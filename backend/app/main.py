import logging
import os

# Set local model cost map and reload config
os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, health, sessions
from app.core.config import load_settings
from app.core.exceptions import register_exception_handlers
from app.db.database import init_db, sqlite_path
from app.services.llm_service import init_cache

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def create_app() -> FastAPI:
    settings = load_settings()
    app = FastAPI(title="Lyftr Resilient AI", version="1.0.0")
    app.state.settings = settings
    init_db(sqlite_path(settings.database_url))  # schema auto-created on startup
    init_cache()
    app.add_middleware(
        CORSMiddleware, allow_origins=settings.allowed_origins,
        allow_methods=["*"], allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(health.router)
    app.include_router(chat.router)
    app.include_router(sessions.router)
    return app


app = create_app()
