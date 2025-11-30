import sqlite3
import json

def migrate():
    print("Migrating database...")
    try:
        conn = sqlite3.connect('perspectiq.db')
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(messages)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'feedback' not in columns:
            print("Adding feedback column to messages table...")
            # SQLite doesn't support adding JSON column type directly in the same way as Postgres, 
            # but we can add it as TEXT or JSON (if supported version). 
            # SQLAlchemy JSON type usually maps to JSON or TEXT in SQLite.
            # Let's add it as TEXT which is safe for JSON storage in SQLite.
            cursor.execute("ALTER TABLE messages ADD COLUMN feedback JSON")
            conn.commit()
            print("Migration successful: feedback column added.")
        else:
            print("Column 'feedback' already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
