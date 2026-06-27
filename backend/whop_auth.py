import os
import httpx
import logging
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)
WHOP_API_KEY = os.environ.get("WHOP_API_KEY")

async def verify_whop_user(request: Request) -> str:
    """
    Verifies the x-whop-user-token by calling the Whop API directly.
    Returns the Whop user ID if valid.
    """
    token = request.headers.get("x-whop-user-token")
    
    if not token:
        logger.error("x-whop-user-token header is MISSING")
        raise HTTPException(status_code=401, detail="Missing Whop token")
    
    logger.info(f"Verifying token: {token[:20]}...")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.whop.com/v2/me",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    if response.status_code != 200:
        logger.error(f"Whop API rejected token: {response.status_code} - {response.text}")
        raise HTTPException(status_code=401, detail="Invalid Whop token")
    
    data = response.json()
    user_id = data.get("id") or data.get("user_id")
    logger.info(f"Verified user: {user_id}")
    return user_id

async def verify_whop_access(request: Request) -> str:
    """
    Verifies token AND checks experience access.
    """
    user_id = await verify_whop_user(request)
    
    experience_id = request.headers.get("x-whop-experience-id")
    if experience_id and WHOP_API_KEY:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.whop.com/v2/me/has-access/{experience_id}",
                headers={"Authorization": f"Bearer {WHOP_API_KEY}",
                         "x-whop-user-token": request.headers.get("x-whop-user-token")}
            )
        if response.status_code == 200:
            data = response.json()
            if not data.get("has_access"):
                raise HTTPException(status_code=403, detail="No active subscription")
    
    return user_id
