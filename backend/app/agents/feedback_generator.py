from __future__ import annotations

import logging

from app.agents.resume_analyzer import analyze_candidate_resume, _fallback_role_resume_analysis as _fallback_resume_analysis
from app.config import LLM_ENABLED
from app.models.schemas import (
    CommunicationMetrics,
    Feedback,
    InterviewSession,
    ResumeAnalysis,
    TopicMastery,
    UnifiedCandidateIntelligence,
)
from app.services.curriculum import curriculum_service
from app.services.llm_client import chat_json

logger = logging.getLogger(__name__)


def calculate_grade(score: int) -> str:
    if score >= 90:
        return "A+"
    if score >= 85:
        return "A"
    if score >= 80:
        return "A-"
    if score >= 75:
        return "B+"
    if score >= 70:
        return "B"
    if score >= 60:
        return "C+"
    if score >= 50:
        return "C"
    return "D"


async def generate_feedback(session: InterviewSession) -> Feedback:
    try:
        resume_analysis = await analyze_candidate_resume(session.candidate, session)
    except Exception as exc:
        logger.warning("Resume analysis failed (%s) — using fallback.", exc)
        resume_analysis = _fallback_resume_analysis(session.candidate, session)

    try:
        if LLM_ENABLED:
            feedback = await _llm_feedback(session, resume_analysis)
            if feedback:
                return feedback
    except Exception as exc:
        logger.warning("LLM feedback generation failed (%s) — using deterministic fallback.", exc)

    return _fallback_feedback(session, resume_analysis)


async def _llm_feedback(session: InterviewSession, resume_analysis: ResumeAnalysis) -> Feedback:
    evals = session.evaluations
    scores = [ev.score for ev in evals]
    avg_score = sum(scores) / len(scores) if scores else 5.0
    overall = int(avg_score * 10)

    # Average communication metrics
    comm_scores = [ev.communication.communicationScore for ev in evals if ev.communication]
    avg_comm_score = int(sum(comm_scores) / len(comm_scores)) if comm_scores else int(overall * 0.9)

    avg_clarity = sum(ev.communication.clarity for ev in evals if ev.communication) / len(evals) if evals else 0.8
    avg_confidence = sum(ev.communication.confidence for ev in evals if ev.communication) / len(evals) if evals else 0.8
    avg_struct = sum(ev.communication.structure for ev in evals if ev.communication) / len(evals) if evals else 0.8
    avg_concise = sum(ev.communication.conciseness for ev in evals if ev.communication) / len(evals) if evals else 0.8
    avg_tech_comm = sum(ev.communication.technicalCommunication for ev in evals if ev.communication) / len(evals) if evals else 0.8

    comm_obs = []
    comm_imps = []
    for ev in evals:
        if ev.communication:
            comm_obs.extend(ev.communication.observations)
            comm_imps.extend(ev.communication.improvements)

    comm_metrics = CommunicationMetrics(
        communicationScore=avg_comm_score,
        clarity=round(avg_clarity, 2),
        confidence=round(avg_confidence, 2),
        structure=round(avg_struct, 2),
        conciseness=round(avg_concise, 2),
        technicalCommunication=round(avg_tech_comm, 2),
        observations=list(set(comm_obs))[:4],
        improvements=list(set(comm_imps))[:4],
    )

    # Topic Mastery List
    topic_mastery = []
    for day in session.covered_days:
        entry = curriculum_service.get_day(day)
        t_title = entry.title if entry else f"Day {day}"
        km = session.knowledge_model.get(str(day))
        t_score = int(km.knowledge * 100) if km else int(overall * 0.9)
        topic_mastery.append(TopicMastery(topic=t_title, day=day, scorePct=t_score))

    # Unified Intelligence
    unified = UnifiedCandidateIntelligence(
        technicalStrengths=list(set([s for ev in evals for s in ev.strengths if s]))[:4],
        technicalWeaknesses=list(set([w for ev in evals for w in ev.weaknesses if w] + [m for ev in evals for m in ev.misconceptions if m]))[:4],
        communicationStrengths=comm_metrics.observations[:3],
        communicationWeaknesses=comm_metrics.improvements[:3],
        resumeStrengths=[item.topic for item in resume_analysis.curriculumAlignment if item.status == "Strong"][:3],
        resumeGaps=[item.topic for item in resume_analysis.curriculumAlignment if item.status in ("Weak", "Missing")][:3],
        recommendedFocus=resume_analysis.recommendations[:3],
    )

    member = session.candidate.get("member", {})
    name = member.get("name", "Candidate")

    summary = (
        f"Thank you for attending the technical interview, {name}! "
        f"You completed all {session.question_number} questions covering cohort Days {session.covered_days}. "
        f"Overall Score: {overall}/100 (Grade {calculate_grade(overall)}). "
        f"Your responses demonstrated solid core technical alignment with clear opportunities for deeper architectural trade-offs."
    )

    # Collect difficulty progression string representation
    diff_prog = []
    for entry in session.transcript:
        if entry.role == "interviewer" and entry.question_meta:
            diff_prog.append(f"D{entry.question_meta.day}: {entry.question_meta.difficulty.value.title()}")

    return Feedback(
        summary=summary,
        overallScore=overall,
        grade=calculate_grade(overall),
        technicalKnowledge=int(avg_score * 10),
        problemSolving=int(avg_score * 9.5),
        systemDesign=int(avg_score * 9.2),
        communication=avg_comm_score,
        confidenceScore=int(avg_confidence * 100),
        strengths=unified.technicalStrengths,
        drawbacks=unified.technicalWeaknesses,
        improvements=resume_analysis.recommendations,
        gaps=unified.technicalWeaknesses,
        next=resume_analysis.recommendations,
        communicationMetrics=comm_metrics,
        resumeAnalysis=resume_analysis,
        unifiedIntelligence=unified,
        topicMastery=topic_mastery,
        difficultyProgression=diff_prog,
    )


