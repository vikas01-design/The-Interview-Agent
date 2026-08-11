"""Automated verification suite for 10-Question Adaptive Technical Interview Engine.

Tests:
1. Greeting-Only validation warning & retry workflow.
2. Greeting + Technical answer evaluation (greeting stripped).
3. Irrelevant response classification.
4. Knowledge Gap classification & adaptive question selection.
5. Full 10-Question interview completion and final report.
"""
import asyncio
import sys
import traceback

sys.path.insert(0, ".")

CANDIDATE = {
    "member": {
        "id": "CAND-TEST-10Q",
        "name": "Jordan Lee",
        "jobRole": "AI Engineer",
        "yearsExperience": 5,
        "education": "BS Computer Science",
        "status": "COMPLETED",
    },
    "missions": [
        {"day": 7, "title": "Embeddings Explained", "passed": True, "attempts": 1},
        {"day": 8, "title": "Vector Databases Overview", "passed": True, "attempts": 1},
        {"day": 10, "title": "Retrieval & Matching Engine", "passed": True, "attempts": 1},
        {"day": 12, "title": "Prompt Engineering Fundamentals", "passed": True, "attempts": 1},
        {"day": 16, "title": "Chatbot Backend & API Integration", "passed": True, "attempts": 1},
        {"day": 22, "title": "Multi-Agent Orchestration", "passed": True, "attempts": 1},
    ],
    "signals": {"commitDays": 30, "missionsCompleted": 30, "missionsFirstTry": 28},
}


async def run_tests():
    from app.services.orchestrator import start_interview, continue_interview
    from app.services.session_store import get_session

    print("=== Step 1: Initialize 10-Question Interview Session ===")
    session_id = "test-10q-session"
    res = await start_interview(session_id, CANDIDATE)
    print("  Q1 Reply:", res.reply[:100])
    print("  Progress:", res.progress)
    assert res.progress.questionNumber == 1
    assert res.progress.totalQuestions == 10

    print("\n=== Step 2: Test Greeting-Only Answer Validation ===")
    res_greeting = await continue_interview(session_id, "Hi, how are you?")
    print("  Greeting Reply Warning:", res_greeting.reply)
    print("  Classification:", res_greeting.answerClassification)
    print("  Progress Question Number:", res_greeting.progress.questionNumber)

    assert res_greeting.answerClassification.answerType == "greeting_only"
    assert res_greeting.answerClassification.accepted is False
    assert res_greeting.progress.retryAllowed is True
    # Question count must NOT advance on greeting-only warning!
    assert res_greeting.progress.questionNumber == 1
    print("  Greeting-Only Validation PASSED!")

    print("\n=== Step 3: Test Greeting + Technical Answer ===")
    ans1 = "Hi, Retrieval-Augmented Generation retrieves relevant documents from a vector store and provides them as context to the LLM to ground generation."
    res_ans1 = await continue_interview(session_id, ans1)
    print("  Reply:", res_ans1.reply[:100])
    print("  Classification:", res_ans1.answerClassification)
    print("  Question Number:", res_ans1.progress.questionNumber)

    assert res_ans1.answerClassification.accepted is True
    assert res_ans1.answerClassification.hasGreeting is True
    assert res_ans1.progress.questionNumber == 2
    print("  Greeting + Technical Answer PASSED!")

    print("\n=== Step 4: Test Irrelevant Response Classification ===")
    res_irr = await continue_interview(session_id, "Python is my favorite programming language because I started learning it in college.")
    print("  Irrelevant Classification:", res_irr.answerClassification)
    assert res_irr.answerClassification.answerType == "irrelevant"
    print("  Irrelevant Response PASSED!")

    print("\n=== Step 5: Test Knowledge Gap Response ===")
    res_kg = await continue_interview(session_id, "I don't know.")
    print("  Knowledge Gap Classification:", res_kg.answerClassification)
    print("  Selection Reason:", res_kg.progress.selectionReason)
    assert res_kg.answerClassification.answerType == "knowledge_gap"
    print("  Knowledge Gap PASSED!")

    print("\n=== Step 6: Complete 10 Questions Life Cycle ===")
    answers = [
        "Vector databases index high-dimensional embeddings using algorithms like HNSW to enable fast cosine distance search.",
        "Prompt engineering guides LLM output format using system prompts and few-shot examples.",
        "Function calling allows LLMs to output structured JSON arguments to invoke external APIs.",
        "We evaluate retrieval quality using MRR, Hit Rate, and NDCG metrics.",
        "Multi-agent orchestration coordinates agents using planner and routing patterns.",
        "I monitor latency, cache hit rates, and fallback rate in production systems.",
        "Capstone architecture integrates RAG, vector search, and agent orchestration for production deployments."
    ]


    final_res = None
    for ans in answers:
        final_res = await continue_interview(session_id, ans)
        print(f"  Q{final_res.progress.questionNumber if final_res.progress else 'END'} -> Done: {final_res.done}")

    assert final_res.done is True
    assert final_res.feedback is not None
    print("\n=== FINAL REPORT OVERVIEW ===")
    print("  Summary:", final_res.feedback.summary[:150])
    print("  Overall Score:", final_res.feedback.overallScore)
    print("  Grade:", final_res.feedback.grade)
    print("  Technical Knowledge:", final_res.feedback.technicalKnowledge)
    print("  Communication:", final_res.feedback.communication)
    print("  Problem Solving:", final_res.feedback.problemSolving)
    print("  System Design:", final_res.feedback.systemDesign)
    print("  Strengths:", final_res.feedback.strengths[:2])
    print("  Drawbacks:", final_res.feedback.drawbacks[:2])

    print("\n=== ALL 10-QUESTION ADAPTIVE ENGINE TESTS PASSED! ===")


if __name__ == "__main__":
    try:
        asyncio.run(run_tests())
    except Exception:
        print("\n=== EXCEPTION ===")
        traceback.print_exc()
