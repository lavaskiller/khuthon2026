from datetime import date

from pydantic import BaseModel, EmailStr

from app.models.user import Gender, UserRole


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    birth_date: date
    gender: Gender
    region: str


class UserUpdate(BaseModel):
    name: str | None = None
    birth_date: date | None = None
    gender: Gender | None = None
    region: str | None = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserRead(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: UserRole
    birth_date: date
    gender: Gender
    region: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
