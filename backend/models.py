# Peter Shin (G01073633)
# SQLModel definitions for the student survey: the database table plus the
# request/response schemas used by the REST API.
from datetime import date
from typing import Optional

from sqlmodel import Field, SQLModel


class SurveyBase(SQLModel):
    """Fields shared by the table and the create/read schemas."""

    first_name: str
    last_name: str
    street_address: str
    city: str
    state: str
    zip: str
    telephone: str
    email: str
    survey_date: date
    # Comma-separated selection of: students, location, campus, atmosphere,
    # dorm rooms, sports
    liked_most: str = ""
    # One of: friends, television, internet, other
    interest_source: str = ""
    # One of: Very Likely, Likely, Unlikely
    recommendation: str = ""


class Survey(SurveyBase, table=True):
    """The surveys table; the id is assigned by the database."""

    id: Optional[int] = Field(default=None, primary_key=True)


class SurveyCreate(SurveyBase):
    """Payload for POST /surveys."""


class SurveyUpdate(SQLModel):
    """Payload for PUT /surveys/{id}; only the provided fields are changed."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    survey_date: Optional[date] = None
    liked_most: Optional[str] = None
    interest_source: Optional[str] = None
    recommendation: Optional[str] = None
