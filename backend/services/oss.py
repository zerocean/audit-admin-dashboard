"""
阿里云 OSS 文件存储 (复用自 audit-platform)
"""
import os
import oss2
from config import OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET, OSS_ENDPOINT


def _get_bucket():
    if not OSS_ACCESS_KEY_ID or not OSS_ACCESS_KEY_SECRET:
        raise RuntimeError("OSS 凭证未配置")
    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    return oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)


def get_presigned_url(oss_url: str, expires: int = 3600) -> str:
    key = oss_url.replace(f"oss://{OSS_BUCKET}/", "")
    bucket = _get_bucket()
    return bucket.sign_url('GET', key, expires)
