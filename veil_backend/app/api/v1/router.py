from fastapi import APIRouter

from app.api.v1.endpoints import auth, content, explore, invite, review, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(content.router)
api_router.include_router(review.router)
api_router.include_router(explore.router)
api_router.include_router(invite.router)
