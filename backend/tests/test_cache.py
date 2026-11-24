from tests.conftest import chat


def test_equivalent_fresh_session_hits_cache(client, provider):
    first = chat(client, "s-1", "What is Docker?").json()
    second = chat(client, "s-2", "What is Docker?").json()
    f, s = first["metadata"], second["metadata"]
    assert f["resolution_source"] == "LIVE_INFERENCE"
    assert s["resolution_source"] == "LLM_CACHE"
    assert second["reply"] == first["reply"]
    assert s["key_id"] is None and s["fallback_attempts"] == 0
    assert s["input_tokens"] == f["input_tokens"] and s["output_tokens"] == f["output_tokens"]
    assert s["model"] == f["model"]
    assert s["latency_ms"] < f["latency_ms"]


def test_different_message_never_cached(client):
    chat(client, "s-1", "What is Docker?")
    r = chat(client, "s-2", "What is Kubernetes?").json()
    assert r["metadata"]["resolution_source"] == "LIVE_INFERENCE"


def test_different_system_prompt_misses_cache(client):
    chat(client, "s-1", "What is Docker?", system_prompt="Be terse.")
    r = chat(client, "s-2", "What is Docker?", system_prompt="Be verbose.").json()
    assert r["metadata"]["resolution_source"] == "LIVE_INFERENCE"


def test_different_history_misses_cache(client):
    chat(client, "s-1", "Hello there")
    chat(client, "s-1", "What is Docker?")
    r = chat(client, "s-2", "What is Docker?").json()  # no history in s-2 -> different message list
    assert r["metadata"]["resolution_source"] == "LIVE_INFERENCE"


def test_cached_turn_is_stored_in_history(client):
    chat(client, "s-1", "What is Docker?")
    chat(client, "s-2", "What is Docker?")
    md = client.get("/sessions/s-2/messages").json()["messages"][1]["metadata"]
    assert md["resolution_source"] == "LLM_CACHE" and md["key_id"] is None
