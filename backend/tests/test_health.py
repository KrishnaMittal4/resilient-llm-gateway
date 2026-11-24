def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "keys_configured": 2, "cache_enabled": True}


def test_health_503_without_keys(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import create_app
    for k in ("LLM_API_KEYS", "GEMINI_API_KEY", "GROQ_API_KEY"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/x.db")
    assert TestClient(create_app()).get("/health").status_code == 503


def test_llm_api_keys_compat(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import create_app
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setenv("LLM_API_KEYS", "a-key,b-key")
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/y.db")
    assert TestClient(create_app()).get("/health").json()["keys_configured"] == 2
