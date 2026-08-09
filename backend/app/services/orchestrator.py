from __future__ import annotations

import logging
import re

from app.agents.evaluator import evaluate_answer
from app.agents.feedback_generator import generate_feedback
from app.agents.question_generator import build_question_meta, generate_question
from app.config import MIN_CURRICULUM_DAYS, MIN_QUESTIONS
from app.models.schemas import (
    Feedback,
    InterviewProgress,
    InterviewResponse,
    InterviewSession,
    TranscriptEntry,
)
from app.services.planner import (
    handle_edge_case_message,
    plan_next_action,
    pick_difficulty_for_day,
    should_end_interview,
)
from app.services.profile import analyze_candidate, init_knowledge_model, update_knowledge_model
from app.services.session_store import get_session, save_session

logger = logging.getLogger(__name__)


async def start_interview(session_id: str, candidate: dict) -> InterviewResponse:
    """
    Initialize a new interview session and generate the opening question.

    The opening question is chosen based on the candidate's learning journey —
    specifically their strongest or most strategically interesting topic.
    """
    analysis = analyze_candidate(candidate)
    session = InterviewSession(
        session_id=session_id,
        candidate=candidate,
        candidate_analysis=analysis,
        knowledge_model=init_knowledge_model(analysis),
    )

    from app.services.planner import _pick_day, _question_type_for_turn

    # Opening: start with the first target day (weakness → medium entry point,
    # or strong area → hard question to impress the candidate immediately).
    day = _pick_day(session)
    qtype = _question_type_for_turn(session)
    diff = pick_difficulty_for_day(session, day)
    meta = build_question_meta(session, day, qtype, difficulty=diff)

    logger.info(
        "Starting interview session=%s candidate=%s day=%s type=%s diff=%s",
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
    Process a candidate's answer, evaluate it, update the knowledge model,
    and generate the next question or final feedback.
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

    # Record the candidate's message in the transcript.
    session.transcript.append(TranscriptEntry(role="candidate", content=message))

    # Detect edge case (very short, "I don't know", clarification requests, etc.)
    transition_hint = handle_edge_case_message(message)

    # Evaluate the answer against the curriculum and interview context.
    evaluation = await evaluate_answer(session, message, session.last_question_meta)
    session.evaluations.append(evaluation)
    session.last_evaluation = evaluation

    logger.info(
        "session=%s Q%d score=%.1f depth=%.2f misconceptions=%s",
        session_id,
        session.question_number,
        evaluation.score,
        evaluation.depth,
        evaluation.misconceptions,
    )

    # Update the dynamic candidate knowledge model for the current topic.
    if session.current_day is not None:
        update_knowledge_model(session.knowledge_model, session.current_day, evaluation)

    # Check termination conditions (deterministic — not LLM-controlled).
    if should_end_interview(session):
        return await _complete_interview(session)

    # Plan the next question (deterministic priority logic).
    day, qtype, diff, is_follow_up, plan_transition = plan_next_action(session, evaluation, message)
    meta = build_question_meta(session, day, qtype, is_follow_up=is_follow_up, difficulty=diff)

    # Update follow-up tracking.
    if is_follow_up:
        session.follow_up_depth += 1
        session.pending_follow_up = True
    else:
        session.follow_up_depth = 0
        session.pending_follow_up = False

    effective_transition = plan_transition or transition_hint

    # Generate the next question (AI-powered, grounded in TheBreeth + curriculum).
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
        progress=_build_progress(session),
    )


async def _complete_interview(session: InterviewSession) -> InterviewResponse:
    """Generate final feedback report with grading system and mark the session complete."""
    logger.info(
        "Completing interview session=%s questions=%d days_covered=%s",
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
        f"Thank you for attending the technical interview, {name}! "
        f"You have completed all {session.question_number} technical questions across cohort Days {session.covered_days}. "
        f"I have compiled your full evaluation results, performance grade, strengths, drawbacks, and recommended improvements below."
    )
    return InterviewResponse(reply=closing, done=True, feedback=feedback)


def _record_question(session: InterviewSession, question: str, meta) -> None:
    """Record a new question in the session state."""
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

    session.transcript.append(
        TranscriptEntry(role="interviewer", content=question, question_meta=meta)
    )

    logger.debug(
        "Q%d recorded: day=%d topic=%s type=%s difficulty=%s follow_up=%s",
        session.question_number,
        meta.day,
        meta.topic,
        meta.question_type.value,
        meta.difficulty.value,
        meta.is_follow_up,
    )


def _normalize_question(text: str) -> str:
    """Normalize a question for deduplication checking."""
    return re.sub(r"\s+", " ", text.strip().lower())[:200]


def _build_progress(session: InterviewSession) -> InterviewProgress:
    """Build a progress snapshot to send to the frontend."""
    from app.config import MIN_CURRICULUM_DAYS, MIN_QUESTIONS
    return InterviewProgress(
        questionNumber=session.question_number,
        minQuestions=MIN_QUESTIONS,
        coveredDays=session.covered_days,
        minDays=MIN_CURRICULUM_DAYS,
        coveredTopics=session.covered_topics,
        currentDay=session.current_day,
        currentTopic=session.current_topic,
        difficulty=session.difficulty.value,
        isFollowUp=session.pending_follow_up,
    )
