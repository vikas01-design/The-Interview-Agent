from __future__ import annotations

import json
import logging
import asyncio
from typing import Any

import httpx

from app.config import LLM_ENABLED, OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL

logger = logging.getLogger(__name__)

# Retry settings — fail fast so the fallback kicks in quickly
_MAX_RETRIES = 2
_RETRY_DELAYS = [1.0, 2.0]  # seconds between retries


async def chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.7,
    json_mode: bool = False,
) -> str:
    if not LLM_ENABLED:
        raise RuntimeError("LLM not configured")

    payload: dict[str, Any] = {
        "model": OPENAI_MODEL,
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    url = f"{OPENAI_BASE_URL.rstrip('/')}/chat/completions"

    # Force IPv4 transport — some environments have broken IPv6 connectivity.
    transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
    async with httpx.AsyncClient(timeout=60.0, transport=transport) as client:
        for attempt, delay in enumerate([0.0] + _RETRY_DELAYS, start=1):
            if delay:
                logger.info("LLM retry %d/%d after %.1fs", attempt, _MAX_RETRIES + 1, delay)
                await asyncio.sleep(delay)
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code == 429:
                    # Daily quota exhausted — don't waste time retrying
                    logger.warning("Rate limited (429) — quota exhausted, skipping retries.")
                    raise httpx.HTTPStatusError(
                        "429 quota exhausted",
                        request=response.request,
                        response=response,
                    )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as exc:
                if attempt <= _MAX_RETRIES and exc.response.status_code in (429, 500, 502, 503):
                    continue
                raise

    raise RuntimeError("LLM request failed after all retries")


async def chat_json(messages: list[dict[str, str]], *, temperature: float = 0.3) -> dict:
    # Gemini (and some other providers) don't support response_format: json_object.
    # Instead, append a JSON instruction to the last user message.
    patched = list(messages)
    if patched and patched[-1]["role"] == "user":
        patched[-1] = {
            "role": "user",
            "content": patched[-1]["content"] + "\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code fences, no explanation.",
        }
    raw = await chat_completion(patched, temperature=temperature, json_mode=False)
    # Strip markdown code fences if the model wrapped the JSON anyway
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Failed to parse LLM JSON, attempting extraction")
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            return json.loads(raw[start : end + 1])
        raise
