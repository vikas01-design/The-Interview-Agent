from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from app.config import DATA_DIR
from app.services.curriculum import curriculum_service

logger = logging.getLogger(__name__)

_USERS_DIR = DATA_DIR / "users"
_USERS_DIR.mkdir(parents=True, exist_ok=True)

# Role-specific default skill matrices for reference
ROLE_SKILLS_MAP: dict[str, dict[str, list[str]]] = {
    "AI Engineer": {
        "strengths": ["RAG Pipeline Architecture", "Vector Search (HNSW)", "Prompt Engineering"],
        "weaknesses": ["Retrieval Evaluation (Recall@K)", "Model Context Protocol (MCP)", "Streaming Data Processing"],
    },
    "Data Engineer": {
        "strengths": ["SQL Query Optimization", "ETL Pipeline Design", "Data Warehousing (Snowflake)"],
        "weaknesses": ["Apache Spark Tuning", "Real-Time Streaming (Kafka)", "Data Governance"],
    },
    "Backend Engineer": {
        "strengths": ["Microservices Architecture", "Database Indexing & Queries", "Caching Strategies (Redis)"],
        "weaknesses": ["System Scalability under 100k QPS", "Async Event Loops", "gRPC Protocol Buffers"],
    },
    "ML Engineer": {
        "strengths": ["PyTorch Model Training", "Feature Engineering", "Model Quantization (INT8)"],
        "weaknesses": ["MLOps Pipeline Deployment", "GPU Memory Management", "Distributed Training"],
    },
    "Software Engineer": {
        "strengths": ["Object-Oriented Design", "Algorithms & Data Structures", "CI/CD Pipelines"],
        "weaknesses": ["Distributed System Design", "High Concurrency Locks", "Performance Profiling"],
    },
}


def get_role_skills(role: str) -> dict[str, list[str]]:
    role_lower = role.lower()
    for k, v in ROLE_SKILLS_MAP.items():
        if k.lower() in role_lower or role_lower in k.lower():
            return v
    return ROLE_SKILLS_MAP["AI Engineer"]


def build_default_missions() -> list[dict[str, Any]]:
    days = curriculum_service.all_days()

    missions: list[dict[str, Any]] = []
    for d in days:
        status = "AVAILABLE" if d.day <= 5 else ("LOCKED" if d.day > 15 else "AVAILABLE")

        missions.append(
            {
                "day": d.day,
                "module": d.module_title,
                "title": d.title,
                "topics": [d.type, d.module_title],
                "learningObjectives": d.objectives,
                "tools": d.tools,
                "status": status,
                "passed": False,
                "skipped": False,
                "attempts": 0,
                "bestScore": None,
            }
        )

    return missions


def sanitize_user_profile(data: dict[str, Any]) -> dict[str, Any]:
    """
    Purges legacy mock/seed sessions (e.g. SESS-101, SESS-102) and mock resume scores (79)
    so candidates without actual interviews or uploaded resumes strictly start at 0.
    """
    sessions = data.get("sessions", [])
    real_sessions = [
        s for s in sessions
        if isinstance(s, dict) and s.get("id") not in ("SESS-101", "SESS-102") and not str(s.get("id", "")).startswith("SESS-10")
    ]
    data["sessions"] = real_sessions

    if data.get("lastResumeScore") == 79 and (data.get("lastResumeDate") == "Aug 08, 2026" or not data.get("resumeText")):
        data["lastResumeScore"] = 0
        data["lastResumeRole"] = None

    return data


def get_user_profile(user_id: str, name: str = "Candidate User", email: str | None = None) -> dict[str, Any]:
    file_path = _USERS_DIR / f"{user_id}.json"
    if file_path.exists():
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
            data = sanitize_user_profile(data)
            if "missions" not in data or len(data["missions"]) != 31:
                data["missions"] = build_default_missions()
            save_user_profile(user_id, data)
            return data
        except Exception as exc:
            logger.warning("Failed to load user profile %s: %s", user_id, exc)

    # Initial profile data for brand new candidate (Clean unpopulated profile)
    new_profile: dict[str, Any] = {
        "userId": user_id,
        "name": name,
        "email": email,
        "jobRole": None,
        "yearsExperience": None,
        "jobDescription": "",
        "education": "Not specified",
        "sessions": [],
        "lastResumeScore": 0,
        "lastResumeRole": None,
        "missions": build_default_missions(),
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }

    save_user_profile(user_id, new_profile)
    return new_profile


def save_user_profile(user_id: str, data: dict[str, Any]) -> None:
    data["updatedAt"] = datetime.utcnow().isoformat()
    file_path = _USERS_DIR / f"{user_id}.json"
    try:
        file_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as exc:
        logger.warning("Failed to save user profile %s: %s", user_id, exc)


def update_user_career_target(
    user_id: str,
    target_role: str | None = None,
    years_experience: int | None = None,
    job_description: str | None = None,
) -> dict[str, Any]:
    user_data = get_user_profile(user_id)

    if target_role and target_role != user_data.get("jobRole"):
        user_data["jobRole"] = target_role
        if user_data.get("lastResumeRole") != target_role:
            user_data["lastResumeScore"] = 0

    if years_experience is not None:
        user_data["yearsExperience"] = years_experience

    if job_description is not None:
        user_data["jobDescription"] = job_description

    save_user_profile(user_id, user_data)
    return user_data