def _fallback_feedback(
    session: InterviewSession,
    resume_analysis: ResumeAnalysis,
) -> Feedback:
    evals = session.evaluations
    if evals:
        avg_score = sum(e.score for e in evals) / len(evals)
        avg_corr = sum(e.technicalCorrectness for e in evals) / len(evals)
        avg_depth = sum(e.depth for e in evals) / len(evals)
        avg_reason = sum(e.reasoning for e in evals) / len(evals)
        avg_clarity = sum(e.clarity for e in evals) / len(evals)
    else:
        avg_score, avg_corr, avg_depth, avg_reason, avg_clarity = 6.5, 0.65, 0.60, 0.65, 0.75

    overall = min(98, max(25, int(avg_score * 10)))
    tech_k = min(99, max(20, int(avg_corr * 100)))
    prob_s = min(99, max(20, int(avg_reason * 100)))
    sys_d = min(99, max(20, int(avg_depth * 100)))
    comm = min(99, max(20, int(avg_clarity * 100)))
    conf = min(99, max(20, int(avg_clarity * 95)))

    strengths = []
    drawbacks = []
    for ev in evals:
        for s in ev.strengths:
            if s and s not in strengths:
                strengths.append(s)
        for w in ev.weaknesses:
            if w and w not in drawbacks:
                drawbacks.append(w)
        for m in ev.misconceptions:
            if m and f"Misconception: {m}" not in drawbacks:
                drawbacks.append(f"Misconception: {m}")

    if not strengths:
        strengths = [
            "Demonstrated core conceptual understanding across cohort modules",
            "Followed logical problem-solving structure in primary technical answers",
        ]
    if not drawbacks:
        drawbacks = [
            "Lacked explicit trade-off and latency metric discussion in production architecture questions",
            "Further practice needed on edge-case diagnosis under failure scenarios",
        ]

    topic_mastery = []
    for day in session.covered_days:
        entry = curriculum_service.get_day(day)
        t_title = entry.title if entry else f"Day {day}"
        km = session.knowledge_model.get(str(day))
        t_score = int(km.knowledge * 100) if km else int(overall * 0.9)
        topic_mastery.append(TopicMastery(topic=t_title, day=day, scorePct=t_score))

    comm_metrics = CommunicationMetrics(
        communicationScore=comm,
        clarity=round(avg_clarity, 2),
        confidence=0.78,
        structure=0.82,
        conciseness=0.80,
        technicalCommunication=round(avg_clarity, 2),
        observations=["Structured technical explanations with clear terminology"],
        improvements=["Provide direct answers before expanding into secondary background context"],
    )

    unified = UnifiedCandidateIntelligence(
        technicalStrengths=strengths[:4],
        technicalWeaknesses=drawbacks[:4],
        communicationStrengths=comm_metrics.observations[:3],
        communicationWeaknesses=comm_metrics.improvements[:3],
        resumeStrengths=[item.topic for item in resume_analysis.curriculumAlignment if item.status == "Strong"][:3],
        resumeGaps=[item.topic for item in resume_analysis.curriculumAlignment if item.status in ("Weak", "Missing")][:3],
        recommendedFocus=resume_analysis.recommendations[:3],
    )

    member = session.candidate.get("member", {})
    name = member.get("name", "Candidate")

    summary = (
        f"Thank you for attending the technical interview, {name}! "
        f"You completed all {session.question_number} questions covering cohort Days {session.covered_days}. "
        f"Overall Score: {overall}/100 (Grade {calculate_grade(overall)}). "
        f"Performance showed good technical engagement with clear opportunities for deeper architectural practice."
    )

    diff_prog = []
    for entry in session.transcript:
        if entry.role == "interviewer" and entry.question_meta:
            diff_prog.append(f"D{entry.question_meta.day}: {entry.question_meta.difficulty.value.title()}")

    return Feedback(
        summary=summary,
        overallScore=overall,
        grade=calculate_grade(overall),
        technicalKnowledge=tech_k,
        problemSolving=prob_s,
        systemDesign=sys_d,
        communication=comm,
        confidenceScore=conf,
        strengths=strengths[:5],
        drawbacks=drawbacks[:5],
        improvements=resume_analysis.recommendations[:5],
        gaps=drawbacks[:5],
        next=resume_analysis.recommendations[:5],
        communicationMetrics=comm_metrics,
        resumeAnalysis=resume_analysis,
        unifiedIntelligence=unified,
        topicMastery=topic_mastery,
        difficultyProgression=diff_prog,
    )
