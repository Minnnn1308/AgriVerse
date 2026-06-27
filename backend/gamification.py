import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from db_adapter import get_db_connection

router = APIRouter(
    prefix="/gamification",
    tags=["Gamification Mode"]
)



# --- Models ---
class Quest(BaseModel):
    quest_id: str
    title: str
    description: str
    reward_points: int
    difficulty: str

class KidProfile(BaseModel):
    user_id: str
    full_name: str
    current_level: int
    total_points: int
    avatar_url: str = ""

class RenameRequest(BaseModel):
    new_name: str

class AvatarRequest(BaseModel):
    avatar_url: str

class LocationRequest(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = None
    location_name: Optional[str] = None

class AreaUpdateRequest(BaseModel):
    area_size: float

class BlockActionRequest(BaseModel):
    action: str

# --- Endpoints ---
@router.get("/profile/{user_id}", summary="Lấy thông tin Nông dân nhí", response_model=KidProfile)
async def get_kid_profile(user_id: str):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE user_id = ? AND role = 'JUNIOR_ASSISTANT'", (user_id,)).fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy Nông dân nhí")
        
    return KidProfile(
        user_id=user["user_id"],
        full_name=user["full_name"],
        current_level=user["current_level"],
        total_points=user["total_points"],
        avatar_url=(user["avatar_url"] or "") if "avatar_url" in user.keys() else ""
    )

