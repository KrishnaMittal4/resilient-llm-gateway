export default function HealthPanel({ health }) {
  const { loading, ok, data } = health;
  const rows = [
    ["Backend", loading ? "Checking…" : ok ? "Healthy" : "Unreachable", loading ? "idle" : ok ? "good" : "bad"],
    ["SQLite", ok ? "Connected" : "—", ok ? "good" : "idle"],
    ["Providers", ok ? `${data.keys_configured} configured` : "—", ok ? "good" : "idle"],
    ["Cache", ok ? (data.cache_enabled ? "Enabled" : "Disabled") : "—", ok ? (data.cache_enabled ? "good" : "warn") : "idle"],
  ];
  return (
    <ul className="health" aria-label="System health">
      {rows.map(([label, value, tone]) => (
        <li key={label}>
          <span className="health-label">{label}</span>
          <span className={`health-value ${tone}`}>
            <i className="dot" aria-hidden="true" />
            {value}
          </span>
        </li>
      ))}
    </ul>
  );
}
