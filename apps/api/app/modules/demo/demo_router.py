from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.demo.demo_service import seed_demo

router = APIRouter()


@router.post("/seed")
def seed_demo_endpoint(db: Session = Depends(get_db)):
    return seed_demo(db=db)
