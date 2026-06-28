# Siêu dự án: AgriVerse (Agtech-Platform) v0.0.8.0
**Đại cách mạng Nông nghiệp số dành cho Nông dân Việt Nam**

AgriVerse là một nền tảng quản lý nông nghiệp ứng dụng **Gamification (Game hóa)**, **Trí tuệ Nhân tạo (AI)**, và kiến trúc **OOP nâng cao**, được thiết kế đặc biệt cho thị trường Việt Nam (phù hợp với nông dân quy mô nhỏ, ít tiếp cận công nghệ cao, nhà kính).

---

## 🚀 Các tính năng nổi bật trong phiên bản v0.0.8.0

### 1. Kiến trúc Java OOP cốt lõi (Core Domain)
Áp dụng thuần thục các Design Patterns chuyên nghiệp:
- **Strategy Pattern**: Quản lý chiến lược bón phân (Hữu cơ, Hóa học) linh hoạt, dễ dàng chuyển đổi phương pháp canh tác.
- **Command Pattern**: Hỗ trợ tính năng "Hoàn tác" (Undo) khi nông dân vô tình bấm nhầm thao tác chăm sóc, giảm thiểu rủi ro dữ liệu sai.
- **Singleton Pattern**: Quản lý nhật ký hệ thống (GameLogger) đồng nhất, tránh phân mảnh log khi scale hệ thống.
- **Tính Đa hình (Polymorphism)**: Chế độ hiển thị (Pro Mode / Game Mode) tự động tương thích theo từng loại tài khoản (Nông dân / Trợ lý nhí).

### 2. Backend & AI (FastAPI + SQLite/PostgreSQL)
- **AI Chatbot (Rule-based)**: Trợ lý ảo nông nghiệp giải đáp nhanh kỹ thuật canh tác, phòng trừ sâu bệnh, cải tạo đất chua. Hoạt động ổn định không cần API bên ngoài.
- **Hệ thống Gamification mở rộng**: Tích hợp Bảng xếp hạng (Leaderboard), Sự kiện Mùa vụ (Seasonal Events), và Hệ thống Thành tựu (Achievements).
- **Hệ thống Thú cưng Sinh thái (Eco-Pet)**: Nâng cấp trải nghiệm MMO, dùng "Eco Karma" kiếm được từ việc trồng trọt hữu cơ để nuôi thú cưng.

### 3. Frontend / PWA (Vanilla JS + CSS Hiện đại)
- **Thiết kế Mobile-first & PWA**: Ứng dụng hỗ trợ cài đặt thẳng lên màn hình chính điện thoại nông dân (Installable PWA) và hoạt động mượt mà (Offline-first / Service Worker).
- **Chế độ Tối (Dark Mode) & Particle Animations**: Bảo vệ mắt cho người dùng khi làm việc đêm, tăng trải nghiệm thị giác.
- **Biểu đồ Radar (Chart.js)**: Trực quan hóa dữ liệu dinh dưỡng đất (NPK, độ ẩm, pH).
- **Báo cáo Lợi nhuận (Profit Report)**: Đưa ra cái nhìn rõ nét về chi phí, doanh thu, lợi nhuận thực tế sau quá trình thí nghiệm (Sandbox).

---

## 🛠 Hướng dẫn Khởi chạy Hệ thống

### 1. Backend (API & Database)
```bash
cd backend
python init_db.py       # (Lần đầu) Khởi tạo Database
python migrate_v7.py    # (Cập nhật) Chạy migration v0.0.7.0
python main.py          # Chạy server FastAPI tại http://localhost:8000
```

### 2. Frontend (PWA Client)
Sử dụng Live Server hoặc mở trực tiếp file `index.html` trong thư mục `frontend/`. 
Do đã tích hợp **Service Worker**, ứng dụng có thể lưu cache và hoạt động ngoại tuyến sau lần tải đầu tiên.

### 3. Module Java OOP (Giảng dạy / Lõi Engine)
Sử dụng IDE (IntelliJ / Eclipse) hoặc chạy thông qua Terminal:
```bash
cd java_oop_module/src
javac GamifiedFarmApp.java
java GamifiedFarmApp
```

---
*Tối ưu hóa dành cho Nông dân Việt - Linh hoạt, Trực quan, Dễ sử dụng!*
