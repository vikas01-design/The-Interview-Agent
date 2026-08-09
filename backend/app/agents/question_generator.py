from __future__ import annotations

import logging

from app.config import LLM_ENABLED
from app.models.schemas import (
    AnswerEvaluation,
    Difficulty,
    InterviewSession,
    QuestionMeta,
    QuestionType,
)
from app.services.curriculum import curriculum_service
from app.services.llm_client import chat_completion
from app.services.profile import pick_difficulty
from app.thebreeth.retrieval import retrieve_candidate_profile_context, retrieve_curriculum_context

logger = logging.getLogger(__name__)


QUESTION_SYSTEM = """You are a senior AI engineer conducting a personalized technical interview.

Your behavior:
- Ask EXACTLY ONE focused question per response.
- Be conversational, warm but technical. Never robotic. Never say "Question X of Y".
- Ground every question in the provided curriculum context. Never invent topics.
- Reference the candidate's actual learning journey (completed days, struggled topics).
- Do NOT claim a candidate completed a topic marked as skipped.
- CRITICAL: If the candidate answered "I don't know", "idk", "pass", or gave an empty/superficial non-answer, DO NOT say "Building on what you said" or invent candidate claims. Acknowledge naturally (e.g., "No problem at all! Let's approach it from a simpler angle...") and ask a foundational guided question.
- ONLY reference candidate claims if the candidate actually stated a specific technical fact or claim in their response.
- Challenge unsupported claims with probing questions — don't accept vague answers.
- Vary question style: sometimes short and direct, sometimes scenario-based.
- Never reveal your internal scoring, evaluation criteria, or interview state.
- Keep the question to 1–4 sentences maximum.

Personality: curious, technically rigorous, fair, encouraging but probing."""


