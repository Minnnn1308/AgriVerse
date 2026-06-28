import os
import sys
import bcrypt

sys.path.append(os.path.dirname(__file__))

default_hash = bcrypt.hashpw(b"123456", bcrypt.gensalt()).decode("utf-8")

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    print("Running v0.0.8.0 Auth Migration on PostgreSQL...")
    from db_adapter import get_db_connection
    conn = get_db_connection()
    # Note: _ensure_schema inside get_db_connection already added username & password_hash columns!
    # Seed default values:
    conn.execute("UPDATE users SET username = 'hai991', password_hash = ? WHERE user_id = 'F-991' AND (username IS NULL OR username = '')", (default_hash,))
    conn.execute("UPDATE users SET username = 'becarot', password_hash = ? WHERE user_id = 'J-007' AND (username IS NULL OR username = '')", (default_hash,))
    conn.commit()
    conn.close()
    print("Auth Migration on PostgreSQL completed!")
else:
    print("Running v0.0.8.0 Auth Migration on local SQLite...")
    import sqlite3
    DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'agtech.db')
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]

    if "username" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN username VARCHAR(100)")
    if "password_hash" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")

    cursor.execute("UPDATE users SET username = ? , password_hash = ? WHERE user_id = 'F-991' AND (username IS NULL OR username = '')", ('hai991', default_hash))
    cursor.execute("UPDATE users SET username = ? , password_hash = ? WHERE user_id = 'J-007' AND (username IS NULL OR username = '')", ('becarot', default_hash))
    conn.commit()
    conn.close()
    print("Auth Migration on local SQLite completed!")
