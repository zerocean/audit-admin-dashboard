"""
统计报表 API — DESIGN.md §4.4
"""
from datetime import datetime, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from shared_db.models import Task, TaskStep
from auth import get_current_user

router = APIRouter(prefix="/api/v1/statistics", tags=["statistics"])


@router.get("/overview")
def overview(
    project: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    """概览卡片: 总任务数, 总Token, 总费用, 活跃模型数"""
    q = db.query(Task).filter(Task.source != "development")
    if project:
        q = q.filter(Task.project_name == project)
    if start_date:
        q = q.filter(func.date(Task.created_at) >= start_date[:10])
    if end_date:
        q = q.filter(func.date(Task.created_at) <= end_date[:10])

    total_tasks = q.count()
    task_ids = [t.id for t in q.all()]
    total_tokens = db.query(func.sum(Task.total_tokens)).filter(
        Task.id.in_(task_ids) if task_ids else Task.id == -1
    ).scalar() or 0
    total_cost = db.query(func.sum(Task.total_cost)).filter(
        Task.id.in_(task_ids) if task_ids else Task.id == -1
    ).scalar() or 0
    total_files = db.query(func.sum(Task.input_file_count)).filter(
        Task.id.in_(task_ids) if task_ids else Task.id == -1
    ).scalar() or 0

    # active models filtered by task date range
    am_q = db.query(func.count(func.distinct(TaskStep.model_name))).filter(
        TaskStep.model_name.isnot(None)
    )
    if task_ids:
        am_q = am_q.filter(TaskStep.task_id.in_(task_ids))
    active_models = am_q.scalar() or 0

    # 按项目 (reuse q's filtering)
    by_project_q = db.query(
        Task.project_name,
        func.count(Task.id),
        func.sum(Task.total_tokens),
        func.sum(Task.total_cost),
    )
    if start_date:
        by_project_q = by_project_q.filter(func.date(Task.created_at) >= start_date[:10])
    if end_date:
        by_project_q = by_project_q.filter(func.date(Task.created_at) <= end_date[:10])
    by_project_q = by_project_q.group_by(Task.project_name)
    by_project = [
        {"project_name": r[0], "task_count": r[1], "total_tokens": r[2] or 0, "total_cost": float(r[3] or 0)}
        for r in by_project_q.all()
    ]

    # 按提供商 (filtered by task date)
    by_provider_q = db.query(
        TaskStep.model_provider,
        func.count(TaskStep.id),
        func.sum(TaskStep.total_tokens),
        func.sum(TaskStep.total_cost),
    )
    if task_ids:
        by_provider_q = by_provider_q.filter(TaskStep.task_id.in_(task_ids))
    by_provider_q = by_provider_q.group_by(TaskStep.model_provider)
    by_provider = [
        {"provider": r[0], "task_count": r[1], "total_tokens": r[2] or 0, "total_cost": float(r[3] or 0)}
        for r in by_provider_q.all() if r[0]
    ]

    # 按模型 (filtered by task date)
    by_model_q = db.query(
        TaskStep.model_name,
        TaskStep.model_provider,
        func.sum(TaskStep.total_tokens),
        func.sum(TaskStep.total_cost),
    )
    if task_ids:
        by_model_q = by_model_q.filter(TaskStep.task_id.in_(task_ids))
    by_model_q = by_model_q.group_by(TaskStep.model_name, TaskStep.model_provider)
    by_model = [
        {"model_name": r[0], "provider": r[1], "total_tokens": r[2] or 0, "total_cost": float(r[3] or 0)}
        for r in by_model_q.all() if r[0]
    ]

    return {
        "success": True,
        "data": {
            "total_tasks": total_tasks,
            "total_tokens": total_tokens,
            "total_cost": float(total_cost),
            "total_files": total_files,
            "by_project": by_project,
            "by_provider": by_provider,
            "by_model": by_model,
        },
    }


@router.get("/daily")
def daily(
    start_date: str = Query(None),
    end_date: str = Query(None),
    provider: str = Query(None),
    project: str = Query(None),
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    """每日统计: 用于趋势图"""
    q = db.query(
        func.date(Task.created_at).label("day"),
        func.count(Task.id),
        func.sum(Task.total_tokens),
        func.sum(Task.total_cost),
    ).filter(Task.source != "development").group_by("day").order_by("day")

    if start_date:
        q = q.filter(func.date(Task.created_at) >= start_date[:10])
    if end_date:
        q = q.filter(func.date(Task.created_at) <= end_date[:10])
    if project:
        q = q.filter(Task.project_name == project)

    rows = q.all()
    return {
        "success": True,
        "data": [
            {
                "date": str(r[0]),
                "task_count": r[1],
                "total_tokens": r[2] or 0,
                "total_cost": float(r[3] or 0),
            }
            for r in rows
        ],
    }


@router.get("/by-project")
def by_project(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    """按项目统计"""
    q = db.query(
        Task.project_name,
        func.count(Task.id),
        func.sum(Task.total_tokens),
        func.sum(Task.total_cost),
    ).filter(Task.source != "development")
    if start_date:
        q = q.filter(func.date(Task.created_at) >= start_date[:10])
    if end_date:
        q = q.filter(func.date(Task.created_at) <= end_date[:10])
    rows = q.group_by(Task.project_name).all()

    return {
        "success": True,
        "data": [
            {"name": r[0], "task_count": r[1], "total_tokens": r[2] or 0, "total_cost": float(r[3] or 0)}
            for r in rows
        ],
    }


@router.get("/by-provider")
def by_provider(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    """按提供商统计"""
    q = db.query(
        TaskStep.model_provider,
        func.count(TaskStep.id),
        func.sum(TaskStep.total_tokens),
        func.sum(TaskStep.total_cost),
    )
    if start_date or end_date:
        q = q.join(Task, TaskStep.task_id == Task.id)
        if start_date:
            q = q.filter(func.date(Task.created_at) >= start_date[:10])
        if end_date:
            q = q.filter(func.date(Task.created_at) <= end_date[:10])
    rows = q.group_by(TaskStep.model_provider).all()

    return {
        "success": True,
        "data": [
            {"name": r[0], "task_count": r[1], "total_tokens": r[2] or 0, "total_cost": float(r[3] or 0)}
            for r in rows if r[0]
        ],
    }


@router.get("/by-user")
def by_user(start_date: str = Query(None), end_date: str = Query(None),
            db: Session = Depends(get_db), _= Depends(get_current_user)):
    """按用户统计"""
    from shared_db.models import User
    q = db.query(
        User.username, func.count(Task.id), func.sum(Task.total_tokens), func.sum(Task.total_cost)
    ).join(Task, Task.user_id == User.id).filter(Task.source != "development")
    if start_date:
        q = q.filter(func.date(Task.created_at) >= start_date[:10])
    if end_date:
        q = q.filter(func.date(Task.created_at) <= end_date[:10])
    rows = q.group_by(User.username).all()
    return {
        "success": True,
        "data": [
            {"name": r[0], "task_count": r[1], "total_tokens": r[2] or 0, "total_cost": float(r[3] or 0)}
            for r in rows
        ],
    }


@router.get("/error-rate")
def error_rate(start_date: str = None, end_date: str = None,
               db: Session = Depends(get_db), _= Depends(get_current_user)):
    """错误率统计"""
    from shared_db.models import User
    base = db.query(Task).filter(Task.source != "development")
    if start_date: base = base.filter(func.date(Task.created_at) >= start_date[:10])
    if end_date: base = base.filter(func.date(Task.created_at) <= end_date[:10])

    total = base.count()
    failed = base.filter(Task.status == "failed").count()
    rate = round(failed / total * 100, 2) if total > 0 else 0

    # 按用户
    by_user_rows = db.query(
        User.username, func.count(Task.id),
        func.sum(func.iif(Task.status == "failed", 1, 0))
    ).join(Task, Task.user_id == User.id).group_by(User.username)
    if start_date: by_user_rows = by_user_rows.filter(func.date(Task.created_at) >= start_date[:10])
    if end_date: by_user_rows = by_user_rows.filter(func.date(Task.created_at) <= end_date[:10])
    by_user = [{"username": r[0], "total": r[1], "failed": r[2] or 0,
                "rate": round((r[2] or 0) / r[1] * 100, 2) if r[1] > 0 else 0}
               for r in by_user_rows.all()]

    # 按工具
    by_tool_rows = db.query(
        Task.tool_type, func.count(Task.id),
        func.sum(func.iif(Task.status == "failed", 1, 0))
    ).group_by(Task.tool_type)
    by_tool = [{"tool_type": r[0], "total": r[1], "failed": r[2] or 0,
                "rate": round((r[2] or 0) / r[1] * 100, 2) if r[1] > 0 else 0}
               for r in by_tool_rows.all()]

    return {
        "success": True,
        "data": {"overall": {"total": total, "failed": failed, "rate": rate},
                 "by_user": by_user, "by_tool": by_tool},
    }


@router.get("/reports")
def reports(start_date: str = Query(None), end_date: str = Query(None),
            db: Session = Depends(get_db), _= Depends(get_current_user)):
    """报告维度: 去重报告数 + 重复执行排行"""
    q = db.query(
        Task.tool_type, Task.input_filename, func.count(Task.id), func.max(Task.created_at)
    ).filter(Task.input_filename.isnot(None), Task.source != "development")
    if start_date:
        q = q.filter(func.date(Task.created_at) >= start_date[:10])
    if end_date:
        q = q.filter(func.date(Task.created_at) <= end_date[:10])
    rows = q.group_by(Task.tool_type, Task.input_filename).all()

    unique = len(rows)
    by_tool = {}
    for r in rows:
        by_tool[r[0]] = by_tool.get(r[0], 0) + 1

    top = sorted(
        [{"filename": r[1], "tool": r[0], "count": r[2], "last_run": str(r[3])} for r in rows],
        key=lambda x: x["count"], reverse=True
    )[:10]

    return {"success": True, "data": {"total_unique": unique, "by_tool": by_tool, "top_reports": top}}
