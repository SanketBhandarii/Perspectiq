from db.database import init_db, engine, SQLALCHEMY_DATABASE_URL
from db.models import Base, User, Session, Message
import os

def manual_init():
    print(f"CWD: {os.getcwd()}")
    print(f"DB URL: {SQLALCHEMY_DATABASE_URL}")
    print("Initializing database manually...")
    # Ensure models are imported so Base knows about them
    # (Already imported above)
    
    print("Creating tables...")
    print(f"Registered tables: {Base.metadata.tables.keys()}")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

if __name__ == "__main__":
    manual_init()
