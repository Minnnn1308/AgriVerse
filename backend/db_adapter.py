import os
import psycopg2
from psycopg2.extras import DictCursor

DATABASE_URL = os.environ.get("DATABASE_URL")

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

class DBAdapter:
    def __init__(self, db_url=None):
        url = db_url or DATABASE_URL
        if not url:
            raise ValueError("DATABASE_URL is not set")
        self.conn = psycopg2.connect(url)
        self.conn.autocommit = False

    def execute(self, query, params=None):
        # Convert sqlite ? to postgres %s
        pg_query = query.replace("?", "%s")
        cur = self.conn.cursor(cursor_factory=DictCursor)
        if params is None:
            cur.execute(pg_query)
        else:
            cur.execute(pg_query, params)
        return MockCursor(cur)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

def _ensure_schema(conn):
    """Migration nhẹ cho PostgreSQL — thêm cột mới nếu chưa có."""
    cur = conn.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
    cols = {r['column_name'] for r in cur.fetchall()}
    if cols and "avatar_url" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''")
        conn.commit()
        
    cur = conn.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'farms'")
    farm_cols = {r['column_name'] for r in cur.fetchall()}
    if farm_cols and "location_gps" not in farm_cols:
        conn.execute("ALTER TABLE farms ADD COLUMN location_gps TEXT DEFAULT ''")
        conn.commit()

def get_db_connection():
    conn = DBAdapter()
    _ensure_schema(conn)
    return conn
