import time
from typing import Optional

from fastapi import APIRouter, Header, Request

from app.core.config import DEFAULT_SYSTEM_PROMPT
from app.db.database import connect, sqlite_path
from app.schemas.chat import ChatRequest, ChatResponse, Metadata
from app.services import llm_service, session_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, request: Request, x_simulate_failure: Optional[str] = Header(default=None)):
    start = time.perf_counter()
    settings = request.app.state.settings
    db_path = sqlite_path(settings.database_url)
    simulate = llm_service.parse_failure_header(x_simulate_failure) if settings.enable_failure_simulation else {}
    new_prompt = (body.system_prompt or "").strip() or None

    # 1. load history + effective system prompt (request > stored for session > default)
    with connect(db_path) as conn:
        history = session_service.load_history(conn, body.session_id)
        stored_prompt = session_service.get_system_prompt(conn, body.session_id)
    system_prompt = new_prompt or stored_prompt or DEFAULT_SYSTEM_PROMPT

    # 2. LLM call (cache + failover). Raises AllProvidersUnavailable -> 503, nothing stored.
    messages = session_service.build_llm_messages(system_prompt, history, body.message)
    result = llm_service.complete(settings.key_pool, messages, simulate, settings.request_timeout)

    metadata = Metadata(
        resolution_source="LLM_CACHE" if result.from_cache else "LIVE_INFERENCE",
        model=result.model,
        latency_ms=int(round((time.perf_counter() - start) * 1000)),
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        key_id=result.key_id,
        fallback_attempts=result.fallback_attempts,
        failed_keys=result.failed_keys,
    )

    # 3. persist the successful turn only
    with connect(db_path) as conn:
        session_service.save_turn(conn, body.session_id, new_prompt, body.message, result.reply, metadata.model_dump())
    return ChatResponse(session_id=body.session_id, reply=result.reply, metadata=metadata)
