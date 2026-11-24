from tests.conftest import chat


def test_unknown_session_404(client):
    r = client.get("/sessions/nope/messages")
    assert r.status_code == 404 and r.json() == {"detail": "session not found"}


def test_multi_turn_context_and_order(client, provider):
    chat(client, "s-mt", "What is Docker?")
    chat(client, "s-mt", "How is it different from a VM?")
    sent = provider.calls[-1]["messages"]
    assert [m["role"] for m in sent] == ["system", "user", "assistant", "user"]
    assert sent[1]["content"] == "What is Docker?" and sent[3]["content"] == "How is it different from a VM?"

    body = client.get("/sessions/s-mt/messages").json()
    assert body["session_id"] == "s-mt"
    msgs = body["messages"]
    assert [m["role"] for m in msgs] == ["user", "assistant", "user", "assistant"]
    assert msgs[0]["content"] == "What is Docker?"
    assert "metadata" not in msgs[0]
    md = msgs[1]["metadata"]
    assert {"resolution_source", "input_tokens", "output_tokens"} <= set(md)
    assert all(m["role"] != "system" for m in msgs)


def test_session_isolation(client, provider):
    chat(client, "s-A", "secret apples")
    chat(client, "s-B", "something else")
    assert all("secret apples" not in str(m) for m in provider.calls[-1]["messages"])
    assert len(client.get("/sessions/s-B/messages").json()["messages"]) == 2


def test_history_persists_across_app_restart(client, tmp_path):
    from fastapi.testclient import TestClient
    from app.main import create_app
    chat(client, "s-persist", "remember me")
    restarted = TestClient(create_app())
    assert restarted.get("/sessions/s-persist/messages").json()["messages"][0]["content"] == "remember me"
