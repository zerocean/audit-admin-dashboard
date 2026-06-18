"""
任务管理 API
POST   /api/v1/tasks           创建任务
GET    /api/v1/tasks           任务列表 (分页+筛选)
GET    /api/v1/tasks/:id        任务详情
"""
from datetime import datetime, timezone, timedelta
CST = timezone(timedelta(hours=8))

def _fmt_time(dt):
    if dt is None: return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(CST).strftime('%Y-%m-%d %H:%M')
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from database import get_db
from shared_db.models import Task
from schemas import TaskCreateRequest, TaskItem, TaskListResponse, TaskDetailResponse
from auth import get_current_user

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.post("", status_code=201)
def create_task(
    req: TaskCreateRequest,
    db: Session = Depends(get_db),
):
    """创建任务记录 (供 audit-platform / email_worker 调用)"""
    task = Task(
        user_id=req.user_id,
        project_name=req.project_name,
        tool_type=req.tool_type,
        source=req.source,
        input_filename=req.input_filename,
        input_file_count=req.input_file_count,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return {
        "success": True,
        "data": {
            "id": task.id,
            "project_name": task.project_name,
            "tool_type": task.tool_type,
            "status": task.status,
        },
    }


@router.get("")
def list_tasks(
    project: str = Query(None),
    status: str = Query(None),
    source: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    keyword: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    """任务列表"""
    q = db.query(Task).filter(Task.source != "development")

    if project:
        q = q.filter(Task.project_name == project)
    if status:
        q = q.filter(Task.status == status)
    if source:
        q = q.filter(Task.source == source)
    if keyword:
        q = q.filter(Task.input_filename.ilike(f"%{keyword}%"))
    if start_date:
        q = q.filter(func.date(Task.created_at) >= start_date[:10])
    if end_date:
        q = q.filter(func.date(Task.created_at) <= end_date[:10])

    total = q.count()
    items = (
        q.order_by(desc(Task.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "success": True,
        "data": {
            "items": [
                {
                    "id": t.id,
                    "user_id": t.user_id,
                    "project_name": t.project_name,
                    "tool_type": t.tool_type,
                    "source": t.source,
                    "status": t.status,
                    "input_filename": t.input_filename,
                    "input_file_count": t.input_file_count,
                    "total_tokens": t.total_tokens,
                    "total_cost": float(t.total_cost),
                    "error_message": t.error_message,
                    "created_at": _fmt_time(t.created_at) if t.created_at else None,
                    "completed_at": _fmt_time(t.completed_at) if t.completed_at else None,
                }
                for t in items
            ],
            "pagination": {"page": page, "page_size": page_size, "total": total},
        },
    }


@router.get("/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    """任务详情 (含 steps + files)"""
    from shared_db.models import User
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    user_name = None
    if task.user_id:
        u = db.query(User).filter(User.id == task.user_id).first()
        if u:
            user_name = u.username

    return {
        "success": True,
        "data": {
            "id": task.id,
            "user_id": task.user_id,
            "user_name": user_name,
            "project_name": task.project_name,
            "tool_type": task.tool_type,
            "source": task.source,
            "status": task.status,
            "input_filename": task.input_filename,
            "input_file_count": task.input_file_count,
            "total_tokens": task.total_tokens,
            "total_cost": float(task.total_cost),
            "error_message": task.error_message,
            "result_json": task.result_json,
            "created_at": _fmt_time(task.created_at) if task.created_at else None,
            "completed_at": _fmt_time(task.completed_at) if task.completed_at else None,
            "steps": [
                {
                    "step_type": s.step_type,
                    "status": s.status,
                    "duration_ms": s.duration_ms,
                    "input_tokens": s.input_tokens,
                    "output_tokens": s.output_tokens,
                    "total_tokens": s.total_tokens,
                    "total_cost": float(s.total_cost),
                    "model_name": s.model_name,
                    "model_provider": s.model_provider,
                    "error_message": s.error_message,
                }
                for s in task.steps
            ],
            "files": [
                {
                    "id": f.id,
                    "file_type": f.file_type,
                    "file_name": f.file_name,
                    "file_size": f.file_size,
                }
                for f in task.files
            ],
        },
    }


@router.get("/{task_id}/files/{file_id}")
def download_task_file(task_id: int, file_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """下载任务关联文件"""
    from shared_db.models import TaskFile
    import os as _os
    tf = db.query(TaskFile).filter(TaskFile.id == file_id, TaskFile.task_id == task_id).first()
    if not tf:
        raise HTTPException(status_code=404, detail="文件不存在")
    path = tf.oss_url
    if not path or not _os.path.exists(path):
        raise HTTPException(status_code=404, detail="文件已丢失")
    from fastapi.responses import FileResponse
    return FileResponse(path, filename=tf.file_name)


@router.get("/{task_id}/report")
def download_audit_report(task_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """下载审计分析报告 (Word 格式)"""
    import json as _json
    task = db.query(Task).filter(Task.id == task_id, Task.tool_type == "audit").first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在或非审计任务")
    
    result = {}
    if task.result_json:
        try: result = _json.loads(task.result_json)
        except Exception: pass
    
    audit_text = result.get("audit_text", "")
    audit_table = result.get("audit_table", "")
    parsed_json = result.get("parsed_json")
    inspector = result.get("inspector", {})
    pages = result.get("pages", 0)
    uploaded_file = result.get("uploaded_file", "")
    filename = task.input_filename or uploaded_file or f"audit_{task_id}"
    
    def esc(s):
        return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    
    def markdown_table_to_html(md):
        """解析 markdown 表格为 HTML，正确处理单元格内换行"""
        if not md:
            return '<p>暂无复核结果</p>'
        lines = md.split('\n')
        merged = []
        for line in lines:
            t = line.strip()
            if not t:
                continue
            if t.startswith('|'):
                merged.append(t)
            elif merged:
                merged[-1] += ' ' + t
        table_lines = [l for l in merged if l.count('|') >= 2]
        if len(table_lines) < 2:
            return '<pre>' + esc(md[:10000]) + '</pre>'
        headers = [c.strip() for c in table_lines[0].split('|') if c.strip()]
        if not headers:
            return '<pre>' + esc(md[:10000]) + '</pre>'
        h = '<table><thead><tr>'
        for hdr in headers:
            h += f'<th>{esc(hdr)}</th>'
        h += '</tr></thead><tbody>'
        for row_line in table_lines[2:]:  # skip header and separator
            cells = [c.strip() for c in row_line.split('|') if c.strip()]
            if not cells:
                continue
            h += '<tr>'
            for i, cell in enumerate(cells):
                tag = 'td'
                if i == 1:  # Error Type column - colorize
                    ct = cell.lower()
                    if 'tie' in ct:
                        h += f'<td style="background:rgba(79,142,247,.15);color:#3b82f6;font-weight:600">{esc(cell)}</td>'
                        continue
                h += f'<{tag}>{esc(cell)}</{tag}>'
            h += '</tr>'
        h += '</tbody></table>'
        return h
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    html = f"""<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>审计复核报告</title>
<style>body{{font-family:"微软雅黑",SimSun,sans-serif;font-size:11pt;line-height:1.6}}
h1{{font-size:18pt;text-align:center}}h2{{font-size:14pt;border-bottom:1pt solid #ccc}}
table{{border-collapse:collapse;width:100%;margin:8pt 0}}
th,td{{border:1pt solid #999;padding:4pt 6pt;font-size:10pt}}
th{{background:#f2f2f2}}pre{{background:#f8f8f8;padding:8pt;font-size:9pt;white-space:pre-wrap}}
</style></head><body><h1>财务审计复核分析报告</h1>
<p style="color:#666">任务 #{task_id} | 文件: {esc(filename)} | 生成时间: {now}</p>
<h2>一、语法/结构性分析</h2>"""

    insp_issues = inspector.get("issues", [])
    if insp_issues:
        html += '<table><tr><th>页码</th><th>类别</th><th>位置</th><th>问题描述</th></tr>'
        for i in insp_issues:
            p = i.split('|')
            html += f'<tr><td>{esc(p[0] if len(p)>0 else "")}</td><td>{esc(p[1] if len(p)>1 else "")}</td><td>{esc(p[2] if len(p)>2 else "")}</td><td>{esc(p[3] if len(p)>3 else i)}</td></tr>'
        html += '</table>'
    else:
        html += '<p>暂无检查结果</p>'

    html += '<h2>二、数值复核结果</h2>'
    
    if audit_table:
        html += markdown_table_to_html(audit_table)
    elif audit_text:
        html += '<pre>' + esc(audit_text[:50000]) + '</pre>'
    else:
        html += '<p>暂无复核结果</p>'
    
    html += '<h2>三、数值复核完整输出</h2>'
    if audit_text:
        html += '<pre>' + esc(audit_text) + '</pre>'
    else:
        html += '<p>暂无</p>'
    
    html += '<h2>四、源报告解析结果</h2>'
    if parsed_json:
        html += f'<p>共解析 {pages} 页</p>'
        html += '<pre>' + esc(_json.dumps(parsed_json, ensure_ascii=False, indent=2)[:100000]) + '</pre>'
    else:
        html += '<p>暂无</p>'
    
    html += '</body></html>'
    
    from fastapi.responses import Response
    import re as _re
    base = uploaded_file or filename
    base = _re.sub(r'\.[^.]+$', '', base) or f'audit_{task_id}'
    return Response(
        content=('\ufeff' + html).encode('utf-8'),
        media_type='application/msword',
        headers={'Content-Disposition': f'attachment; filename="{base}_review.doc"'}
    )
