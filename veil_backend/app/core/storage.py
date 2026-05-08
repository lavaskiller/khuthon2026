import asyncio
import hashlib
import json
import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile

from app.core.config import settings

ALLOWED_EXTENSIONS = {"mp4", "mov"}
MAX_TEASER_BYTES = 100 * 1024 * 1024       # 100MB
MAX_MVP_BYTES = 2 * 1024 * 1024 * 1024    # 2GB


def _validate_extension(filename: str | None) -> str:
    if not filename or "." not in filename:
        raise HTTPException(status_code=422, detail="mp4, mov 형식만 지원됩니다")
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail="mp4, mov 형식만 지원됩니다")
    return ext


async def save_file(file: UploadFile, subdir: str, max_bytes: int) -> tuple[str, str, str]:
    """파일 저장 후 (url_path, disk_path, sha256_hash) 반환"""
    ext = _validate_extension(file.filename)

    upload_dir = Path(settings.UPLOAD_DIR) / subdir
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_name = f"{uuid.uuid4().hex}.{ext}"
    disk_path = upload_dir / file_name
    sha256 = hashlib.sha256()
    total = 0

    try:
        async with aiofiles.open(disk_path, "wb") as fp:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(
                        status_code=422,
                        detail=(
                            "티저는 최대 100MB까지 업로드 가능합니다"
                            if max_bytes == MAX_TEASER_BYTES
                            else "MVP 영상은 최대 2GB까지 업로드 가능합니다"
                        ),
                    )
                sha256.update(chunk)
                await fp.write(chunk)
    except HTTPException:
        disk_path.unlink(missing_ok=True)
        raise

    url_path = f"/uploads/{subdir}/{file_name}"
    return url_path, str(disk_path), sha256.hexdigest()


async def get_video_duration(disk_path: str) -> int:
    """ffprobe로 영상 길이(초) 추출"""
    proc = await asyncio.create_subprocess_exec(
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_streams", "-select_streams", "v:0", disk_path,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await proc.communicate()
    if proc.returncode != 0:
        raise HTTPException(status_code=422, detail="영상 파일을 분석할 수 없습니다")
    try:
        data = json.loads(stdout)
        return round(float(data["streams"][0]["duration"]))
    except (KeyError, IndexError, ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=422, detail="영상 파일을 분석할 수 없습니다")
