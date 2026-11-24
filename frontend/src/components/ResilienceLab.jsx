// Each mode sends the contract's real X-Simulate-Failure header. No separate endpoint.
export const LAB_MODES = [
  { id: "normal", label: "Normal", hint: "Gemini answers (key_1)", header: null },
  { id: "k1-429", label: "Gemini / key_1 → 429", hint: "Fails over to Groq (key_2)", header: "key_1=429" },
  { id: "k1-500", label: "Gemini / key_1 → 500", hint: "Fails over to Groq (key_2)", header: "key_1=500" },
  { id: "all-429", label: "All providers → 429", hint: "Expect a clean 503", header: "*=429" },
];

export default function ResilienceLab({ mode, onChange }) {
  const active = LAB_MODES.find((m) => m.id === mode) || LAB_MODES[0];
  return (
    <div className="lab">
      <div className="lab-modes" role="radiogroup" aria-label="Failure simulation mode">
        {LAB_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={m.id === mode}
            className={`lab-mode ${m.id === mode ? "active" : ""}`}
            onClick={() => onChange(m.id)}
          >
            <span>{m.label}</span>
            <small>{m.hint}</small>
          </button>
        ))}
      </div>
      <p className="lab-header">
        {active.header ? (
          <>
            Next messages send <code>X-Simulate-Failure: {active.header}</code>
          </>
        ) : (
          "No failure header is sent."
        )}
      </p>
    </div>
  );
}
