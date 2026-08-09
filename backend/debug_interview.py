"""Quick debug: run the interview start logic directly and print full traceback."""
import sys, asyncio, traceback
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
        {"day": 7,  "title": "Embeddings Explained",             "passed": True, "attempts": 1},
        {"day": 8,  "title": "Vector Databases Overview",        "passed": True, "attempts": 1},
        {"day": 10, "title": "Retrieval & Matching Engine",      "passed": True, "attempts": 1},
        {"day": 12, "title": "Prompt Engineering Fundamentals",  "passed": True, "attempts": 1},
    ],
    "signals": {"commitDays": 31, "missionsCompleted": 31, "missionsFirstTry": 30}
}

async def run():
    print("=== Step 1: analyze_candidate ===")
    from app.services.profile import analyze_candidate, init_knowledge_model
    analysis = analyze_candidate(CANDIDATE)
    print("  completed_days:", analysis.completed_days)
    print("  strong_days:", analysis.strong_days)
    print("  target_days:", analysis.target_days[:6])

    print("\n=== Step 2: init session ===")
    from app.models.schemas import InterviewSession
    session = InterviewSession(
        session_id="debug-001",
        candidate=CANDIDATE,
        candidate_analysis=analysis,
        knowledge_model=init_knowledge_model(analysis),
    )
    print("  session OK")

    print("\n=== Step 3: pick day + build meta ===")
    from app.services.planner import _pick_day, _question_type_for_turn, pick_difficulty_for_day
    from app.agents.question_generator import build_question_meta
    day = _pick_day(session)
    qtype = _question_type_for_turn(session)
    diff = pick_difficulty_for_day(session, day)
    meta = build_question_meta(session, day, qtype, difficulty=diff)
    print(f"  day={day} qtype={qtype} diff={diff} meta={meta}")

    print("\n=== Step 4: retrieve_curriculum_context ===")
    from app.thebreeth.retrieval import retrieve_curriculum_context
    ctx = await retrieve_curriculum_context(
        f"Day {meta.day} {meta.topic} {meta.question_type.value}",
        day=meta.day,
    )
    print("  context length:", len(ctx))
    print("  context preview:", ctx[:200])

    print("\n=== Step 5: generate_question ===")
    from app.agents.question_generator import generate_question
    question = await generate_question(session, meta)
    print("  QUESTION 1:", question)

    print("\n=== Step 6: candidate answers 'I don't know' ===")
    from app.services.orchestrator import start_interview, continue_interview
    res1 = await start_interview("debug-session-idk", CANDIDATE)
    print("  Start reply:", res1.reply)
    print("  Progress 1:", res1.progress)

    res2 = await continue_interview("debug-session-idk", "I don't know")
    print("\n  Response to 'I don't know':", res2.reply)
    print("  Progress 2 (currentTopic):", res2.progress.currentTopic if res2.progress else "N/A")

    print("\n=== Step 8: Run interview to question 8 completion ===")
    session_id = "debug-completion-8"
    await start_interview(session_id, CANDIDATE)
    answers = [
        "Embeddings map text to vectors in vector space.",
        "Vector databases use similarity search like cosine distance.",
        "Retrieval Augmented Generation combines search with LLM generation.",
        "I use top-k parameter to filter retrieved documents.",
        "Tradeoffs include latency and memory footprint.",
        "I inspect chunk size and embedding quality when debugging.",
        "I design a multi-stage architecture with hybrid search.",
        "I monitor latency, cost, and cache hit rates in production."
    ]

    final_res = None
    for i, ans in enumerate(answers, 1):
        final_res = await continue_interview(session_id, ans)
        print(f"  Turn {i} -> done: {final_res.done}, QNum: {final_res.progress.questionNumber if final_res.progress else 'N/A'}")

    print("\n=== FINAL COMPLETION RESPONSE ===")
    print("  Done:", final_res.done)
    print("  Reply:", final_res.reply)
    if final_res.feedback:
        print("  Feedback overallScore:", final_res.feedback.overallScore)
        print("  Feedback Grade:", final_res.feedback.grade)
        print("  Feedback Strengths:", final_res.feedback.strengths[:2])
        print("  Feedback Drawbacks:", final_res.feedback.drawbacks[:2])
        print("  Feedback Improvements:", final_res.feedback.improvements[:2])

    print("\n=== ALL STEPS PASSED ===")

if __name__ == "__main__":
    try:
        asyncio.run(run())
    except Exception:
        print("\n=== EXCEPTION ===")
        traceback.print_exc()

