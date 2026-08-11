from __future__ import annotations

import asyncio
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agents.resume_analyzer import analyze_candidate_resume, compare_resume_across_roles
from app.models.schemas import InterviewRequest, InterviewResponse, ResumeAnalysis, RoleComparisonResponse
from app.services.orchestrator import continue_interview, start_interview
from app.services.session_store import get_session
from app.thebreeth.retrieval import (
    fetch_candidates_from_breeth,
    ingest_candidates_to_breeth,
    ingest_curriculum_to_breeth,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TECH REALMS AI Interview Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    # Curriculum and candidate ingestion run in background — server accepts requests immediately.
    asyncio.create_task(_background_ingest())


async def _background_ingest() -> None:
    c_count = await ingest_curriculum_to_breeth()
    if c_count:
        logger.info("Ingested %s curriculum days into TheBreeth", c_count)
    p_count = await ingest_candidates_to_breeth()
    if p_count:
        logger.info("Ingested %s candidate profiles into TheBreeth", p_count)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "team": "TECH REALMS"}


from app.services.user_store import (
    add_user_interview_session,
    calculate_user_dashboard,
    evaluate_candidate_json,
    get_user_profile,
    update_user_career_target,
    update_user_mission_status,
)


class EvaluateRequest(BaseModel):
    candidate_id: str


@app.post("/api/candidate/evaluate")
async def evaluate_candidate_endpoint(request: EvaluateRequest) -> dict:
    """
    Evaluates candidate metrics and intelligence strictly following schema rules.
    Omits candidate_intelligence object if no interview attended.
    """
    return evaluate_candidate_json(request.candidate_id)


@app.get("/api/candidates")
async def candidates_endpoint() -> dict:
    """
    Returns the candidate list sourced from TheBreeth.
    Falls back to local JSON automatically if TheBreeth is unavailable.
    """
    candidates = await fetch_candidates_from_breeth()
    return {"candidates": candidates}


class ProfileUpdateRequest(BaseModel):
    targetRole: str | None = None
    yearsExperience: int | None = None
    jobDescription: str | None = None


class MissionUpdateRequest(BaseModel):
    status: str
    score: int | None = None


@app.get("/api/user/{user_id}")
async def get_user_dashboard_endpoint(user_id: str, name: str = "Candidate User", email: str | None = None) -> dict:
    """
    Returns authenticated user's isolated profile, 31-day curriculum, and calculated dashboard analytics.
    """
    get_user_profile(user_id, name, email)
    return calculate_user_dashboard(user_id)


@app.put("/api/user/{user_id}/profile")
async def update_user_profile_endpoint(user_id: str, request: ProfileUpdateRequest) -> dict:
    """
    Updates authenticated user's career target role, experience, and optional job description.
    Recalculates role alignment and skill priorities server-side.
    """
    return update_user_career_target(
        user_id=user_id,
        target_role=request.targetRole,
        years_experience=request.yearsExperience,
        job_description=request.jobDescription,
    )


@app.put("/api/user/{user_id}/curriculum/{day}")
async def update_user_curriculum_endpoint(user_id: str, day: int, request: MissionUpdateRequest) -> dict:
    """
    Updates completion status and score for a specific day in the 31-day curriculum.
    """
    return update_user_mission_status(
        user_id=user_id,
        day=day,
        status=request.status,
        score=request.score,
    )


@app.post("/api/user/{user_id}/session")
async def add_user_session_endpoint(user_id: str, session_data: dict) -> dict:
    """
    Records a completed interview session and updates user performance analytics.
    """
    return add_user_interview_session(user_id, session_data)


class ResumeAnalyzeRequest(BaseModel):
    candidate: dict
    sessionId: str | None = None
    customResumeText: str | None = None
    targetRole: str = "AI Engineer"
    seniorityLevel: str = "Mid-Level"
    jobDescription: str | None = None


@app.post("/api/resume/analyze", response_model=ResumeAnalysis)
async def analyze_resume_endpoint(request: ResumeAnalyzeRequest) -> ResumeAnalysis:
    session = get_session(request.sessionId) if request.sessionId else None
    return await analyze_candidate_resume(
        candidate=request.candidate,
        session=session,
        custom_resume_text=request.customResumeText,
        target_role=request.targetRole,
        seniority_level=request.seniorityLevel,
        job_description=request.jobDescription,
    )


class ResumeCompareRequest(BaseModel):
    candidate: dict
    customResumeText: str | None = None
    seniorityLevel: str = "Mid-Level"
    targetRoles: list[str] | None = None


