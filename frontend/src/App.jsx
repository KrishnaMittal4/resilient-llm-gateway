import { useCallback, useState } from "react";
import Composer from "./components/Composer";
import Conversation from "./components/Conversation";
import { IconBolt, IconDownload, IconExpand, IconMenu } from "./components/Icons";
import { LAB_MODES } from "./components/ResilienceLab";
import Sidebar, { DEFAULT_PROMPT } from "./components/Sidebar";
import { useChat } from "./hooks/useChat";
import { useHealth } from "./hooks/useHealth";

export default function App() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [labMode, setLabMode] = useState("normal");
  const [drawer, setDrawer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [engineeringMode, setEngineeringMode] = useState(true);

  const health = useHealth();
  const simulate = LAB_MODES.find((m) => m.id === labMode)?.header || null;
  const {
    sessionId,
    messages,
    loading,
    send,
    retry,
    storedCount,
    newChat,
    pastSessions,
    loadSession,
    deletePastSession,
  } = useChat({
    systemPrompt,
    simulate,
  });

  // Derive latest failover event from messages
  const latestFailoverEvent = messages
    .filter((m) => m.role === "assistant" && m.metadata?.fallback_attempts > 0)
    .slice(-1)[0]?.metadata || null;

  // Health status indicator
  const systemHealthy = health?.loading ? null : (health?.ok ?? false);

  const exportTrace = useCallback(() => {
    if (messages.length === 0) return;
    const trace = {
      app: "ResilientLLM",
      exported_at: new Date().toISOString(),
      session_id: sessionId,
      system_prompt: systemPrompt,
      session_summary: {
        total_messages: messages.length,
        assistant_replies: messages.filter((m) => m.role === "assistant").length,
        cache_hits: messages.filter((m) => m.role === "assistant" && m.metadata?.resolution_source === "LLM_CACHE").length,
        live_inferences: messages.filter((m) => m.role === "assistant" && m.metadata?.resolution_source === "LIVE_INFERENCE").length,
        failover_events: messages.filter((m) => m.role === "assistant" && m.metadata?.fallback_attempts > 0).length,
      },
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        status: m.status,
        metadata: m.metadata || null,
        simulation: m.simulate || null,
      })),
    };
    const blob = new Blob([JSON.stringify(trace, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resilient-llm-trace-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessionId, systemPrompt, messages]);

  return (
    <div className={`app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        open={drawer}
        onClose={() => setDrawer(false)}
        sessionId={sessionId}
        messageCount={storedCount}
        health={health}
        systemPrompt={systemPrompt}
        onSystemPrompt={setSystemPrompt}
        labMode={labMode}
        onLabMode={setLabMode}
        refreshKey={storedCount}
        onNewChat={newChat}
        messages={messages}
        engineeringMode={engineeringMode}
        onEngineeringMode={setEngineeringMode}
        latestFailoverEvent={latestFailoverEvent}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        pastSessions={pastSessions}
        onSelectSession={loadSession}
        onDeleteSession={deletePastSession}
      />
      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn menu-btn"
              onClick={() => setDrawer(true)}
              aria-label="Open sidebar drawer"
              title="Open sidebar"
            >
              <IconMenu size={16} />
            </button>
            {sidebarCollapsed && (
              <button
                type="button"
                className="icon-btn uncollapse-btn"
                onClick={() => setSidebarCollapsed(false)}
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <IconExpand size={14} />
              </button>
            )}
            <div className="topbar-brand">
              <strong className="topbar-title">ResilientLLM</strong>
              <small className="topbar-sub">Observable, fault-tolerant LLM conversations.</small>
            </div>
          </div>

          <div className="topbar-actions">
            {simulate && (
              <div
                className="sim-pill"
                title="Active simulation header injected for failure testing"
              >
                <IconBolt size={12} className="sim-pill-icon" /> Simulating {simulate}
              </div>
            )}
            {systemHealthy !== null && (
              <div className={`health-indicator ${systemHealthy ? "healthy" : "degraded"}`} title="Backend & database status">
                <span className="health-dot" />
                <span>{systemHealthy ? "Systems Healthy" : "Degraded"}</span>
              </div>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                className="export-btn"
                onClick={exportTrace}
                title="Download complete session telemetry trace as JSON"
                aria-label="Download session JSON trace"
              >
                <IconDownload size={13} />
                <span>Export Trace</span>
              </button>
            )}
            <button
              type="button"
              className="new-chat-btn"
              onClick={newChat}
              title="Start a fresh conversation session"
            >
              + New Chat
            </button>
          </div>
        </header>

        <Conversation
          messages={messages}
          loading={loading}
          onRetry={retry}
          onPick={send}
          engineeringMode={engineeringMode}
        />
        <Composer onSend={send} loading={loading} />
      </main>
    </div>
  );
}
