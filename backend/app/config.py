import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# Supports Gemini (GOOGLE_API_KEY), DeepSeek (DEEPSEEK_API_KEY),
# or standard OpenAI (OPENAI_API_KEY) — whichever is set.
OPENAI_API_KEY = (
    os.getenv("GOOGLE_API_KEY")
    or os.getenv("DEEPSEEK_API_KEY")
    or os.getenv("OPENAI_API_KEY")
    or ""
)
# Gemini OpenAI-compatible base URL; override in .env for other providers
OPENAI_BASE_URL = os.getenv(
    "OPENAI_BASE_URL",
    "https://generativelanguage.googleapis.com/v1beta/openai",
)
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gemini-2.0-flash")

BREETH_API_KEY = os.getenv("BREETH_API_KEY", "")
BREETH_GROUP_ID = os.getenv("BREETH_GROUP_ID", "curriculum")

LLM_ENABLED = os.getenv("LLM_ENABLED", "true").lower() == "true" and bool(OPENAI_API_KEY)

MIN_QUESTIONS = 8
MIN_CURRICULUM_DAYS = 4