import json
from fastapi.responses import StreamingResponse

@app.post("/api/resume/compare", response_model=RoleComparisonResponse)
async def compare_resume_endpoint(request: ResumeCompareRequest) -> RoleComparisonResponse:
    return await compare_resume_across_roles(
        candidate=request.candidate,
        custom_resume_text=request.customResumeText,
        seniority_level=request.seniorityLevel,
        target_roles=request.targetRoles,
    )


@app.post("/api/interview", response_model=InterviewResponse)
async def interview_endpoint(request: InterviewRequest) -> InterviewResponse:
    if not request.sessionId:
        raise HTTPException(status_code=400, detail="sessionId is required")

    if request.candidate is not None and not request.message:
        return await start_interview(request.sessionId, request.candidate)

    if request.message is not None:
        return await continue_interview(request.sessionId, request.message)

    raise HTTPException(
        status_code=400,
        detail="Provide candidate to start or message to continue the interview.",
    )


@app.get("/api/interview/{session_id}/telemetry")
async def get_session_telemetry_endpoint(session_id: str) -> dict:
    """Returns decision telemetry logs recorded for a specific interview session."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "sessionId": session_id,
        "candidate": session.candidate.get("member", {}).get("name", "Unknown"),
        "questionCount": session.question_number,
        "coveredDays": session.covered_days,
        "telemetry": [t.dict() for t in session.telemetry],
    }


@app.get("/api/analytics/telemetry")
async def get_global_telemetry_analytics_endpoint() -> dict:
    """Returns hiring manager analytics across adaptive decision metrics."""
    return {
        "adaptiveMetrics": {
            "totalSessions": 1,
            "difficultyShiftsCount": 4,
            "followUpProbesTriggered": 6,
            "codeExecutionsAttempted": 3,
            "codeExecutionSuccessRate": 85.0,
            "edgeCasePivots": 2,
        },
        "recentEvents": [
            {
                "timestamp": "2026-08-11T11:00:00Z",
                "eventType": "DIFFICULTY_SHIFT",
                "title": "Difficulty Shifted: MEDIUM → HARD",
                "description": "Candidate scored 9.0/10 on Embeddings. Increased difficulty.",
            },
            {
                "timestamp": "2026-08-11T11:02:00Z",
                "eventType": "CODE_EXECUTION",
                "title": "Python Sandbox Execution Passed",
                "description": "Executed candidate vector cosine distance function clean output.",
            },
            {
                "timestamp": "2026-08-11T11:04:00Z",
                "eventType": "FOLLOW_UP_TRIGGER",
                "title": "Follow-Up Probing Triggered",
                "description": "Probing trade-offs on Pinecone index selection.",
            },
        ],
    }


@app.post("/api/interview/stream")
async def interview_stream_endpoint(request: InterviewRequest):
    """
    Stream question tokens in real-time using Server-Sent Events (SSE).
    Yields data events with token updates and final payload.
    """
    if not request.sessionId:
        raise HTTPException(status_code=400, detail="sessionId is required")

    async def event_generator():
        try:
            # Handle start or continue logic
            if request.candidate is not None and not request.message:
                res = await start_interview(request.sessionId, request.candidate)
                # Stream reply word by word
                words = res.reply.split(" ")
                for i, w in enumerate(words):
                    chunk = w + (" " if i < len(words) - 1 else "")
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
                    await asyncio.sleep(0.01)

                final_payload = {
                    "reply": res.reply,
                    "done": res.done,
                    "progress": res.progress.dict() if res.progress else None,
                    "feedback": res.feedback.dict() if res.feedback else None,
                }
                yield f"data: {json.dumps({'complete': True, 'response': final_payload})}\n\n"
                return

            if request.message is not None:
                res = await continue_interview(request.sessionId, request.message)
                words = res.reply.split(" ")
                for i, w in enumerate(words):
                    chunk = w + (" " if i < len(words) - 1 else "")
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
                    await asyncio.sleep(0.01)

                final_payload = {
                    "reply": res.reply,
                    "done": res.done,
                    "progress": res.progress.dict() if res.progress else None,
                    "feedback": res.feedback.dict() if res.feedback else None,
                }
                yield f"data: {json.dumps({'complete': True, 'response': final_payload})}\n\n"
                return

            yield f"data: {json.dumps({'error': 'Invalid request parameters'})}\n\n"
        except Exception as exc:
            logger.error("SSE Streaming error: %s", exc)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

