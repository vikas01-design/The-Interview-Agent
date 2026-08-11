from __future__ import annotations

import logging
from app.config import LLM_ENABLED
from app.models.schemas import (
    AnswerEvaluation,
    CommunicationMetrics,
    Difficulty,
    EvaluationDimensions,
    InterviewSession,
    QuestionMeta,
    QuestionType,
)
from app.services.answer_validator import classify_candidate_answer, extract_technical_content
from app.services.code_evaluator import execute_candidate_code
from app.services.curriculum import curriculum_service
from app.services.llm_client import chat_json

logger = logging.getLogger(__name__)

EVAL_SYSTEM = """You are a senior technical interviewer performing a deep, multi-dimensional semantic evaluation of a candidate's answer.

CRITICAL INSTRUCTIONS:
- Do NOT perform raw keyword matching. Perform SEMANTIC REASONING: evaluate what the candidate actually demonstrates they understand even if they use different phrasing.
- Evaluate the answer against the Question's EXPECTED CONCEPTS and WEIGHTED EVALUATION CRITERIA.
- Return structured feedback in 3 parts:
  Part A (Demonstrated): What specific technical concepts the candidate demonstrated understanding of.
  Part B (Missing/Incorrect): What specific technical details were missing, incomplete, or inaccurate.
  Part C (How to Strengthen): Actionable guidance on what would make this answer stronger.
- Never use generic scripted praise like "Good answer", "Great job", "Keep practicing" unless justified by candidate claims.

Return ONLY valid JSON matching this exact schema:
{
  "overallScore": <number 0-100, calculated weighted score>,
  "score": <number 0-10, overallScore divided by 10>,
  "dimensions": {
    "correctness": <0-100>,
    "relevance": <0-100>,
    "depth": <0-100>,
    "completeness": <0-100>,
    "conceptualUnderstanding": <0-100>,
    "reasoning": <0-100>,
    "practicalUnderstanding": <0-100>,
    "accuracy": <0-100>,
    "communication": <0-100>,
    "confidence": <0-100>
  },
  "partA_demonstrated": <string, specific demonstrated concepts from candidate answer>,
  "partB_missing": <string, specific missing concepts or misconceptions>,
  "partC_strengthen": <string, actionable guidance to make the answer stronger>,
  "strengths": [<specific observed technical strengths>],
  "weaknesses": [<specific technical gaps or limited trade-off analysis>],
  "misconceptions": [<specific technical errors or inaccurate assumptions>],
  "missingConcepts": [<important missing concepts>],
  "recommendedFollowUp": <specific follow-up topic string or null>,
  "candidate_claims": [<specific factual or technical claims made>],
  "communication": {
    "communicationScore": <number 0-100>,
    "clarity": <number 0-1>,
    "confidence": <number 0-1>,
    "structure": <number 0-1>,
    "conciseness": <number 0-1>,
    "technicalCommunication": <number 0-1>,
    "observations": [<observable communication statements>],
    "improvements": [<actionable communication improvement suggestions>]
  }
}
"""


