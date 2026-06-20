from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.auth_service import (
    verify_google_id_token,
    get_or_create_google_user,
    create_app_token,
)


router = APIRouter()


class GoogleLoginRequest(BaseModel):
    credential: str


@router.post("/google")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    idinfo = verify_google_id_token(payload.credential)
    user = get_or_create_google_user(db=db, idinfo=idinfo)
    token = create_app_token(user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "picture": user.picture,
        },
    }
