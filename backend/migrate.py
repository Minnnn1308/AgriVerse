import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'agtech.db')
print("Connecting to database...")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get existing columns of farm_blocks
cursor.execute("PRAGMA table_info(farm_blocks)")
columns = [col[1] for col in cursor.fetchall()]

# Columns to add
new_cols = [
    ("soil_n", "DECIMAL(5,2) DEFAULT 120.00"),
    ("soil_p", "DECIMAL(5,2) DEFAULT 85.00"),
    ("soil_k", "DECIMAL(5,2) DEFAULT 150.00"),
    ("soil_ec", "DECIMAL(5,2) DEFAULT 1.60"),
    ("soil_ph", "DECIMAL(3,1) DEFAULT 6.0"),
    ("heavy_metals", "VARCHAR(50) DEFAULT 'AN_TOAN'"),
    ("crop_history", "TEXT DEFAULT 'Cà phê Robusta'"),
    ("last_fertilized_at", "TIMESTAMP"),
    ("moisture_decay_rate", "DECIMAL(3,2) DEFAULT 0.05")
]

for col_name, col_type in new_cols:
    if col_name not in columns:
        print(f"Adding column {col_name} to farm_blocks")
        cursor.execute(f"ALTER TABLE farm_blocks ADD COLUMN {col_name} {col_type}")

# Create user_achievements table
cursor.execute("""
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,
    progress_current INT DEFAULT 0,
    progress_target INT NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(user_id, achievement_id)
)
""")

# Create user_pets table
cursor.execute("""
CREATE TABLE IF NOT EXISTS user_pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    pet_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(user_id, pet_id)
)
""")

# Insert initial achievements if not exists
achievements = [
    ('J-007', 'gieo_hat_cham_chi', 0, 5),
    ('J-007', 'bac_si_thuc_vat', 0, 10),
    ('J-007', 'nong_dan_tri_thuc', 0, 15),
    ('J-007', 'vua_mua_sam', 0, 5)
]

for user_id, ach_id, current, target in achievements:
    cursor.execute("SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?", (user_id, ach_id))
    if not cursor.fetchone():
        print(f"Inserting achievement {ach_id} for user {user_id}")
        cursor.execute("""
        INSERT INTO user_achievements (user_id, achievement_id, progress_current, progress_target)
        VALUES (?, ?, ?, ?)
        """, (user_id, ach_id, current, target))

conn.commit()
conn.close()
print("Migration completed successfully!")
