from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from gamification import router as gamification_router
from weather import router as weather_router
import uvicorn
import asyncio
import json
from typing import List

app = FastAPI(
    title="Agtech-Platform API - Scale x100",
    description="Hệ thống quản lý liên minh nông hộ ứng dụng Game hóa (Gamification) & AI (Bản 0.0.6.0)",
    version="0.0.6.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500", 
        "http://localhost:5500", 
        "https://agriverse-vn-bl.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WEBSOCKET CONNECTION MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error sending message: {e}")

manager = ConnectionManager()
# ------------------------------------

@app.get("/", summary="Kiểm tra trạng thái máy chủ")
async def root():
    return JSONResponse(
        content={
            "status": "success",
            "message": "Agtech-Platform API x100 đã sẵn sàng!",
            "architecture": "FastAPI + WebSockets + PostgreSQL (Ready)",
            "version": "0.0.6.0"
        }
    )

@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "healthy"}

@app.websocket("/ws/farm/{farm_id}")
async def websocket_endpoint(websocket: WebSocket, farm_id: str):
    """
    Endpoint WebSocket để truyền dữ liệu thời gian thực cho nông trại 3D.
    Cho phép nhận tín hiệu IoT và đẩy dữ liệu sinh học sâu trực tiếp tới Frontend.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Nhận lệnh từ Frontend (Ví dụ: Yêu cầu bón phân, tưới nước)
            data = await websocket.receive_text()
            print(f"Received from {farm_id}: {data}")
            
            # Xử lý logic tại đây (Sẽ kết nối với AI Model sau)
            response_data = {
                "event": "action_ack",
                "farm_id": farm_id,
                "message": f"Server received action: {data}",
                "status": "processing"
            }
            await manager.broadcast(json.dumps(response_data))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Client {farm_id} disconnected")

app.include_router(gamification_router)
app.include_router(weather_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
