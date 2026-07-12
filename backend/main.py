# Peter Shin (G01073633)
# FastAPI REST API for the Student Survey application: CRUD endpoints over the
# surveys table in RDS MySQL, consumed by the React frontend.
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from database import get_session, init_db
from models import Survey, SurveyCreate, SurveyUpdate


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()  # creates the surveys table on first startup
    yield


app = FastAPI(title="SWE645 HW3 Survey API", lifespan=lifespan)

# The React app calls this API from the browser (a different origin/port),
# so cross-origin requests must be allowed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    """Health endpoint used by the Kubernetes liveness/readiness probes."""
    return {"status": "ok"}


@app.post("/surveys", response_model=Survey, status_code=201)
def create_survey(payload: SurveyCreate, session: Session = Depends(get_session)):
    survey = Survey.model_validate(payload)
    session.add(survey)
    session.commit()
    session.refresh(survey)
    return survey


@app.get("/surveys", response_model=list[Survey])
def list_surveys(session: Session = Depends(get_session)):
    return session.exec(select(Survey)).all()


@app.get("/surveys/{survey_id}", response_model=Survey)
def get_survey(survey_id: int, session: Session = Depends(get_session)):
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


@app.put("/surveys/{survey_id}", response_model=Survey)
def update_survey(
    survey_id: int, payload: SurveyUpdate, session: Session = Depends(get_session)
):
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    survey.sqlmodel_update(payload.model_dump(exclude_unset=True))
    session.add(survey)
    session.commit()
    session.refresh(survey)
    return survey


@app.delete("/surveys/{survey_id}", status_code=204)
def delete_survey(survey_id: int, session: Session = Depends(get_session)):
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    session.delete(survey)
    session.commit()
    return Response(status_code=204)
