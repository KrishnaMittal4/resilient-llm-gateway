const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Map backend errors to readable text. Raw exceptions are never shown to the user.
function friendly(status) {
  if (status === 503) return "All AI providers are temporarily unavailable. Please try again.";
  if (status === 422) return "That message couldn't be sent. Messages must be 1–4000 characters.";
  if (status === 404) return "Not found.";
  return "Something went wrong on our side. Please try again.";
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body: ignore */
  }
  if (!res.ok) throw new ApiError(friendly(res.status), res.status);
  return data;
}

export const getHealth = () => request("/health");
export const getHistory = (sessionId) => request(`/sessions/${encodeURIComponent(sessionId)}/messages`);

export function postChat({ sessionId, message, systemPrompt, simulate }) {
  const headers = { "Content-Type": "application/json" };
  if (simulate) headers["X-Simulate-Failure"] = simulate; // the contract's test hook
  const body = { session_id: sessionId, message };
  if (systemPrompt && systemPrompt.trim()) body.system_prompt = systemPrompt;
  return request("/chat", { method: "POST", headers, body: JSON.stringify(body) });
}
