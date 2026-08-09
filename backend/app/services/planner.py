from __future__ import annotations

from app.config import MIN_CURRICULUM_DAYS, MIN_QUESTIONS
from app.models.schemas import (
    AnswerEvaluation,
    Difficulty,
    InterviewSession,
    QuestionType,
)
from app.services.curriculum import curriculum_service

# Maximum consecutive follow-up questions before forcing a topic transition.
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
    Deterministic termination gate.

    The interview ends only when ALL of the following are true:
    - At least MIN_QUESTIONS questions have been asked.
    - At least MIN_CURRICULUM_DAYS unique days have been covered.
    - We are NOT in a mandatory follow-up (pending_follow_up), OR we have
      exceeded MAX_FOLLOW_UP_DEPTH (safety valve so interviews can't run
      forever due to perpetually weak answers).
    """
    unique_days = len(set(session.covered_days))
    min_met = (
        session.question_number >= MIN_QUESTIONS
        and unique_days >= MIN_CURRICULUM_DAYS
    )
    if not min_met:
        return False
    # Allow termination if requirements are met and no pending follow-up,
    # OR if we've gone deep enough past the minimum (safety valve).
    follow_up_exhausted = session.follow_up_depth >= MAX_FOLLOW_UP_DEPTH
    return not session.pending_follow_up or follow_up_exhausted


def is_no_experience_message(message: str) -> bool:
    """Return True if candidate explicitly states they have no prior experience or background."""
    text = message.strip().lower()
    phrases = (
        "no experience", "no prior experience", "don't have experience",
        "dont have experience", "haven't done", "havent done",
        "never worked", "never used", "no background", "haven't worked",
        "havent worked", "not experienced", "dont know this topic",
        "no idea about this", "dont know anything about", "don't know anything about",
        "don't have any prior", "dont have any prior",
    )
    return any(p in text for p in phrases)


def is_dont_know_message(message: str) -> bool:
    """Return True if candidate states 'I don't know', 'pass', 'idk', etc."""
    text = message.strip().lower()
    phrases = {"i don't know", "i dont know", "idk", "not sure", "no idea", "pass", "skip", "dont know", "don't know"}
    return text in phrases or any(text.startswith(p) for p in phrases) or is_no_experience_message(message)


def plan_next_action(
    session: InterviewSession,
    evaluation: AnswerEvaluation,
    message: str = "",
) -> tuple[int, QuestionType, Difficulty, bool, str | None]:
    """
    Deterministic question planner.

    Returns (day, question_type, difficulty, is_follow_up, transition_hint).

    Priority order:
    1. Hard coverage requirement — if running low on questions.
    2. Explicit 'No Experience' OR repeated non-answers -> Pivot to a DIFFERENT completed/target topic.
    3. First 'I don't know' on topic -> Stay on topic, lower to EASY foundational concept.
    4. Follow-up on weak/misconception answer (3.0 < score < 6.0).
    5. Deepen a strong answer (score >= 8).
    6. Probe weakness day periodically.
    7. Default: advance to next planned target day.
    """
    analysis = session.candidate_analysis
    unique_days = len(set(session.covered_days))
    no_exp = is_no_experience_message(message)
    dont_know = is_dont_know_message(message) or evaluation.score <= 3.0

    # Priority 1: Hard coverage requirement — if running out of questions.
    if (
        session.question_number >= MIN_QUESTIONS - 2
        and unique_days < MIN_CURRICULUM_DAYS
        and session.follow_up_depth == 0
    ):
        day = _pick_uncovered_day(session)
        qtype = _question_type_for_turn(session)
        return day, qtype, pick_difficulty_for_day(session, day), False, None

    # Priority 2: Explicit NO EXPERIENCE or 2nd consecutive IDK on same topic -> PIVOT TO NEW TOPIC.
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
            f"Acknowledge naturally and empathetically without penalising (e.g. 'Got it, no problem at all! Let's pivot to a different topic from your cohort journey...'), "
            f"then ask a clear opening question about Day {new_day} ({new_topic})."
        )
        return new_day, QuestionType.CONCEPT, pick_difficulty_for_day(session, new_day), False, hint

    # Priority 3: First 'I don't know' on this topic -> Stay on topic, lower to EASY foundational concept.
    if dont_know:
        session.consecutive_idks_on_topic += 1
        day = session.current_day or _pick_day(session)
        entry = curriculum_service.get_day(day)
        topic_title = entry.title if entry else f"Day {day}"

        hint = (
            f"The candidate doesn't know. Acknowledge naturally without penalising "
            f"(e.g. 'No problem at all! Let's look at it from a simpler angle...') "
            f"and ask a foundational concept question about {topic_title}."
        )
        return day, QuestionType.CONCEPT, Difficulty.EASY, False, hint

    # Reset consecutive IDK counter on valid answer
    session.consecutive_idks_on_topic = 0

    # Priority 4: follow-up on weak/misconception answer (3.0 < score < 6.0 or misconceptions).
    if (
        (evaluation.recommended_followup or evaluation.score < 6 or evaluation.misconceptions)
        and session.follow_up_depth < MAX_FOLLOW_UP_DEPTH
    ):
        day = session.current_day or _pick_day(session)
        qtype = _follow_up_type(evaluation)
        diff = Difficulty.EASY if evaluation.score < 4 else session.difficulty
        return day, qtype, diff, True, None

    # Priority 5: deepen a strong answer.
    if (
        evaluation.score >= 8
        and session.follow_up_depth < 2
        and session.current_day is not None
    ):
        qtype = (
            QuestionType.TRADEOFF
            if session.follow_up_depth == 0
            else QuestionType.SCENARIO
        )
        return session.current_day, qtype, Difficulty.HARD, True, None

    # Priority 6: probe a known weak area every few questions.
    weakness_day = _pick_weakness_day(session)
    if weakness_day and session.question_number % 3 == 0:
        return weakness_day, QuestionType.DEBUGGING, Difficulty.EASY, False, None

    # Default: advance to next target day.
    day = _pick_day(session)
    qtype = _question_type_for_turn(session)
    return day, qtype, pick_difficulty_for_day(session, day), False, None