@router.put("/profile/{user_id}/rename", summary="Đổi tên Nông dân nhí")
async def rename_kid(user_id: str, request: RenameRequest):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE user_id = ? AND role = 'JUNIOR_ASSISTANT'", (user_id,)).fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy Nông dân nhí")
        
    conn.execute("UPDATE users SET full_name = ? WHERE user_id = ?", (request.new_name, user_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Đổi tên thành công!", "new_name": request.new_name}

@router.put("/profile/{user_id}/avatar", summary="Đổi avatar Nông dân nhí")
async def update_avatar(user_id: str, request: AvatarRequest):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE user_id = ? AND role = 'JUNIOR_ASSISTANT'", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy Nông dân nhí")
    conn.execute("UPDATE users SET avatar_url = ? WHERE user_id = ?", (request.avatar_url, user_id))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Đổi avatar thành công!", "avatar_url": request.avatar_url}

@router.put("/farm/{farm_id}/location", summary="Lưu vị trí GPS nông trại")
async def update_farm_location(farm_id: str, request: LocationRequest):
    conn = get_db_connection()
    farm = conn.execute("SELECT * FROM farms WHERE farm_id = ?", (farm_id,)).fetchone()
    if not farm:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy thửa ruộng")
    gps = f"{request.lat},{request.lng}"
    if request.accuracy is not None:
        gps += f"|acc:{request.accuracy}"
    if request.location_name:
        gps += f"|{request.location_name}"
    conn.execute("UPDATE farms SET location_gps = ? WHERE farm_id = ?", (gps, farm_id))
    conn.commit()
    conn.close()
    return {
        "status": "success",
        "message": "Đã lưu vị trí nông trại",
        "location_gps": gps,
        "lat": request.lat,
        "lng": request.lng,
        "location_name": request.location_name,
    }

@router.get("/farm/{farm_id}/location", summary="Lấy vị trí GPS nông trại")
async def get_farm_location(farm_id: str):
    conn = get_db_connection()
    farm = conn.execute("SELECT location_gps FROM farms WHERE farm_id = ?", (farm_id,)).fetchone()
    conn.close()
    if not farm:
        raise HTTPException(status_code=404, detail="Không tìm thấy thửa ruộng")
    gps = farm["location_gps"] or ""
    if not gps:
        return {"lat": None, "lng": None, "location_name": None}
    parts = gps.split("|")
    coords = parts[0].split(",")
    result = {"lat": float(coords[0]), "lng": float(coords[1]), "location_name": None}
    for p in parts[1:]:
        if p.startswith("acc:"):
            result["accuracy"] = float(p[4:])
        elif p:
            result["location_name"] = p
    return result

@router.get("/quests", summary="Lấy danh sách nhiệm vụ hôm nay", response_model=List[Quest])
async def get_quests():
    conn = get_db_connection()
    quests = conn.execute("SELECT * FROM quests").fetchall()
    conn.close()
    
    return [
        Quest(
            quest_id=q["quest_id"],
            title=q["title"],
            description=q["description"],
            reward_points=q["reward_points"],
            difficulty=q["difficulty"]
        ) for q in quests
    ]

@router.post("/complete-quest/{user_id}/{quest_id}", summary="Hoàn thành nhiệm vụ")
async def complete_quest(user_id: str, quest_id: str):
    conn = get_db_connection()
    
    # Check if quest exists
    quest = conn.execute("SELECT * FROM quests WHERE quest_id = ?", (quest_id,)).fetchone()
    if not quest:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy Nhiệm vụ")
        
    # Check if user exists
    user = conn.execute("SELECT * FROM users WHERE user_id = ? AND role = 'JUNIOR_ASSISTANT'", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy Nông dân nhí")

    # Check if already completed
    already_completed = conn.execute("SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ?", (user_id, quest_id)).fetchone()
    if already_completed:
        conn.close()
        return {"status": "info", "message": "Nhiệm vụ này bé đã hoàn thành rồi!"}

    # Mark as completed
    conn.execute("INSERT INTO user_quests (user_id, quest_id, status, completed_at) VALUES (?, ?, 'COMPLETED', CURRENT_TIMESTAMP)", (user_id, quest_id))
    
    # Update points
    new_points = user["total_points"] + quest["reward_points"]
    new_level = user["current_level"]
    level_up = False
    
    while new_points >= 100:
        new_level += 1
        new_points -= 100
        level_up = True
        
    conn.execute("UPDATE users SET total_points = ?, current_level = ? WHERE user_id = ?", (new_points, new_level, user_id))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": f"Chúc mừng {user['full_name']} đã hoàn thành nhiệm vụ!",
        "reward_points": quest["reward_points"],
        "current_level": new_level,
        "current_points": new_points,
        "level_up": level_up
    }

# --- New Endpoints for Field Blocks & Converter ---

@router.get("/farm/{farm_id}/blocks", summary="Lấy danh sách ô đất của thửa ruộng")
async def get_farm_blocks(farm_id: str):
    conn = get_db_connection()
    farm = conn.execute("SELECT * FROM farms WHERE farm_id = ?", (farm_id,)).fetchone()
    if not farm:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy thửa ruộng")
        
    blocks = conn.execute("SELECT * FROM farm_blocks WHERE farm_id = ? ORDER BY row_index, col_index", (farm_id,)).fetchall()
    conn.close()
    
    return {
        "farm_id": farm["farm_id"],
        "name": farm["name"],
        "area_size": float(farm["area_size"]) if farm["area_size"] is not None else 0.0,
        "crop_type": farm["crop_type"],
        "blocks": [
            {
                "block_id": b["block_id"],
                "farm_id": b["farm_id"],
                "row_index": b["row_index"],
                "col_index": b["col_index"],
                "crop_status": b["crop_status"],
                "soil_moisture": float(b["soil_moisture"]),
                "temperature": float(b["temperature"]),
                "fertilizer_level": float(b["fertilizer_level"])
            } for b in blocks
        ]
    }

@router.put("/farm/{farm_id}/area", summary="Cập nhật diện tích thửa ruộng")
async def update_farm_area(farm_id: str, request: AreaUpdateRequest):
    conn = get_db_connection()
    farm = conn.execute("SELECT * FROM farms WHERE farm_id = ?", (farm_id,)).fetchone()
    if not farm:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy thửa ruộng")
        
    conn.execute("UPDATE farms SET area_size = ? WHERE farm_id = ?", (request.area_size, farm_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Cập nhật diện tích thành công", "area_size": request.area_size}

@router.post("/block/{block_id}/action", summary="Thực hiện thao tác chăm sóc ô đất")
async def perform_block_action(block_id: str, request: BlockActionRequest):
    conn = get_db_connection()
    block = conn.execute("SELECT * FROM farm_blocks WHERE block_id = ?", (block_id,)).fetchone()
    if not block:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy ô đất")
        
    action = request.action.lower()
    
    new_status = block["crop_status"]
    new_moisture = float(block["soil_moisture"])
    new_temp = float(block["temperature"])
    new_fert = float(block["fertilizer_level"])
    
    quest_completed_info = None
    
    if action == 'water':
        # Tưới nước
        new_moisture = 75.0
        new_temp = max(20.0, new_temp - 1.5)
        if new_status == 'THIRSTY':
            new_status = 'HEALTHY'
            
        # Kiểm tra hoàn thành nhiệm vụ "Siêu nhân tưới tiêu" (Q-02) cho Bé Cà Rốt (J-007)
        kid_id = "J-007"
        quest_id = "Q-02"
        
        # Check if already completed
        already_completed = conn.execute(
            "SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ?", (kid_id, quest_id)
        ).fetchone()
        
        if not already_completed:
            # Mark as completed
            conn.execute(
                "INSERT INTO user_quests (user_id, quest_id, status, completed_at) VALUES (?, ?, 'COMPLETED', CURRENT_TIMESTAMP)",
                (kid_id, quest_id)
            )
            # Fetch quest reward
            quest = conn.execute("SELECT * FROM quests WHERE quest_id = ?", (quest_id,)).fetchone()
            reward_points = quest["reward_points"] if quest else 70
            
            # Update user level and points
            user = conn.execute("SELECT * FROM users WHERE user_id = ? AND role = 'JUNIOR_ASSISTANT'", (kid_id,)).fetchone()
            if user:
                new_points = user["total_points"] + reward_points
                new_level = user["current_level"]
                level_up = False
                while new_points >= 100:
                    new_level += 1
                    new_points -= 100
                    level_up = True
                
                conn.execute(
                    "UPDATE users SET total_points = ?, current_level = ? WHERE user_id = ?",
                    (new_points, new_level, kid_id)
                )
                
                quest_completed_info = {
                    "quest_id": quest_id,
                    "title": quest["title"] if quest else "Siêu nhân tưới tiêu",
                    "reward_points": reward_points,
                    "current_level": new_level,
                    "current_points": new_points,
                    "level_up": level_up
                }
                
    elif action == 'fertilize':
        # Bón phân
        new_fert = 90.0
        if new_status == 'THIRSTY' or new_status == 'PEST':
            # Fertilizing a dry or sick block helps, but status becomes healthy only if not thirsty
            if new_moisture >= 50.0:
                new_status = 'HEALTHY'
        elif new_status == 'HEALTHY':
            pass
            
    elif action == 'treat_pest':
        # Phun thuốc / trị sâu bệnh
        if new_status == 'PEST':
            new_status = 'HEALTHY'
            new_fert = max(50.0, new_fert - 10.0) # Phun thuốc làm giảm nhẹ chất dinh dưỡng tạm thời
            
        # Kiểm tra hoàn thành nhiệm vụ "Bác sĩ cây trồng" (Q-01) cho Bé Cà Rốt
        kid_id = "J-007"
        quest_id = "Q-01"
        
        already_completed = conn.execute(
            "SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ?", (kid_id, quest_id)
        ).fetchone()
        
        if not already_completed:
            conn.execute(
                "INSERT INTO user_quests (user_id, quest_id, status, completed_at) VALUES (?, ?, 'COMPLETED', CURRENT_TIMESTAMP)",
                (kid_id, quest_id)
            )
            quest = conn.execute("SELECT * FROM quests WHERE quest_id = ?", (quest_id,)).fetchone()
            reward_points = quest["reward_points"] if quest else 40
            
            user = conn.execute("SELECT * FROM users WHERE user_id = ? AND role = 'JUNIOR_ASSISTANT'", (kid_id,)).fetchone()
            if user:
                new_points = user["total_points"] + reward_points
                new_level = user["current_level"]
                level_up = False
                while new_points >= 100:
                    new_level += 1
                    new_points -= 100
                    level_up = True
                
                conn.execute(
                    "UPDATE users SET total_points = ?, current_level = ? WHERE user_id = ?",
                    (new_points, new_level, kid_id)
                )
                
                quest_completed_info = {
                    "quest_id": quest_id,
                    "title": quest["title"] if quest else "Bác sĩ cây trồng",
                    "reward_points": reward_points,
                    "current_level": new_level,
                    "current_points": new_points,
                    "level_up": level_up
                }
                
    else:
        conn.close()
        raise HTTPException(status_code=400, detail="Thao tác chăm sóc không hợp lệ")
        
    conn.execute(
        "UPDATE farm_blocks SET crop_status = ?, soil_moisture = ?, temperature = ?, fertilizer_level = ? WHERE block_id = ?",
        (new_status, new_moisture, new_temp, new_fert, block_id)
    )
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": f"Thực hiện thao tác '{action}' thành công!",
        "block": {
            "block_id": block_id,
            "crop_status": new_status,
            "soil_moisture": new_moisture,
            "temperature": new_temp,
            "fertilizer_level": new_fert
        },
        "quest_completed": quest_completed_info
    }

@router.post("/use-item/{user_id}/{item_id}", summary="Sử dụng vật phẩm từ túi đồ")
async def use_item(user_id: str, item_id: str):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE user_id = ? AND role = 'JUNIOR_ASSISTANT'", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy Nông dân nhí")

    points_to_add = 0
    message = ""

    if item_id == "other_magic_apple":
        points_to_add = 30
        message = "Bé đã ăn Táo đỏ thần kỳ và nhận được 30 EXP!"
    elif item_id == "other_water_can":
        points_to_add = 10
        message = "Bé đã dùng Bình tưới xối xả và nhận được 10 EXP!"
    else:
        points_to_add = 5
        message = f"Bé đã sử dụng vật phẩm thành công! Nhận được 5 EXP."

    new_points = user["total_points"] + points_to_add
    new_level = user["current_level"]
    level_up = False

    while new_points >= 100:
        new_level += 1
        new_points -= 100
        level_up = True

    conn.execute("UPDATE users SET total_points = ?, current_level = ? WHERE user_id = ?", (new_points, new_level, user_id))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": message,
        "points_added": points_to_add,
        "current_level": new_level,
        "current_points": new_points,
        "level_up": level_up
    }

