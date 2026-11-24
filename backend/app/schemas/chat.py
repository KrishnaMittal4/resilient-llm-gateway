from typing import Annotated, Literal, Optional

from pydantic import BaseModel, StringConstraints

SessionId = Annotated[str, StringConstraints(min_length=1, max_length=128)]
Message = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]
SystemPrompt = Annotated[str, StringConstraints(max_length=4000)]


class ChatRequest(BaseModel):
    session_id: SessionId
    message: Message
    system_prompt: Optional[SystemPrompt] = None


class FailedKey(BaseModel):
    key_id: str
    status: Optional[int] = None


class Metadata(BaseModel):
    resolution_source: Literal["LIVE_INFERENCE", "LLM_CACHE"]
    model: str
    latency_ms: int
    input_tokens: int
    output_tokens: int
    key_id: Optional[str]
    fallback_attempts: int
    failed_keys: list[FailedKey] = []  # extra (allowed by contract): which keys failed first


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    metadata: Metadata
