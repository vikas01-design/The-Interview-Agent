from __future__ import annotations

import logging
from app.config import MIN_CURRICULUM_DAYS, TOTAL_QUESTIONS
from app.models.schemas import (
    AnswerEvaluation,
    Difficulty,
    InterviewSession,
    QuestionType,
)
from app.services.curriculum import curriculum_service

logger = logging.getLogger(__name__)

MAX_FOLLOW_UP_DEPTH = 3

QUESTION_TYPE_ROTATION = [
    QuestionType.CONCEPT,
    QuestionType.EXPLANATION,
    QuestionType.IMPLEMENTATION,
    QuestionType.WHY,
    QuestionType.TRADEOFF,
    QuestionType.DEBUGGING,
    QuestionType.SCENARIO,
    QuestionType.ARCHITECTURE,
    QuestionType.PRODUCTION,
]


def should_end_interview(session: InterviewSession) -> bool:
    """
    Deterministic termination gate for 10-question interview.

    Ends when session.question_number >= TOTAL_QUESTIONS (10 evaluated questions).
    """
    return session.question_number >= TOTAL_QUESTIONS


def is_no_experience_message(message: str) -> bool:
    text = message.strip().lower()
    phrases = (
        "no experience", "no prior experience", "don't have experience",
        "dont have experience", "haven't done", "havent done",
        "never worked", "never used", "no background", "haven't worked",
        "havent worked", "not experienced", "dont know this topic",
        "no idea about this", "dont know anything about", "don't know anything about",
    )
    return any(p in text for p in phrases)


def is_dont_know_message(message: str) -> bool:
    text = message.strip().lower()
    phrases = {"i don't know", "i dont know", "idk", "not sure", "no idea", "pass", "skip", "dont know", "don't know"}
    return text in phrases or any(text.startswith(p) for p in phrases) or is_no_experience_message(message)


def plan_next_action(
    session: InterviewSession,
    evaluation: AnswerEvaluation,
    message: str = "",
) -> tuple[int, QuestionType, Difficulty, bool, str | None, str]:
    """
    Deterministic adaptive question planner.

    Returns (day, question_type, difficulty, is_follow_up, transition_hint, selection_reason).
    """
    analysis = session.candidate_analysis
    unique_days = len(set(session.covered_days))
    no_exp = is_no_experience_message(message)
    dont_know = is_dont_know_message(message) or evaluation.score <= 3.0

    # Priority 1: Coverage requirement gate if running out of turns
    if (
        session.question_number >= TOTAL_QUESTIONS - 3
        and unique_days < MIN_CURRICULUM_DAYS
        and session.follow_up_depth == 0
    ):
        day = _pick_uncovered_day(session)
        qtype = _question_type_for_turn(session)
        diff = pick_difficulty_for_day(session, day)
        reason = f"Coverage requirement: Day {day} selected to satisfy 4 unique curriculum day coverage threshold."
        return day, qtype, diff, False, None, reason

    # Priority 2: Explicit NO EXPERIENCE or 2nd consecutive IDK -> PIVOT
    if no_exp or (dont_know and session.consecutive_idks_on_topic >= 1):
        if session.current_day is not None and session.current_day not in session.abandoned_days:
            session.abandoned_days.append(session.current_day)

        session.consecutive_idks_on_topic = 0
        new_day = _pick_different_day(session)
        old_topic = session.current_topic or "the previous topic"
        new_entry = curriculum_service.get_day(new_day)
        new_topic = new_entry.title if new_entry else f"Day {new_day}"

        hint = (
            f"The candidate has no prior experience with {old_topic}. "
            f"Acknowledge naturally and empathetically without penalising, "
            f"then ask a clear opening question about Day {new_day} ({new_topic})."
        )
        reason = f"Candidate non-answer/no experience on '{old_topic}'. Adapting by pivoting to Day {new_day} ({new_topic})."
        return new_day, QuestionType.CONCEPT, pick_difficulty_for_day(session, new_day), False, hint, reason

    # Priority 3: First 'I don't know' on this topic -> Lower to EASY foundational concept
    if dont_know:
        session.consecutive_idks_on_topic += 1
        day = session.current_day or _pick_day(session)
        entry = curriculum_service.get_day(day)
        topic_title = entry.title if entry else f"Day {day}"

        hint = (
            f"The candidate doesn't know. Acknowledge naturally without penalising "
            f"and ask a foundational concept question about {topic_title}."
        )
        reason = f"Candidate expressed knowledge gap on '{topic_title}'. Lowering difficulty to EASY foundational concept."
        return day, QuestionType.CONCEPT, Difficulty.EASY, False, hint, reason

    session.consecutive_idks_on_topic = 0

    # Priority 4: Follow-up on weak/misconception answer (3.0 < score < 6.0 or misconceptions)
    if (
        (evaluation.recommended_followup or evaluation.score < 6 or evaluation.misconceptions)
        and session.follow_up_depth < MAX_FOLLOW_UP_DEPTH
    ):
        day = session.current_day or _pick_day(session)
        qtype = _follow_up_type(evaluation)
        diff = Difficulty.EASY if evaluation.score < 4 else session.difficulty
        entry = curriculum_service.get_day(day)
        topic_title = entry.title if entry else f"Day {day}"
        reason = (
            f"Candidate demonstrated partial understanding (score {int(evaluation.overallScore)}/100) on '{topic_title}'. "
            f"Probing missing concept with follow-up ({qtype.value})."
        )
        return day, qtype, diff, True, None, reason

    # Priority 5: Deepen a strong answer (score >= 8.0)
    if (
        evaluation.score >= 8.0
        and session.follow_up_depth < 2
        and session.current_day is not None
    ):
        qtype = QuestionType.TRADEOFF if session.follow_up_depth == 0 else QuestionType.ARCHITECTURE
        entry = curriculum_service.get_day(session.current_day)
        topic_title = entry.title if entry else f"Day {session.current_day}"
        reason = (
            f"Candidate demonstrated strong performance (score {int(evaluation.overallScore)}/100) on '{topic_title}'. "
            f"Escalating difficulty to HARD to test architectural trade-offs."
        )
        return session.current_day, qtype, Difficulty.HARD, True, None, reason

    # Default: advance to next planned target day
    day = _pick_day(session)
    qtype = _question_type_for_turn(session)
    diff = pick_difficulty_for_day(session, day)
    entry = curriculum_service.get_day(day)
    topic_title = entry.title if entry else f"Day {day}"
    reason = f"Advancing to planned target topic Day {day} ({topic_title}) for balanced curriculum coverage."
    return day, qtype, diff, False, None, reason


