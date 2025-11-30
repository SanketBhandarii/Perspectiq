import sqlite3
import os

def debug():
    db_path = os.path.abspath('perspectiq.db')
    print(f"Connecting to: {db_path}")
    
    if not os.path.exists(db_path):
        print("Database file does not exist at this path!")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("Tables found:", tables)
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug()
