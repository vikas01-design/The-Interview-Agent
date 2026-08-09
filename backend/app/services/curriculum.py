from __future__ import annotations

import json
from dataclasses import dataclass

from app.config import DATA_DIR


@dataclass
class DayEntry:
    day: int
    title: str
    type: str
    tools: list[str]
    objectives: list[str]
    module_title: str


class CurriculumService:
    def __init__(self) -> None:
        self._days: dict[int, DayEntry] = {}
        self._load()

    def _load(self) -> None:
        path = DATA_DIR / "curriculum.json"
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        module_map: dict[int, str] = {}
        for module in data.get("modules", []):
            for day_num in range(module["days"][0], module["days"][-1] + 1):
                module_map[day_num] = module["title"]

        for entry in data.get("days", []):
            day_num = entry["day"]
            self._days[day_num] = DayEntry(
                day=day_num,
                title=entry["title"],
                type=entry.get("type", "BUILD"),
                tools=entry.get("tools", []),
                objectives=entry.get("objectives", []),
                module_title=module_map.get(day_num, "Unknown"),
            )

    def get_day(self, day: int) -> DayEntry | None:
        return self._days.get(day)

    def all_days(self) -> list[DayEntry]:
        return sorted(self._days.values(), key=lambda d: d.day)

    def format_day_context(self, day: int) -> str:
        entry = self.get_day(day)
        if not entry:
            return ""
        objectives = "\n".join(f"- {obj}" for obj in entry.objectives)
        tools = ", ".join(entry.tools)
        return (
            f"Day {entry.day}: {entry.title}\n"
            f"Module: {entry.module_title}\n"
            f"Type: {entry.type}\n"
            f"Tools: {tools}\n"
            f"Objectives:\n{objectives}"
        )

    def search_local(self, query: str, limit: int = 5) -> list[DayEntry]:
        query_lower = query.lower()
        scored: list[tuple[int, DayEntry]] = []
        for entry in self._days.values():
            score = 0
            blob = f"{entry.title} {' '.join(entry.tools)} {' '.join(entry.objectives)}".lower()
            for token in query_lower.split():
                if len(token) > 2 and token in blob:
                    score += 1
            if score:
                scored.append((score, entry))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [entry for _, entry in scored[:limit]]


curriculum_service = CurriculumService()