def generate_question_spec(
    day: int,
    topic: str,
    qtype: QuestionType,
) -> tuple[list[str], dict[str, float]]:
    """Generate expected concepts and weighted criteria for a question."""
    entry = curriculum_service.get_day(day)
    expected: list[str] = []

    if entry:
        if entry.objectives:
            expected.extend(entry.objectives[:3])
        if entry.tools:
            expected.extend(entry.tools[:2])

    if not expected:
        expected = [f"Core concept of {topic}", f"Practical application of {topic}"]

    # Criteria weighting depending on question type
    if qtype in (QuestionType.ARCHITECTURE, QuestionType.PRODUCTION):
        criteria = {
            "correctness": 0.20,
            "conceptualUnderstanding": 0.20,
            "reasoning": 0.25,
            "practicalUnderstanding": 0.20,
            "relevance": 0.15,
        }
    elif qtype in (QuestionType.TRADEOFF, QuestionType.DEBUGGING):
        criteria = {
            "correctness": 0.25,
            "reasoning": 0.30,
            "depth": 0.20,
            "relevance": 0.15,
            "practicalUnderstanding": 0.10,
        }
    else:
        criteria = {
            "correctness": 0.30,
            "conceptualUnderstanding": 0.25,
            "depth": 0.20,
            "relevance": 0.15,
            "practicalUnderstanding": 0.10,
        }

    return expected, criteria


def _pick_different_day(session: InterviewSession) -> int:
    analysis = session.candidate_analysis
    current = session.current_day
    excluded = set(session.abandoned_days)
    if current is not None:
        excluded.add(current)
    excluded.update(analysis.skipped_days)

    for day in analysis.target_days:
        if day not in excluded and day not in session.covered_days:
            return day
    for day in analysis.completed_days:
        if day not in excluded and day not in session.covered_days:
            return day
    for day in analysis.completed_days:
        if day not in excluded:
            return day

    candidates = [d for d in analysis.completed_days if d != current and d not in analysis.skipped_days]
    return candidates[0] if candidates else (current + 1 if current else 7)


def pick_difficulty_for_day(session: InterviewSession, day: int) -> Difficulty:
    analysis = session.candidate_analysis
    if day in analysis.failed_days or day in analysis.struggle_days:
        return Difficulty.EASY
    if day in analysis.strong_days:
        return Difficulty.HARD
    return Difficulty.MEDIUM


def _follow_up_type(evaluation: AnswerEvaluation) -> QuestionType:
    hint = (evaluation.recommended_followup or "").lower()
    if any(k in hint for k in ("trade", "top-k", "latency", "cost", "tradeoff")):
        return QuestionType.TRADEOFF
    if any(k in hint for k in ("debug", "diagnos", "fix", "troubleshoot")):
        return QuestionType.DEBUGGING
    if any(k in hint for k in ("architect", "design", "scale", "system")):
        return QuestionType.ARCHITECTURE
    if any(k in hint for k in ("production", "deploy", "observ")):
        return QuestionType.PRODUCTION
    if evaluation.misconceptions:
        return QuestionType.WHY
    return QuestionType.FOLLOW_UP


def _question_type_for_turn(session: InterviewSession) -> QuestionType:
    idx = session.question_number % len(QUESTION_TYPE_ROTATION)
    return QUESTION_TYPE_ROTATION[idx]


def _pick_day(session: InterviewSession) -> int:
    analysis = session.candidate_analysis
    covered = set(session.covered_days)

    for day in analysis.target_days:
        if day not in covered and day not in analysis.skipped_days:
            return day

    for day in analysis.target_days:
        if day not in analysis.skipped_days:
            return day

    for day in analysis.completed_days:
        if day not in analysis.skipped_days:
            return day

    return analysis.completed_days[0] if analysis.completed_days else 7


def _pick_uncovered_day(session: InterviewSession) -> int:
    analysis = session.candidate_analysis
    covered = set(session.covered_days)

    for day in analysis.target_days:
        if day not in covered and day not in analysis.skipped_days:
            return day

    for day in analysis.completed_days:
        if day not in covered and day not in analysis.skipped_days:
            return day

    return _pick_day(session)


def handle_edge_case_message(message: str) -> str | None:
    text = message.strip().lower()

    if text in {"i don't know", "idk", "not sure", "no idea", "pass", "skip"}:
        return (
            "The candidate doesn't know. Don't penalise — acknowledge naturally "
            "and pivot to a more foundational angle on the same topic."
        )

    word_count = len(text.split())

    if word_count <= 3:
        return (
            "Very short answer. Ask the candidate to expand with more technical detail."
        )

    if any(phrase in text for phrase in ("what do you mean", "can you clarify", "can you repeat")):
        return (
            "Candidate asked for clarification. Rephrase the question slightly without "
            "giving away the answer."
        )

    return None
