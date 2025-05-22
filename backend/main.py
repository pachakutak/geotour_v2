from fastapi import FastAPI, Request, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User
from utils import verify_telegram_auth
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Разрешим доступ с фронта
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # в продакшене — ограничить!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/auth")
async def auth_user(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    init_data = data.get("initData")
    
    print("RAW initData:", init_data)
    user_data = verify_telegram_auth(init_data)
    if not user_data:
        return {"status": "error", "message": "Invalid Telegram auth"}

    telegram_id = int(user_data["user.id"])
    user = db.query(User).filter(User.telegram_id == telegram_id).first()

    if not user:
        user = User(
            telegram_id=telegram_id,
            first_name=user_data.get("user.first_name"),
            last_name=user_data.get("user.last_name"),
            username=user_data.get("user.username"),
            language_code=user_data.get("user.language_code"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "status": "ok",
        "telegram_id": user.telegram_id,
        "first_name": user.first_name,
    }
