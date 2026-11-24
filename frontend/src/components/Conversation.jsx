import { useEffect, useRef } from "react";
import { IconArrowRight, IconSparkles } from "./Icons";
import { AssistantMessage, UserMessage } from "./Message";

const SUGGESTIONS = [
  { tag: "Architecture", text: "Explain caching & failover architecture" },
  { tag: "Systems", text: "What is an API gateway?" },
  { tag: "DevOps", text: "Explain Docker simply" },
  { tag: "API Design", text: "Compare REST vs GraphQL" },
];

export function EmptyState({ onPick }) {
  return (
    <div className="empty" aria-label="Welcome screen">
      <div className="empty-badge">
        <IconSparkles size={11} className="badge-sparkle" /> PRODUCTION LLM GATEWAY
      </div>
      <h1>ResilientLLM</h1>
      <p className="tagline">Observable, fault-tolerant LLM conversations.</p>
      <p className="empty-copy">
        Reliable multi-turn conversations with automatic key failover (Gemini → Groq), LiteLLM response caching, SQLite persistence, and per-request observability.
      </p>
      <div className="tech-stack-pills">
        <span className="tech-pill">React</span>
        <span className="tech-pill-dot">•</span>
        <span className="tech-pill">FastAPI</span>
        <span className="tech-pill-dot">•</span>
        <span className="tech-pill">LiteLLM</span>
        <span className="tech-pill-dot">•</span>
        <span className="tech-pill">Gemini → Groq</span>
        <span className="tech-pill-dot">•</span>
        <span className="tech-pill">SQLite</span>
      </div>
      <div className="suggestions" role="group" aria-label="Suggested prompts">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            type="button"
            className="suggestion"
            onClick={() => onPick(s.text)}
            aria-label={`Prompt: ${s.text}`}
          >
            <div className="suggestion-content">
              <span className="suggestion-category">{s.tag}</span>
              <span className="suggestion-text">{s.text}</span>
            </div>
            <span className="suggestion-arrow" aria-hidden="true">
              <IconArrowRight size={13} />
            </span>
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
      <div className="scroller empty-scroller">
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
          <div className="msg assistant loading" aria-label="Waiting for AI provider">
            <div className="loading-state-card" role="status">
              <span className="spinner small" aria-hidden="true" />
              <span className="loading-text">Waiting for AI provider...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
