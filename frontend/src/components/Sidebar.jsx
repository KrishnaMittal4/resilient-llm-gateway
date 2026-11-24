import HealthPanel from "./HealthPanel";
import HistoryInspector from "./HistoryInspector";
import ResilienceLab from "./ResilienceLab";

const DEFAULT_PROMPT = "You are a helpful, concise and accurate AI assistant.";
export { DEFAULT_PROMPT };

export default function Sidebar({
  open, onClose, sessionId, messageCount, health, systemPrompt, onSystemPrompt,
  labMode, onLabMode, refreshKey, onNewChat,
}) {
  return (
    <>
      {open && <div className="scrim" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Sidebar">
        <div className="brand">
          <span className="logo" aria-hidden="true">L</span>
          <div>
            <strong>Lyftr Resilient AI</strong>
            <small>Reliability console</small>
          </div>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close sidebar">✕</button>
        </div>

        <section>
          <div className="section-head">
            <h3>Session</h3>
            <button type="button" className="link-btn" onClick={() => { onNewChat?.(); onClose?.(); }} title="Start new session">+ New Chat</button>
          </div>
          <dl className="kv">
            <dt>Session ID</dt>
            <dd title={sessionId}><code>{sessionId}</code></dd>
            <dt>Messages</dt>
            <dd>{messageCount}</dd>
          </dl>
        </section>

        <section>
          <h3>System health</h3>
          <HealthPanel health={health} />
        </section>

        <section>
          <h3>AI configuration</h3>
          <label className="field-label" htmlFor="sys">System prompt</label>
          <textarea
            id="sys"
            data-testid="system-prompt-input"
            rows={3}
            maxLength={4000}
            value={systemPrompt}
            onChange={(e) => onSystemPrompt(e.target.value)}
          />
          <small className="muted">Applies to this session and is part of the cache identity.</small>
        </section>

        <section>
          <h3>Developer tools</h3>
          <details open>
            <summary>Resilience Lab</summary>
            <ResilienceLab mode={labMode} onChange={onLabMode} />
          </details>
          <details>
            <summary>Session History</summary>
            <HistoryInspector sessionId={sessionId} refreshKey={refreshKey} />
          </details>
        </section>
      </aside>
    </>
  );
}
