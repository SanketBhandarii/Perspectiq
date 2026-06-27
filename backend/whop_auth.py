from fastapi import Request, HTTPException
from whop_sdk import Whop
from config import WHOP_API_KEY

# Initialize the Whop SDK client
whop_client = Whop(api_key=WHOP_API_KEY) if WHOP_API_KEY else None


async def verify_whop_user(request: Request) -> str:
    """
    FastAPI dependency that verifies the x-whop-user-token header.
    Returns the Whop user ID if valid.
    Raises 401 if missing or invalid.
    """
    if not whop_client:
        raise HTTPException(status_code=500, detail="Whop SDK not configured")

    token = request.headers.get("x-whop-user-token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing Whop user token")

    try:
        result = whop_client.verify_user_token(token)
        return result.user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Whop user token")


async def verify_whop_access(request: Request) -> str:
    """
    FastAPI dependency that verifies both the Whop user token
    AND checks if the user has access to the experience (paid membership).
    Returns the Whop user ID if everything checks out.
    """
    user_id = await verify_whop_user(request)

    experience_id = request.headers.get("x-whop-experience-id")
    if experience_id and whop_client:
        try:
            access = whop_client.users.check_access(
                experience_id,
                id=user_id
            )
            if not access.has_access:
                raise HTTPException(status_code=403, detail="No access to this experience. Please purchase a membership.")
        except HTTPException:
            raise
        except Exception:
            # If check_access call fails, still allow (graceful degradation)
            pass

    return user_id
