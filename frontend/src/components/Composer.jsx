import { useRef, useState } from "react";
import { IconSend } from "./Icons";

export default function Composer({ onSend, loading }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);
  const canSend = value.trim().length > 0 && !loading;

  const handleInput = (e) => {
    setValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const submit = () => {
    if (!canSend) return;
    const text = value.trim();
    setValue(""); // input is empty after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    onSend(text);
  };

  return (
    <div className="composer">
      <textarea
        ref={textareaRef}
        data-testid="chat-input"
        aria-label="Message"
        placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
        rows={1}
        maxLength={4000}
        value={value}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="composer-actions">
        <span className="composer-kbd" title="Press Enter to send">
          <kbd>↵</kbd>
        </span>
        <button
          data-testid="send-button"
          className="send"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          title="Send message (Enter)"
        >
          {loading ? <span className="spinner" aria-hidden="true" /> : <IconSend size={15} />}
        </button>
      </div>
    </div>
  );
}
