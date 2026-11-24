// Each mode sends the contract's real X-Simulate-Failure header. No separate endpoint.
export const LAB_MODES = [
  { id: "normal", label: "Normal Operation", hint: "Gemini / key_1 answers directly", header: null },
  { id: "k1-429", label: "Gemini / key_1 → 429", hint: "Simulate rate limiting (falls over to Groq / key_2)", header: "key_1=429" },
  { id: "k1-500", label: "Gemini / key_1 → 500", hint: "Simulate provider failure (falls over to Groq / key_2)", header: "key_1=500" },
  { id: "all-429", label: "All Providers → 429", hint: "Simulate complete outage (clean 503 error)", header: "*=429" },
];

export default function ResilienceLab({ mode, onChange, latestEvent }) {
  const active = LAB_MODES.find((m) => m.id === mode) || LAB_MODES[0];
  return (
    <div className="lab" aria-label="Resilience Lab">
      <div className="lab-badge-row">
        <span className="lab-sub-badge">DEMO FAILURE SIMULATION</span>
      </div>
      <p className="lab-desc">
        Uses the assignment-required <code>X-Simulate-Failure</code> header. Real provider keys are skipped on demand without exhausting quota.
      </p>

      <div className="lab-modes" role="radiogroup" aria-label="Failure Scenario">
        {LAB_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={m.id === mode}
            className={`lab-mode ${m.id === mode ? "active" : ""}`}
            onClick={() => onChange(m.id)}
          >
            <div className="lab-mode-top">
              <span className={`radio-indicator ${m.id === mode ? "checked" : ""}`} />
              <span className="lab-mode-title">{m.label}</span>
            </div>
            <small>{m.hint}</small>
          </button>
        ))}
      </div>

      <div className="lab-header-banner">
        {active.header ? (
          <span>
            Active Header: <code>X-Simulate-Failure: {active.header}</code>
          </span>
        ) : (
          <span className="muted">Standard mode: no failure simulation header sent.</span>
        )}
      </div>

      {latestEvent && (
        <div className="failover-event-summary" aria-label="Latest failover event">
          <div className="event-head">
            <span className="event-tag">FAILOVER EVENT</span>
            <span className="event-attempts">Fallback Attempts: {latestEvent.fallback_attempts}</span>
          </div>
          <div className="event-flow">
            <span className="event-node fail">Gemini / key_1 (429/5xx FAILED)</span>
            <span className="event-arrow">↓ Automatic Failover ↓</span>
            <span className="event-node ok">Groq / key_2 ({latestEvent.latency_ms} ms SUCCESS)</span>
          </div>
        </div>
      )}
    </div>
  );
}
