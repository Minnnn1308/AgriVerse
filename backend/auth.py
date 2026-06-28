import os
import random
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import bcrypt
from db_adapter import get_db_connection

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# Crypt and JWT Settings
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-agriverse-key-100x")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

class UserRegister(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "FARMER"  # FARMER or JUNIOR_ASSISTANT
    parent_id: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

# Helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_user_id(role: str, conn) -> str:
    prefix = "F-" if role == "FARMER" else "J-"
    while True:
        num = random.randint(100, 999)
        uid = f"{prefix}{num}"
        # Check if uid exists
        existing = conn.execute("SELECT user_id FROM users WHERE user_id = ?", (uid,)).fetchone()
        if not existing:
            return uid

def seed_farm_blocks(farm_id: str, conn):
    statuses = ['HEALTHY', 'THIRSTY', 'PEST', 'READY_TO_HARVEST']
    status_weights = [0.6, 0.25, 0.1, 0.05]
    
    for r in range(5):
        for c in range(10):
            block_id = f"B_{farm_id.replace('FARM_', '')}_{chr(65+r)}{c+1}"
            status = random.choices(statuses, weights=status_weights)[0]
            
            # Base stats based on status
            if status == 'HEALTHY':
                moisture = round(random.uniform(60.0, 75.0), 1)
                temp = round(random.uniform(23.0, 26.0), 1)
                fert = round(random.uniform(70.0, 90.0), 1)
            elif status == 'THIRSTY':
                moisture = round(random.uniform(25.0, 45.0), 1)
                temp = round(random.uniform(26.5, 29.5), 1)
                fert = round(random.uniform(60.0, 80.0), 1)
            elif status == 'PEST':
                moisture = round(random.uniform(50.0, 65.0), 1)
                temp = round(random.uniform(24.0, 27.0), 1)
                fert = round(random.uniform(40.0, 60.0), 1)
            else: # READY_TO_HARVEST
                moisture = round(random.uniform(55.0, 65.0), 1)
                temp = round(random.uniform(22.0, 25.0), 1)
                fert = round(random.uniform(50.0, 70.0), 1)
            
            conn.execute(
                """
                INSERT INTO farm_blocks (
                    block_id, farm_id, row_index, col_index, crop_status, 
                    soil_moisture, temperature, soil_n, soil_p, soil_k, 
                    soil_ec, soil_ph, carbon_sequestered, mycorrhizal_health
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (block_id, farm_id, r, c, status, moisture, temp, 120.0, 85.0, 150.0, 1.6, 6.0, 0.0, 50)
            )

# APIs
@router.post("/register")
async def register(user_data: UserRegister):
    username = user_data.username.strip().lower()
    full_name = user_data.full_name.strip()
    
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Tên đăng nhập phải dài hơn 3 ký tự")
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải dài hơn 6 ký tự")
    
    conn = get_db_connection()
    try:
        # Check if username exists
        existing = conn.execute("SELECT user_id FROM users WHERE username = ?", (username,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Tên tài khoản này đã được sử dụng")
        
        # Resolve parent_id if JUNIOR_ASSISTANT
        resolved_parent_id = None
        if user_data.role == "JUNIOR_ASSISTANT" and user_data.parent_id:
            parent = conn.execute("SELECT user_id FROM users WHERE user_id = ? OR username = ?", 
                                  (user_data.parent_id, user_data.parent_id)).fetchone()
            if parent:
                resolved_parent_id = parent["user_id"]
        
        # Generate user ID
        user_id = generate_user_id(user_data.role, conn)
        hashed_pwd = hash_password(user_data.password)
        
        # Insert user
        conn.execute(
            """
            INSERT INTO users (
                user_id, username, password_hash, full_name, role, parent_id, 
                current_level, total_exp, eco_karma, wallet_balance
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, username, hashed_pwd, full_name, user_data.role, resolved_parent_id, 1, 0, 100, 500)
        )
        
        # Auto-create dependencies
        if user_data.role == "FARMER":
            # Create a farm for the farmer
            farm_id = f"FARM_{user_id.replace('-', '')}"
            farm_name = f"Vườn của {full_name}"
            conn.execute(
                "INSERT INTO farms (farm_id, owner_id, name, area_size, crop_type, location_gps) VALUES (?, ?, ?, ?, ?, ?)",
                (farm_id, user_id, farm_name, 2.5, "Cà phê Robusta", "12.6667,108.0500")
            )
            # Seed 50 blocks
            seed_farm_blocks(farm_id, conn)
        elif user_data.role == "JUNIOR_ASSISTANT":
            # Create a pet for the assistant
            pet_id = f"PET_{user_id.replace('-', '')}"
            conn.execute(
                "INSERT INTO eco_pets (pet_id, owner_id, name, species) VALUES (?, ?, ?, ?)",
                (pet_id, user_id, "Chồi Non", "Mộc Tinh")
            )
        
        conn.commit()
        return {
            "status": "success",
            "message": "Đăng ký tài khoản thành công!",
            "user_id": user_id
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống khi đăng ký: {str(e)}")
    finally:
        conn.close()

@router.post("/login")
async def login(user_data: UserLogin):
    username = user_data.username.strip().lower()
    
    conn = get_db_connection()
    try:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="Sai tên đăng nhập hoặc mật khẩu")
        
        if not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Sai tên đăng nhập hoặc mật khẩu")
        
        # Find farm_id
        user_id = user["user_id"]
        farm_id = None
        
        # Check if direct farm owner
        farm = conn.execute("SELECT farm_id FROM farms WHERE owner_id = ?", (user_id,)).fetchone()
        if farm:
            farm_id = farm["farm_id"]
        elif user["role"] == "JUNIOR_ASSISTANT" and user["parent_id"]:
            # Check parent's farm
            parent_farm = conn.execute("SELECT farm_id FROM farms WHERE owner_id = ?", (user["parent_id"],)).fetchone()
            if parent_farm:
                farm_id = parent_farm["farm_id"]
        
        # Fallback if no farm found
        if not farm_id:
            # Check if there is any farm at all
            any_farm = conn.execute("SELECT farm_id FROM farms LIMIT 1").fetchone()
            if any_farm:
                farm_id = any_farm["farm_id"]
            else:
                farm_id = "FARM_001" # Default fallback
        
        # Generate token
        token = create_access_token({
            "user_id": user_id,
            "username": username,
            "role": user["role"]
        })
        
        return {
            "status": "success",
            "token": token,
            "user": {
                "user_id": user_id,
                "username": username,
                "full_name": user["full_name"],
                "role": user["role"],
                "farm_id": farm_id
            }
        }
    finally:
        conn.close()
