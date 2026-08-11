from __future__ import annotations

import logging
import re
from datetime import datetime

from app.agents.evaluator import evaluate_answer
from app.agents.feedback_generator import generate_feedback
from app.agents.question_generator import build_question_meta, generate_question
from app.config import MIN_CURRICULUM_DAYS, TOTAL_QUESTIONS
from app.models.schemas import (
    Feedback,
    InterviewProgress,
    InterviewResponse,
    InterviewSession,
    TelemetryEvent,
    TranscriptEntry,
)
from app.services.planner import (
    generate_question_spec,
    handle_edge_case_message,
    pick_difficulty_for_day,
    plan_next_action,
    should_end_interview,
)
from app.services.profile import analyze_candidate, init_knowledge_model, update_knowledge_model
from app.services.session_store import get_session, save_session

logger = logging.getLogger(__name__)


def _log_telemetry(
    session: InterviewSession,
    event_type: str,
    title: str,
    description: str,
    details: dict | None = None,
) -> None:
    event = TelemetryEvent(
        timestamp=datetime.utcnow().isoformat() + "Z",
        eventType=event_type,
        title=title,
        description=description,
        details=details or {},
    )
    session.telemetry.append(event)


async def start_interview(session_id: str, candidate: dict) -> InterviewResponse:
    """
    Initialize a new 10-question technical interview session and generate Question 1.
    """
    analysis = analyze_candidate(candidate)
    session = InterviewSession(
        session_id=session_id,
        candidate=candidate,
        candidate_analysis=analysis,
        total_questions=TOTAL_QUESTIONS,
        attempt_number=1,
        knowledge_model=init_knowledge_model(analysis),
    )

    _log_telemetry(
        session,
        "SESSION_START",
        "10-Question Technical Interview Started",
        f"Candidate {candidate.get('member', {}).get('name', 'User')} started 10-question adaptive interview.",
        {"completed_days": analysis.completed_days, "target_days": analysis.target_days},
    )

    from app.services.planner import _pick_day, _question_type_for_turn

    day = _pick_day(session)
    qtype = _question_type_for_turn(session)
    diff = pick_difficulty_for_day(session, day)
    meta = build_question_meta(session, day, qtype, difficulty=diff)

    expected, criteria = generate_question_spec(day, meta.topic, qtype)
    meta.expectedConcepts = expected
    meta.evaluationCriteria = criteria
    meta.selectionReason = f"Opening question targeting Day {day} ({meta.topic}) based on cohort progress."

    _log_telemetry(
        session,
        "INITIAL_QUESTION_SELECTED",
        f"Question 1: Day {day} ({meta.topic})",
        f"Targeting Day {day} with difficulty {diff.value}.",
        {"day": day, "topic": meta.topic, "difficulty": diff.value, "reason": meta.selectionReason},
    )

    logger.info(
        "Starting 10-question interview session=%s candidate=%s day=%s type=%s diff=%s",
        session_id,
        candidate.get("member", {}).get("id"),
        day,
        qtype.value,
        diff.value,
    )

    question = await generate_question(session, meta)
    _record_question(session, question, meta)

    save_session(session)
    return InterviewResponse(
        reply=question,
        done=False,
        progress=_build_progress(session),
    )


