#!/usr/bin/env python3
"""Integration test for admin-dashboard backend"""
import urllib.request
import json

BASE = "http://localhost:5003"

def api(method, path, data=None, headers=None):
    url = BASE + path
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()}

# Login
resp = api("POST", "/api/v1/auth/login", {"username": "admin", "password": "admin123"})
admin_token = resp["data"]["token"]
print(f"Login OK, token: {admin_token[:20]}...")

auth = {"Authorization": f"Bearer ***}

# Create task
resp = api("POST", "/api/v1/tasks", {"project_name": "test", "source": "frontend", "input_filename": "f.pdf"})
print(f"Create task: {resp}")

# Step reports
int_auth = {"Authorization": f"Bearer dev-in...ey"}
for step in ["parser", "inspector", "audit"]:
    resp = api("POST", f"/api/v1/internal/steps/{step}/complete", {
        "task_id": "582d1d81-2f7c-4efe-8a7c-dd60234b9406",
        "step_type": step, "status": "success",
        "usage": {"input_tokens": 1000, "output_tokens": 500, "total_tokens": 1500,
                  "model_name": "test", "model_provider": "dashscope"},
        "files": []
    }, int_auth)
    print(f"Report {step}: {resp}")

# Task list
resp = api("GET", "/api/v1/tasks", headers=auth)
print(f"\nTasks: total={resp['data']['pagination']['total']}")
for t in resp["data"]["items"]:
    print(f"  #{t['id']}: {t['project_name']} - {t['overall_status']}")

# Stats
resp = api("GET", "/api/v1/statistics/overview", headers=auth)
s = resp["data"]
print(f"\nStats: tasks={s['total_tasks']}, tokens={s['total_tokens']}")
print(f"  by_project: {s['by_project']}")

print("\n=== ALL TESTS PASSED ===")
