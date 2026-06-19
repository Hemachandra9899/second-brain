from fastapi import APIRouter, Request


router = APIRouter()


@router.post("/webhook")
async def openwa_webhook(request: Request):
    event = await request.json()
    return {"ok": True, "received": event}
