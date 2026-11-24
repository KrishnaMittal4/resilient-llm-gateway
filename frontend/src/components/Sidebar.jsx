import HealthPanel from "./HealthPanel";
import HistoryInspector from "./HistoryInspector";
import { IconChat, IconClose, IconCollapse, IconExpand, IconTrash } from "./Icons";
import ResilienceLab from "./ResilienceLab";
import SessionInsights from "./SessionInsights";

const DEFAULT_PROMPT = "You are a helpful, concise and accurate AI assistant.";
export { DEFAULT_PROMPT };

export default function Sidebar({
  open, onClose, sessionId, messageCount, health, systemPrompt, onSystemPrompt,
  labMode, onLabMode, refreshKey, onNewChat,
  messages, engineeringMode, onEngineeringMode, latestFailoverEvent,
  collapsed, onToggleCollapse,
  pastSessions = [], onSelectSession, onDeleteSession,
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
            <h3>Active Session</h3>
            <button
              type="button"
              className="subtle-reset-btn"
              onClick={() => { onNewChat?.(); onClose?.(); }}
              title="Reset to fresh session"
              aria-label="Start new session"
            >
              + New
            </button>
          </div>
          <dl className="kv">
            <dt>Session ID</dt>
            <dd title={sessionId}><code>{sessionId}</code></dd>
            <dt>Messages</dt>
            <dd>{messageCount}</dd>
          </dl>
        </section>

        {/* Recent Conversations */}
        <section className="sidebar-section">
          <div className="section-head">
            <h3>Recent Chats</h3>
            <span className="badge-count">{pastSessions.length}</span>
          </div>
          {pastSessions.length > 0 ? (
            <ul className="past-sessions-list" aria-label="Recent chats">
              {pastSessions.slice(0, 8).map((s) => {
                const isActive = s.id === sessionId;
                return (
                  <li
                    key={s.id}
                    className={`past-session-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      onSelectSession?.(s.id);
                      onClose?.();
                    }}
                    title={`Load chat: ${s.title || s.id}`}
                  >
                    <div className="past-session-main">
                      <span className="past-session-icon">
                        <IconChat size={13} />
                      </span>
                      <div className="past-session-text">
                        <strong className="past-session-title">{s.title || "Chat"}</strong>
                        <small className="past-session-id"><code>{s.id.slice(0, 12)}…</code></small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="past-session-delete"
                      onClick={(e) => onDeleteSession?.(s.id, e)}
                      title="Remove from history"
                      aria-label="Remove session from list"
                    >
                      <IconTrash size={12} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted empty-note" style={{ margin: 0, fontSize: 11.5 }}>
              No previous chats saved yet. New conversations are automatically indexed here.
            </p>
          )}
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
