import HealthPanel from "./HealthPanel";
import HistoryInspector from "./HistoryInspector";
import { IconClose, IconCollapse, IconExpand } from "./Icons";
import ResilienceLab from "./ResilienceLab";
import SessionInsights from "./SessionInsights";

const DEFAULT_PROMPT = "You are a helpful, concise and accurate AI assistant.";
export { DEFAULT_PROMPT };

export default function Sidebar({
  open, onClose, sessionId, messageCount, health, systemPrompt, onSystemPrompt,
  labMode, onLabMode, refreshKey, onNewChat,
  messages, engineeringMode, onEngineeringMode, latestFailoverEvent,
  collapsed, onToggleCollapse,
}) {
  return (
    <>
      {open && <div className="scrim" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`sidebar ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}
        aria-label="Sidebar"
      >
        {/* Brand Header */}
        <div className="brand">
          <span className="logo" aria-hidden="true">R</span>
          <div className="brand-text">
            <strong>ResilientLLM</strong>
            <small>Observability Console</small>
          </div>
          <button
            type="button"
            className="icon-btn collapse-toggle-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <IconExpand size={14} /> : <IconCollapse size={14} />}
          </button>
          <button
            type="button"
            className="icon-btn close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <IconClose size={13} />
          </button>
        </div>

        {/* Session Section */}
        <section className="sidebar-section">
          <div className="section-head">
            <h3>Session</h3>
            <button
              type="button"
              className="subtle-reset-btn"
              onClick={() => { onNewChat?.(); onClose?.(); }}
              title="Reset to fresh session"
              aria-label="Start new session"
            >
              Reset
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
        <section className="sidebar-section">
          <h3>System Health</h3>
          <HealthPanel health={health} />
        </section>

        {/* Session Insights */}
        <section className="sidebar-section">
          <h3>Session Insights</h3>
          <SessionInsights messages={messages || []} />
        </section>

        {/* AI Configuration */}
        <section className="sidebar-section">
          <h3>AI Configuration</h3>
          <label className="field-label" htmlFor="sys">System Prompt</label>
          <textarea
            id="sys"
            data-testid="system-prompt-input"
            rows={2}
            maxLength={4000}
            value={systemPrompt}
            onChange={(e) => onSystemPrompt(e.target.value)}
            placeholder="System prompt participating in cache identity..."
          />
          <small className="muted subtle-help">
            Applies to this session and participates in cache identity.
          </small>
        </section>

        {/* Developer Tools */}
        <section className="sidebar-section dev-tools-section">
          <div className="section-head">
            <h3>Developer Tools</h3>
            {/* Engineering Mode Toggle */}
            <div className="eng-mode-inline">
              <span className="eng-mode-label">Engineering</span>
              <button
                type="button"
                className={`toggle-btn ${engineeringMode ? "on" : ""}`}
                onClick={() => onEngineeringMode?.(!engineeringMode)}
                aria-pressed={engineeringMode}
                title="Toggle technical metadata display"
                aria-label="Toggle technical engineering mode"
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>

          <details open className="tool-details">
            <summary>Resilience Lab</summary>
            <ResilienceLab
              mode={labMode}
              onChange={onLabMode}
              latestEvent={latestFailoverEvent}
            />
          </details>

          <details className="tool-details">
            <summary>Session History</summary>
            <HistoryInspector sessionId={sessionId} refreshKey={refreshKey} />
          </details>
        </section>
      </aside>
    </>
  );
}
