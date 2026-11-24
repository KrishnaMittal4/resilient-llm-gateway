import { useCallback, useEffect, useState } from "react";
import { getHistory } from "../services/api";

export default function HistoryInspector({ sessionId, refreshKey }) {
  const [state, setState] = useState({ loading: false, messages: null, error: null });

  const load = useCallback(async (forced = false) => {
    // A fresh session starts empty in browser memory before any turn is completed.
    // Avoid triggering an unnecessary 404 in console/backend logs unless forced by refresh.
    if (!forced && refreshKey === 0) {
      setState({ loading: false, messages: [], error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getHistory(sessionId);
      setState({ loading: false, messages: data.messages, error: null });
    } catch (err) {
      if (err.status === 404) setState({ loading: false, messages: [], error: null });
      else setState({ loading: false, messages: null, error: "Couldn't load history." });
    }
  }, [sessionId, refreshKey]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="history">
      <div className="history-head">
        <span className="history-badge">SQLite Session Store</span>
        <button type="button" className="link-btn" onClick={() => load(true)} disabled={state.loading}>
          {state.loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      <div className="history-session-meta">
        <code>{sessionId}</code>
        <span className="msg-count-tag">{state.messages !== null ? `${state.messages.length} stored` : "Loading..."}</span>
      </div>
      {state.error && <p className="muted error-text">{state.error}</p>}
      {state.messages && state.messages.length === 0 && (
        <p className="muted empty-note">No stored turns in SQLite yet. Successful turns are saved atomically.</p>
      )}
      <ol className="history-list">
        {(state.messages || []).map((m, i) => (
          <li key={i} className={`history-item ${m.role}`}>
            <div className="history-item-top">
              <span className={`history-role-tag ${m.role}`}>{m.role === "user" ? "YOU" : "ASSISTANT"}</span>
              <span className="history-idx">#{i + 1}</span>
            </div>
            <span className="history-text">{m.content}</span>
            {m.metadata && (
              <span className="history-meta">
                {m.metadata.resolution_source} {m.metadata.latency_ms ? `• ${m.metadata.latency_ms} ms` : ""} • ↓{m.metadata.input_tokens} ↑{m.metadata.output_tokens}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
