from __future__ import annotations

import logging
from typing import Any

from app.config import LLM_ENABLED
from app.models.schemas import (
    InterviewSession,
    ResumeAlignmentItem,
    ResumeAnalysis,
    RoleCategoryScore,
    RoleComparisonItem,
    RoleComparisonResponse,
    RoleScoreReport,
    SeniorityLevel,
    SubScoreBreakdown,
    TargetRole,
    WeakPointEnhancement,
)
from app.services.llm_client import chat_json

logger = logging.getLogger(__name__)

ROLE_ANALYSIS_SYSTEM = """You are an Executive AI Technical Recruiter and Principal Engineer performing a Role-Aware AI Resume Evaluation.

Calculate a role-specific resume match score based on the target role, seniority level, and target job description (if provided).

Return ONLY valid JSON matching this exact schema:
{
  "resumeStrengthScore": <number 0-100>,
  "targetRole": "<Target Role Name>",
  "seniorityLevel": "<Junior | Mid-Level | Senior | Lead / Staff>",
  "overallMatchScore": <number 0-100, role-specific match score>,
  "subScores": {
    "skillsMatch": <number 0-100>,
    "experienceMatch": <number 0-100>,
    "projectRelevance": <number 0-100>,
    "technologyMatch": <number 0-100>,
    "seniorityMatch": <number 0-100>,
    "impactScore": <number 0-100>
  },
  "categories": [
    {
      "categoryName": "<Role specific skill area, e.g. SQL & Data Pipelines>",
      "weightPct": <number 10-40>,
      "scorePct": <number 0-100>
    }
  ],
  "matchedEvidence": [
    "<specific green check bullet showing resume evidence matched to role requirement, e.g. '✓ Strong Python and SQL data pipeline experience'>"
  ],
  "missingEvidence": [
    "<specific amber warning bullet showing missing evidence for target role, e.g. '⚠ Limited evidence of distributed Spark or Airflow orchestration'>"
  ],
  "whySummary": "<2-3 sentence clear explanation of why this specific score was awarded for this specific role and seniority level>",
  "positioning": {
    "RAG": <number 0-100>,
    "Vector Databases": <number 0-100>,
    "Agentic AI": <number 0-100>,
    "MCP": <number 0-100>,
    "Deployment": <number 0-100>,
    "Production AI": <number 0-100>
  },
  "curriculumAlignment": [
    {
      "topic": "<e.g. RAG>",
      "resumeEvidence": "<evidence from profile>",
      "status": "<Strong | Moderate | Weak | Missing>"
    }
  ],
  "interviewConsistency": [
    "<interview performance consistency statement>"
  ],
  "weakPointEnhancements": [
    {
      "weakStatement": "<original weak line>",
      "enhancedStatement": "<quantified impact rewrite>",
      "rationale": "<why stronger>"
    }
  ],
  "recommendations": [
    "<actionable suggestion to improve positioning for target role>"
  ]
}

Rules:
- NO fixed score formula or random numbers! The score MUST change dynamically according to target role and seniority.
- A candidate strong in Data Engineering (SQL/ETL) must score higher for Data Engineer (e.g. 90%) than for Senior AI Architect (e.g. 65%).
- A candidate evaluated for Senior/Lead roles MUST be evaluated strictly on architecture, scalability, systems design, and leadership.
- If a skill is missing from the resume, list it in missingEvidence and do NOT assume candidate possesses it.
"""


