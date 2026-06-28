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
    user = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    return KidProfile(
        user_id=user["user_id"],
        full_name=user["full_name"],
        current_level=user["current_level"],
        total_points=(user.get("total_points") or user.get("total_exp") or 0),
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
    current_points = user.get("total_points", user.get("total_exp", 0))
    new_points = current_points + quest["reward_points"]
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

@router.get("/farm-detail/{farm_id}", summary="Alias endpoint cho farm detail")
async def get_farm_detail(farm_id: str):
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
async def perform_block_action(block_id: str, request: BlockActionRequest, user_id: Optional[str] = None):
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
    resolved_user_id = user_id or None
    
    if action == 'water':
        # Tưới nước
        new_moisture = 75.0
        new_temp = max(20.0, new_temp - 1.5)
        if new_status == 'THIRSTY':
            new_status = 'HEALTHY'
            
        # Kiểm tra hoàn thành nhiệm vụ "Siêu nhân tưới tiêu" (Q-02)
        kid_id = resolved_user_id or "J-007"
        quest_id = "Q-02"
        
        already_completed = conn.execute(
            "SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ?", (kid_id, quest_id)
        ).fetchone()
        
        if not already_completed:
            conn.execute(
                "INSERT INTO user_quests (user_id, quest_id, status, completed_at) VALUES (?, ?, 'COMPLETED', CURRENT_TIMESTAMP)",
                (kid_id, quest_id)
            )
            quest = conn.execute("SELECT * FROM quests WHERE quest_id = ?", (quest_id,)).fetchone()
            reward_points = quest["reward_points"] if quest else 70
            
            user = conn.execute("SELECT * FROM users WHERE user_id = ?", (kid_id,)).fetchone()
            if user:
                current_points = (user.get("total_points") or user.get("total_exp") or 0)
                new_points = current_points + reward_points
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
            
        # Kiểm tra hoàn thành nhiệm vụ "Bác sĩ cây trồng" (Q-01)
        kid_id = resolved_user_id or "J-007"
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
            
            user = conn.execute("SELECT * FROM users WHERE user_id = ?", (kid_id,)).fetchone()
            if user:
                current_points = (user.get("total_points") or user.get("total_exp") or 0)
                new_points = current_points + reward_points
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
    user = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

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

    current_points = (user.get("total_points") or user.get("total_exp") or 0)
    new_points = current_points + points_to_add
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
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
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

# --- ACHIEVEMENTS & LEADERBOARD & SEASONAL ---

@router.get("/achievements/{user_id}", summary="Lấy danh sách thành tựu")
async def get_achievements(user_id: str):
    conn = get_db_connection()
    # Mock data if table not fully ready
    try:
        achievements = conn.execute("SELECT * FROM user_achievements ua JOIN achievements a ON ua.achievement_id = a.achievement_id WHERE ua.user_id = ?", (user_id,)).fetchall()
        result = [dict(a) for a in achievements]
    except Exception:
        # Fallback mock data
        result = [
            {"achievement_id": "A01", "name": "Gieo Hạt Chăm Chỉ", "description": "Gieo 5 hạt giống", "emoji": "🌱", "progress_current": 3, "progress_target": 5, "is_claimed": False},
            {"achievement_id": "A02", "name": "Bác Sĩ Cây Trồng", "description": "Bắt 10 con sâu", "emoji": "🐛", "progress_current": 10, "progress_target": 10, "is_claimed": False},
            {"achievement_id": "A03", "name": "Nông Dân Tri Thức", "description": "Đọc 5 bài báo", "emoji": "📖", "progress_current": 5, "progress_target": 5, "is_claimed": True}
        ]
    finally:
        conn.close()
    return result

@router.post("/achievements/{user_id}/{achievement_id}/claim", summary="Nhận thưởng thành tựu")
async def claim_achievement(user_id: str, achievement_id: str):
    return {"status": "success", "message": "Đã nhận thưởng 50 EXP!", "exp_gained": 50}

@router.get("/leaderboard", summary="Bảng xếp hạng Nông dân nhí")
async def get_leaderboard():
    # Mock data for simplicity
    return [
        {"rank": 1, "name": "Bé Cà Rốt", "level": 15, "score": 2500, "is_current_user": True},
        {"rank": 2, "name": "Bé Su Hào", "level": 14, "score": 2350, "is_current_user": False},
        {"rank": 3, "name": "Bé Mầm Non", "level": 12, "score": 1900, "is_current_user": False},
        {"rank": 4, "name": "Bé Dâu Tây", "level": 10, "score": 1500, "is_current_user": False},
        {"rank": 5, "name": "Bé Bắp Cải", "level": 8, "score": 1200, "is_current_user": False}
    ]

@router.get("/leaderboard/eco-karma", summary="Bảng xếp hạng Eco Karma (Kết nối Doanh nghiệp)")
async def get_eco_karma_leaderboard():
    conn = get_db_connection()
    try:
        users = conn.execute("SELECT user_id, full_name, role, eco_karma FROM users WHERE eco_karma > 0 ORDER BY eco_karma DESC LIMIT 10").fetchall()
        return {"status": "success", "data": [dict(u) for u in users]}
    finally:
        conn.close()

@router.post("/exchange-eco-karma/{user_id}", summary="Đổi điểm Eco Karma lấy quà tặng từ Doanh nghiệp")
async def exchange_eco_karma(user_id: str, reward_id: str, cost: int):
    conn = get_db_connection()
    try:
        user = conn.execute("SELECT eco_karma FROM users WHERE user_id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
        if user['eco_karma'] < cost:
            raise HTTPException(status_code=400, detail="Không đủ điểm Eco Karma")
            
        new_karma = user['eco_karma'] - cost
        conn.execute("UPDATE users SET eco_karma = ? WHERE user_id = ?", (new_karma, user_id))
        conn.commit()
        return {"status": "success", "message": "Đổi quà thành công!", "remaining_karma": new_karma, "reward_id": reward_id}
    finally:
        conn.close()

@router.get("/seasonal-event", summary="Sự kiện mùa vụ hiện tại")
async def get_seasonal_event():
    import datetime
    month = datetime.datetime.now().month
    if 2 <= month <= 4:
        season, icon, desc, multiplier = "Mùa Xuân", "🌸", "Lễ hội gieo hạt đầu năm", 1.2
    elif 5 <= month <= 7:
        season, icon, desc, multiplier = "Mùa Hè", "☀️", "Chiến dịch diệt trừ sâu rầy", 1.0
    elif 8 <= month <= 10:
        season, icon, desc, multiplier = "Mùa Thu", "🍂", "Mùa vàng thu hoạch", 1.5
    else:
        season, icon, desc, multiplier = "Mùa Đông", "❄️", "Nghỉ ngơi ủ phân cải tạo đất", 0.8

    return {
        "season_name": season,
        "icon": icon,
        "description": desc,
        "bonus_multiplier": multiplier,
        "time_remaining": "15 ngày"
    }
