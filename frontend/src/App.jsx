import { useState } from "react";
import Composer from "./components/Composer";
import Conversation from "./components/Conversation";
import { LAB_MODES } from "./components/ResilienceLab";
import Sidebar, { DEFAULT_PROMPT } from "./components/Sidebar";
import { useChat } from "./hooks/useChat";
import { useHealth } from "./hooks/useHealth";

export default function App() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [labMode, setLabMode] = useState("normal");
  const [drawer, setDrawer] = useState(false);
  const [engineeringMode, setEngineeringMode] = useState(true);

  const health = useHealth();
  const simulate = LAB_MODES.find((m) => m.id === labMode)?.header || null;
  const { sessionId, messages, loading, send, retry, storedCount, newChat } = useChat({
    systemPrompt,
    simulate,
  });

  // Derive latest failover event from messages
  const latestFailoverEvent = messages
    .filter((m) => m.role === "assistant" && m.metadata?.fallback_attempts > 0)
    .slice(-1)[0]?.metadata || null;

  // Health status indicator
  const systemHealthy = health?.keys?.some((k) => k.healthy) ?? null;

  return (
    <div className="app">
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
      />
      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setDrawer(true)}
            aria-label="Open sidebar"
          >
            ☰
          </button>
          <div className="topbar-brand">
            <strong className="topbar-title">ResilientLLM</strong>
            <small className="topbar-sub">Observable, fault-tolerant LLM conversations.</small>
          </div>
          <div className="topbar-actions">
            {simulate && (
              <button
                type="button"
                className="sim-pill clickable"
                onClick={() => setDrawer(true)}
                title="Resilience Lab active — click to configure"
              >
                ⚡ Simulating {simulate}
              </button>
            )}
            {systemHealthy !== null && (
              <div className={`health-indicator ${systemHealthy ? "healthy" : "degraded"}`}>
                <span className="health-dot" />
                <span>{systemHealthy ? "Systems Healthy" : "Degraded"}</span>
              </div>
            )}
            <button
              type="button"
              className="new-chat-btn"
              onClick={newChat}
              title="Start a fresh conversation"
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
