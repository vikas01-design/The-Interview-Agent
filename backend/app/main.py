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


@app.get("/api/candidates")
async def candidates_endpoint() -> dict:
    """
    Returns the candidate list sourced from TheBreeth.
    Falls back to local JSON automatically if TheBreeth is unavailable.
    """
    candidates = await fetch_candidates_from_breeth()
    return {"candidates": candidates}


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
