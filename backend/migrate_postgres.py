from db.database import engine
from sqlalchemy import text

def migrate_postgres():
    print("Migrating Postgres database...")
    with engine.connect() as conn:
        try:
            # Try to add the column
            conn.execute(text("ALTER TABLE messages ADD COLUMN feedback JSON"))
            conn.commit()
            print("Migration successful: feedback column added.")
        except Exception as e:
            print(f"Migration failed (maybe column exists?): {e}")

if __name__ == "__main__":
    migrate_postgres()