async def continue_interview(session_id: str, message: str) -> InterviewResponse:
    """
    Process a candidate's answer, evaluate it, update knowledge model,
    and adaptively select the next question or generate final report on Question 10 completion.
    """
    session = get_session(session_id)
    if not session:
        return InterviewResponse(
            reply="Session not found. Please start a new interview.",
            done=False,
        )

    if session.status == "complete":
        return InterviewResponse(
            reply="This interview has already been completed.",
            done=True,
        )

    # Record message in transcript
    session.transcript.append(TranscriptEntry(role="candidate", content=message))

    # Evaluate the answer against curriculum context & question specifications
    evaluation = await evaluate_answer(session, message, session.last_question_meta)
    classification = evaluation.classification

    # Handle GREETING ONLY or EMPTY NON-ANSWER (when attemptNumber == 1)
    if classification and not classification.accepted and classification.retryAllowed and session.attempt_number == 1:
        session.attempt_number = 2
        _log_telemetry(
            session,
            "ANSWER_VALIDATION",
            f"Answer Validation Warning: {classification.answerType}",
            classification.warningMessage or "Greeting or non-answer detected.",
            {"attempt": 1, "warning": classification.warningMessage},
        )
        save_session(session)

        # Return dynamic warning without incrementing question count or evaluating score
        warning_reply = classification.warningMessage or (
            f"That response doesn't address the technical question yet. "
            f"Please answer the question in your own words so I can evaluate your understanding."
        )
        session.transcript.append(TranscriptEntry(role="interviewer", content=warning_reply))

        return InterviewResponse(
            reply=warning_reply,
            done=False,
            answerClassification=classification,
            progress=_build_progress(session, warning=warning_reply, retry_allowed=True),
        )

    # Reset attempt counter on evaluated answer (valid or attempt 2)
    session.attempt_number = 1
    session.evaluations.append(evaluation)
    session.last_evaluation = evaluation

    if classification:
        session.classifications.append(classification)

    _log_telemetry(
        session,
        "ANSWER_EVALUATED",
        f"Q{session.question_number} Evaluated: Score {int(evaluation.overallScore)}/100",
        f"Demonstrated: {evaluation.partA_demonstrated}",
        {
            "score": evaluation.overallScore,
            "answerType": classification.answerType if classification else "valid_technical",
            "partA": evaluation.partA_demonstrated,
            "partB": evaluation.partB_missing,
        },
    )

    if evaluation.codeExecution and evaluation.codeExecution.executed:
        _log_telemetry(
            session,
            "CODE_EXECUTION",
            "Python Code Execution Completed",
            f"Executed candidate code: syntaxValid={evaluation.codeExecution.syntaxValid}, passed={evaluation.codeExecution.passed}",
            {
                "syntaxValid": evaluation.codeExecution.syntaxValid,
                "passed": evaluation.codeExecution.passed,
                "stdout": evaluation.codeExecution.stdout[:200],
                "stderr": evaluation.codeExecution.stderr[:200],
            },
        )

    # Update knowledge model for current topic
    if session.current_day is not None:
        update_knowledge_model(session.knowledge_model, session.current_day, evaluation)

    # Check termination gate (exactly 10 evaluated questions)
    if should_end_interview(session):
        return await _complete_interview(session)

    # Plan next question
    old_diff = session.difficulty
    day, qtype, diff, is_follow_up, plan_transition, selection_reason = plan_next_action(
        session, evaluation, message
    )
    meta = build_question_meta(session, day, qtype, is_follow_up=is_follow_up, difficulty=diff)

    expected, criteria = generate_question_spec(day, meta.topic, qtype)
    meta.expectedConcepts = expected
    meta.evaluationCriteria = criteria
    meta.selectionReason = selection_reason

    if diff != old_diff:
        _log_telemetry(
            session,
            "DIFFICULTY_SHIFT",
            f"Difficulty Shifted: {old_diff.value.upper()} → {diff.value.upper()}",
            f"Adjusted difficulty based on score {evaluation.overallScore}/100.",
            {"old_difficulty": old_diff.value, "new_difficulty": diff.value},
        )

    if is_follow_up:
        session.follow_up_depth += 1
        session.pending_follow_up = True
        _log_telemetry(
            session,
            "FOLLOW_UP_TRIGGER",
            f"Follow-up Probing (Depth {session.follow_up_depth})",
            selection_reason,
            {"topic": meta.topic, "depth": session.follow_up_depth},
        )
    else:
        session.follow_up_depth = 0
        session.pending_follow_up = False

    effective_transition = plan_transition

    question = await generate_question(
        session,
        meta,
        evaluation=evaluation,
        transition=effective_transition,
    )
    _record_question(session, question, meta)

    save_session(session)
    return InterviewResponse(
        reply=question,
        done=False,
        answerClassification=classification,
        progress=_build_progress(session, selection_reason=selection_reason),
    )


async def _complete_interview(session: InterviewSession) -> InterviewResponse:
    """Generate final 10-question evaluation report and mark session complete."""
    logger.info(
        "Completing 10-question interview session=%s questions=%d days_covered=%s",
        session.session_id,
        session.question_number,
        session.covered_days,
    )
    try:
        feedback = await generate_feedback(session)
    except Exception as exc:
        logger.warning("Failed to generate feedback (%s) — using fallback.", exc)
        from app.agents.feedback_generator import _fallback_feedback
        feedback = _fallback_feedback(session)

    session.status = "complete"
    save_session(session)

    name = session.candidate.get("member", {}).get("name", "there")
    closing = (
        f"Thank you for completing the technical interview, {name}! "
        f"You have finished all 10 technical questions across cohort Days {session.covered_days}. "
        f"I have compiled your comprehensive 10-question evaluation report, performance scores, strengths, areas for improvement, and next steps below."
    )
    return InterviewResponse(reply=closing, done=True, feedback=feedback)


def _record_question(session: InterviewSession, question: str, meta) -> None:
    normalized = _normalize_question(question)
    session.asked_questions.append(normalized)
    session.question_number += 1
    session.current_day = meta.day
    session.current_topic = meta.topic
    session.difficulty = meta.difficulty
    session.last_question_meta = meta
    session.awaiting_answer = True

    if meta.day not in session.covered_days:
        session.covered_days.append(meta.day)
    if meta.topic not in session.covered_topics:
        session.covered_topics.append(meta.topic)
    if meta.question_type.value not in session.question_types_used:
        session.question_types_used.append(meta.question_type.value)

    session.transcript.append(
        TranscriptEntry(role="interviewer", content=question, question_meta=meta)
    )


def _normalize_question(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())[:200]


def _build_progress(
    session: InterviewSession,
    *,
    warning: str | None = None,
    retry_allowed: bool = False,
    selection_reason: str | None = None,
) -> InterviewProgress:
    return InterviewProgress(
        questionNumber=session.question_number,
        totalQuestions=TOTAL_QUESTIONS,
        attemptNumber=session.attempt_number,
        minQuestions=TOTAL_QUESTIONS,
        coveredDays=session.covered_days,
        minDays=MIN_CURRICULUM_DAYS,
        coveredTopics=session.covered_topics,
        currentDay=session.current_day,
        currentTopic=session.current_topic,
        difficulty=session.difficulty.value,
        isFollowUp=session.pending_follow_up,
        warningMessage=warning,
        retryAllowed=retry_allowed,
        selectionReason=selection_reason or (session.last_question_meta.selectionReason if session.last_question_meta else None),
    )
