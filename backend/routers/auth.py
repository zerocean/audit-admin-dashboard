"""POST /api/v1/auth/login"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from shared_db.models import User
from schemas import LoginRequest, LoginResponse
from auth import verify_password, create_access_token, JWT_EXPIRES_IN

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_access_token(user.username)
    return LoginResponse(
        success=True,
        data={"token": token, "expires_in": JWT_EXPIRES_IN},
    )
