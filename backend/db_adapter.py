import os
import psycopg2
from psycopg2.extras import DictCursor
import sqlite3

DATABASE_URL = os.environ.get("DATABASE_URL")
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'agtech.db')

class MockCursor:
    def __init__(self, pg_cursor):
        self.pg_cursor = pg_cursor

    def fetchone(self):
        row = self.pg_cursor.fetchone()
        if row is not None:
            return dict(row)
        return None

    def fetchall(self):
        rows = self.pg_cursor.fetchall()
        return [dict(row) for row in rows]

class SQLiteMockCursor:
    def __init__(self, sqlite_cursor):
        self.sqlite_cursor = sqlite_cursor

    def fetchone(self):
        row = self.sqlite_cursor.fetchone()
        if row is not None:
            return dict(row)
        return None

    def fetchall(self):
        rows = self.sqlite_cursor.fetchall()
        return [dict(row) for row in rows]

class DBAdapter:
    conn: sqlite3.Connection | psycopg2.extensions.connection

    def __init__(self, db_url=None):
        url = db_url or DATABASE_URL
        if url:
            self.mode = "postgres"
            self.conn = psycopg2.connect(url)
            self.conn.autocommit = False
        else:
            self.mode = "sqlite"
            sqlite_conn = sqlite3.connect(DB_PATH)
            sqlite_conn.row_factory = sqlite3.Row
            self.conn = sqlite_conn

    def execute(self, query, params=None):
        if self.mode == "postgres":
            # Convert sqlite ? to postgres %s
            pg_query = query.replace("?", "%s")
            cur = self.conn.cursor(cursor_factory=DictCursor)
            if params is None:
                cur.execute(pg_query)
            else:
                cur.execute(pg_query, params)
            return MockCursor(cur)
        else:
            cur = self.conn.cursor()
            if params is None:
                cur.execute(query)
            else:
                cur.execute(query, params)
            return SQLiteMockCursor(cur)

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()

