"""Verification test script for 3 system optimizations:
1. Python Code Execution Engine
2. Telemetry Event Logging
3. FastAPI Endpoints Integration
"""
import sys
import asyncio
import traceback

sys.path.insert(0, '.')

async def run_tests():
    print("=== Step 1: Test Code Execution Engine ===")
    from app.services.code_evaluator import execute_candidate_code

    code_sample = """```python
def cosine_similarity(a, b):
    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    return dot_product / (norm_a * norm_b)

print(cosine_similarity([1, 2, 3], [1, 2, 3]))
```"""

    res = execute_candidate_code(code_sample)
    print("  Executed:", res.executed)
    print("  Syntax Valid:", res.syntaxValid)
    print("  Passed:", res.passed)
    print("  Stdout:", res.stdout)
    print("  Execution Time (ms):", res.executionTimeMs)
    assert res.executed is True
    assert res.syntaxValid is True
    assert res.passed is True
    print("  Code execution test PASSED!")

    print("\n=== Step 2: Test Telemetry Logging & Interview Flow ===")
    from app.services.orchestrator import start_interview, continue_interview
    from app.services.session_store import get_session

    CANDIDATE = {
        "member": {
            "id": "CAND-001",
            "name": "Sarah Johnson",
            "jobRole": "Senior Data Engineer",
            "yearsExperience": 9,
            "education": "MS Computer Science",
            "status": "COMPLETED",
        },
        "missions": [
            {"day": 7, "title": "Embeddings Explained", "passed": True, "attempts": 1},
            {"day": 8, "title": "Vector Databases Overview", "passed": True, "attempts": 1},
            {"day": 10, "title": "Retrieval & Matching Engine", "passed": True, "attempts": 1},
            {"day": 12, "title": "Prompt Engineering Fundamentals", "passed": True, "attempts": 1},
        ],
        "signals": {"commitDays": 28, "missionsCompleted": 30, "missionsFirstTry": 20},
    }

    session_id = "test-opt-session-101"
    res1 = await start_interview(session_id, CANDIDATE)
    print("  Start Reply:", res1.reply[:80])

    res2 = await continue_interview(session_id, code_sample)
    print("  Continue Reply:", res2.reply[:80])

    session = get_session(session_id)
    print("  Recorded Telemetry Count:", len(session.telemetry))
    for evt in session.telemetry:
        print(f"    - [{evt.eventType}] {evt.title}: {evt.description}")

    assert len(session.telemetry) >= 2
    assert any(e.eventType == "CODE_EXECUTION" for e in session.telemetry)
    print("  Telemetry logging test PASSED!")

    print("\n=== Step 3: Test FastAPI Analytics & Telemetry Routes ===")
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    r1 = client.get(f"/api/interview/{session_id}/telemetry")
    print("  Session Telemetry HTTP Status:", r1.status_code)
    assert r1.status_code == 200
    print("  Telemetry count returned:", len(r1.json()["telemetry"]))

    r2 = client.get("/api/analytics/telemetry")
    print("  Global Analytics HTTP Status:", r2.status_code)
    assert r2.status_code == 200
    print("  Adaptive Metrics:", r2.json()["adaptiveMetrics"])

    print("\n=== ALL OPTIMIZATION VERIFICATION TESTS PASSED! ===")

if __name__ == "__main__":
    try:
        asyncio.run(run_tests())
    except Exception:
        print("\n=== EXCEPTION ===")
        traceback.print_exc()
