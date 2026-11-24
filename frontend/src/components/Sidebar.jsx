import HealthPanel from "./HealthPanel";
import HistoryInspector from "./HistoryInspector";
import ResilienceLab from "./ResilienceLab";
import SessionInsights from "./SessionInsights";

const DEFAULT_PROMPT = "You are a helpful, concise and accurate AI assistant.";
export { DEFAULT_PROMPT };

export default function Sidebar({
  open, onClose, sessionId, messageCount, health, systemPrompt, onSystemPrompt,
  labMode, onLabMode, refreshKey, onNewChat,
  messages, engineeringMode, onEngineeringMode, latestFailoverEvent,
}) {
  return (
    <>
      {open && <div className="scrim" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Sidebar">
        {/* Brand */}
        <div className="brand">
          <span className="logo" aria-hidden="true">R</span>
          <div>
            <strong>ResilientLLM</strong>
            <small>Observability console</small>
          </div>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close sidebar">✕</button>
        </div>

        {/* Session */}
        <section>
          <div className="section-head">
            <h3>Session</h3>
            <button
              type="button"
              className="link-btn"
              onClick={() => { onNewChat?.(); onClose?.(); }}
              title="Start new session"
            >
              + New Chat
            </button>
          </div>
          <dl className="kv">
            <dt>Session ID</dt>
            <dd title={sessionId}><code>{sessionId}</code></dd>
            <dt>Messages</dt>
            <dd>{messageCount}</dd>
          </dl>
        </section>

        {/* System Health */}
        <section>
          <h3>System Health</h3>
          <HealthPanel health={health} />
        </section>

        {/* Session Insights */}
        <section>
          <h3>Session Insights</h3>
          <SessionInsights messages={messages || []} />
        </section>

        {/* AI Configuration */}
        <section>
          <h3>AI Configuration</h3>
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

        {/* Developer Tools */}
        <section>
          <h3>Developer Tools</h3>

          {/* Engineering Mode Toggle */}
          <div className="eng-mode-row">
            <span className="eng-mode-label">Engineering Mode</span>
            <button
              type="button"
              className={`toggle-btn ${engineeringMode ? "on" : ""}`}
              onClick={() => onEngineeringMode?.(!engineeringMode)}
              aria-pressed={engineeringMode}
              title="Toggle response metadata display"
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          <small className="muted" style={{ display: "block", marginBottom: 12 }}>
            Show metadata chips and observability details on responses.
          </small>

          <details open>
            <summary>Resilience Lab</summary>
            <ResilienceLab
              mode={labMode}
              onChange={onLabMode}
              latestEvent={latestFailoverEvent}
            />
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
