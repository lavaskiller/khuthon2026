import hashlib
from datetime import date


def anon_id(user_id: int, content_id: int) -> str:
    """컨텐츠별 익명 식별자 — 동일 입력이면 항상 동일 출력"""
    raw = f"veil:{content_id}:{user_id}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def age_group(birth_date: date) -> str:
    today = date.today()
    age = today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )
    return f"{(age // 10) * 10}대"
