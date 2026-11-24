import { useCallback, useEffect, useState } from "react";
import { getHistory } from "../services/api";

export default function HistoryInspector({ sessionId, refreshKey }) {
  const [state, setState] = useState({ loading: false, messages: null, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getHistory(sessionId);
      setState({ loading: false, messages: data.messages, error: null });
    } catch (err) {
      if (err.status === 404) setState({ loading: false, messages: [], error: null });
      else setState({ loading: false, messages: null, error: "Couldn't load history." });
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="history">
      <div className="history-head">
        <small>Live from SQLite · GET /sessions/…/messages</small>
        <button type="button" className="link-btn" onClick={load} disabled={state.loading}>
          {state.loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      {state.error && <p className="muted">{state.error}</p>}
      {state.messages && state.messages.length === 0 && <p className="muted">No stored messages yet.</p>}
      <ol className="history-list">
        {(state.messages || []).map((m, i) => (
          <li key={i} className={`history-item ${m.role}`}>
            <span className="history-role">{m.role}</span>
            <span className="history-text">{m.content}</span>
            {m.metadata && (
              <span className="history-meta">
                {m.metadata.resolution_source} · ↓{m.metadata.input_tokens} ↑{m.metadata.output_tokens}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
