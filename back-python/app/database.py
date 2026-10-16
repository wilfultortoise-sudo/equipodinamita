import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Path to database: allows overriding with DATABASE_URL, defaults to SQLite ecommerce.db
DEFAULT_SQLITE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "back", "ecommerce.db")
)
if not os.path.exists(DEFAULT_SQLITE_PATH):
    DEFAULT_SQLITE_PATH = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "ecommerce.db")
    )

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
