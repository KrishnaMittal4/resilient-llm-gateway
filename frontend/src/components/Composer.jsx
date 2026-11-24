import { useState } from "react";

export default function Composer({ onSend, loading }) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !loading;

  const submit = () => {
    if (!canSend) return;
    const text = value.trim();
    setValue(""); // input is empty after sending
    onSend(text);
  };

  return (
    <div className="composer">
      <textarea
        data-testid="chat-input"
        aria-label="Message"
        placeholder="Message Lyftr Resilient AI…"
        rows={1}
        maxLength={4000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button data-testid="send-button" className="send" onClick={submit} disabled={!canSend} aria-label="Send message">
        {loading ? <span className="spinner" aria-hidden="true" /> : "Send"}
      </button>
    </div>
  );
}
