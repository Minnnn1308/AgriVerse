from fastapi import APIRouter
from pydantic import BaseModel
import re

router = APIRouter(prefix="/ai", tags=["AI Chatbot (Rule-Based)"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    confidence: float
    topics: list[str]

# Dữ liệu kiến thức nông nghiệp cơ bản (cho nông dân)
KNOWLEDGE_BASE = {
    "sâu bệnh|rầy nâu|sâu cuốn lá": {
        "answer": "Đối với rầy nâu hoặc sâu cuốn lá, bà con nên kiểm tra mật độ sâu trước. Nếu ít, có thể dùng các biện pháp sinh học như nuôi thả thiên địch (ong mắt đỏ, nhện lùn). Nếu mật độ cao, sử dụng các loại thuốc bảo vệ thực vật đặc trị nhưng nhớ tuân thủ nguyên tắc '4 Đúng' (Đúng thuốc, Đúng liều, Đúng lúc, Đúng cách).",
        "topics": ["sâu bệnh", "phòng trừ"]
    },
    "phân bón|bón phân|hữu cơ|hóa học": {
        "answer": "Để bón phân hiệu quả, bà con nên kết hợp phân hữu cơ và vô cơ. Phân hữu cơ (phân chuồng ủ hoai mục, phân xanh) giúp cải tạo đất bền vững, giữ ẩm tốt. Phân vô cơ (NPK, Urê) dùng để bón thúc khi cây cần dinh dưỡng nhanh. Tuyệt đối không lạm dụng phân hóa học vì sẽ làm chai cứng đất.",
        "topics": ["phân bón", "cải tạo đất"]
    },
    "đất chua|cải tạo đất|vôi": {
        "answer": "Đất bị chua (pH thấp) thường do lạm dụng phân vô cơ nhiều năm. Bà con nên bón lót bằng vôi bột (khoảng 30-50kg/sào) trước khi gieo trồng để khử chua. Ngoài ra, tăng cường bón phân hữu cơ hoai mục và sử dụng chế phẩm vi sinh (Trichoderma) để phục hồi hệ vi sinh vật trong đất.",
        "topics": ["cải tạo đất", "đất chua"]
    },
    "tưới nước|hạn hán|thiếu nước": {
        "answer": "Vào mùa khô, bà con nên áp dụng phương pháp tưới tiết kiệm (tưới nhỏ giọt hoặc phun mưa tại gốc) kết hợp tủ gốc bằng rơm rạ, cỏ khô để giữ ẩm. Không nên tưới quá nhiều vào buổi trưa nắng gắt mà nên tưới vào sáng sớm hoặc chiều mát.",
        "topics": ["tưới tiêu", "hạn hán"]
    },
    "thời tiết|mưa|nắng": {
        "answer": "Bà con có thể xem dự báo thời tiết chi tiết tại mục 'Thời tiết' trên ứng dụng. Lưu ý: Không phun thuốc trừ sâu khi trời sắp mưa to (thuốc sẽ bị rửa trôi) hoặc khi nắng gắt (thuốc bay hơi nhanh và dễ làm cháy lá).",
        "topics": ["thời tiết", "chăm sóc"]
    },
    "năng suất|thu hoạch": {
        "answer": "Để đạt năng suất cao, ngoài giống tốt, bà con cần theo dõi sát sao lịch thời vụ, bón phân cân đối và phòng trừ sâu bệnh kịp thời. Thu hoạch đúng lúc khi nông sản đạt độ chín chuẩn sẽ đảm bảo chất lượng và giá bán tốt nhất.",
        "topics": ["thu hoạch", "năng suất"]
    },
    "hello|chào|xin chào": {
        "answer": "Dạ cháu chào bà con ạ! Cháu là Trợ lý Ảo Nông Nghiệp. Bà con cần hỏi kinh nghiệm gì về trồng trọt, bón phân hay sâu bệnh cứ nhắn cháu nhé!",
        "topics": ["chào hỏi"]
    }
}

DEFAULT_ANSWER = "Dạ, vấn đề này cháu chưa rõ lắm. Bà con có thể hỏi về các chủ đề phổ biến như: cách bón phân, phòng trừ sâu bệnh, cải tạo đất chua, hoặc kỹ thuật tưới tiêu ạ."

@router.post("/chat", summary="Chat với Trợ lý Nông Nghiệp Ảo", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    user_msg = request.message.lower().strip()
    
    best_match_answer = DEFAULT_ANSWER
    topics = []
    confidence = 0.0
    
    for pattern, data in KNOWLEDGE_BASE.items():
        # Kiểm tra nếu bất kỳ từ khóa nào trong pattern xuất hiện trong câu hỏi
        keywords = pattern.split('|')
        if any(re.search(rf"\b{kw}\b", user_msg) or kw in user_msg for kw in keywords):
            best_match_answer = data["answer"]
            topics = data["topics"]
            confidence = 0.85  # Tỉ lệ tự tin giả lập
            break
            
    return ChatResponse(
        answer=best_match_answer,
        confidence=confidence,
        topics=topics
    )
