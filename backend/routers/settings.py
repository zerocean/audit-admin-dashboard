"""
系统设置 API — DESIGN.md §3.5
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from shared_db.models import SystemSetting
from schemas import SettingUpdate
from auth import get_current_user

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


@router.get("")
def list_settings(
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    settings = db.query(SystemSetting).all()
    return {
        "success": True,
        "data": [
            {
                "id": s.id,
                "setting_key": s.setting_key,
                "setting_value": s.setting_value,
                "description": s.description,
            }
            for s in settings
        ],
    }


@router.put("/{setting_key}")
def update_setting(
    setting_key: str,
    req: SettingUpdate,
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    setting = db.query(SystemSetting).filter(SystemSetting.setting_key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="设置项不存在")

    setting.setting_value = req.setting_value
    db.commit()
    return {"success": True, "message": "已更新"}
