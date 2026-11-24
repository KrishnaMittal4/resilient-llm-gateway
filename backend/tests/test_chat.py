import pytest
from tests.conftest import chat

META_FIELDS = {"resolution_source", "model", "latency_ms", "input_tokens", "output_tokens", "key_id", "fallback_attempts"}


def test_successful_chat_contract(client):
    r = chat(client, "s-abc", "What is the capital of France?")
    assert r.status_code == 200
    body = r.json()
    assert body["session_id"] == "s-abc"
    assert isinstance(body["reply"], str) and body["reply"]
    m = body["metadata"]
    assert META_FIELDS <= set(m)
    assert m["resolution_source"] == "LIVE_INFERENCE"
    assert m["model"] == "gemini/gemini-test"
    assert m["key_id"] == "key_1" and m["fallback_attempts"] == 0
    for f in ("latency_ms", "input_tokens", "output_tokens"):
        assert isinstance(m[f], int) and not isinstance(m[f], bool)
    assert m["input_tokens"] > 0 and m["output_tokens"] > 0


@pytest.mark.parametrize("payload", [
    {"message": "hi"},
    {"session_id": "", "message": "hi"},
    {"session_id": "s", "message": ""},
    {"session_id": "s", "message": "   \n\t "},
    {"session_id": "s", "message": "x" * 4001},
    {"session_id": "s" * 129, "message": "hi"},
    {"session_id": "s"},
])
def test_validation_422_and_not_stored(client, payload):
    r = client.post("/chat", json=payload)
    assert r.status_code == 422 and "detail" in r.json()
    if payload.get("session_id"):
        assert client.get(f"/sessions/{payload['session_id']}/messages").status_code == 404


def test_malformed_json_422(client):
    r = client.post("/chat", content="{not json", headers={"Content-Type": "application/json"})
    assert r.status_code == 422 and "detail" in r.json()


def test_message_is_trimmed_and_4000_boundary(client):
    assert chat(client, "s-trim", "  hello  ").status_code == 200
    assert client.get("/sessions/s-trim/messages").json()["messages"][0]["content"] == "hello"
    assert chat(client, "s-max", "x" * 4000).status_code == 200


def test_input_tokens_per_request_not_cumulative(client):
    a = chat(client, "s-a", "Tell me about cats").json()["metadata"]["input_tokens"]
    b = chat(client, "s-b", "Tell me about dogs").json()["metadata"]["input_tokens"]
    assert abs(a - b) <= 3
    chat(client, "s-a", "And more please")
    again = chat(client, "s-c", "Tell me about bats").json()["metadata"]["input_tokens"]
    assert abs(again - a) <= 3


def test_system_prompt_used_and_not_in_history(client, provider):
    chat(client, "s-sys", "hello", system_prompt="Answer like a pirate.")
    assert provider.calls[-1]["messages"][0] == {"role": "system", "content": "Answer like a pirate."}
    msgs = client.get("/sessions/s-sys/messages").json()["messages"]
    assert [m["role"] for m in msgs] == ["user", "assistant"]
    chat(client, "s-sys", "again")  # stored session prompt is reused
    assert provider.calls[-1]["messages"][0]["content"] == "Answer like a pirate."


def test_default_system_prompt(client, provider):
    chat(client, "s-def", "hello")
    assert provider.calls[-1]["messages"][0]["content"].startswith("You are a helpful")
