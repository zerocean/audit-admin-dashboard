"""用户管理 API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import get_db
from shared_db.models import User, Task
from auth import get_current_user, hash_password

from datetime import timezone, timedelta
CST = timezone(timedelta(hours=8))

def _fmt_time(dt):
    if dt is None: return None
    if hasattr(dt, 'tzinfo') and dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    elif not hasattr(dt, 'tzinfo'):
        return str(dt) if dt else None
    return dt.astimezone(CST).strftime('%Y-%m-%d %H:%M')


router = APIRouter(prefix="/api/v1/users", tags=["users"])


class CreateUserReq(BaseModel):
    username: str
    password: str
    role: str = "user"


class ResetPasswordReq(BaseModel):
    password: str


@router.get("")
def list_users(db: Session = Depends(get_db), _=Depends(get_current_user)):
    users = db.query(User).all()
    return {
        "success": True,
        "data": [{
            "id": u.id, "username": u.username, "role": u.role,
            "created_at": _fmt_time(u.created_at) if u.created_at else None,
        } for u in users]
    }


@router.post("", status_code=201)
def create_user(req: CreateUserReq, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=409, detail="用户名已存在")
    user = User(username=req.username, password_hash=hash_password(req.password), role=req.role)
    db.add(user); db.commit()
    return {"success": True, "id": user.id}


@router.put("/{user_id}/password")
def reset_password(user_id: int, req: ResetPasswordReq, db: Session = Depends(get_db),
                   _=Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.password_hash = hash_password(req.password)
    db.commit()
    return {"success": True}


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="不能删除管理员账号")
    db.delete(user); db.commit()
    return {"success": True}


@router.get("/{user_id}/summary")
def user_summary(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    tasks = db.query(Task).filter(Task.user_id == user_id)
    total = tasks.count()
    total_tokens = db.query(func.sum(Task.total_tokens)).filter(Task.user_id == user_id).scalar() or 0
    total_cost = float(db.query(func.sum(Task.total_cost)).filter(Task.user_id == user_id).scalar() or 0)
    from shared_db.models import TaskFile
    unique_reports = db.query(func.count(func.distinct(TaskFile.file_name))).join(
        Task, TaskFile.task_id == Task.id
    ).filter(Task.user_id == user_id, TaskFile.file_type == "input").scalar() or 0
    error_rate_val = 0
    if total > 0:
        failed = tasks.filter(Task.status == "failed").count()
        error_rate_val = round(failed / total * 100, 2)

    return {
        "success": True,
        "data": {
            "username": user.username, "role": user.role,
            "total_tasks": total, "total_tokens": total_tokens,
            "total_cost": total_cost, "unique_reports": unique_reports,
            "error_rate": error_rate_val,
        }
    }


@router.get("/{user_id}/tasks")
def user_tasks(user_id: int, page: int = 1, page_size: int = 20,
               db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Task).filter(Task.user_id == user_id, Task.source != "development").order_by(Task.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "success": True,
        "data": {
            "items": [{
                "id": t.id, "tool_type": t.tool_type, "status": t.status,
                "input_filename": t.input_filename, "total_tokens": t.total_tokens,
                "total_cost": float(t.total_cost),
                "created_at": _fmt_time(t.created_at) if t.created_at else None,
            } for t in items],
            "pagination": {"page": page, "page_size": page_size, "total": total},
        }
    }


@router.get("/{user_id}/reports")
def user_reports(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    from shared_db.models import TaskFile
    rows = db.query(
        Task.tool_type, TaskFile.file_name,
        func.count(func.distinct(Task.id)), func.max(Task.created_at)
    ).join(Task, TaskFile.task_id == Task.id).filter(
        Task.user_id == user_id, TaskFile.file_type == "input", Task.source != "development"
    ).group_by(Task.tool_type, TaskFile.file_name).all()
    return {
        "success": True,
        "data": [{"tool_type": r[0], "filename": r[1], "count": r[2],
                   "last_run": _fmt_time(r[3])} for r in rows]
    }
