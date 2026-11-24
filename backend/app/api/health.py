from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.db.database import connect, sqlite_path
from app.services.llm_service import cache_enabled

router = APIRouter()


@router.get("/health")
def health(request: Request):
    settings = request.app.state.settings
    try:
        with connect(sqlite_path(settings.database_url)) as conn:
            conn.execute("SELECT 1")
    except Exception:
        return JSONResponse(status_code=503, content={"detail": "database unavailable"})
    if not settings.key_pool:
        return JSONResponse(status_code=503, content={"detail": "no provider keys configured"})
    return {"status": "ok", "keys_configured": len(settings.key_pool), "cache_enabled": cache_enabled()}
