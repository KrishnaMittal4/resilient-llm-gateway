"""Provider network calls are mocked via LiteLLM's own `mock_response`, so the real
LiteLLM cache + completion path (token counting, cache hits) still runs. No external API calls or quota are used."""
import os
# Force LiteLLM into full offline mode for tests (disables remote cost map downloads and remote telemetry)
os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
os.environ["LITELLM_OFFLINE_MODE"] = "true"

from types import SimpleNamespace

import litellm
import pytest
from fastapi.testclient import TestClient

from app.main import create_app

GEMINI_KEY = "test-gemini-SECRET-123"
GROQ_KEY = "test-groq-SECRET-456"


@pytest.fixture(autouse=True)
def provider(monkeypatch):
    """Autouse fixture ensuring EVERY test has litellm.completion mocked with mock_response."""
    state = SimpleNamespace(calls=[], fail={}, counter=0)
    real = litellm.completion

    def fake(*args, **kwargs):
        state.calls.append({"model": kwargs["model"], "messages": kwargs["messages"]})
        for prefix, exc in state.fail.items():
            if kwargs["model"].startswith(prefix):
                raise exc
        state.counter += 1
        text = f"[{kwargs['model']}] reply #{state.counter} to: {kwargs['messages'][-1]['content']}"
        kwargs.pop("api_key", None)
        hit = False
        if getattr(litellm, "cache", None) is not None:
            try:
                hit = litellm.cache.get_cache(**kwargs) is not None
            except Exception:
                pass
        # 500ms mock delay for live, 0ms for cache hit so cache latency reduction test reliably passes
        delay = 0.0 if hit else 0.5
        return real(*args, mock_response=text, mock_delay=delay, **kwargs)

    monkeypatch.setattr(litellm, "completion", fake)
    return state


@pytest.fixture
def client(tmp_path, monkeypatch, provider):
    monkeypatch.delenv("LLM_API_KEYS", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", GEMINI_KEY)
    monkeypatch.setenv("GROQ_API_KEY", GROQ_KEY)
    monkeypatch.setenv("GEMINI_MODEL", "gemini/gemini-test")
    monkeypatch.setenv("GROQ_MODEL", "groq/groq-test")
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/test.db")
    monkeypatch.setenv("ENABLE_FAILURE_SIMULATION", "true")
    return TestClient(create_app(), raise_server_exceptions=False)


def chat(client, session_id="s-1", message="What is Docker?", headers=None, **extra):
    return client.post("/chat", json={"session_id": session_id, "message": message, **extra}, headers=headers or {})