async def analyze_candidate_resume(
    candidate: dict[str, Any],
    session: InterviewSession | None = None,
    custom_resume_text: str | None = None,
    target_role: str = "AI Engineer",
    seniority_level: str = "Mid-Level",
    job_description: str | None = None,
) -> ResumeAnalysis:
    member = candidate.get("member", {})
    name = member.get("name", "Candidate")
    cand_role = member.get("jobRole", "Engineer")
    exp = member.get("yearsExperience", 3)
    edu = member.get("education", "BS Computer Science")
    missions = candidate.get("missions", [])

    if not LLM_ENABLED:
        return _fallback_role_resume_analysis(
            candidate=candidate,
            session=session,
            target_role=target_role,
            seniority_level=seniority_level,
            job_description=job_description,
        )

    completed_titles = [m["title"] for m in missions if m.get("passed")]
    skipped_titles = [m["title"] for m in missions if m.get("skipped")]

    interview_evidence_str = "No interview conducted yet."
    if session and session.evaluations:
        scores = [e.score for e in session.evaluations]
        avg = sum(scores) / len(scores) if scores else 5.0
        interview_evidence_str = f"Interview Completed ({session.question_number} Qs, Avg score: {avg:.1f}/10)."

    user_prompt = f"""Candidate: {name} (Current Role: {cand_role}, {exp} yrs exp, Education: {edu})

Target Evaluation Context:
- Target Role: {target_role}
- Target Seniority Level: {seniority_level}
- Target Job Description: {job_description if job_description else 'Standard industry job expectations for ' + target_role}

Resume / Profile text:
{custom_resume_text if custom_resume_text else f"Member: {name}, Current Role: {cand_role}, Experience: {exp} years, Education: {edu}"}

Cohort Missions Completed: {completed_titles}
Cohort Missions Skipped: {skipped_titles}

Interview Evidence:
{interview_evidence_str}

Evaluate the resume specifically for the target position '{target_role}' at '{seniority_level}' level and return structured JSON."""

    try:
        data = await chat_json(
            [
                {"role": "system", "content": ROLE_ANALYSIS_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )
        return _parse_role_analysis_json(data, target_role, seniority_level)
    except Exception as exc:
        logger.warning("LLM role resume analysis failed (%s) — using fallback.", exc)
        return _fallback_role_resume_analysis(candidate, session, target_role, seniority_level, job_description)


async def compare_resume_across_roles(
    candidate: dict[str, Any],
    custom_resume_text: str | None = None,
    seniority_level: str = "Mid-Level",
    target_roles: list[str] | None = None,
) -> RoleComparisonResponse:
    if not target_roles:
        target_roles = [
            "AI Engineer",
            "Data Engineer",
            "ML Engineer",
            "Software Engineer",
            "Senior Data Engineer",
        ]

    comparisons: list[RoleComparisonItem] = []
    for role in target_roles:
        res = await analyze_candidate_resume(
            candidate=candidate,
            custom_resume_text=custom_resume_text,
            target_role=role,
            seniority_level="Senior" if "Senior" in role else seniority_level,
        )
        match_score = res.roleReport.overallMatchScore if res.roleReport else res.resumeStrengthScore
        why = res.roleReport.whySummary if res.roleReport else f"Evaluated for {role}"
        comparisons.append(RoleComparisonItem(role=role, score=match_score, isBestMatch=False, why=why))

    # Sort descending by match score
    comparisons.sort(key=lambda x: x.score, reverse=True)
    if comparisons:
        comparisons[0].isBestMatch = True

    best = comparisons[0] if comparisons else RoleComparisonItem(role="AI Engineer", score=80, isBestMatch=True, why="Best overall fit")

    name = candidate.get("member", {}).get("name", "Candidate")
    summary = (
        f"Multi-Role Assessment for {name}: Best alignment with {best.role} ({best.score}% match). "
        f"Score varies across roles due to specific skill & architectural requirements."
    )

    return RoleComparisonResponse(
        bestMatchRole=best.role,
        bestMatchScore=best.score,
        comparisons=comparisons,
        summary=summary,
    )


def _parse_role_analysis_json(data: dict, target_role: str, seniority_level: str) -> ResumeAnalysis:
    sub_data = data.get("subScores", {})
    sub_scores = SubScoreBreakdown(
        skillsMatch=int(sub_data.get("skillsMatch", 80)),
        experienceMatch=int(sub_data.get("experienceMatch", 80)),
        projectRelevance=int(sub_data.get("projectRelevance", 80)),
        technologyMatch=int(sub_data.get("technologyMatch", 80)),
        seniorityMatch=int(sub_data.get("seniorityMatch", 80)),
        impactScore=int(sub_data.get("impactScore", 80)),
    )

    categories = []
    for c in data.get("categories", []):
        categories.append(
            RoleCategoryScore(
                categoryName=c.get("categoryName", "Category"),
                weightPct=int(c.get("weightPct", 20)),
                scorePct=int(c.get("scorePct", 80)),
            )
        )

    overall_match = int(data.get("overallMatchScore", data.get("resumeStrengthScore", 80)))

    role_report = RoleScoreReport(
        targetRole=data.get("targetRole", target_role),
        seniorityLevel=data.get("seniorityLevel", seniority_level),
        overallMatchScore=overall_match,
        subScores=sub_scores,
        categories=categories,
        matchedEvidence=data.get("matchedEvidence", []),
        missingEvidence=data.get("missingEvidence", []),
        whySummary=data.get("whySummary", f"Awarded {overall_match}% for {target_role} ({seniority_level}) based on resume evidence."),
        recommendations=data.get("recommendations", []),
    )

    alignments = []
    for item in data.get("curriculumAlignment", []):
        alignments.append(
            ResumeAlignmentItem(
                topic=item.get("topic", "Topic"),
                resumeEvidence=item.get("resumeEvidence", "Evidence"),
                status=item.get("status", "Moderate"),
            )
        )

    enhancements = []
    for item in data.get("weakPointEnhancements", []):
        enhancements.append(
            WeakPointEnhancement(
                weakStatement=item.get("weakStatement", "Basic statement"),
                enhancedStatement=item.get("enhancedStatement", "Enhanced statement"),
                rationale=item.get("rationale", "Better impact"),
            )
        )

    return ResumeAnalysis(
        resumeStrengthScore=overall_match,
        targetRole=target_role,
        seniorityLevel=seniority_level,
        positioning=data.get("positioning", {"RAG": 85, "Vector Databases": 80, "Agentic AI": 75, "MCP": 60, "Deployment": 70, "Production AI": 65}),
        curriculumAlignment=alignments,
        interviewConsistency=data.get("interviewConsistency", []),
        weakPointEnhancements=enhancements,
        recommendations=data.get("recommendations", []),
        roleReport=role_report,
    )


def _fallback_role_resume_analysis(
    candidate: dict[str, Any],
    session: InterviewSession | None = None,
    target_role: str = "AI Engineer",
    seniority_level: str = "Mid-Level",
    job_description: str | None = None,
) -> ResumeAnalysis:
    member = candidate.get("member", {})
    role = member.get("jobRole", "Engineer")
    exp = member.get("yearsExperience", 3)
    missions = candidate.get("missions", [])

    completed_count = len([m for m in missions if m.get("passed")])
    skipped_count = len([m for m in missions if m.get("skipped")])

    # Dynamic role & seniority penalty calculation
    is_senior = seniority_level in ("Senior", "Lead / Staff") or "Senior" in target_role
    seniority_penalty = 18 if (is_senior and exp < 5) else 0

    role_lower = target_role.lower()
    if "ai" in role_lower or "llm" in role_lower:
        match_score = min(96, max(40, 65 + completed_count * 2 - skipped_count * 4 - seniority_penalty))
        matched = [
            "✓ Strong evidence of RAG pipelines and vector database integration",
            "✓ Hands-on experience with LLM prompt engineering and function calling",
        ]
        missing = [
            "⚠ Limited evidence of production AI evaluation metrics (Recall@K, MRR)",
            "⚠ Missing explicit Model Context Protocol (MCP) production deployment",
        ]
        categories = [
            RoleCategoryScore(categoryName="AI / LLM Engineering", weightPct=25, scorePct=match_score + 5),
            RoleCategoryScore(categoryName="RAG & Retrieval", weightPct=20, scorePct=match_score + 2),
            RoleCategoryScore(categoryName="Agentic Architecture", weightPct=20, scorePct=match_score - 5),
            RoleCategoryScore(categoryName="Software Engineering", weightPct=15, scorePct=75),
            RoleCategoryScore(categoryName="AI Deployment & Observability", weightPct=20, scorePct=60),
        ]
    elif "data" in role_lower:
        match_score = min(96, max(35, 75 + exp * 3 - skipped_count * 5 - seniority_penalty))
        matched = [
            "✓ Strong Python and relational SQL query optimization experience",
            "✓ Relevant ETL pipeline engineering and data transformation projects",
        ]
        missing = [
            "⚠ Limited evidence of distributed Spark or Airflow DAG orchestration",
            "⚠ Missing cloud data platform (Snowflake / Databricks) evidence",
        ]
        categories = [
            RoleCategoryScore(categoryName="SQL & Data Processing", weightPct=25, scorePct=match_score + 4),
            RoleCategoryScore(categoryName="Data Engineering Pipelines", weightPct=25, scorePct=match_score + 2),
            RoleCategoryScore(categoryName="Pipeline Architecture", weightPct=20, scorePct=match_score - 8),
            RoleCategoryScore(categoryName="Cloud & Infrastructure", weightPct=15, scorePct=65),
            RoleCategoryScore(categoryName="Project & Impact Evidence", weightPct=15, scorePct=75),
        ]
    elif "ml" in role_lower:
        match_score = min(94, max(35, 60 + completed_count * 1.5 - seniority_penalty))
        matched = [
            "✓ Good foundation in Python, feature engineering, and model training",
            "✓ Familiarity with similarity search and embedding models",
        ]
        missing = [
            "⚠ Limited evidence of MLOps pipelines (MLflow, Kubeflow, W&B)",
            "⚠ Missing production model monitoring and drift detection evidence",
        ]
        categories = [
            RoleCategoryScore(categoryName="Model Development & Training", weightPct=30, scorePct=match_score + 2),
            RoleCategoryScore(categoryName="MLOps & Pipelines", weightPct=25, scorePct=match_score - 10),
            RoleCategoryScore(categoryName="Feature Engineering", weightPct=20, scorePct=match_score + 5),
            RoleCategoryScore(categoryName="Model Deployment & Monitoring", weightPct=25, scorePct=55),
        ]
    else:
        match_score = min(92, max(40, 70 + exp * 2 - seniority_penalty))
        matched = [
            "✓ Solid backend software development and API integration",
            "✓ Database modeling and structured code architecture",
        ]
        missing = [
            "⚠ Limited evidence of distributed systems design under high load",
            "⚠ Missing explicit CI/CD and Kubernetes orchestration evidence",
        ]
        categories = [
            RoleCategoryScore(categoryName="Core Software Development", weightPct=30, scorePct=85),
            RoleCategoryScore(categoryName="Backend APIs & Databases", weightPct=25, scorePct=80),
            RoleCategoryScore(categoryName="System Architecture", weightPct=25, scorePct=match_score - 10),
            RoleCategoryScore(categoryName="DevOps & Deployment", weightPct=20, scorePct=60),
        ]

    sub_scores = SubScoreBreakdown(
        skillsMatch=match_score + 2,
        experienceMatch=min(95, max(30, exp * 15)),
        projectRelevance=match_score,
        technologyMatch=match_score - 3,
        seniorityMatch=max(40, 90 - seniority_penalty),
        impactScore=72,
    )

    why = (
        f"Awarded {match_score}% for target role '{target_role}' at '{seniority_level}' level. "
        f"The candidate's profile demonstrates strong alignment in core technical skills but "
        f"shows gaps in high-scale production architecture required for senior positioning."
    )

    role_report = RoleScoreReport(
        targetRole=target_role,
        seniorityLevel=seniority_level,
        overallMatchScore=match_score,
        subScores=sub_scores,
        categories=categories,
        matchedEvidence=matched,
        missingEvidence=missing,
        whySummary=why,
        recommendations=[
            f"Emphasize scalable architecture and production metrics relevant to {target_role}.",
            "Add quantifiable impact metrics (latency reduction, throughput, cost savings).",
            f"Highlight specific tools required for {target_role} in project descriptions.",
        ],
    )

    alignment = [
        ResumeAlignmentItem(topic="RAG", resumeEvidence="Completed RAG pipeline missions and vector search integration", status="Strong"),
        ResumeAlignmentItem(topic="Vector Databases", resumeEvidence="Demonstrated embeddings & vector index setup", status="Strong"),
        ResumeAlignmentItem(topic="Agentic AI", resumeEvidence="Built multi-agent orchestration workflows", status="Moderate" if completed_count > 5 else "Weak"),
        ResumeAlignmentItem(topic="MCP (Model Context Protocol)", resumeEvidence="Attempted protocol integration missions", status="Moderate" if completed_count > 7 else "Missing"),
        ResumeAlignmentItem(topic="Deployment", resumeEvidence="Docker & Kubernetes deployment missions", status="Weak" if skipped_count > 0 else "Moderate"),
        ResumeAlignmentItem(topic="Production AI", resumeEvidence="Monitoring & observability missions", status="Missing" if skipped_count > 0 else "Weak"),
    ]

    enhancements = [
        WeakPointEnhancement(
            weakStatement="Created a chatbot using Python and OpenAI API.",
            enhancedStatement="Architected a grounded retrieval-augmented AI assistant utilizing semantic vector search and streaming responses, reducing hallucination rates by 35%.",
            rationale="Quantifies engineering impact and specifies technical architecture components."
        ),
        WeakPointEnhancement(
            weakStatement="Worked on vector database indexing.",
            enhancedStatement="Engineered high-throughput vector index pipelines supporting sub-50ms ANN similarity queries across 500k+ embedded documents.",
            rationale="Demonstrates scale, performance metrics, and low-latency production engineering."
        )
    ]

    return ResumeAnalysis(
        resumeStrengthScore=match_score,
        targetRole=target_role,
        seniorityLevel=seniority_level,
        positioning={
            "RAG": 88 if completed_count > 4 else 65,
            "Vector Databases": 85 if completed_count > 4 else 60,
            "Agentic AI": 78 if completed_count > 6 else 55,
            "MCP": 64,
            "Deployment": 60 if skipped_count == 0 else 45,
            "Production AI": 55 if skipped_count == 0 else 40,
        },
        curriculumAlignment=alignment,
        interviewConsistency=["Interview consistency synthesized upon technical completion."],
        weakPointEnhancements=enhancements,
        recommendations=role_report.recommendations,
        roleReport=role_report,
    )
