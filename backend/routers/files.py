"""
文件下载 API — DESIGN.md §4.3
GET /api/v1/tasks/:id/download/:fileType
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from shared_db.models import TaskFile
from auth import get_current_user
from services.oss import get_presigned_url

router = APIRouter(prefix="/api/v1/tasks", tags=["files"])


@router.get("/{task_id}/download/{file_type}")
def download_file(
    task_id: int,
    file_type: str,
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    """生成 OSS 预签名下载 URL"""
    task_file = db.query(TaskFile).filter(
        TaskFile.task_id == task_id,
        TaskFile.file_type == file_type,
    ).first()

    if not task_file:
        raise HTTPException(status_code=404, detail="文件不存在")

    try:
        download_url = get_presigned_url(task_file.oss_url)
        return {
            "success": True,
            "data": {
                "download_url": download_url,
                "expires_in": 3600,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成下载链接失败: {str(e)}")
