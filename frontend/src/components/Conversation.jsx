import { useEffect, useRef } from "react";
import { AssistantMessage, UserMessage } from "./Message";

const SUGGESTIONS = [
  "Explain Docker simply",
  "What is an API gateway?",
  "Compare REST vs GraphQL",
  "Explain caching & failover architecture",
];

export function EmptyState({ onPick }) {
  return (
    <div className="empty" aria-label="Welcome screen">
      <div className="empty-badge">Production LLM Gateway</div>
      <h1>ResilientLLM</h1>
      <p className="tagline">Observable, fault-tolerant LLM conversations.</p>
      <p className="empty-copy">
        Reliable multi-turn conversations with automatic key failover (Gemini ➔ Groq), LiteLLM response caching, SQLite persistence, and per-request observability.
      </p>
      <p className="tech-stack-line">Built with LiteLLM • Gemini • Groq • SQLite</p>
      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="suggestion" onClick={() => onPick(s)}>
            <span>{s}</span>
            <span className="suggestion-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Conversation({ messages, loading, onRetry, onPick, engineeringMode = true }) {
  const scroller = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 260;
    if (nearBottom || last?.role === "user") {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="scroller">
        <EmptyState onPick={onPick} />
      </div>
    );
  }

  return (
    <div className="scroller" ref={scroller}>
      <div className="thread" aria-live="polite">
        {messages.map((m) =>
          m.role === "assistant" ? (
            <AssistantMessage key={m.id} msg={m} engineeringMode={engineeringMode} />
          ) : (
            <UserMessage key={m.id} msg={m} onRetry={onRetry} retryDisabled={loading} />
          )
        )}
        {loading && (
          <div className="msg assistant loading" aria-label="Waiting for AI response">
            <div className="loading-state-card">
              <span className="spinner small" aria-hidden="true" />
              <span className="loading-text">Waiting for AI response...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
