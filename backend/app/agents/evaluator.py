from __future__ import annotations

from app.config import LLM_ENABLED
from app.models.schemas import (
    AnswerEvaluation,
    CommunicationMetrics,
    Difficulty,
    InterviewSession,
    QuestionMeta,
    QuestionType,
)
from app.services.curriculum import curriculum_service
from app.services.llm_client import chat_json


EVAL_SYSTEM = """You are a senior technical interviewer performing a deep, multi-dimensional evaluation of a candidate's answer.

Evaluate TWO distinct categories:
1. Technical Dimensions (Relevance, Technical Correctness, Depth, Logical Structure, Reasoning)
2. Behavioral & Communication Dimensions (Clarity, Confidence, Structure, Conciseness, Technical Communication)

Return ONLY valid JSON matching this exact schema:
{
  "score": <number 0-10>,
  "overallScore": <number 0-100>,
  "relevance": <number 0-1, directness and focus on the question>,
  "technicalCorrectness": <number 0-1, technical accuracy>,
  "depth": <number 0-1, implementation knowledge and trade-off depth>,
  "structure": <number 0-1, logical flow: Problem -> Approach -> Reasoning -> Implementation -> Trade-off>,
  "reasoning": <number 0-1, decision justification and analytical reasoning>,
  "clarity": <number 0-1, clarity of communication>,
  "strengths": [<specific observed technical strengths>],
  "weaknesses": [<specific technical gaps or limited trade-off analysis>],
  "misconceptions": [<specific technical errors or inaccurate assumptions>],
  "missingConcepts": [<important missing concepts>],
  "recommendedFollowUp": <specific follow-up topic string or null>,
  "candidate_claims": [<specific factual or technical claims made>],
  "communication": {
    "communicationScore": <number 0-100>,
    "clarity": <number 0-1>,
    "confidence": <number 0-1, ability to explain choices without excessive uncertainty>,
    "structure": <number 0-1, direct answer -> reasoning -> examples>,
    "conciseness": <number 0-1, efficient without excessive repetition or rambling>,
    "technicalCommunication": <number 0-1, explaining technical ideas clearly to engineers>,
    "observations": [<observable communication pattern statements>],
    "improvements": [<actionable communication improvement suggestions>]
  }
}

Rules:
- Distinguish technical strength from communication strength (e.g. Technical Knowledge: High, Communication: Needs Improvement).
- Do NOT infer psychological traits. Base communication scores purely on observable answer structure, clarity, and conciseness.
"""


