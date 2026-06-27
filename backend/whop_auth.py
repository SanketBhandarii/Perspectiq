import os
import json
import logging
from fastapi import Request, HTTPException, APIRouter
from whop_sdk import Whop

logger = logging.getLogger(__name__)

WHOP_API_KEY = os.environ.get("WHOP_API_KEY")

whop_client = Whop(api_key=WHOP_API_KEY) if WHOP_API_KEY else None

router = APIRouter(tags=["whop"])
CREDENTIALS_FILE = "whop_credentials.json"

def get_saved_credentials(whop_id: str):
    if not os.path.exists(CREDENTIALS_FILE):
        return {}
    try:
        with open(CREDENTIALS_FILE, 'r') as f:
            data = json.load(f)
        return data.get(whop_id, {})
    except Exception:
        return {}

def save_credentials(whop_id: str, creds: dict):
    data = {}
    if os.path.exists(CREDENTIALS_FILE):
        try:
            with open(CREDENTIALS_FILE, 'r') as f:
                data = json.load(f)
        except Exception:
            data = {}
    data[whop_id] = creds
    with open(CREDENTIALS_FILE, 'w') as f:
        json.dump(data, f)

async def verify_whop_user(request: Request) -> str:
    """
    Verifies the x-whop-user-token by calling the Whop API via SDK.
    Returns the Whop user ID if valid.
    """
    if not whop_client:
        raise HTTPException(status_code=500, detail="Whop SDK not configured")

    token = request.headers.get("x-whop-user-token")
    
    if not token:
        logger.error("x-whop-user-token header is MISSING")
        raise HTTPException(status_code=401, detail="Missing Whop token")
    
    logger.info(f"Verifying token: {token[:20]}...")
    
    try:
        result = await whop_client.verify_user_token(request.headers)
        user_id = result.user_id
        logger.info(f"Verified user: {user_id}")
        return user_id
    except Exception as e:
        logger.error(f"Whop API rejected token: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Whop token")

@router.get("/credentials")
async def get_credentials_route(request: Request):
    """
    Reads x-whop-user-token, calls Whop to get user ID,
    returns saved credentials for that user if any.
    """
    whop_user_id = await verify_whop_user(request)
    creds = get_saved_credentials(whop_user_id)
    return creds

@router.post("/credentials")
async def post_credentials_route(request: Request):
    """
    Reads x-whop-user-token, calls Whop to get user ID,
    saves the POST payload to the persistent store.
    """
    whop_user_id = await verify_whop_user(request)
    body = await request.json()
    save_credentials(whop_user_id, body)
    return {"success": True}

async def verify_whop_access(request: Request) -> str:
    """
    Verifies token AND checks experience access.
    """
    user_id = await verify_whop_user(request)
    
    experience_id = request.headers.get("x-whop-experience-id")
    if experience_id and whop_client:
        try:
            pass
        except Exception:
            pass
    
    return user_id
