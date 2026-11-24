import os
import sqlite3
from contextlib import contextmanager

from app.db.models import SCHEMA


def sqlite_path(database_url: str) -> str:
    prefix = "sqlite:///"
    if not database_url.startswith(prefix):
        raise ValueError("DATABASE_URL must be a SQLite URL, e.g. sqlite:////data/app.db")
    return database_url[len(prefix):]  # sqlite:////data/app.db -> /data/app.db


@contextmanager
def connect(path: str):
    conn = sqlite3.connect(path, timeout=10)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(path: str) -> None:
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with connect(path) as conn:
        conn.executescript(SCHEMA)
