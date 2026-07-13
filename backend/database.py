# Peter Shin (G01073633)
# Database wiring: builds the engine from the DATABASE_URL env var, creates the
# tables on startup (retrying while the network/DB come up), and provides sessions.
import os
import time

from sqlalchemy.exc import OperationalError
from sqlmodel import Session, SQLModel, create_engine

# e.g. mysql+pymysql://admin:<password>@<rds-endpoint>:3306/surveys
# Supplied by a Kubernetes Secret in the cluster; never committed to git.
DATABASE_URL = os.environ["DATABASE_URL"]

# pool_pre_ping/pool_recycle keep pooled connections valid across MySQL's
# idle-connection timeouts.
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=280, echo=True)


def init_db(retries: int = 30, delay_seconds: float = 2.0) -> None:
    """Create the tables, retrying so the pod survives the DB not being ready yet."""
    for attempt in range(1, retries + 1):
        try:
            SQLModel.metadata.create_all(engine)
            return
        except OperationalError:
            if attempt == retries:
                raise
            time.sleep(delay_seconds)


def get_session():
    """FastAPI dependency yielding a database session per request."""
    with Session(engine) as session:
        yield session
