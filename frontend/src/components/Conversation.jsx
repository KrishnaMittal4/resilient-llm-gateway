import { useEffect, useRef } from "react";
import { AssistantMessage, UserMessage } from "./Message";

const SUGGESTIONS = ["Explain Docker simply", "What is an API gateway?", "Explain vector databases", "Compare REST and GraphQL"];

export function EmptyState({ onPick }) {
  return (
    <div className="empty">
      <span className="logo big" aria-hidden="true">L</span>
      <h1>Lyftr Resilient AI</h1>
      <p className="tagline">Reliable LLM Conversations.<br />Built for Failure.</p>
      <p className="empty-copy">
        Ask anything. Behind every answer is automatic provider failover, intelligent caching and persistent conversation memory.
      </p>
      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="suggestion" onClick={() => onPick(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
}

export default function Conversation({ messages, loading, onRetry, onPick }) {
  const scroller = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
    if (nearBottom || last?.role === "user") endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  if (messages.length === 0) return <div className="scroller"><EmptyState onPick={onPick} /></div>;

  return (
    <div className="scroller" ref={scroller}>
      <div className="thread" aria-live="polite">
        {messages.map((m) =>
          m.role === "assistant" ? (
            <AssistantMessage key={m.id} msg={m} />
          ) : (
            <UserMessage key={m.id} msg={m} onRetry={onRetry} retryDisabled={loading} />
          )
        )}
        {loading && (
          <div className="msg assistant" aria-label="Assistant is responding">
            <div className="bubble typing"><i /><i /><i /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
