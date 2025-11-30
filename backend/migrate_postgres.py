from db.database import engine
from sqlalchemy import text

def migrate_postgres():
    print("Migrating Postgres database...")
    with engine.connect() as conn:
        try:
            # Try to add the column
            # Try to add the column
            conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS feedback JSON"))
            
            # Add new session columns
            conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_role VARCHAR"))
            conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS partner_role VARCHAR"))
            conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_personality TEXT"))
            conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS partner_personality TEXT"))
            
            conn.commit()
            print("Migration successful: Columns added.")
        except Exception as e:
            print(f"Migration failed (maybe column exists?): {e}")

if __name__ == "__main__":
    migrate_postgres()