def update_user_mission_status(
    user_id: str,
    day: int,
    status: str,
    score: int | None = None,
) -> dict[str, Any]:
    user_data = get_user_profile(user_id)
    missions = user_data.get("missions", [])

    for m in missions:
        if m["day"] == day:
            m["status"] = status
            m["attempts"] = (m.get("attempts") or 0) + 1
            if status == "COMPLETED":
                m["passed"] = True
                m["skipped"] = False
                m["completionDate"] = datetime.utcnow().strftime("%Y-%m-%d")
            elif status == "SKIPPED":
                m["skipped"] = True
                m["passed"] = False
            if score is not None:
                m["bestScore"] = max(m.get("bestScore") or 0, score)
            break

    save_user_profile(user_id, user_data)
    return user_data


def add_user_interview_session(user_id: str, session_data: dict[str, Any]) -> dict[str, Any]:
    user_data = get_user_profile(user_id)
    sessions = user_data.get("sessions", [])
    sessions.insert(0, session_data)
    user_data["sessions"] = sessions
    save_user_profile(user_id, user_data)
    return user_data


def calculate_user_dashboard(user_id: str) -> dict[str, Any]:
    profile = get_user_profile(user_id)
    sessions = profile.get("sessions", [])
    missions = profile.get("missions", [])
    target_role = profile.get("jobRole")

    has_sessions = len(sessions) > 0
    avg_score = round(sum(s["score"] for s in sessions) / len(sessions)) if has_sessions else None
    avg_tech = round(sum(s["technicalKnowledge"] for s in sessions) / len(sessions)) if has_sessions else None
    avg_comm = round(sum(s["communication"] for s in sessions) / len(sessions)) if has_sessions else None

    is_resume_matched = profile.get("lastResumeRole") == target_role if target_role else False
    resume_score = profile.get("lastResumeScore") if (is_resume_matched and profile.get("lastResumeScore")) else 0

    eval_strengths = list(set(st for s in sessions for st in s.get("strengths", []))) if has_sessions else []
    eval_drawbacks = list(set(dr for s in sessions for dr in s.get("drawbacks", []))) if has_sessions else []

    completed_count = sum(1 for m in missions if m.get("status") == "COMPLETED" or m.get("passed"))

    return {
        "profile": profile,
        "metrics": {
            "avgScore": avg_score,
            "avgTechnicalKnowledge": avg_tech,
            "avgCommunication": avg_comm,
            "resumeMatchScore": resume_score,
            "sessionsCount": len(sessions),
            "completedMissionsCount": completed_count,
            "totalMissionsCount": len(missions),
            "hasAttendedInterview": has_sessions,
            "hasUploadedResume": resume_score > 0,
        },
        "intelligence": {
            "targetRole": target_role or "Not configured",
            "topStrengths": eval_strengths,
            "topDrawbacks": eval_drawbacks,
            "hasData": has_sessions,
        },
    }


def evaluate_candidate_json(user_id: str) -> dict[str, Any]:
    profile = get_user_profile(user_id)
    sessions = profile.get("sessions", [])
    target_role = profile.get("jobRole", "Not configured")

    has_interview = len(sessions) > 0
    last_resume = profile.get("lastResumeScore")
    last_role = profile.get("lastResumeRole")
    has_resume = last_resume is not None and isinstance(last_resume, (int, float)) and last_resume > 0 and last_role == target_role

    resume_match = int(last_resume) if has_resume else 0
    interview_score = round(sum(s["score"] for s in sessions) / len(sessions)) if has_interview else 0
    technical_knowledge = round(sum(s["technicalKnowledge"] for s in sessions) / len(sessions)) if has_interview else 0
    communication = round(sum(s["communication"] for s in sessions) / len(sessions)) if has_interview else 0

    evaluation: dict[str, Any] = {
        "candidate_id": user_id,
        "metrics": {
            "resume_match": resume_match,
            "interview_score": interview_score,
            "technical_knowledge": technical_knowledge,
            "communication": communication,
        },
    }

    if has_interview:
        eval_strengths = list(set(st for s in sessions for st in s.get("strengths", [])))
        eval_drawbacks = list(set(dr for s in sessions for dr in s.get("drawbacks", [])))

        top_strengths = eval_strengths[:3] if eval_strengths else ["Technical Knowledge", "Problem Solving"]
        top_drawbacks = eval_drawbacks[:3] if eval_drawbacks else ["System Design Depth"]

        review_text = (
            f"Candidate demonstrated technical proficiency in {', '.join(top_strengths[:2])} for the {target_role} role. "
            f"Communicated technical concepts clearly with an overall interview evaluation score of {interview_score}/100. "
            f"Recommended areas for further skill refinement include {', '.join(top_drawbacks[:2])}."
        )

        evaluation["candidate_intelligence"] = {
            "strongest_areas": top_strengths,
            "needs_attention": top_drawbacks,
            "review": review_text,
        }

    return evaluation
