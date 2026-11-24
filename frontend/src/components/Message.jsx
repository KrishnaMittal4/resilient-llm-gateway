import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

const KEY_PROVIDER = { key_1: "Gemini", key_2: "Groq" };

function providerName(model = "", keyId = null, isCache = false) {
  if (isCache) return "LiteLLM Cache";
  if (keyId && KEY_PROVIDER[keyId]) return KEY_PROVIDER[keyId];
  const p = model.split("/")[0].toLowerCase();
  return p === "gemini" ? "Gemini" : p === "groq" ? "Groq" : p.toUpperCase();
}

function ProviderRouteVisualization({ meta }) {
  const isCache = meta.resolution_source === "LLM_CACHE";
  const failed = meta.failed_keys || [];
  const hadFailover = meta.fallback_attempts > 0 || failed.length > 0;

  if (isCache) {
    return (
      <div className="route-box cache" aria-label="Provider routing: Cache Hit">
        <div className="route-step">
          <span className="route-node cache">⚡ LiteLLM Local Cache</span>
          <span className="route-arrow">➔</span>
          <span className="route-node ok">CACHE HIT (0 ms network, key_id: null)</span>
        </div>
      </div>
    );
  }

  if (hadFailover) {
    return (
      <div className="route-box failover" aria-label="Provider routing: Automatic Failover">
        <div className="route-flow-row">
          {failed.map((f, i) => (
            <span key={i} className="route-node fail">
              {KEY_PROVIDER[f.key_id] || "Gemini"} / {f.key_id} ({f.status ? `${f.status} ` : ""}FAILED)
            </span>
          ))}
          <span className="route-arrow">➔ Automatic Failover ➔</span>
          <span className="route-node ok">
            {providerName(meta.model, meta.key_id)} / {meta.key_id} (SUCCESS)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="route-box normal" aria-label="Provider routing: Primary">
      <div className="route-flow-row">
        <span className="route-node ok">
          {providerName(meta.model, meta.key_id)} / {meta.key_id || "key_1"} ➔ SUCCESS
        </span>
      </div>
    </div>
  );
}

function CacheComparison({ meta, compare }) {
  if (meta.resolution_source !== "LLM_CACHE") return null;

  if (!compare) {
    return (
      <div className="cache-banner">
        <span>⚡ Served instantly from LiteLLM in-memory cache</span>
      </div>
    );
  }

  const reduction = Math.max(0, Math.round((1 - meta.latency_ms / compare.liveMs) * 100));
  return (
    <div className="cache-banner with-compare">
      <span className="cache-tag">⚡ LLM_CACHE</span>
      <span className="cache-metric">Live: {compare.liveMs} ms ➔ Cached: {meta.latency_ms} ms</span>
      {reduction > 0 && <strong className="reduction-badge">{reduction}% Latency Reduction</strong>}
    </div>
  );
}

export function UserMessage({ msg, onRetry, retryDisabled }) {
  return (
    <div className="msg user">
      <div className="msg-header-user">
        <span className="user-label">YOU</span>
      </div>
      <div className="bubble user-bubble">{msg.content}</div>
      {msg.status === "failed" && (
        <div className="error-banner" role="alert">
          <div className="error-copy">
            <strong>Delivery Failed</strong>
            <span>{msg.error}</span>
          </div>
          <button type="button" className="retry-btn" onClick={() => onRetry(msg.id)} disabled={retryDisabled}>
            Retry Request
          </button>
        </div>
      )}
    </div>
  );
}

export function AssistantMessage({ msg, engineeringMode = true }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'helpful' | 'unhelpful' | null
  const [showDetails, setShowDetails] = useState(false);

  const m = msg.metadata;
  const isCache = m.resolution_source === "LLM_CACHE";
  const provider = providerName(m.model, m.key_id, isCache);

  const handleCopy = () => {
    navigator.clipboard?.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="msg assistant" data-testid="assistant-message">
      <div className="msg-header-assistant">
        <div className="assistant-identity">
          <span className="assistant-avatar">AI</span>
          <strong className="assistant-name">ResilientLLM</strong>
          <span className={`provider-pill ${isCache ? "cache" : "live"}`}>
            {provider}
          </span>
        </div>
      </div>

      <div className="bubble assistant-bubble">
        <MarkdownRenderer content={msg.content} />
      </div>

      {/* Answer Actions */}
      <div className="answer-actions" aria-label="Answer actions">
        <button
          type="button"
          className={`action-btn ${copied ? "copied" : ""}`}
          onClick={handleCopy}
          aria-label="Copy full answer"
          title="Copy answer to clipboard"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
        <button
          type="button"
          className={`action-btn ${feedback === "helpful" ? "active" : ""}`}
          onClick={() => setFeedback(feedback === "helpful" ? null : "helpful")}
          aria-label="Helpful"
          title="Helpful response"
        >
          👍
        </button>
        <button
          type="button"
          className={`action-btn ${feedback === "unhelpful" ? "active" : ""}`}
          onClick={() => setFeedback(feedback === "unhelpful" ? null : "unhelpful")}
          aria-label="Not helpful"
          title="Not helpful response"
        >
          👎
        </button>
      </div>

      {/* Route & Cache Visualizations */}
      <ProviderRouteVisualization meta={m} />
      <CacheComparison meta={m} compare={msg.compare} />

      {/* Mandatory Metadata Contract Elements (always rendered in DOM) */}
      <div className={`meta-bar ${engineeringMode ? "" : "clean-mode"}`} aria-label="Response metadata">
        <span className={`chip ${isCache ? "cache" : "live"}`} data-testid="meta-source">
          {m.resolution_source}
        </span>
        <span className="chip" data-testid="meta-model">
          {m.model}
        </span>
        <span className="chip" data-testid="meta-latency">
          {m.latency_ms} ms
        </span>
        <span className="chip">
          ↓<span data-testid="meta-input-tokens">{m.input_tokens}</span>
        </span>
        <span className="chip">
          ↑<span data-testid="meta-output-tokens">{m.output_tokens}</span>
        </span>
        {m.key_id && <span className="chip key">{m.key_id}</span>}

        <button
          type="button"
          className="details-toggle-btn"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
        >
          {showDetails ? "Hide Details" : "View Details"}
        </button>
      </div>

      {/* Observability Response Details Panel */}
      {showDetails && (
        <div className="details-panel" aria-label="Detailed response breakdown">
          <div className="details-panel-head">
            <strong>RESPONSE DETAILS</strong>
            <small className="muted">Per-request telemetry from backend</small>
          </div>
          <dl className="kv details-kv">
            <dt>Resolution Source</dt>
            <dd><code>{m.resolution_source}</code></dd>
            <dt>Provider</dt>
            <dd>{provider}</dd>
            <dt>Model</dt>
            <dd><code>{m.model}</code></dd>
            <dt>Latency</dt>
            <dd>{m.latency_ms} ms</dd>
            <dt>Input Tokens</dt>
            <dd>{m.input_tokens} (this request)</dd>
            <dt>Output Tokens</dt>
            <dd>{m.output_tokens} (this reply)</dd>
            <dt>Provider Key</dt>
            <dd>{m.key_id ? <code>{m.key_id}</code> : "null (cache hit)"}</dd>
            <dt>Fallback Attempts</dt>
            <dd>{m.fallback_attempts}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
