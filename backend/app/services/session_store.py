import json
import logging
import pathlib
from app.config import DATA_DIR
from app.models.schemas import InterviewSession

logger = logging.getLogger(__name__)

_sessions: dict[str, InterviewSession] = {}
_SESSIONS_DIR = DATA_DIR / "sessions"
_SESSIONS_DIR.mkdir(parents=True, exist_ok=True)


def get_session(session_id: str) -> InterviewSession | None:
    if session_id in _sessions:
        return _sessions[session_id]

    # Try loading from disk
    file_path = _SESSIONS_DIR / f"{session_id}.json"
    if file_path.exists():
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
            session = InterviewSession.model_validate(data)
            _sessions[session_id] = session
            logger.info("Restored session %s from disk", session_id)
            return session
        except Exception as exc:
            logger.warning("Failed to restore session %s from disk: %s", session_id, exc)

    return None


def save_session(session: InterviewSession) -> None:
    _sessions[session.session_id] = session
    try:
        file_path = _SESSIONS_DIR / f"{session.session_id}.json"
        file_path.write_text(session.model_dump_json(indent=2), encoding="utf-8")
    except Exception as exc:
        logger.warning("Failed to save session %s to disk: %s", session.session_id, exc)


def delete_session(session_id: str) -> None:
    _sessions.pop(session_id, None)
    file_path = _SESSIONS_DIR / f"{session_id}.json"
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass

