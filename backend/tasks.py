from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any
from db_adapter import get_db_connection
import uuid
import datetime
import json

router = APIRouter(prefix="/tasks", tags=["Tasks & Data Entry"])

@router.get("/", summary="Lấy danh sách nhiệm vụ cần làm")
def get_tasks(farm_id: str, status: str = "SUGGESTED"):
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT * FROM tasks WHERE farm_id = ? AND status = ?", (farm_id, status))
        tasks = cur.fetchall()
        return {"status": "success", "data": tasks}
    finally:
        conn.close()

@router.post("/", summary="Tạo nhiệm vụ mới (Bởi Hệ thống hoặc Trợ lý nhí)")
def create_task(payload: Dict[str, Any] = Body(...)):
    farm_id = payload.get("farm_id")
    zone_id = payload.get("zone_id")
    task_type = payload.get("type")
    recommended_value = payload.get("recommended_value")
    unit = payload.get("unit")
    is_recurring = payload.get("is_recurring", 0)
    cron_schedule = payload.get("cron_schedule", "")
    created_by = payload.get("created_by")

    if not farm_id or not task_type:
        raise HTTPException(status_code=400, detail="Missing required fields")

    task_id = "TASK_" + str(uuid.uuid4())[:8]
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO tasks (task_id, farm_id, zone_id, type, recommended_value, unit, is_recurring, cron_schedule, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (task_id, farm_id, zone_id, task_type, recommended_value, unit, is_recurring, cron_schedule, created_by))
        conn.commit()
        return {"status": "success", "task_id": task_id, "message": "Task created successfully"}
    finally:
        conn.close()

@router.post("/{task_id}/complete", summary="Hoàn thành nhiệm vụ")
def complete_task(task_id: str):
    conn = get_db_connection()
    try:
        # Check task
        cur = conn.execute("SELECT * FROM tasks WHERE task_id = ?", (task_id,))
        task = cur.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task['status'] == 'COMPLETED':
            return {"status": "success", "message": "Task already completed"}

        # Mark task as completed
        conn.execute("UPDATE tasks SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE task_id = ?", (task_id,))
        
        # Reward Kid (created_by) if applicable
        created_by = task['created_by']
        eco_karma_reward = 10 # Default
        if created_by:
            cur = conn.execute("SELECT role FROM users WHERE user_id = ?", (created_by,))
            user = cur.fetchone()
            if user and user['role'] == 'JUNIOR_ASSISTANT':
                conn.execute("UPDATE users SET eco_karma = eco_karma + ? WHERE user_id = ?", (eco_karma_reward, created_by))
        
        # Create Data Entry Queue
        queue_id = "DEQ_" + str(uuid.uuid4())[:8]
        # Determine metrics based on task type
        metrics = ["soil_moisture"]
        if task['type'] == 'FERTILIZE':
            metrics = ["soil_ph", "fertilizer_level"]
        
        conn.execute("""
            INSERT INTO data_entry_queue (queue_id, task_id, farm_id, required_metrics)
            VALUES (?, ?, ?, ?)
        """, (queue_id, task_id, task['farm_id'], json.dumps(metrics)))

        conn.commit()
        return {
            "status": "success", 
            "message": "Task completed. Added to Data Entry Queue.",
            "eco_karma_awarded": eco_karma_reward if created_by else 0
        }
    finally:
        conn.close()

@router.get("/data-entry", summary="Lấy danh sách sổ chờ nhập")
def get_data_entry_queue(farm_id: str):
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT * FROM data_entry_queue WHERE farm_id = ? AND status = 'PENDING'", (farm_id,))
        queues = cur.fetchall()
        # Parse JSON required_metrics for frontend
        for q in queues:
            try:
                if isinstance(q, dict):
                    q['required_metrics'] = json.loads(q['required_metrics'])
                else: # sqlite.Row
                    q_dict = dict(q)
                    q_dict['required_metrics'] = json.loads(q_dict['required_metrics'])
                    # Needs mapping back or just return list of dicts
                    # Fetchall above returns dicts due to MockCursor logic in db_adapter
            except:
                pass
        return {"status": "success", "data": queues}
    finally:
        conn.close()

from weather import _fetch_open_meteo

@router.post("/data-entry/{queue_id}/submit", summary="Nộp số liệu (Cuối ngày)")
async def submit_data_entry(queue_id: str, payload: Dict[str, Any] = Body(...)):
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT * FROM data_entry_queue WHERE queue_id = ?", (queue_id,))
        queue = cur.fetchone()
        if not queue:
            raise HTTPException(status_code=404, detail="Queue not found")
        
        # Lấy tọa độ thửa ruộng để tự động điền thời tiết
        farm_id = queue['farm_id']
        farm = conn.execute("SELECT location_gps FROM farms WHERE farm_id = ?", (farm_id,)).fetchone()
        
        weather_auto_filled = False
        if farm and farm['location_gps']:
            gps_parts = farm['location_gps'].split('|')[0].split(',')
            if len(gps_parts) >= 2:
                lat, lng = float(gps_parts[0]), float(gps_parts[1])
                try:
                    weather_data = await _fetch_open_meteo(lat, lng)
                    # Giả lập auto-fill
                    payload['auto_temperature'] = weather_data['current']['temperature_2m']
                    payload['auto_wind_speed'] = weather_data['current']['wind_speed_10m']
                    weather_auto_filled = True
                except Exception as e:
                    pass
        
        # In a real app, we would use Spread Simulation here to update farm_blocks
        
        conn.execute("UPDATE data_entry_queue SET status = 'SUBMITTED', submitted_at = CURRENT_TIMESTAMP WHERE queue_id = ?", (queue_id,))
        conn.commit()
        return {
            "status": "success", 
            "message": "Data submitted successfully", 
            "weather_auto_filled": weather_auto_filled,
            "final_payload": payload
        }
    finally:
        conn.close()
