"""Domain errors + JSON handlers. No traceback / HTML ever reaches the client."""
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

log = logging.getLogger("app")


class AllProvidersUnavailable(Exception):
    pass


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AllProvidersUnavailable)
    async def _all_down(_: Request, __: AllProvidersUnavailable):
        return JSONResponse(status_code=503, content={"detail": "all providers unavailable"})

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        log.error("unhandled error: %s", type(exc).__name__)  # type only; never message/keys
        return JSONResponse(status_code=500, content={"detail": "internal server error"})
