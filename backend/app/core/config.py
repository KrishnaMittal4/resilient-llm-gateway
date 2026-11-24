"""Environment-driven configuration. Real keys live only in this process's memory."""
import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

# Automatically load .env if present (checks current dir and repo root)
load_dotenv(override=True)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"), override=True)

DEFAULT_SYSTEM_PROMPT = "You are a helpful, concise and accurate AI assistant."


@dataclass(frozen=True)
class KeyEntry:
    key_id: str  # safe public identifier: key_1, key_2
    provider: str
    model: str  # LiteLLM model name, e.g. gemini/gemini-2.5-flash
    api_key: str = field(repr=False)  # never logged / returned


@dataclass(frozen=True)
class Settings:
    key_pool: tuple
    database_url: str
    allowed_origins: list
    enable_failure_simulation: bool
    request_timeout: float


def _prefixed(model: str, prefix: str) -> str:
    return model if "/" in model else f"{prefix}/{model}"


def load_settings(env=None) -> Settings:
    env = os.environ if env is None else env
    # LLM_API_KEYS (assignment variable): ordered pool -> key_1 = Gemini, key_2 = Groq.
    # GEMINI_API_KEY / GROQ_API_KEY, when set, take precedence for their slot.
    pool = [k.strip() for k in env.get("LLM_API_KEYS", "").split(",") if k.strip()]
    gemini_key = env.get("GEMINI_API_KEY", "").strip() or (pool[0] if len(pool) > 0 else "")
    groq_key = env.get("GROQ_API_KEY", "").strip() or (pool[1] if len(pool) > 1 else "")

    entries = []
    if gemini_key:
        model = env.get("GEMINI_MODEL", "").strip() or "gemini/gemini-3.5-flash-lite"
        entries.append(KeyEntry("key_1", "gemini", _prefixed(model, "gemini"), gemini_key))
    if groq_key:
        model = env.get("GROQ_MODEL", "").strip() or "groq/llama-3.3-70b-versatile"
        entries.append(KeyEntry("key_2", "groq", _prefixed(model, "groq"), groq_key))

    origins = [o.strip() for o in env.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
    db_url = env.get("DATABASE_URL", "sqlite:///./app.db")
    if os.name == "nt" and db_url == "sqlite:////data/app.db" and not os.path.exists("/data"):
        db_url = "sqlite:///./app.db"
    return Settings(
        key_pool=tuple(entries),
        database_url=db_url,
        allowed_origins=origins,
        enable_failure_simulation=env.get("ENABLE_FAILURE_SIMULATION", "false").strip().lower() == "true",
        request_timeout=float(env.get("LLM_TIMEOUT_SECONDS", "30")),
    )
