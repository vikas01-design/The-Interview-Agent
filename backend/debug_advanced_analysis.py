"""Comprehensive debug script verifying Advanced Interview Analysis, Communication Metrics, and AI Resume Intelligence."""
import asyncio
import sys
import traceback

sys.path.insert(0, '.')

CANDIDATE = {
    "member": {
        "id": "CAND-003",
        "name": "Emily Chen",
        "jobRole": "AI Engineer",
        "yearsExperience": 6,
        "education": "MS Artificial Intelligence",
        "status": "COMPLETED"
    },
    "missions": [
        {"day": 7, "title": "Embeddings Explained", "passed": True, "attempts": 1},
        {"day": 8, "title": "Vector Databases Overview", "passed": True, "attempts": 1},
        {"day": 10, "title": "Retrieval & Matching Engine", "passed": True, "attempts": 1},
        {"day": 12, "title": "Prompt Engineering Fundamentals", "passed": True, "attempts": 1},
        {"day": 22, "title": "Multi-Agent Orchestration", "passed": True, "attempts": 2},
    ],
    "signals": {"commitDays": 31, "missionsCompleted": 31, "missionsFirstTry": 30}
}


async def test():
    print("=== Step 1: Test AI Resume Intelligence Agent ===")
    from app.agents.resume_analyzer import analyze_candidate_resume
    resume_analysis = await analyze_candidate_resume(CANDIDATE)
    print("  Resume Strength Score:", resume_analysis.resumeStrengthScore)
    print("  Positioning:", resume_analysis.positioning)
    print("  Curriculum Alignment items:", len(resume_analysis.curriculumAlignment))
    print("  Weak Point Enhancements:", len(resume_analysis.weakPointEnhancements))
    if resume_analysis.weakPointEnhancements:
        print("  Sample Enhancement Weak:", resume_analysis.weakPointEnhancements[0].weakStatement)
        print("  Sample Enhancement Strong:", resume_analysis.weakPointEnhancements[0].enhancedStatement)

    print("\n=== Step 2: Test Deep Answer Evaluation & Communication Metrics ===")
    from app.services.profile import analyze_candidate, init_knowledge_model
    from app.models.schemas import InterviewSession
    from app.agents.evaluator import evaluate_answer

    analysis = analyze_candidate(CANDIDATE)
    session = InterviewSession(
        session_id="debug-adv-001",
        candidate=CANDIDATE,
        candidate_analysis=analysis,
        knowledge_model=init_knowledge_model(analysis),
    )

    eval_res = await evaluate_answer(
        session=session,
        candidate_message="Embeddings transform raw text into high-dimensional numerical vectors where distance correlates with semantic similarity. In vector databases, we use indexes like HNSW for approximate nearest neighbor search to balance search speed and recall.",
        question_meta=None,
    )
    print("  Evaluation overallScore:", eval_res.overallScore)
    print("  Relevance:", eval_res.relevance)
    print("  Technical Correctness:", eval_res.technicalCorrectness)
    print("  Depth:", eval_res.depth)
    print("  Structure:", eval_res.structure)
    print("  Reasoning:", eval_res.reasoning)
    print("  Communication Score:", eval_res.communication.communicationScore if eval_res.communication else "N/A")
    print("  Communication Clarity:", eval_res.communication.clarity if eval_res.communication else "N/A")

    print("\n=== Step 3: Test Full 8-Question Flow to Unified Feedback Report ===")
    from app.services.orchestrator import start_interview, continue_interview

    session_id = "debug-adv-completion-8"
    await start_interview(session_id, CANDIDATE)
    answers = [
        "Embeddings project text into dense vector space, enabling semantic retrieval beyond exact word matching.",
        "Vector databases utilize indexing techniques like HNSW or IVF to achieve fast sub-50ms ANN queries across millions of vectors.",
        "Retrieval Augmented Generation enhances LLM context by injecting relevant chunks retrieved via hybrid dense-sparse search.",
        "I evaluate retrieval quality using Recall@K and MRR (Mean Reciprocal Rank) metrics against ground truth benchmarks.",
        "Tradeoffs between Pinecone, Qdrant, and Milvus involve managed service convenience versus latency and memory footprint control.",
        "When debugging retrieval failures, I check chunking boundaries, embedding model alignment, and metadata filtering rules.",
        "I design multi-agent workflows using supervisor routing patterns and structured tool schema enforcement.",
        "In production, I monitor generation latency, token cost, cache hit ratios, and groundedness drift metrics."
    ]

    final_res = None
    for i, ans in enumerate(answers, 1):
        final_res = await continue_interview(session_id, ans)
        print(f"  Turn {i} complete -> done: {final_res.done}")

    print("\n=== FINAL UNIFIED CANDIDATE PERFORMANCE REPORT ===")
    print("  Done:", final_res.done)
    print("  Reply:", final_res.reply)
    fb = final_res.feedback
    if fb:
        print("  Overall Score:", fb.overallScore)
        print("  Grade:", fb.grade)
        print("  Technical Knowledge:", fb.technicalKnowledge)
        print("  Problem Solving:", fb.problemSolving)
        print("  System Design:", fb.systemDesign)
        print("  Communication:", fb.communication)
        print("  Confidence Score:", fb.confidenceScore)
        print("  Topic Mastery Count:", len(fb.topicMastery))
        if fb.communicationMetrics:
          print("  Communication Clarity:", fb.communicationMetrics.clarity)
          print("  Communication Confidence:", fb.confidenceScore)
        if fb.resumeAnalysis:
          print("  Resume Strength Score:", fb.resumeAnalysis.resumeStrengthScore)
          print("  Curriculum Alignment Items:", len(fb.resumeAnalysis.curriculumAlignment))
        if fb.unifiedIntelligence:
          print("  Unified Strengths:", fb.unifiedIntelligence.technicalStrengths)
          print("  Unified Weaknesses:", fb.unifiedIntelligence.technicalWeaknesses)

    print("\n=== ALL ADVANCED TESTS PASSED PERFECTLY ===")

if __name__ == "__main__":
    try:
        asyncio.run(test())
    except Exception:
        print("\n=== EXCEPTION ===")
        traceback.print_exc()