# --- MMO: ECO-PETS & MARKETPLACE ---

@router.get("/marketplace", summary="Lấy thông tin thị trường nông sản")
async def get_marketplace():
    conn = get_db_connection()
    items = conn.execute("SELECT * FROM marketplace").fetchall()
    conn.close()
    return [dict(i) for i in items]

@router.get("/eco-pets/{user_id}", summary="Lấy danh sách thú cưng sinh thái của người chơi")
async def get_eco_pets(user_id: str):
    conn = get_db_connection()
    pets = conn.execute("SELECT * FROM eco_pets WHERE owner_id = ?", (user_id,)).fetchall()
    conn.close()
    return [dict(p) for p in pets]

@router.post("/eco-pets/feed/{pet_id}", summary="Cho thú cưng ăn bằng Eco-Karma")
async def feed_eco_pet(pet_id: str):
    conn = get_db_connection()
    pet = conn.execute("SELECT * FROM eco_pets WHERE pet_id = ?", (pet_id,)).fetchone()
    if not pet:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy thú cưng")
        
    user_id = pet["owner_id"]
    user = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
    
    if user["eco_karma"] < 10:
        conn.close()
        raise HTTPException(status_code=400, detail="Không đủ Eco Karma. Hãy trồng hữu cơ để tích lũy!")
        
    new_karma = user["eco_karma"] - 10
    new_loyalty = pet["loyalty"] + 5
    new_stage = pet["evolution_stage"]
    
    if new_loyalty >= 50 and pet["evolution_stage"] == 1:
        new_stage = 2
        
    conn.execute("UPDATE users SET eco_karma = ? WHERE user_id = ?", (new_karma, user_id))
    conn.execute("UPDATE eco_pets SET loyalty = ?, evolution_stage = ? WHERE pet_id = ?", (new_loyalty, new_stage, pet_id))
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Thú cưng đã được cho ăn! Tăng độ thân thiết.",
        "pet_id": pet_id,
        "new_loyalty": new_loyalty,
        "evolution_stage": new_stage
    }

