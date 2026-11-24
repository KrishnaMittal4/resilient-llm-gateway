import litellm
import pytest
from tests.conftest import GEMINI_KEY, GROQ_KEY, chat


@pytest.mark.parametrize("header", ["key_1=429", "key_1=500", "key_1=502", "key_1=503"])
def test_simulated_key1_failure_falls_back_to_groq(client, header, provider):
    r = chat(client, "s-f", "hello", headers={"X-Simulate-Failure": header})
    assert r.status_code == 200
    m = r.json()["metadata"]
    assert m["key_id"] == "key_2" and m["fallback_attempts"] == 1
    assert m["model"] == "groq/groq-test" and m["resolution_source"] == "LIVE_INFERENCE"
    assert m["failed_keys"] == [{"key_id": "key_1", "status": int(header.split("=")[1])}]
    assert r.json()["reply"].startswith("[groq/groq-test]")  # real (mocked-network) Groq completion
    assert all(c["model"] != "gemini/gemini-test" for c in provider.calls)  # simulation skips the provider


@pytest.mark.parametrize("header", ["*=429", "key_1=429,key_2=500", "*=503"])
def test_all_failed_503_and_not_stored(client, header):
    r = chat(client, "s-x", "hello", headers={"X-Simulate-Failure": header})
    assert r.status_code == 503 and r.json() == {"detail": "all providers unavailable"}
    assert client.get("/sessions/s-x/messages").status_code == 404


def test_simulation_affects_only_that_request(client):
    chat(client, "s-1", "one", headers={"X-Simulate-Failure": "*=429"})
    r = chat(client, "s-1", "two").json()
    assert r["metadata"]["key_id"] == "key_1" and r["metadata"]["fallback_attempts"] == 0


def test_simulation_ignored_when_disabled(client, monkeypatch, tmp_path):
    from fastapi.testclient import TestClient
    from app.main import create_app
    monkeypatch.setenv("ENABLE_FAILURE_SIMULATION", "false")
    c = TestClient(create_app())
    r = chat(c, "s-d", "hello", headers={"X-Simulate-Failure": "*=429"})
    assert r.status_code == 200 and r.json()["metadata"]["key_id"] == "key_1"


def test_real_provider_429_fails_over(client, provider):
    provider.fail["gemini/"] = litellm.RateLimitError("quota exceeded", "gemini", "gemini-test")
    r = chat(client, "s-r", "hello").json()
    assert r["metadata"]["key_id"] == "key_2" and r["metadata"]["fallback_attempts"] == 1
    assert r["metadata"]["failed_keys"][0]["status"] == 429


def test_real_provider_5xx_fails_over(client, provider):
    provider.fail["gemini/"] = litellm.InternalServerError("boom", "gemini", "gemini-test")
    assert chat(client, "s-r", "hello").json()["metadata"]["key_id"] == "key_2"


def test_both_real_providers_down_503(client, provider):
    provider.fail["gemini/"] = litellm.ServiceUnavailableError("down", "gemini", "m")
    provider.fail["groq/"] = litellm.RateLimitError("limit", "groq", "m")
    r = chat(client, "s-r", "hello")
    assert r.status_code == 503 and r.json() == {"detail": "all providers unavailable"}
    assert client.get("/sessions/s-r/messages").status_code == 404


def test_error_responses_leak_nothing(client, provider):
    provider.fail["gemini/"] = litellm.AuthenticationError(f"bad key {GEMINI_KEY}", "gemini", "m")
    provider.fail["groq/"] = litellm.AuthenticationError(f"bad key {GROQ_KEY}", "groq", "m")
    r = chat(client, "s-leak", "hello")
    assert r.status_code == 503
    assert GEMINI_KEY not in r.text and GROQ_KEY not in r.text and "Traceback" not in r.text


def test_unexpected_error_is_json_500(client, monkeypatch):
    import app.api.chat as chat_mod
    monkeypatch.setattr(chat_mod.llm_service, "complete", lambda *a, **k: 1 / 0)
    r = chat(client, "s-500", "hello")
    assert r.status_code == 500 and r.headers["content-type"].startswith("application/json")
    assert r.json() == {"detail": "internal server error"} and "Traceback" not in r.text


def test_success_never_returns_keys(client):
    r = chat(client, "s-k", "hello")
    assert GEMINI_KEY not in r.text and GROQ_KEY not in r.text
    assert GEMINI_KEY not in client.get("/health").text
    assert GEMINI_KEY not in client.get("/sessions/s-k/messages").text


def test_cors_allows_configured_origin(client):
    r = client.options("/chat", headers={
        "Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,x-simulate-failure"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
