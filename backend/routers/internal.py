"""
内部上报 API — DESIGN.md §4.6
POST /api/v1/internal/steps/:stepType/complete
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from shared_db.models import Task, TaskStep, TaskFile
from shared_db.models import ModelPricing
from schemas import StepReportRequest
from config import INTERNAL_API_KEY

router = APIRouter(prefix="/api/v1/internal", tags=["internal"])


def _verify_internal_key(authorization: str = Header(None)):
    """验证内部 API Key"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing internal API key")
    token = authorization.replace("Bearer ", "")
    if token != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid internal API key")
    return True


@router.post("/steps/{step_type}/complete")
def report_step_complete(
    step_type: str,
    req: StepReportRequest,
    db: Session = Depends(get_db),
    _= Depends(_verify_internal_key),
):
    """步骤完成上报"""
    # 查找任务
    task = db.query(Task).filter(Task.task_id == req.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"任务不存在: {req.task_id}")

    # 计算费用
    usage = req.usage
    input_cost = 0
    output_cost = 0
    total_cost = 0

    if usage.model_provider and usage.model_name:
        pricing = db.query(ModelPricing).filter(
            ModelPricing.provider == usage.model_provider,
            ModelPricing.model_name == usage.model_name,
            ModelPricing.is_active == True,
        ).first()
        if pricing:
            input_cost = (usage.input_tokens / 1000) * float(pricing.input_price_per_1k)
            output_cost = (usage.output_tokens / 1000) * float(pricing.output_price_per_1k)
            total_cost = input_cost + output_cost

    # 创建或更新 TaskStep
    step = db.query(TaskStep).filter(
        TaskStep.task_id == task.id,
        TaskStep.step_type == step_type,
    ).first()

    if not step:
        step = TaskStep(task_id=task.id, step_type=step_type)
        db.add(step)

    step.status = req.status
    step.started_at = req.started_at
    step.completed_at = req.completed_at or datetime.now(timezone.utc)
    step.duration_ms = usage.duration_ms
    step.input_tokens = usage.input_tokens
    step.output_tokens = usage.output_tokens
    step.total_tokens = usage.total_tokens
    step.input_cost = input_cost
    step.output_cost = output_cost
    step.total_cost = total_cost
    step.model_name = usage.model_name
    step.model_provider = usage.model_provider

    if req.status == "failed":
        step.error_message = "Step failed"

    # 创建 TaskFile 记录
    for f in req.files:
        task_file = TaskFile(
            task_id=task.id,
            file_type=f.get("file_type", step_type),
            file_name=f.get("file_name", ""),
            oss_url=f.get("oss_url", ""),
        )
        db.add(task_file)

    # 更新任务汇总
    all_steps = db.query(TaskStep).filter(TaskStep.task_id == task.id).all()
    task.total_tokens = sum(s.total_tokens for s in all_steps)
    task.total_cost = sum(s.total_cost for s in all_steps)

    # 更新子状态
    status_map = {
        "parser": "parser_status",
        "vision_parser": "parser_status",
        "inspector": "inspector_status",
        "audit": "audit_status",
        "filling_engine": "audit_status",
    }
    attr = status_map.get(step_type)
    if attr:
        setattr(task, attr, req.status)

    # 判断 overall_status
    statuses = [task.parser_status, task.inspector_status, task.audit_status]

    if any(s == "failed" for s in statuses):
        task.overall_status = "failed"
    elif any(s == "running" for s in statuses) or any(s == "pending" for s in statuses):
        task.overall_status = "running"
    elif all(s == "success" for s in statuses):
        task.overall_status = "success"
        task.completed_at = datetime.now(timezone.utc)
    else:
        task.overall_status = "pending"

    db.commit()

    return {"success": True, "message": f"Step {step_type} reported"}
