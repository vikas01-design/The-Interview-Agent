from __future__ import annotations

import asyncio
import logging
import re
import json
import pathlib
from typing import Optional

from app.config import BREETH_API_KEY, BREETH_GROUP_ID
from app.services.curriculum import curriculum_service

logger = logging.getLogger(__name__)

CANDIDATES_GROUP = "candidates"

_async_client = None
_ingestion_done: bool = False


def _get_async_client():
    """Lazily initialize the AsyncBreethClient (reused across the app lifetime)."""
    global _async_client
    if _async_client is None and BREETH_API_KEY:
        try:
            from breeth import AsyncBreethClient
            _async_client = AsyncBreethClient(api_key=BREETH_API_KEY)
        except Exception as exc:
            logger.warning("TheBreeth async client init failed: %s", exc)
    return _async_client


# ---------------------------------------------------------------------------
# Curriculum retrieval
# ---------------------------------------------------------------------------

async def retrieve_curriculum_context(
    query: str,
    *,
    day: Optional[int] = None,
    candidate_context: Optional[str] = None,
    limit: int = 5,
) -> str:
    """
    Retrieve curriculum context from TheBreeth with local fallback.
    ``candidate_context`` enriches the query with current interview signals.
    """
    enriched_query = f"{query} | {candidate_context}" if candidate_context else query

    client = _get_async_client()
    if client:
        try:
            results = await client.retrieve(
                enriched_query,
                group_id=BREETH_GROUP_ID,
                limit=limit,
            )
            facts = [
                edge.fact
                for edge in getattr(results, "edges", [])
                if getattr(edge, "fact", None)
            ]
            if facts:
                logger.debug("TheBreeth returned %d facts for: %s", len(facts), query[:80])
                return "\n".join(facts[:limit])
        except Exception as exc:
            logger.warning("TheBreeth retrieve failed, using local fallback: %s", exc)

    # Local fallback — always reliable
    if day is not None:
        return curriculum_service.format_day_context(day)
    entries = curriculum_service.search_local(query, limit=limit)
    if entries:
        return "\n\n".join(curriculum_service.format_day_context(e.day) for e in entries)
    return ""


# ---------------------------------------------------------------------------
# Candidate retrieval from TheBreeth
# ---------------------------------------------------------------------------

async def fetch_candidates_from_breeth() -> list[dict]:
    """
    Retrieve all candidate profiles from the cohort dataset.

    Returns the complete list of candidate profiles so any candidate can be selected
    and interviewed with the full adaptive logic.
    """
    candidates = _load_all_local_candidates()
    logger.info("Serving %d candidate profiles for selection.", len(candidates))
    return candidates


def _load_all_local_candidates() -> list[dict]:
    local_path = pathlib.Path(__file__).parent.parent.parent / "data" / "candidates.json"
    data = json.loads(local_path.read_text(encoding="utf-8"))
    return data["candidates"]


def _parse_candidate_ids_from_facts(facts: list[str]) -> list[dict]:
    """
    Extract CAND-XXX IDs from TheBreeth fact strings, then return the
    matching full candidate profiles from local JSON.
    """
    local_path = pathlib.Path(__file__).parent.parent.parent / "data" / "candidates.json"
    local_data = json.loads(local_path.read_text(encoding="utf-8"))
    local_by_id = {c["member"]["id"]: c for c in local_data["candidates"]}

    found_ids: set[str] = set()
    cand_pattern = re.compile(r"CAND-\d{3}")
    for fact in facts:
        for cid in cand_pattern.findall(fact):
            found_ids.add(cid)

    if not found_ids:
        return []

    return [local_by_id[cid] for cid in sorted(found_ids) if cid in local_by_id]


# ---------------------------------------------------------------------------
# Candidate profile retrieval & ingestion from TheBreeth
# ---------------------------------------------------------------------------

