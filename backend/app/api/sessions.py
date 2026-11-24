from fastapi import APIRouter, HTTPException, Request

from app.db.database import connect, sqlite_path
from app.services import session_service

router = APIRouter()


@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: str, request: Request):
    with connect(sqlite_path(request.app.state.settings.database_url)) as conn:
        rows = session_service.load_history(conn, session_id)
    if not rows:
        raise HTTPException(status_code=404, detail="session not found")
    return {"session_id": session_id, "messages": session_service.public_history(rows)}
