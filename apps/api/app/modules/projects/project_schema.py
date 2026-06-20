from pydantic import BaseModel


class CreateProjectRequest(BaseModel):
    name: str
    description: str | None = None
    status: str = "active"


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class CreateGoalRequest(BaseModel):
    title: str
    project_id: str | None = None
    description: str | None = None
    target_date: str | None = None
    status: str = "active"


class UpdateGoalRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    target_date: str | None = None
    status: str | None = None