async def retrieve_candidate_profile_context(candidate_id: str, topic: Optional[str] = None) -> str:
    """
    Retrieve candidate profile facts from TheBreeth for candidate_id and optional topic.
    """
    client = _get_async_client()
    if not client:
        return ""

    query = f"Candidate {candidate_id} learning signals missions attempts passed skipped"
    if topic:
        query += f" {topic}"

    try:
        results = await client.retrieve(
            query,
            group_id=CANDIDATES_GROUP,
            limit=5,
        )
        facts = [
            edge.fact
            for edge in getattr(results, "edges", [])
            if getattr(edge, "fact", None)
        ]
        if facts:
            logger.debug("TheBreeth returned %d candidate facts for %s", len(facts), candidate_id)
            return "\n".join(facts[:5])
    except Exception as exc:
        logger.warning("TheBreeth profile retrieve failed for %s: %s", candidate_id, exc)

    return ""


async def ingest_candidates_to_breeth() -> int:
    """
    Ingest candidate profile learning journeys into TheBreeth (CANDIDATES_GROUP).

    Uses a marker file to skip re-ingestion on server reboots/hot-reloads.
    Returns the count of candidate episodes written.
    """
    client = _get_async_client()
    if not client:
        logger.info("TheBreeth not configured; skipping candidate profile ingestion.")
        return 0

    marker = pathlib.Path(__file__).parent.parent.parent / "data" / ".breeth_candidates_ingested"
    if marker.exists():
        logger.info("Candidate profiles already ingested into TheBreeth; skipping.")
        return 0

    candidates = _load_all_local_candidates()
    count = 0

    for cand in candidates:
        member = cand.get("member", {})
        cand_id = member.get("id", "CAND-000")
        missions = cand.get("missions", [])

        completed_days = []
        skipped_days = []
        failed_days = []
        struggle_days = []

        for m in missions:
            d = m.get("day")
            if m.get("skipped"):
                skipped_days.append(d)
            elif m.get("passed") is False:
                failed_days.append(d)
            elif m.get("passed"):
                completed_days.append(d)
                if m.get("attempts", 1) >= 3:
                    struggle_days.append(d)

        content = (
            f"[CANDIDATE PROFILE] {cand_id}: {member.get('name')} ({member.get('jobRole')}, {member.get('yearsExperience')} yrs exp)\n"
            f"Education: {member.get('education')}\n"
            f"Completed Days: {completed_days}\n"
            f"Skipped Days: {skipped_days}\n"
            f"Failed Days: {failed_days}\n"
            f"Struggled Days: {struggle_days}\n"
            f"Total Missions Attempted: {len(missions)}"
        )

        try:
            await client.write(
                content,
                group_id=CANDIDATES_GROUP,
                source_description=f"candidate-profile-{cand_id}",
            )
            count += 1
            await asyncio.sleep(0.3)
        except Exception as exc:
            logger.warning("Failed to ingest candidate %s into TheBreeth: %s", cand_id, exc)
            await asyncio.sleep(1.0)

    marker.touch()
    logger.info("TheBreeth candidate ingestion complete: %d profiles written.", count)
    return count


# ---------------------------------------------------------------------------
# Curriculum ingestion
# ---------------------------------------------------------------------------

async def ingest_curriculum_to_breeth() -> int:
    """
    One-time curriculum ingestion into TheBreeth.

    Uses a marker file to skip re-ingestion on hot-reloads.
    Returns the count of episodes successfully written.
    """
    global _ingestion_done

    client = _get_async_client()
    if not client:
        logger.info("TheBreeth not configured; skipping curriculum ingestion.")
        return 0

    marker = pathlib.Path(__file__).parent.parent.parent / "data" / ".breeth_ingested"
    if _ingestion_done or marker.exists():
        logger.info("Curriculum already ingested into TheBreeth; skipping.")
        _ingestion_done = True
        return 0

    count = 0
    for entry in curriculum_service.all_days():
        content = (
            f"[CURRICULUM] {curriculum_service.format_day_context(entry.day)}\n"
            f"Module: {entry.module_title}\n"
            f"Day type: {entry.type}"
        )
        try:
            await client.write(
                content,
                group_id=BREETH_GROUP_ID,
                source_description=f"curriculum-day-{entry.day}",
            )
            count += 1
            await asyncio.sleep(0.3)
        except Exception as exc:
            logger.warning("Failed to ingest day %s into TheBreeth: %s", entry.day, exc)
            await asyncio.sleep(1.0)

    _ingestion_done = True
    marker.touch()
    logger.info("TheBreeth ingestion complete: %d days written.", count)
    return count

