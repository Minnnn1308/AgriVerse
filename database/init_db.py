import sqlite3
import os

DB_PATH = 'agtech.db'
SCHEMA_PATH = 'schema.sql'

def init_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed old {DB_PATH}")

    # Read schema
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        schema = f.read()

    # SQLite specific conversions for the standard schema
    schema = schema.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Execute script
    try:
        cursor.executescript(schema)
        conn.commit()
        
        # Seed 50 blocks for FARM_001 (5 rows, 10 columns)
        import random
        random.seed(42)
        statuses = ['HEALTHY', 'THIRSTY', 'PEST', 'READY_TO_HARVEST']
        status_weights = [0.6, 0.25, 0.1, 0.05]
        
        blocks_data = []
        for r in range(5):
            for c in range(10):
                block_id = f"B_001_{chr(65+r)}{c+1}" # B_001_A1, B_001_A2, etc.
                status = random.choices(statuses, weights=status_weights)[0]
                
                # Base stats based on status
                if status == 'HEALTHY':
                    moisture = round(random.uniform(60.0, 75.0), 1)
                    temp = round(random.uniform(23.0, 26.0), 1)
                    fert = round(random.uniform(70.0, 90.0), 1)
                elif status == 'THIRSTY':
                    moisture = round(random.uniform(25.0, 45.0), 1)
                    temp = round(random.uniform(26.5, 29.5), 1)
                    fert = round(random.uniform(60.0, 80.0), 1)
                elif status == 'PEST':
                    moisture = round(random.uniform(50.0, 65.0), 1)
                    temp = round(random.uniform(24.0, 27.0), 1)
                    fert = round(random.uniform(40.0, 60.0), 1)
                else: # READY_TO_HARVEST
                    moisture = round(random.uniform(55.0, 65.0), 1)
                    temp = round(random.uniform(22.0, 25.0), 1)
                    fert = round(random.uniform(50.0, 70.0), 1)
                
                blocks_data.append((block_id, 'FARM_001', r, c, status, moisture, temp, fert))
        
        cursor.executemany("""
            INSERT INTO farm_blocks (block_id, farm_id, row_index, col_index, crop_status, soil_moisture, temperature, fertilizer_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, blocks_data)
        conn.commit()
        
        print(f"Successfully initialized {DB_PATH} and seeded 50 blocks.")
    except Exception as e:
        print(f"Error initializing db: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
