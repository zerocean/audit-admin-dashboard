"""
Pydantic 请求/响应 Schemas
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


# ═══════════════════════════ Auth ═══════════════════════════

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool = True
    data: dict  # {"token": str, "expires_in": int}


# ═══════════════════════════ Task ═══════════════════════════

class TaskCreateRequest(BaseModel):
    user_id: int
    project_name: str
    tool_type: str  # 'audit' | 'taxfill'
    source: str = "frontend"
    input_filename: str
    input_file_count: int = 1


class TaskItem(BaseModel):
    id: int
    task_id: str
    project_name: str
    source: str
    input_filename: str
    input_file_count: int = 1
    parser_status: str = "pending"
    inspector_status: str = "pending"
    audit_status: str = "pending"
    overall_status: str = "pending"
    total_tokens: int = 0
    total_cost: float = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    success: bool = True
    data: dict  # {items: [...], pagination: {page, page_size, total}}


class StepItem(BaseModel):
    step_type: str
    status: str
    duration_ms: Optional[int] = None
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    total_cost: float = 0
    model_name: Optional[str] = None
    model_provider: Optional[str] = None

    class Config:
        from_attributes = True


class FileItem(BaseModel):
    file_type: str
    file_name: str
    oss_url: str

    class Config:
        from_attributes = True


class TaskDetailResponse(BaseModel):
    success: bool = True
    data: dict  # TaskItem + steps: [...] + files: [...]


# ═══════════════════════════ Internal Report ═══════════════════════════

class UsageReport(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    model_name: Optional[str] = None
    model_provider: Optional[str] = None
    duration_ms: Optional[int] = None


class StepReportRequest(BaseModel):
    task_id: str
    step_type: str
    status: str  # 'success' | 'failed'
    usage: UsageReport
    files: List[Dict[str, str]] = []
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


# ═══════════════════════════ Statistics ═══════════════════════════

class OverviewResponse(BaseModel):
    success: bool = True
    data: dict


class DailyStatItem(BaseModel):
    date: str
    task_count: int = 0
    total_tokens: int = 0
    total_cost: float = 0


class DailyStatsResponse(BaseModel):
    success: bool = True
    data: List[DailyStatItem]


class ByGroupItem(BaseModel):
    name: str
    task_count: int = 0
    total_tokens: int = 0
    total_cost: float = 0


class ByGroupResponse(BaseModel):
    success: bool = True
    data: List[ByGroupItem]


# ═══════════════════════════ Pricing ═══════════════════════════

class PricingCreate(BaseModel):
    provider: str
    model_name: str
    model_alias: Optional[str] = None
    input_price_per_1k: float = 0
    output_price_per_1k: float = 0
    description: Optional[str] = None


class PricingItem(BaseModel):
    id: int
    provider: str
    model_name: str
    model_alias: Optional[str] = None
    input_price_per_1k: float = 0
    output_price_per_1k: float = 0
    is_active: bool = True
    description: Optional[str] = None

    class Config:
        from_attributes = True


class PricingListResponse(BaseModel):
    success: bool = True
    data: List[PricingItem]


# ═══════════════════════════ Settings ═══════════════════════════

class SettingItem(BaseModel):
    id: int
    setting_key: str
    setting_value: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SettingUpdate(BaseModel):
    setting_value: str


class SettingsListResponse(BaseModel):
    success: bool = True
    data: List[SettingItem]