def _pick_different_day(session: InterviewSession) -> int:
    """Pick a completed or target day different from current_day and abandoned_days."""
    analysis = session.candidate_analysis
    current = session.current_day
    excluded = set(session.abandoned_days)
    if current is not None:
        excluded.add(current)
    excluded.update(analysis.skipped_days)

    # 1. Uncovered target day not excluded
    for day in analysis.target_days:
        if day not in excluded and day not in session.covered_days:
            return day

    # 2. Uncovered completed day not excluded
    for day in analysis.completed_days:
        if day not in excluded and day not in session.covered_days:
            return day

    # 3. Any non-excluded target day
    for day in analysis.target_days:
        if day not in excluded:
            return day

    # 4. Any non-excluded completed day
    for day in analysis.completed_days:
        if day not in excluded:
            return day

    # Fallback to any completed day except current
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
    """
    Pick the next interview day from the candidate's target list.

    Order: uncovered target days → any target day → any completed day.
    Skipped days are never selected.
    """
    analysis = session.candidate_analysis
    covered = set(session.covered_days)

    for day in analysis.target_days:
        if day not in covered and day not in analysis.skipped_days:
            return day

    # All target days covered — revisit from the top (for deeper questions).
    for day in analysis.target_days:
        if day not in analysis.skipped_days:
            return day

    for day in analysis.completed_days:
        if day not in analysis.skipped_days:
            return day

    return analysis.completed_days[0] if analysis.completed_days else 7


def _pick_uncovered_day(session: InterviewSession) -> int:
    """Pick a day not yet covered in this interview session."""
    analysis = session.candidate_analysis
    covered = set(session.covered_days)

    for day in analysis.target_days:
        if day not in covered and day not in analysis.skipped_days:
            return day

    for day in analysis.completed_days:
        if day not in covered and day not in analysis.skipped_days:
            return day

    return _pick_day(session)


def _pick_weakness_day(session: InterviewSession) -> int | None:
    """Return a day where the candidate failed or struggled, if any."""
    analysis = session.candidate_analysis
    for day in analysis.failed_days + analysis.struggle_days:
        if day not in analysis.skipped_days:
            return day
    return None


def handle_edge_case_message(message: str) -> str | None:
    """
    Return an interviewer transition hint for common edge cases.

    These hints are passed to the question generator as a ``transition``
    parameter so the LLM can open the next question naturally.
    """
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

    if any(phrase in text for phrase in ("what do you mean", "can you clarify", "can you repeat", "repeat that")):
        return (
            "Candidate asked for clarification. Rephrase the question slightly without "
            "giving away the answer."
        )

    if word_count > 120:
        return (
            "Long answer. Pick the single most interesting or questionable claim and probe it."
        )

    return None
