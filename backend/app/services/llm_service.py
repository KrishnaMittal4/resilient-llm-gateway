"""All provider access goes through LiteLLM (completion + built-in cache)."""
import logging
from dataclasses import dataclass, field
from typing import Optional

import litellm
from litellm import Cache

from app.core.exceptions import AllProvidersUnavailable

log = logging.getLogger("app.llm")
litellm.suppress_debug_info = True
VALID_STATUSES = {429, 500, 502, 503}


def init_cache() -> None:
    """LiteLLM built-in in-memory cache. Key = model + full message list."""
    litellm.cache = Cache(type="local")


def cache_enabled() -> bool:
    return litellm.cache is not None


def parse_failure_header(value: Optional[str]) -> dict:
    """'key_1=429,key_2=500' or '*=429' -> {'key_1': 429, ...}. Bad pairs are ignored."""
    result = {}
    for pair in (value or "").split(","):
        key, sep, status = pair.strip().partition("=")
        if sep and key.strip() and status.strip().isdigit() and int(status) in VALID_STATUSES:
            result[key.strip()] = int(status)
    return result


@dataclass
class LLMResult:
    reply: str
    model: str
    input_tokens: int
    output_tokens: int
    key_id: Optional[str]  # None on cache hit
    fallback_attempts: int
    from_cache: bool
    failed_keys: list = field(default_factory=list)


def complete(pool, messages, simulate: dict, timeout: float) -> LLMResult:
    """Try keys in order (key_1 -> key_2 ...). Any provider error (429 / quota / 5xx /
    connection / auth) fails over to the next key; if every key fails -> 503."""
    failed = []
    for entry in pool:
        sim_status = simulate.get(entry.key_id, simulate.get("*"))
        if sim_status:  # simulated failure for THIS request only
            failed.append({"key_id": entry.key_id, "status": sim_status})
            log.warning("simulated %s for %s", sim_status, entry.key_id)
            continue
        try:
            resp = litellm.completion(
                model=entry.model, messages=messages, api_key=entry.api_key,
                caching=True, num_retries=0, timeout=timeout,
            )
            reply = (resp.choices[0].message.content or "").strip()
            if not reply:
                raise ValueError("empty completion")
        except Exception as exc:  # log the type only: messages could echo secrets
            status = getattr(exc, "status_code", None)
            failed.append({"key_id": entry.key_id, "status": status if isinstance(status, int) else None})
            log.warning("provider %s failed: %s (status=%s)", entry.key_id, type(exc).__name__, status)
            continue

        hit = bool((getattr(resp, "_hidden_params", None) or {}).get("cache_hit"))
        usage = resp.usage
        return LLMResult(
            reply=reply,
            model=entry.model,  # cache key includes model, so this is the model of the cached answer too
            input_tokens=int(usage.prompt_tokens),
            output_tokens=int(usage.completion_tokens),
            key_id=None if hit else entry.key_id,
            fallback_attempts=0 if hit else len(failed),
            from_cache=hit,
            failed_keys=[] if hit else failed,
        )
    raise AllProvidersUnavailable()