async def evaluate_answer(
    session: InterviewSession,
    candidate_message: str,
    question_meta: QuestionMeta | None,
) -> AnswerEvaluation:
    if not LLM_ENABLED:
        return _fallback_evaluation(candidate_message)

    day_context = ""
    if question_meta:
        day_context = curriculum_service.format_day_context(question_meta.day)

    recent_q = ""
    for entry in reversed(session.transcript):
        if entry.role == "interviewer":
            recent_q = entry.content
            break

    prior_qa = ""
    qa_pairs = []
    for entry in reversed(session.transcript[:-1]):
        if len(qa_pairs) >= 4:
            break
        qa_pairs.insert(0, f"{'Interviewer' if entry.role == 'interviewer' else 'Candidate'}: {entry.content[:300]}")
    if qa_pairs:
        prior_qa = "Recent conversation context:\n" + "\n".join(qa_pairs)

    question_type_note = ""
    if question_meta:
        question_type_note = (
            f"Question type: {question_meta.question_type.value} | "
            f"Difficulty: {question_meta.difficulty.value} | "
            f"Topic: Day {question_meta.day} — {question_meta.topic}"
        )

    user_prompt = f"""Question asked:
{recent_q}

{question_type_note}

Curriculum reference:
{day_context}

{prior_qa}

Candidate's answer:
{candidate_message}

Perform deep technical and communication evaluation according to the schema."""

    try:
        data = await chat_json(
            [
                {"role": "system", "content": EVAL_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        return _parse_evaluation_json(data)
    except Exception:
        return _fallback_evaluation(candidate_message)


def _parse_evaluation_json(data: dict) -> AnswerEvaluation:
    comm_data = data.get("communication", {})
    comm_metrics = CommunicationMetrics(
        communicationScore=int(comm_data.get("communicationScore", 80)),
        clarity=float(comm_data.get("clarity", 0.8)),
        confidence=float(comm_data.get("confidence", 0.8)),
        structure=float(comm_data.get("structure", 0.8)),
        conciseness=float(comm_data.get("conciseness", 0.8)),
        technicalCommunication=float(comm_data.get("technicalCommunication", 0.8)),
        observations=comm_data.get("observations", []),
        improvements=comm_data.get("improvements", []),
    )

    score_val = float(data.get("score", 5))
    corr_val = float(data.get("technicalCorrectness", data.get("correctness", 0.5)))
    depth_val = float(data.get("depth", 0.5))
    clarity_val = float(data.get("clarity", 0.5))
    reason_val = float(data.get("reasoning", 0.5))
    rel_val = float(data.get("relevance", 0.8))
    struct_val = float(data.get("structure", 0.75))

    missing = data.get("missingConcepts", data.get("missing_concepts", []))
    rec_followup = data.get("recommendedFollowUp", data.get("recommended_followup"))

    return AnswerEvaluation(
        score=score_val,
        overallScore=int(data.get("overallScore", score_val * 10)),
        relevance=rel_val,
        technicalCorrectness=corr_val,
        correctness=corr_val,
        depth=depth_val,
        structure=struct_val,
        reasoning=reason_val,
        clarity=clarity_val,
        strengths=data.get("strengths", []),
        weaknesses=data.get("weaknesses", []),
        misconceptions=data.get("misconceptions", []),
        missingConcepts=missing,
        missing_concepts=missing,
        recommendedFollowUp=rec_followup,
        recommended_followup=rec_followup,
        candidate_claims=data.get("candidate_claims", []),
        communication=comm_metrics,
    )


def _fallback_evaluation(message: str) -> AnswerEvaluation:
    text = message.strip().lower()

    no_answer_phrases = {
        "i don't know", "i dont know", "idk", "not sure", "no idea",
        "pass", "skip", "can't answer", "i have no idea", "no experience",
    }
    if text in no_answer_phrases or any(text.startswith(p) for p in no_answer_phrases):
        return AnswerEvaluation(
            score=2.0,
            overallScore=20,
            relevance=0.3,
            technicalCorrectness=0.1,
            correctness=0.1,
            depth=0.1,
            structure=0.2,
            reasoning=0.1,
            clarity=0.6,
            missingConcepts=["Foundational understanding of the topic"],
            missing_concepts=["Foundational understanding of the topic"],
            recommendedFollowUp="foundational concept — ask a simpler version",
            recommended_followup="foundational concept — ask a simpler version",
            communication=CommunicationMetrics(
                communicationScore=50,
                clarity=0.5,
                confidence=0.2,
                structure=0.4,
                conciseness=0.9,
                technicalCommunication=0.3,
                observations=["Candidate passed or stated lack of familiarity"],
                improvements=["Build foundational concepts before technical deep dives"],
            ),
        )

    word_count = len(message.split())
    if word_count <= 5:
        return AnswerEvaluation(
            score=3.5,
            overallScore=35,
            relevance=0.6,
            technicalCorrectness=0.35,
            correctness=0.35,
            depth=0.2,
            structure=0.3,
            reasoning=0.2,
            clarity=0.5,
            missingConcepts=["Detailed technical explanation"],
            missing_concepts=["Detailed technical explanation"],
            communication=CommunicationMetrics(
                communicationScore=45,
                clarity=0.5,
                confidence=0.4,
                structure=0.3,
                conciseness=0.95,
                technicalCommunication=0.3,
                observations=["Very short answer"],
                improvements=["Expand on reasoning and implementation details"],
            ),
        )

    return AnswerEvaluation(
        score=6.5,
        overallScore=65,
        relevance=0.85,
        technicalCorrectness=0.65,
        correctness=0.65,
        depth=0.6,
        structure=0.7,
        reasoning=0.65,
        clarity=0.75,
        strengths=["Provided relevant technical response"],
        communication=CommunicationMetrics(
            communicationScore=75,
            clarity=0.75,
            confidence=0.7,
            structure=0.7,
            conciseness=0.8,
            technicalCommunication=0.7,
            observations=["Structured technical response"],
            improvements=["Include specific trade-offs and metrics"],
        ),
    )
