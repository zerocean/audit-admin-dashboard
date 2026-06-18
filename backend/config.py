"""
audit-admin-dashboard 配置
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── 数据库 ──
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./audit_admin.db")

# ── JWT ──
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_IN = int(os.getenv("JWT_EXPIRES_IN", "86400"))  # 24小时

# ── 内部 API ──
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "dev-internal-key")

# ── OSS ──
OSS_ACCESS_KEY_ID = os.getenv("OSS_ACCESS_KEY_ID", "")
OSS_ACCESS_KEY_SECRET = os.getenv("OSS_ACCESS_KEY_SECRET", "")
OSS_BUCKET = os.getenv("OSS_BUCKET", "audit-platform")
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "oss-cn-hangzhou.aliyuncs.com")

# ── 端口 ──
PORT = int(os.getenv("PORT", "5004"))

# ── 路径 ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
