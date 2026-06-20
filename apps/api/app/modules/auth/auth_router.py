from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.modules.auth.auth_schema import GoogleLoginRequest, GoogleLoginResponse
from app.modules.auth.auth_service import verify_google_id_token, get_or_create_google_user, create_app_token

router = APIRouter()


@router.post("/google", response_model=GoogleLoginResponse)
def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
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
