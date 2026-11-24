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
  const health = useHealth();
  const simulate = LAB_MODES.find((m) => m.id === labMode)?.header || null;
  const { sessionId, messages, loading, send, retry, storedCount, newChat } = useChat({ systemPrompt, simulate });

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
      />
      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setDrawer(true)} aria-label="Open sidebar">☰</button>
          <div>
            <strong>Lyftr Resilient AI</strong>
            <small>Reliable LLM Conversations. Built for Failure.</small>
          </div>
          <div className="topbar-actions">
            {simulate && (
              <button
                type="button"
                className="sim-pill clickable"
                onClick={() => setDrawer(true)}
                title="Resilience Lab active (click to configure)"
              >
                Simulating {simulate}
              </button>
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
        <Conversation messages={messages} loading={loading} onRetry={retry} onPick={send} />
        <Composer onSend={send} loading={loading} />
      </main>
    </div>
  );
}
