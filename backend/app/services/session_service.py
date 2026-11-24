import json
from datetime import datetime, timezone
from typing import Optional


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_history(conn, session_id: str) -> list:
    rows = conn.execute(
        "SELECT role, content, metadata FROM messages WHERE session_id=? ORDER BY id", (session_id,)
    ).fetchall()
    return [dict(r) for r in rows]


def get_system_prompt(conn, session_id: str) -> Optional[str]:
    row = conn.execute("SELECT system_prompt FROM sessions WHERE session_id=?", (session_id,)).fetchone()
    return row["system_prompt"] if row else None


def build_llm_messages(system_prompt: str, history: list, new_message: str) -> list:
    msgs = [{"role": "system", "content": system_prompt}]
    msgs += [{"role": m["role"], "content": m["content"]} for m in history]
    msgs.append({"role": "user", "content": new_message})
    return msgs


def save_turn(conn, session_id, system_prompt, user_text, reply, metadata: dict) -> None:
    """Called only after a successful LLM answer; both rows land in one transaction."""
    now = _now()
    conn.execute(
        "INSERT INTO sessions(session_id, system_prompt, created_at) VALUES(?,?,?) "
        "ON CONFLICT(session_id) DO UPDATE SET system_prompt=COALESCE(excluded.system_prompt, system_prompt)",
        (session_id, system_prompt, now),
    )
    conn.execute(
        "INSERT INTO messages(session_id, role, content, metadata, created_at) VALUES(?,?,?,?,?)",
        (session_id, "user", user_text, None, now),
    )
    conn.execute(
        "INSERT INTO messages(session_id, role, content, metadata, created_at) VALUES(?,?,?,?,?)",
        (session_id, "assistant", reply, json.dumps(metadata), now),
    )


def public_history(rows: list) -> list:
    out = []
    for r in rows:
        item = {"role": r["role"], "content": r["content"]}
        if r["role"] == "assistant" and r["metadata"]:
            item["metadata"] = json.loads(r["metadata"])
        out.append(item)
    return out