async def generate_question(
    session: InterviewSession,
    meta: QuestionMeta,
    *,
    evaluation: AnswerEvaluation | None = None,
    transition: str | None = None,
) -> str:
    """
    Generate the next interview question using TheBreeth + LLM.

    The retrieval query is enriched with current interview state so that
    TheBreeth returns the most contextually relevant curriculum knowledge
    and candidate profile graph facts.
    """
    member = session.candidate.get("member", {})
    name = member.get("name", "there")
    cand_id = member.get("id", "")

    # Retrieve candidate profile facts & curriculum knowledge from TheBreeth
    candidate_context = _build_candidate_context_for_retrieval(session, meta, evaluation)
    context = await retrieve_curriculum_context(
        f"Day {meta.day} {meta.topic} {meta.question_type.value}",
        day=meta.day,
        candidate_context=candidate_context,
    )
    profile_facts = await retrieve_candidate_profile_context(cand_id, topic=meta.topic)

    if not LLM_ENABLED:
        return _fallback_question(session, meta, evaluation, name, transition)

    prior_context = _build_transcript_summary(session)
    eval_block = _build_eval_block(evaluation)

    knowledge_snapshot = _build_knowledge_snapshot(session)

    user_prompt = f"""Candidate: {name} ({member.get('jobRole', 'engineer')}, {member.get('yearsExperience', '?')} yrs exp)

TheBreeth Candidate Profile Graph Facts:
{profile_facts if profile_facts else 'Standard profile data active.'}

Cohort progress:
  Completed days: {session.candidate_analysis.completed_days}
  Skipped days (DO NOT ask about these): {session.candidate_analysis.skipped_days}
  Struggled on: {session.candidate_analysis.struggle_days}
  Failed: {session.candidate_analysis.failed_days}

Candidate knowledge model (0-1 scale, based on interview so far):
{knowledge_snapshot}

Curriculum context for this question:
{context}

Recent interview transcript:
{prior_context}

{eval_block}

Your task: Generate the NEXT single interview question.
  Question type: {meta.question_type.value}
  Difficulty: {meta.difficulty.value}
  Target day: Day {meta.day} — {meta.topic}
  Is follow-up: {meta.is_follow_up}
  Transition instruction: {transition or 'natural progression from last topic'}

{"If this is the very first question (question_number==0), open with a brief warm welcome (1 sentence) then immediately ask the question." if session.question_number == 0 else ""}
{"If the candidate didn't know or asked to pass, acknowledge warmly and ask a foundational concept question." if evaluation and evaluation.score <= 3.0 else ""}
{"If this is a follow-up, explicitly reference something specific the candidate just claimed before asking." if meta.is_follow_up and evaluation and evaluation.candidate_claims else ""}
"""

    try:
        reply = await chat_completion(
            [
                {"role": "system", "content": QUESTION_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.75,
        )
        return reply.strip()
    except Exception as exc:
        logger.warning("LLM question generation failed (%s) — using deterministic fallback.", exc)
        return _fallback_question(session, meta, evaluation, name, transition)


def _build_candidate_context_for_retrieval(
    session: InterviewSession,
    meta: QuestionMeta,
    evaluation: AnswerEvaluation | None,
) -> str:
    """Build a concise context string to enrich the TheBreeth retrieval query."""
    parts = [f"topic: {meta.topic}", f"difficulty: {meta.difficulty.value}"]
    if evaluation:
        if evaluation.misconceptions:
            parts.append(f"misconceptions: {', '.join(evaluation.misconceptions[:2])}")
        if evaluation.recommended_followup:
            parts.append(f"follow-up needed: {evaluation.recommended_followup}")
        if evaluation.missing_concepts:
            parts.append(f"gaps: {', '.join(evaluation.missing_concepts[:2])}")
    if session.candidate_analysis.struggle_days:
        parts.append(f"struggle days: {session.candidate_analysis.struggle_days[:3]}")
    return " | ".join(parts)


def _build_knowledge_snapshot(session: InterviewSession) -> str:
    if not session.knowledge_model:
        return "  Not yet assessed."
    lines = []
    for day_key, km in list(session.knowledge_model.items())[:8]:
        entry = curriculum_service.get_day(int(day_key))
        label = entry.title if entry else f"Day {day_key}"
        lines.append(
            f"  Day {day_key} ({label}): "
            f"knowledge={km.knowledge:.2f} depth={km.depth:.2f} reasoning={km.reasoning:.2f}"
        )
    return "\n".join(lines) if lines else "  Not yet assessed."


def _build_transcript_summary(session: InterviewSession, max_turns: int = 8) -> str:
    lines: list[str] = []
    recent = session.transcript[-(max_turns * 2):]
    for entry in recent:
        prefix = "Interviewer" if entry.role == "interviewer" else "Candidate"
        # Truncate very long candidate answers
        content = entry.content[:600] if entry.role == "candidate" else entry.content[:400]
        lines.append(f"{prefix}: {content}")
    return "\n".join(lines) if lines else "No prior conversation."


def _build_eval_block(evaluation: AnswerEvaluation | None) -> str:
    if not evaluation:
        return ""
    parts = [
        f"Last answer score: {evaluation.score}/10",
        f"Correctness: {evaluation.correctness:.1f}  Depth: {evaluation.depth:.1f}  Reasoning: {evaluation.reasoning:.1f}",
    ]
    if evaluation.strengths:
        parts.append(f"Strengths identified: {', '.join(evaluation.strengths[:2])}")
    if evaluation.misconceptions:
        parts.append(f"Misconceptions to probe: {', '.join(evaluation.misconceptions[:2])}")
    if evaluation.missing_concepts:
        parts.append(f"Missing concepts: {', '.join(evaluation.missing_concepts[:2])}")
    if evaluation.recommended_followup:
        parts.append(f"Suggested follow-up angle: {evaluation.recommended_followup}")
    if evaluation.candidate_claims:
        parts.append(f"Key candidate claims to reference: {', '.join(evaluation.candidate_claims[:3])}")
    return "\n".join(parts)


def _fallback_question(
    session: InterviewSession,
    meta: QuestionMeta,
    evaluation: AnswerEvaluation | None,
    name: str,
    transition: str | None = None,
) -> str:
    """Deterministic fallback when LLM is not configured."""
    entry = curriculum_service.get_day(meta.day)
    if not entry:
        return f"Thanks {name}. Can you walk me through a technical concept from your cohort learning?"

    # Handle Candidate "I don't know" or low score non-answer cleanly
    if evaluation and (evaluation.score <= 3.0 or (transition and "doesn't know" in transition.lower())):
        return (
            f"No problem at all! Let's approach it from a simpler angle. "
            f"When you worked with {entry.title}, what was the main problem or tool you focused on?"
        )

    if meta.is_follow_up and evaluation:
        claims = [c for c in evaluation.candidate_claims if len(c.strip()) > 3]
        if claims:
            claim = claims[0]
            if meta.question_type == QuestionType.TRADEOFF:
                return (
                    f"You mentioned {claim}. What trade-offs would you consider in that approach "
                    f"within the context of {entry.title.lower()}?"
                )
            if meta.question_type == QuestionType.DEBUGGING:
                return (
                    f"Interesting point about {claim}. If that component failed in production, "
                    f"how would you diagnose the issue step by step?"
                )
            if meta.question_type == QuestionType.WHY:
                return (
                    f"You said {claim}. Why is that approach preferred over simpler alternatives "
                    f"when working with {entry.title}?"
                )
            return (
                f"Building on what you mentioned about {claim}, can you explain how that applies "
                f"to {entry.title}?"
            )
        else:
            # No specific claim extracted — ask a clean follow-up grounded in topic
            return (
                f"Looking closer at {entry.title}, what key trade-offs or design choices "
                f"did you consider when implementing it?"
            )

    tool_str = entry.tools[0] if entry.tools else "the key tool from that day"
    templates = {
        QuestionType.CONCEPT: (
            f"Can you explain the core idea behind {entry.title}? What problem does it solve?"
        ),
        QuestionType.EXPLANATION: (
            f"Explain how {tool_str} fits into the overall {entry.title} workflow."
        ),
        QuestionType.IMPLEMENTATION: (
            f"Walk me through how you would implement the key components from {entry.title} "
            f"in a production system."
        ),
        QuestionType.WHY: (
            f"Why is the approach in {entry.title} preferred over simpler alternatives? "
            f"What are the specific advantages?"
        ),
        QuestionType.TRADEOFF: (
            f"What trade-offs would you weigh when making design decisions in {entry.title}? "
            f"Think about performance, cost, and complexity."
        ),
        QuestionType.DEBUGGING: (
            f"Imagine {entry.title} is producing poor results in production. "
            f"What's your diagnostic process?"
        ),
        QuestionType.ARCHITECTURE: (
            f"Design a scalable architecture that incorporates the concepts from {entry.title}. "
            f"What components would you include and why?"
        ),
        QuestionType.SCENARIO: (
            f"Here's a scenario: everything from {entry.title} works correctly individually, "
            f"but the end-to-end system gives poor results. Where would you investigate first?"
        ),
        QuestionType.PRODUCTION: (
            f"How would you manage latency, cost, and observability for a production system "
            f"built on {entry.title}?"
        ),
        QuestionType.FOLLOW_UP: (
            f"You touched on an interesting point earlier. "
            f"Can you elaborate on how it connects to {entry.title}?"
        ),
    }

    base = templates.get(meta.question_type, templates[QuestionType.CONCEPT])

    if session.question_number == 0:
        return (
            f"Welcome, {name} — glad to have you here today. "
            f"Let's start with something foundational. {base}"
        )

    return base


def build_question_meta(
    session: InterviewSession,
    day: int,
    question_type: QuestionType,
    *,
    is_follow_up: bool = False,
    difficulty: Difficulty | None = None,
) -> QuestionMeta:
    entry = curriculum_service.get_day(day)
    topic = entry.title if entry else f"Day {day}"
    if difficulty is None:
        difficulty = pick_difficulty(session.candidate_analysis, day)
    return QuestionMeta(
        day=day,
        topic=topic,
        question_type=question_type,
        difficulty=difficulty,
        is_follow_up=is_follow_up,
    )