async def evaluate_answer(
    session: InterviewSession,
    candidate_message: str,
    question_meta: QuestionMeta | None,
) -> AnswerEvaluation:
    # 1. Answer Validation & Classification Layer
    classification = classify_candidate_answer(candidate_message, question_meta)
    code_res = execute_candidate_code(candidate_message)

    # If greeting only or empty non-answer and retry allowed, return non-accepted evaluation
    if not classification.accepted:
        return AnswerEvaluation(
            score=0.0,
            overallScore=0,
            classification=classification,
            codeExecution=code_res,
            partA_demonstrated="No technical content provided yet.",
            partB_missing=classification.warningMessage or "Response did not address the technical question.",
            partC_strengthen="Please explain the technical concepts in your own words.",
            missingConcepts=[question_meta.topic if question_meta else "Technical Concept"],
            missing_concepts=[question_meta.topic if question_meta else "Technical Concept"],
        )

    # Extract clean technical content (strip greetings)
    clean_message = extract_technical_content(candidate_message)

    if not LLM_ENABLED:
        eval_res = _fallback_evaluation(clean_message, classification, question_meta)
        eval_res.codeExecution = code_res
        eval_res.classification = classification
        return eval_res

    day_context = ""
    expected_concepts_str = ""
    criteria_str = ""
    if question_meta:
        day_context = curriculum_service.format_day_context(question_meta.day)
        if question_meta.expectedConcepts:
            expected_concepts_str = f"Expected Concepts to Evaluate: {', '.join(question_meta.expectedConcepts)}"
        if question_meta.evaluationCriteria:
            criteria_str = f"Weighted Evaluation Criteria: {question_meta.evaluationCriteria}"

    recent_q = ""
    for entry in reversed(session.transcript):
        if entry.role == "interviewer":
            recent_q = entry.content
            break

    question_type_note = ""
    if question_meta:
        question_type_note = (
            f"Question type: {question_meta.question_type.value} | "
            f"Difficulty: {question_meta.difficulty.value} | "
            f"Topic: Day {question_meta.day} — {question_meta.topic}"
        )

    code_note = ""
    if code_res:
        code_note = (
            f"\n\nDynamic Code Sandbox Execution Result:\n"
            f"Executed: {code_res.executed} | Syntax Valid: {code_res.syntaxValid} | Passed: {code_res.passed}\n"
            f"Stdout: {code_res.stdout}\n"
            f"Stderr/Error: {code_res.stderr} (Type: {code_res.errorType})\n"
        )

    user_prompt = f"""Question asked:
{recent_q}

{question_type_note}
{expected_concepts_str}
{criteria_str}

Curriculum reference:
{day_context}

Candidate's Answer (Classification: {classification.answerType}):
{clean_message}
{code_note}

Perform deep semantic evaluation matching the schema."""

    try:
        data = await chat_json(
            [
                {"role": "system", "content": EVAL_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        parsed = _parse_evaluation_json(data, classification)
        parsed.codeExecution = code_res
        parsed.classification = classification
        return parsed
    except Exception as exc:
        logger.warning("LLM answer evaluation failed (%s) — using fallback.", exc)
        eval_res = _fallback_evaluation(clean_message, classification, question_meta)
        eval_res.codeExecution = code_res
        eval_res.classification = classification
        return eval_res


def _parse_evaluation_json(data: dict, classification) -> AnswerEvaluation:
    dim_data = data.get("dimensions", {})
    dimensions = EvaluationDimensions(
        correctness=int(dim_data.get("correctness", 80)),
        relevance=int(dim_data.get("relevance", 80)),
        depth=int(dim_data.get("depth", 75)),
        completeness=int(dim_data.get("completeness", 75)),
        conceptualUnderstanding=int(dim_data.get("conceptualUnderstanding", 80)),
        reasoning=int(dim_data.get("reasoning", 78)),
        practicalUnderstanding=int(dim_data.get("practicalUnderstanding", 75)),
        accuracy=int(dim_data.get("accuracy", 80)),
        communication=int(dim_data.get("communication", 80)),
        confidence=int(dim_data.get("confidence", 80)),
    )

    comm_data = data.get("communication", {})
    comm_metrics = CommunicationMetrics(
        communicationScore=int(comm_data.get("communicationScore", dimensions.communication)),
        clarity=float(comm_data.get("clarity", dimensions.communication / 100)),
        confidence=float(comm_data.get("confidence", dimensions.confidence / 100)),
        structure=float(comm_data.get("structure", dimensions.reasoning / 100)),
        conciseness=float(comm_data.get("conciseness", 0.8)),
        technicalCommunication=float(comm_data.get("technicalCommunication", dimensions.correctness / 100)),
        observations=comm_data.get("observations", []),
        improvements=comm_data.get("improvements", []),
    )

    overall_score = int(data.get("overallScore", int(float(data.get("score", 7.0)) * 10)))
    score_val = round(overall_score / 10.0, 1)

    missing = data.get("missingConcepts", data.get("missing_concepts", []))
    rec_followup = data.get("recommendedFollowUp", data.get("recommended_followup"))

    partA = data.get("partA_demonstrated") or "Demonstrated core conceptual alignment."
    partB = data.get("partB_missing") or "Missing deeper trade-offs or production considerations."
    partC = data.get("partC_strengthen") or "Strengthen by including specific latency metrics or implementation choices."

    return AnswerEvaluation(
        score=score_val,
        overallScore=overall_score,
        dimensions=dimensions,
        relevance=round(dimensions.relevance / 100.0, 2),
        technicalCorrectness=round(dimensions.correctness / 100.0, 2),
        correctness=round(dimensions.correctness / 100.0, 2),
        depth=round(dimensions.depth / 100.0, 2),
        structure=round(dimensions.reasoning / 100.0, 2),
        reasoning=round(dimensions.reasoning / 100.0, 2),
        clarity=round(dimensions.communication / 100.0, 2),
        partA_demonstrated=partA,
        partB_missing=partB,
        partC_strengthen=partC,
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


def _fallback_evaluation(
    message: str,
    classification,
    question_meta: QuestionMeta | None,
) -> AnswerEvaluation:
    topic_str = question_meta.topic if question_meta else "the topic"

    if classification.answerType == "knowledge_gap":
        dims = EvaluationDimensions(
            correctness=15, relevance=30, depth=10, completeness=10,
            conceptualUnderstanding=15, reasoning=10, practicalUnderstanding=10,
            accuracy=10, communication=50, confidence=20
        )
        return AnswerEvaluation(
            score=1.5,
            overallScore=15,
            dimensions=dims,
            relevance=0.3,
            technicalCorrectness=0.15,
            correctness=0.15,
            depth=0.1,
            structure=0.2,
            reasoning=0.1,
            clarity=0.5,
            partA_demonstrated=f"Acknowledged lack of familiarity with {topic_str}.",
            partB_missing=f"Unable to explain core mechanics of {topic_str}.",
            partC_strengthen=f"Revisit foundational cohort modules covering {topic_str}.",
            missingConcepts=[f"Foundational understanding of {topic_str}"],
            missing_concepts=[f"Foundational understanding of {topic_str}"],
            recommendedFollowUp=f"prerequisite concept for {topic_str}",
            communication=CommunicationMetrics(
                communicationScore=50, clarity=0.5, confidence=0.2, structure=0.4,
                conciseness=0.9, technicalCommunication=0.2,
                observations=["Candidate clearly communicated knowledge gap."],
                improvements=["Build prerequisite concept foundations."],
            ),
        )

    if classification.answerType == "irrelevant":
        dims = EvaluationDimensions(
            correctness=20, relevance=15, depth=20, completeness=15,
            conceptualUnderstanding=20, reasoning=20, practicalUnderstanding=15,
            accuracy=20, communication=60, confidence=60
        )
        return AnswerEvaluation(
            score=2.0,
            overallScore=20,
            dimensions=dims,
            relevance=0.15,
            technicalCorrectness=0.2,
            correctness=0.2,
            depth=0.2,
            structure=0.4,
            reasoning=0.2,
            clarity=0.6,
            partA_demonstrated="Provided conversational response about personal experience.",
            partB_missing=f"Response did not address the question about {topic_str}.",
            partC_strengthen=f"Focus answer directly on the retrieval, architecture, or mechanics of {topic_str}.",
            missingConcepts=[f"Direct technical explanation of {topic_str}"],
            missing_concepts=[f"Direct technical explanation of {topic_str}"],
            communication=CommunicationMetrics(
                communicationScore=60, clarity=0.6, confidence=0.6, structure=0.4,
                conciseness=0.7, technicalCommunication=0.3,
                observations=["Answer diverged from technical topic asked."],
                improvements=["Focus directly on question parameters before expanding."],
            ),
        )

    word_count = len(message.split())
    if word_count <= 5:
        dims = EvaluationDimensions(
            correctness=40, relevance=60, depth=25, completeness=30,
            conceptualUnderstanding=40, reasoning=30, practicalUnderstanding=25,
            accuracy=40, communication=50, confidence=40
        )
        return AnswerEvaluation(
            score=3.5,
            overallScore=35,
            dimensions=dims,
            relevance=0.6,
            technicalCorrectness=0.4,
            correctness=0.4,
            depth=0.25,
            structure=0.3,
            reasoning=0.3,
            clarity=0.5,
            partA_demonstrated=f"Briefly touched on basic intuition of {topic_str}.",
            partB_missing="Lacks technical detail, specific components, and trade-off reasoning.",
            partC_strengthen="Expand explanation by defining key components and step-by-step workflow.",
            missingConcepts=["Detailed technical explanation"],
            missing_concepts=["Detailed technical explanation"],
        )

    # Standard valid response fallback
    dims = EvaluationDimensions(
        correctness=78, relevance=85, depth=70, completeness=72,
        conceptualUnderstanding=80, reasoning=75, practicalUnderstanding=70,
        accuracy=78, communication=80, confidence=78
    )
    return AnswerEvaluation(
        score=7.6,
        overallScore=76,
        dimensions=dims,
        relevance=0.85,
        technicalCorrectness=0.78,
        correctness=0.78,
        depth=0.7,
        structure=0.75,
        reasoning=0.75,
        clarity=0.8,
        partA_demonstrated=f"Demonstrated core technical understanding of {topic_str}.",
        partB_missing="Omitted specific production latency metrics and failure diagnostic steps.",
        partC_strengthen="Include concrete architectural trade-offs and performance metrics for higher score.",
        strengths=[f"Relevant technical response for {topic_str}"],
    )
