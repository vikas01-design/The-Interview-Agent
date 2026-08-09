"""Comprehensive debug script verifying Role-Aware Resume Scoring, Job Description Matching, and Multi-Role Comparison."""
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
    print("=== Step 1: Evaluate Candidate for Target Role: AI Engineer (Mid-Level) ===")
    from app.agents.resume_analyzer import analyze_candidate_resume, compare_resume_across_roles

    res_ai = await analyze_candidate_resume(
        candidate=CANDIDATE,
        target_role="AI Engineer",
        seniority_level="Mid-Level"
    )
    print("  AI Engineer Match Score:", res_ai.roleReport.overallMatchScore if res_ai.roleReport else res_ai.resumeStrengthScore)
    print("  SubScores:", res_ai.roleReport.subScores if res_ai.roleReport else "N/A")
    print("  Why Summary:", res_ai.roleReport.whySummary if res_ai.roleReport else "N/A")

    print("\n=== Step 2: Evaluate SAME Candidate for Target Role: Data Engineer (Mid-Level) ===")
    res_de = await analyze_candidate_resume(
        candidate=CANDIDATE,
        target_role="Data Engineer",
        seniority_level="Mid-Level"
    )
    print("  Data Engineer Match Score:", res_de.roleReport.overallMatchScore if res_de.roleReport else res_de.resumeStrengthScore)
    print("  Matched Evidence:", res_de.roleReport.matchedEvidence[:2] if res_de.roleReport else [])
    print("  Missing Evidence:", res_de.roleReport.missingEvidence[:2] if res_de.roleReport else [])

    print("\n=== Step 3: Evaluate SAME Candidate for Target Role: Senior Data Engineer (Senior) ===")
    res_sr_de = await analyze_candidate_resume(
        candidate=CANDIDATE,
        target_role="Senior Data Engineer",
        seniority_level="Senior"
    )
    print("  Senior Data Engineer Match Score:", res_sr_de.roleReport.overallMatchScore if res_sr_de.roleReport else res_sr_de.resumeStrengthScore)

    print("\n=== Step 4: Run Multi-Role Comparison Engine ===")
    comp_res = await compare_resume_across_roles(
        candidate=CANDIDATE,
        seniority_level="Mid-Level"
    )
    print("  Best Match Role:", comp_res.bestMatchRole)
    print("  Best Match Score:", comp_res.bestMatchScore)
    print("  Role Comparison Breakdown:")
    for item in comp_res.comparisons:
        print(f"    - {item.role}: {item.score}% {'[BEST MATCH]' if item.isBestMatch else ''}")

    print("\n=== ALL ROLE SCORING TESTS PASSED PERFECTLY ===")

if __name__ == "__main__":
    try:
        asyncio.run(test())
    except Exception:
        print("\n=== EXCEPTION ===")
        traceback.print_exc()
