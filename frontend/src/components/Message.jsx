import { useState } from "react";

const KEY_PROVIDER = { key_1: "Gemini", key_2: "Groq" }; // key mapping is app configuration (key_1 = Gemini, key_2 = Groq)

function providerOf(model = "") {
  const p = model.split("/")[0];
  return p === "gemini" ? "Gemini" : p === "groq" ? "Groq" : p;
}

function FailoverPath({ meta }) {
  const failed = meta.failed_keys || [];
  if (!failed.length) return null;
  return (
    <div className="failover" aria-label="Failover path">
      {failed.map((f) => (
        <div key={f.key_id} className="fo-step fail">
          <b>{KEY_PROVIDER[f.key_id] || "Provider"} / {f.key_id}</b>
          <span>FAILED{f.status ? ` — ${f.status}` : ""}</span>
        </div>
      ))}
      <div className="fo-arrow">↓ Automatic failover</div>
      <div className="fo-step ok">
        <b>{providerOf(meta.model)} / {meta.key_id}</b>
        <span>SUCCESS</span>
      </div>
    </div>
  );
}

function CacheCompare({ meta, compare }) {
  if (meta.resolution_source !== "LLM_CACHE" || !compare) return null;
  const saved = Math.round((1 - meta.latency_ms / compare.liveMs) * 100);
  return (
    <div className="cache-compare">
      <span>LIVE_INFERENCE · {compare.liveMs} ms</span>
      <span aria-hidden="true">→</span>
      <span>LLM_CACHE · {meta.latency_ms} ms</span>
      {saved > 0 && <strong>{saved}% faster</strong>}
    </div>
  );
}

export function UserMessage({ msg, onRetry, retryDisabled }) {
  return (
    <div className="msg user">
      <div className="bubble">{msg.content}</div>
      {msg.status === "failed" && (
        <div className="error" role="alert">
          <span>{msg.error}</span>
          <button type="button" className="link-btn" onClick={() => onRetry(msg.id)} disabled={retryDisabled}>Retry</button>
        </div>
      )}
    </div>
  );
}

export function AssistantMessage({ msg }) {
  const [copied, setCopied] = useState(false);
  const m = msg.metadata;
  const cache = m.resolution_source === "LLM_CACHE";

  const handleCopy = () => {
    navigator.clipboard?.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="msg assistant" data-testid="assistant-message">
      <div className="bubble-wrap">
        <div className="bubble">{msg.content}</div>
        <button
          type="button"
          className="copy-btn"
          onClick={handleCopy}
          title="Copy response"
          aria-label="Copy response"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <FailoverPath meta={m} />
      <CacheCompare meta={m} compare={msg.compare} />
      <div className="meta" aria-label="Response metadata">
        <span className={`chip ${cache ? "cache" : "live"}`} data-testid="meta-source">{m.resolution_source}</span>
        <span className="chip" data-testid="meta-model">{m.model}</span>
        <span className="chip" data-testid="meta-latency">{m.latency_ms} ms</span>
        <span className="chip">↓<span data-testid="meta-input-tokens">{m.input_tokens}</span></span>
        <span className="chip">↑<span data-testid="meta-output-tokens">{m.output_tokens}</span></span>
        {m.key_id && <span className="chip key">{m.key_id}</span>}
      </div>
      <details className="meta-details">
        <summary>Details</summary>
        <dl className="kv">
          <dt>Resolution source</dt><dd>{m.resolution_source}</dd>
          <dt>Model</dt><dd>{m.model}</dd>
          <dt>Latency</dt><dd>{m.latency_ms} ms</dd>
          <dt>Input tokens</dt><dd>{m.input_tokens} (this request)</dd>
          <dt>Output tokens</dt><dd>{m.output_tokens} (this request)</dd>
          <dt>Key ID</dt><dd>{m.key_id ?? "null (cache)"}</dd>
          <dt>Fallback attempts</dt><dd>{m.fallback_attempts}</dd>
        </dl>
      </details>
    </div>
  );
}
