from __future__ import annotations

from app.models.schemas import CandidateAnalysis, Difficulty, TopicKnowledge
from app.services.curriculum import curriculum_service


def analyze_candidate(candidate: dict) -> CandidateAnalysis:
    missions = candidate.get("missions", [])
    completed_days: list[int] = []
    skipped_days: list[int] = []
    failed_days: list[int] = []
    struggle_days: list[int] = []
    strong_days: list[int] = []

    for mission in missions:
        day = mission["day"]
        if mission.get("skipped"):
            skipped_days.append(day)
            continue
        if mission.get("passed") is False:
            failed_days.append(day)
            continue
        if mission.get("passed"):
            completed_days.append(day)
            attempts = mission.get("attempts", 1)
            if attempts == 1:
                strong_days.append(day)
            elif attempts >= 3:
                struggle_days.append(day)

    inferred_strengths: list[str] = []
    inferred_weaknesses: list[str] = []

    for day in strong_days[:5]:
        entry = curriculum_service.get_day(day)
        if entry:
            inferred_strengths.append(f"Day {day}: {entry.title}")

    for day in failed_days + struggle_days:
        entry = curriculum_service.get_day(day)
        if entry:
            inferred_weaknesses.append(f"Day {day}: {entry.title}")

    for day in skipped_days[:3]:
        entry = curriculum_service.get_day(day)
        if entry:
            inferred_weaknesses.append(f"Skipped Day {day}: {entry.title}")

    target_days = _build_target_days(
        completed_days, skipped_days, failed_days, struggle_days, strong_days
    )

    return CandidateAnalysis(
        completed_days=sorted(completed_days),
        skipped_days=sorted(skipped_days),
        failed_days=sorted(failed_days),
        struggle_days=sorted(struggle_days),
        strong_days=sorted(strong_days),
        inferred_strengths=inferred_strengths,
        inferred_weaknesses=inferred_weaknesses,
        target_days=target_days,
    )


def _build_target_days(
    completed: list[int],
    skipped: list[int],
    failed: list[int],
    struggle: list[int],
    strong: list[int],
) -> list[int]:
    """Pick interview focus days: weaknesses first, then strong areas for depth."""
    targets: list[int] = []
    for day in failed + struggle:
        if day not in targets and day not in skipped:
            targets.append(day)
    for day in completed:
        if day not in targets and day not in skipped:
            targets.append(day)
    for day in strong:
        if day not in targets and day not in skipped:
            targets.append(day)
    return targets[:12]


def init_knowledge_model(analysis: CandidateAnalysis) -> dict[str, TopicKnowledge]:
    model: dict[str, TopicKnowledge] = {}
    for day in analysis.completed_days:
        prior = 0.55
        if day in analysis.strong_days:
            prior = 0.75
        if day in analysis.struggle_days:
            prior = 0.45
        if day in analysis.failed_days:
            prior = 0.25
        model[str(day)] = TopicKnowledge(knowledge=prior, depth=prior, reasoning=prior)
    return model


def update_knowledge_model(
    model: dict[str, TopicKnowledge],
    day: int,
    evaluation,
) -> None:
    key = str(day)
    current = model.get(key, TopicKnowledge())
    alpha = 0.4

    model[key] = TopicKnowledge(
        knowledge=_ema(current.knowledge, evaluation.correctness, alpha),
        depth=_ema(current.depth, evaluation.depth, alpha),
        reasoning=_ema(current.reasoning, evaluation.reasoning, alpha),
        evidence=current.evidence + evaluation.strengths[:2],
        misconceptions=list(set(current.misconceptions + evaluation.misconceptions)),
    )


def _ema(old: float, new: float, alpha: float) -> float:
    return round(old * (1 - alpha) + new * alpha, 3)


def pick_difficulty(analysis: CandidateAnalysis, day: int) -> Difficulty:
    if day in analysis.failed_days or day in analysis.struggle_days:
        return Difficulty.EASY
    if day in analysis.strong_days:
        return Difficulty.HARD
    return Difficulty.MEDIUM
