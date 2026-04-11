from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from tortoise.exceptions import DoesNotExist
from models import User
from pydantic import BaseModel, Field

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=6)
    first_name: str
    last_name: str = ""
    role: str

class UserLogin(BaseModel):
    email: str
    password: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    try:
        user = await User.get(email=email)
    except DoesNotExist:
        raise credentials_exception
    return user


def serialize_user(user: User):
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }

@router.post("/register")
async def register(user: UserCreate):
    normalized_email = user.email.strip().lower()
    first_name = user.first_name.strip()
    last_name = user.last_name.strip()
    role = user.role.strip().lower()

    if role not in {"customer", "shipowner", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    if not first_name:
        raise HTTPException(status_code=400, detail="First name is required")
    existing_user = await User.get_or_none(email=normalized_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    try:
        hashed_password = get_password_hash(user.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    user_obj = await User.create(
        email=normalized_email,
        password=hashed_password,
        first_name=first_name,
        last_name=last_name,
        role=role
    )
    return {"message": "User created successfully", "user": serialize_user(user_obj)}

@router.post("/login")
async def login(user: UserLogin):
    try:
        db_user = await User.get(email=user.email.strip().lower())
    except DoesNotExist:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    try:
        is_valid_password = verify_password(user.password, db_user.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not is_valid_password:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(db_user),
    }


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"user": serialize_user(current_user)}
