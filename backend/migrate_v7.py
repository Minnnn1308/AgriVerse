import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'agtech.db')
print("Running v0.0.7.0 DB Migration...")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Achievements table
cursor.execute("""
CREATE TABLE IF NOT EXISTS achievements (
    achievement_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    target_count INT DEFAULT 1
)
""")

# User achievements table
cursor.execute("""
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    achievement_id VARCHAR(50) NOT NULL,
    progress_current INT DEFAULT 0,
    progress_target INT NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id),
    UNIQUE(user_id, achievement_id)
)
""")

# Seasonal events
cursor.execute("""
CREATE TABLE IF NOT EXISTS seasonal_events (
    event_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    season VARCHAR(50),
    start_date DATE,
    end_date DATE,
    bonus_multiplier DECIMAL(3,1) DEFAULT 1.0,
    special_quests TEXT
)
""")

# Chat logs
cursor.execute("""
CREATE TABLE IF NOT EXISTS chat_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50),
    question TEXT,
    answer TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

# Check if users table needs total_points (it has total_exp, but some code uses total_points)
cursor.execute("PRAGMA table_info(users)")
columns = [col[1] for col in cursor.fetchall()]
if "total_points" not in columns:
    cursor.execute("ALTER TABLE users ADD COLUMN total_points INT DEFAULT 0")

# Insert mock achievements
achievements_data = [
    ('A01', 'Gieo Hạt Chăm Chỉ', 'Gieo 5 hạt giống', '🌱', 5),
    ('A02', 'Bác Sĩ Cây Trồng', 'Bắt 10 con sâu', '🐛', 10),
    ('A03', 'Nông Dân Tri Thức', 'Đọc 5 bài báo', '📖', 5)
]

for ach in achievements_data:
    cursor.execute("SELECT * FROM achievements WHERE achievement_id = ?", (ach[0],))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO achievements VALUES (?, ?, ?, ?, ?)", ach)

conn.commit()
conn.close()
print("Migration completed!")
