-- ==============================================================================
-- CƠ SỞ DỮ LIỆU (SQL SCHEMA) CHO HỆ THỐNG AGTECH-PLATFORM (Vũ Trụ Nông Nghiệp x100)
-- Tối ưu cho: PostgreSQL 14+ với TimescaleDB
-- ==============================================================================


-- 1. Bảng Doanh nghiệp / Hợp tác xã (Đơn vị bao tiêu sản phẩm)
CREATE TABLE cooperatives (
    coop_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    contact_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Người dùng (MMO Gamification)
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, 
    coop_id VARCHAR(50) REFERENCES cooperatives(coop_id),
    parent_id VARCHAR(50) REFERENCES users(user_id),
    username VARCHAR(100),
    password_hash VARCHAR(255),
    avatar_url TEXT DEFAULT '',
    current_level INT DEFAULT 1,     
    total_exp INT DEFAULT 0,
    total_points INT DEFAULT 0,
    eco_karma INT DEFAULT 0,         -- Điểm bảo vệ môi trường (Tích lũy từ việc trồng hữu cơ)
    wallet_balance INT DEFAULT 500,  -- Xu/Tiền ảo cho MMO Economy
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Nông trại / Thửa ruộng
CREATE TABLE farms (
    farm_id VARCHAR(50) PRIMARY KEY,
    owner_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    name VARCHAR(255) NOT NULL,
    area_size DECIMAL(10, 2),      
    crop_type VARCHAR(100),        
    location_gps VARCHAR(255),     
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.1 Bảng ô đất chi tiết (Deep Biology Simulation x100)
CREATE TABLE farm_blocks (
    block_id VARCHAR(50) PRIMARY KEY,
    farm_id VARCHAR(50) NOT NULL REFERENCES farms(farm_id),
    row_index INT NOT NULL,
    col_index INT NOT NULL,
    crop_status VARCHAR(100) DEFAULT 'HEALTHY', 
    soil_moisture DECIMAL(5, 2) DEFAULT 65.0,
    temperature DECIMAL(5, 2) DEFAULT 24.5,
    fertilizer_level DECIMAL(5, 2) DEFAULT 75.0,
    -- Deep Biology Data
    soil_n DECIMAL(5,2) DEFAULT 120.00,
    soil_p DECIMAL(5,2) DEFAULT 85.00,
    soil_k DECIMAL(5,2) DEFAULT 150.00,
    soil_ec DECIMAL(5,2) DEFAULT 1.60,
    soil_ph DECIMAL(3,1) DEFAULT 6.0,
    carbon_sequestered DECIMAL(8,2) DEFAULT 0.0, -- Lượng Carbon hấp thụ (kg CO2e)
    mycorrhizal_health INT DEFAULT 50            -- Sức khỏe mạng lưới nấm rễ (0-100)
);

-- 4. Bảng Nhiệm vụ Gamification
CREATE TABLE quests (
    quest_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reward_points INT DEFAULT 0,
    difficulty VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_quests (
    user_id VARCHAR(50) NOT NULL,
    quest_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, quest_id)
);

CREATE TABLE achievements (
    achievement_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    emoji VARCHAR(20) DEFAULT '🏆',
    reward_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_achievements (
    user_id VARCHAR(50) NOT NULL,
    achievement_id VARCHAR(50) NOT NULL,
    is_claimed INT DEFAULT 0,
    progress_current INT DEFAULT 0,
    progress_target INT DEFAULT 1,
    claimed_at TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

-- 5. Bảng Dữ liệu Cảm biến IoT (Sensor Logs - TimescaleDB)
CREATE TABLE sensor_logs (
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    farm_id VARCHAR(50) NOT NULL,
    block_id VARCHAR(50),
    temperature DECIMAL(5, 2),
    soil_moisture DECIMAL(5, 2),
    ec_level DECIMAL(5,2),
    ph_level DECIMAL(3,1)
);


-- 6. Bảng Thị Trường Tự Do (MMO Economy)
CREATE TABLE marketplace (
    item_id VARCHAR(50) PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- SEED, FERTILIZER, EQUIPMENT
    base_price INT NOT NULL,
    current_market_price INT NOT NULL, -- Thay đổi theo cung cầu MMO
    supply_volume INT DEFAULT 1000
);

-- 7. Bảng Thú Cưng Sinh Thái (Eco-Pet Evolution)
CREATE TABLE eco_pets (
    pet_id VARCHAR(50) PRIMARY KEY,
    owner_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    name VARCHAR(100),
    species VARCHAR(100), -- Rồng Đất, Tinh Linh Nước, Mộc Tinh
    evolution_stage INT DEFAULT 1, -- Tiến hóa (1 -> 3)
    hunger_level INT DEFAULT 100,
    loyalty INT DEFAULT 0
);

-- ==============================================================================
-- DỮ LIỆU MẪU (Mock Data)
-- ==============================================================================
INSERT INTO cooperatives (coop_id, name, region) VALUES 
('COOP_001', 'HTX Cà phê Trung Nguyên', 'Đắk Lắk'),
('COOP_002', 'Nestlé Vietnam', 'Đồng Nai');

INSERT INTO users (user_id, full_name, role, coop_id, eco_karma) VALUES 
('F-991', 'Nguyễn Văn Hải', 'FARMER', 'COOP_001', 120);

INSERT INTO users (user_id, full_name, role, parent_id, eco_karma, wallet_balance) VALUES 
('J-007', 'Bé Cà Rốt', 'JUNIOR_ASSISTANT', 'F-991', 350, 1500);

INSERT INTO farms (farm_id, owner_id, name, area_size, crop_type) VALUES 
('FARM_001', 'F-991', 'Vườn Cà phê Chú Hải', 2.5, 'Cà phê Robusta');

INSERT INTO marketplace (item_id, item_name, category, base_price, current_market_price) VALUES
('FERT_ORG_01', 'Phân Hữu Cơ Trichoderma', 'FERT', 50, 65),
('SEED_ROBUSTA', 'Hạt Giống Cà Phê Lai', 'SEED', 100, 95);

INSERT INTO quests (quest_id, title, description, reward_points, difficulty) VALUES
('Q-01', 'Bác sĩ cây trồng', 'Phòng trị sâu bệnh cho một ô đất đang bị nhiễm', 40, 'MEDIUM'),
('Q-02', 'Siêu nhân tưới tiêu', 'Tưới nước cho một ô đất khô hạn và giữ nước ổn định', 70, 'MEDIUM'),
('Q-03', 'Bón phân đúng lúc', 'Bổ sung dinh dưỡng cho ô đất thiếu NPK', 55, 'EASY'),
('Q-04', 'Vệ sinh vườn', 'Dọn vệ sinh và kiểm tra sức khỏe tổng thể', 35, 'EASY'),
('Q-05', 'Thu hoạch mùa', 'Đưa một ô đất đến trạng thái sẵn thu hoạch', 90, 'HARD');

INSERT INTO achievements (achievement_id, name, description, emoji, reward_points) VALUES
('ACH-01', 'Người chăm vườn', 'Cập nhật dữ liệu cho 5 ô đất', '🌱', 25),
('ACH-02', 'Bảo vệ cây xanh', 'Hoàn thành 3 nhiệm vụ tưới và phòng sâu', '🛡️', 40),
('ACH-03', 'Nông dân bền vững', 'Tích lũy 100 điểm kinh nghiệm', '🌍', 60);

INSERT INTO eco_pets (pet_id, owner_id, name, species) VALUES
('PET_001', 'J-007', 'Chồi Non', 'Mộc Tinh');
