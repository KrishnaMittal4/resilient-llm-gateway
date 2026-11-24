import { useCallback, useRef, useState } from "react";
import { getHistory, postChat } from "../services/api";

const STORAGE_KEY = "resilient_llm_past_sessions";

const getSavedSessions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSessionsToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 40)));
  } catch {}
};

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
  const [pastSessions, setPastSessions] = useState(getSavedSessions);
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

        // Record or update this session in the past sessions list
        setPastSessions((prev) => {
          const exists = prev.find((s) => s.id === sessionId);
          let next;
          if (exists) {
            next = prev.map((s) =>
              s.id === sessionId
                ? { ...s, count: (s.count || 0) + 2, updated_at: new Date().toISOString() }
                : s
            );
          } else {
            const preview = text.length > 34 ? text.slice(0, 34) + "…" : text;
            next = [
              { id: sessionId, title: preview, created_at: new Date().toISOString(), count: 2 },
              ...prev,
            ];
          }
          saveSessionsToStorage(next);
          return next;
        });
      } catch (err) {
        patch(userMsgId, { status: "failed", error: err.message || "Something went wrong. Please try again." });
      } finally {
        setLoading(false);
      }
    },
    [sessionId, systemPrompt, simulate]
  );

  const loadSession = useCallback(
    async (targetId) => {
      if (targetId === sessionId) return;
      setLoading(true);
      try {
        const data = await getHistory(targetId);
        const rows = data.messages || [];
        const restored = rows.map((m, idx) => ({
          id: idx + 1,
          role: m.role,
          content: m.content,
          metadata: m.metadata || null,
          status: "ok",
        }));
        counter.current = restored.length;
        setSessionId(targetId);
        setMessages(restored);
        liveLatency.current = {};
      } catch (err) {
        console.error("Failed to load session history from SQLite", err);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const deletePastSession = useCallback(
    (targetId, e) => {
      e?.stopPropagation();
      setPastSessions((prev) => {
        const next = prev.filter((s) => s.id !== targetId);
        saveSessionsToStorage(next);
        return next;
      });
      if (targetId === sessionId) {
        newChat();
      }
    },
    [sessionId, newChat]
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
  return {
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
  };
}