def _ensure_schema(conn):
    """Migration nhẹ cho cả PostgreSQL và SQLite — thêm cột mới nếu chưa có."""
    if conn.mode == "postgres":
        cur = conn.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
        cols = {r['column_name'] for r in cur.fetchall()}
        if cols and "avatar_url" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''")
            conn.commit()
        if cols and "username" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN username VARCHAR(100)")
            conn.commit()
        if cols and "password_hash" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
            conn.commit()
        if cols and "total_points" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN total_points INT DEFAULT 0")
            conn.commit()

        cur = conn.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'farms'")
        farm_cols = {r['column_name'] for r in cur.fetchall()}
        if farm_cols and "location_gps" not in farm_cols:
            conn.execute("ALTER TABLE farms ADD COLUMN location_gps TEXT DEFAULT ''")
            conn.commit()
    else:
        # SQLite migrations
        cur = conn.execute("PRAGMA table_info(users)")
        cols = {r['name'] for r in cur.fetchall()}
        if cols and "total_exp" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN total_exp INT DEFAULT 0")
            conn.commit()
        if cols and "total_points" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN total_points INT DEFAULT 0")
            conn.commit()
        if cols and "eco_karma" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN eco_karma INT DEFAULT 0")
            conn.commit()
        if cols and "wallet_balance" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN wallet_balance INT DEFAULT 500")
            conn.commit()
        if cols and "username" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN username VARCHAR(100)")
            conn.commit()
        if cols and "password_hash" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
            conn.commit()
        if cols and "avatar_url" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''")
            conn.commit()

        conn.execute("""
            CREATE TABLE IF NOT EXISTS quests (
                quest_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                reward_points INTEGER DEFAULT 0,
                difficulty TEXT DEFAULT 'MEDIUM',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_quests (
                user_id TEXT NOT NULL,
                quest_id TEXT NOT NULL,
                status TEXT DEFAULT 'COMPLETED',
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, quest_id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS achievements (
                achievement_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                emoji TEXT DEFAULT '🏆',
                reward_points INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_achievements (
                user_id TEXT NOT NULL,
                achievement_id TEXT NOT NULL,
                is_claimed INTEGER DEFAULT 0,
                progress_current INTEGER DEFAULT 0,
                progress_target INTEGER DEFAULT 1,
                claimed_at TIMESTAMP,
                PRIMARY KEY (user_id, achievement_id)
            )
        """)
        conn.commit()

        conn.execute("INSERT OR IGNORE INTO quests (quest_id, title, description, reward_points, difficulty) VALUES (?, ?, ?, ?, ?)", ("Q-01", "Bác sĩ cây trồng", "Phòng trị sâu bệnh cho một ô đất đang bị nhiễm", 40, "MEDIUM"))
        conn.execute("INSERT OR IGNORE INTO quests (quest_id, title, description, reward_points, difficulty) VALUES (?, ?, ?, ?, ?)", ("Q-02", "Siêu nhân tưới tiêu", "Tưới nước cho một ô đất khô hạn và giữ nước ổn định", 70, "MEDIUM"))
        conn.execute("INSERT OR IGNORE INTO quests (quest_id, title, description, reward_points, difficulty) VALUES (?, ?, ?, ?, ?)", ("Q-03", "Bón phân đúng lúc", "Bổ sung dinh dưỡng cho ô đất thiếu NPK", 55, "EASY"))
        conn.execute("INSERT OR IGNORE INTO quests (quest_id, title, description, reward_points, difficulty) VALUES (?, ?, ?, ?, ?)", ("Q-04", "Vệ sinh vườn", "Dọn vệ sinh và kiểm tra sức khỏe tổng thể", 35, "EASY"))
        conn.execute("INSERT OR IGNORE INTO quests (quest_id, title, description, reward_points, difficulty) VALUES (?, ?, ?, ?, ?)", ("Q-05", "Thu hoạch mùa", "Đưa một ô đất đến trạng thái sẵn thu hoạch", 90, "HARD"))
        conn.execute("INSERT OR IGNORE INTO achievements (achievement_id, name, description, emoji, reward_points) VALUES (?, ?, ?, ?, ?)", ("ACH-01", "Người chăm vườn", "Cập nhật dữ liệu cho 5 ô đất", "🌱", 25))
        conn.execute("INSERT OR IGNORE INTO achievements (achievement_id, name, description, emoji, reward_points) VALUES (?, ?, ?, ?, ?)", ("ACH-02", "Bảo vệ cây xanh", "Hoàn thành 3 nhiệm vụ tưới và phòng sâu", "🛡️", 40))
        conn.execute("INSERT OR IGNORE INTO achievements (achievement_id, name, description, emoji, reward_points) VALUES (?, ?, ?, ?, ?)", ("ACH-03", "Nông dân bền vững", "Tích lũy 100 điểm kinh nghiệm", "🌍", 60))
        conn.commit()

        # Seed default credentials for legacy demo users if they have no username yet
        import bcrypt
        legacy_users = conn.execute("SELECT user_id FROM users WHERE username IS NULL OR username = ''").fetchall()
        if legacy_users:
            default_hash = bcrypt.hashpw("123456".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            _user_map = {"F-991": "hai991", "J-007": "becarot"}
            for u in legacy_users:
                uid = u["user_id"]
                uname = _user_map.get(uid, uid.lower().replace("-", ""))
                conn.execute("UPDATE users SET username = ?, password_hash = ? WHERE user_id = ?",
                             (uname, default_hash, uid))
            conn.commit()

        # farm_blocks migrations
        cur = conn.execute("PRAGMA table_info(farm_blocks)")
        fb_cols = {r['name'] for r in cur.fetchall()}
        if fb_cols and "fertilizer_level" not in fb_cols:
            conn.execute("ALTER TABLE farm_blocks ADD COLUMN fertilizer_level DECIMAL(5,2) DEFAULT 75.0")
            conn.commit()

        # farms migrations
        cur = conn.execute("PRAGMA table_info(farms)")
        farm_cols = {r['name'] for r in cur.fetchall()}
        if farm_cols and "location_gps" not in farm_cols:
            conn.execute("ALTER TABLE farms ADD COLUMN location_gps TEXT DEFAULT ''")
            conn.commit()

def get_db_connection():
    conn = DBAdapter()
    _ensure_schema(conn)
    return conn
