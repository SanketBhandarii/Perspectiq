from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import Optional
from db.crud import get_user_by_username, create_user
from auth.utils import create_access_token
from config import JWT_SECRET_KEY, JWT_ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class LoginRequest(BaseModel):
    username: str
    role: str
    age: Optional[int] = None

class LoginResponse(BaseModel):
    token: str
    user_id: int
    username: str
    role: str

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(username)
    if user is None:
        raise credentials_exception
    return {"id": user.id, "username": user.username, "role": user.role, "age": user.age}

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    username = request.username.strip()
    role = request.role.lower().strip()
    
    user = get_user_by_username(username)
    if user:
        if user.role.lower() != role or (request.age is not None and user.age != request.age):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username exists but role/age mismatch"
            )
    else:
        user = create_user(username, role, request.age)
    
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "token": access_token,
        "user_id": user.id,
        "username": user.username,
        "role": user.role
    }

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
