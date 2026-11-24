import { useCallback, useRef, useState } from "react";
import { postChat } from "../services/api";

const uuid = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

// A brand-new session id on every page load (state initialiser runs once per load).
const newSessionId = () => `s-${uuid()}`;

export function useChat({ systemPrompt, simulate }) {
  const [sessionId, setSessionId] = useState(newSessionId);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const counter = useRef(0);
  const liveLatency = useRef({}); // prompt text -> latency of the live call seen on this page

  const newChat = useCallback(() => {
    setSessionId(newSessionId());
    setMessages([]);
    liveLatency.current = {};
  }, []);

  const patch = (id, changes) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...changes } : m)));

  const deliver = useCallback(
    async (userMsgId, text) => {
      setLoading(true);
      patch(userMsgId, { status: "sending", error: null });
      try {
        const data = await postChat({ sessionId, message: text, systemPrompt, simulate });
        const meta = data.metadata;
        let compare = null;
        if (meta.resolution_source === "LIVE_INFERENCE") liveLatency.current[text] = meta.latency_ms;
        else if (liveLatency.current[text] != null) compare = { liveMs: liveLatency.current[text] };
        patch(userMsgId, { status: "ok" });
        setMessages((list) => [
          ...list,
          { id: ++counter.current, role: "assistant", content: data.reply, metadata: meta, compare, simulate },
        ]);
      } catch (err) {
        patch(userMsgId, { status: "failed", error: err.message || "Something went wrong. Please try again." });
      } finally {
        setLoading(false);
      }
    },
    [sessionId, systemPrompt, simulate]
  );

  const send = useCallback(
    (text) => {
      const id = ++counter.current;
      setMessages((list) => [...list, { id, role: "user", content: text, status: "sending" }]);
      return deliver(id, text);
    },
    [deliver]
  );

  const retry = useCallback(
    (id) => {
      const msg = messages.find((m) => m.id === id);
      if (msg && !loading) deliver(id, msg.content);
    },
    [messages, loading, deliver]
  );

  const storedCount = messages.filter((m) => m.role === "assistant" || m.status === "ok").length;
  return { sessionId, messages, loading, send, retry, storedCount, newChat };
}
