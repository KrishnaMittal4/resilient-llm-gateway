export default function SessionInsights({ messages }) {
  const assistantMsgs = messages.filter((m) => m.role === "assistant" && m.metadata);
  const totalRequests = assistantMsgs.length;

  if (totalRequests === 0) {
    return (
      <div className="insights-panel empty">
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
          No requests yet. Send a prompt to record session metrics.
        </p>
      </div>
    );
  }

  let liveCount = 0;
  let cacheCount = 0;
  let fallbackCount = 0;
  let geminiCount = 0;
  let groqCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalLatency = 0;

  for (const m of assistantMsgs) {
    const meta = m.metadata;
    if (meta.resolution_source === "LLM_CACHE") {
      cacheCount++;
    } else {
      liveCount++;
      if (meta.key_id === "key_1" || meta.model?.toLowerCase().includes("gemini")) {
        geminiCount++;
      } else if (meta.key_id === "key_2" || meta.model?.toLowerCase().includes("groq")) {
        groqCount++;
      }
    }

    if (meta.fallback_attempts > 0 || (meta.failed_keys && meta.failed_keys.length > 0)) {
      fallbackCount++;
    }

    totalInputTokens += meta.input_tokens || 0;
    totalOutputTokens += meta.output_tokens || 0;
    totalLatency += meta.latency_ms || 0;
  }

  const avgLatency = Math.round(totalLatency / totalRequests);
  const cacheHitRate = Math.round((cacheCount / totalRequests) * 100);

  return (
    <div className="insights-panel" aria-label="Session Insights">
      <div className="insights-compact-grid">
        <div className="insight-row">
          <span className="insight-label">Requests</span>
          <strong className="insight-val">{totalRequests}</strong>
        </div>
        <div className="insight-row">
          <span className="insight-label">Live Inferences</span>
          <strong className="insight-val live">{liveCount}</strong>
        </div>
        <div className="insight-row">
          <span className="insight-label">Cache Hits</span>
          <strong className="insight-val cache">{cacheCount}</strong>
        </div>
        <div className="insight-row">
          <span className="insight-label">Fallback Events</span>
          <strong className="insight-val fallback">{fallbackCount}</strong>
        </div>
        <div className="insight-row">
          <span className="insight-label">Avg Latency</span>
          <strong className="insight-val">{avgLatency} ms</strong>
        </div>
        <div className="insight-row">
          <span className="insight-label">Cache Hit Rate</span>
          <strong className="insight-val">{cacheHitRate}%</strong>
        </div>
        <div className="insight-row tokens-row">
          <span className="insight-label">Session Tokens</span>
          <span className="insight-tokens">
            ↓ <strong>{totalInputTokens.toLocaleString()}</strong> &nbsp;
            ↑ <strong>{totalOutputTokens.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      <div className="provider-routing-sub">
        <span className="sub-title">Provider Distribution</span>
        <div className="routing-bars">
          <div className="routing-row">
            <span className="routing-name">Gemini (key_1)</span>
            <span className="routing-count">{geminiCount} live</span>
          </div>
          <div className="routing-row">
            <span className="routing-name">Groq (key_2)</span>
            <span className="routing-count">{groqCount} fallback</span>
          </div>
          <div className="routing-row">
            <span className="routing-name">LiteLLM Cache</span>
            <span className="routing-count">{cacheCount} responses</span>
          </div>
        </div>
      </div>
      <small className="muted insight-footnote">
        Session-level derived analytics. Individual message tokens remain per request.
      </small>
    </div>
  );
}
