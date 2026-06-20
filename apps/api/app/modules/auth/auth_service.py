from datetime import datetime, timedelta, timezone
from uuid import uuid4

from google.oauth2 import id_token
from google.auth.transport import requests
from jose import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import User


def verify_google_id_token(credential: str) -> dict:
    return id_token.verify_oauth2_token(
        credential,
        requests.Request(),
        settings.google_client_id,
    )


def get_or_create_google_user(db: Session, idinfo: dict) -> User:
    provider_user_id = idinfo["sub"]

    user = (
        db.query(User)
        .filter(User.provider == "google")
        .filter(User.provider_user_id == provider_user_id)
        .first()
    )

    if user:
        user.email = idinfo.get("email")
        user.name = idinfo.get("name")
        user.picture = idinfo.get("picture")
        db.commit()
        db.refresh(user)
        return user

    user = User(
        id=str(uuid4()),
        provider="google",
        provider_user_id=provider_user_id,
        email=idinfo.get("email"),
        name=idinfo.get("name"),
        picture=idinfo.get("picture"),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def create_app_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_expire_minutes
    )

    payload = {
        "sub": user.id,
        "email": user.email,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
