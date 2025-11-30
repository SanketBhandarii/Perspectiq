from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth.routes import router as auth_router
from chat.routes import router as chat_router
from db.database import init_db

app = FastAPI(title="Perspectiq", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    from config import GOOGLE_API_KEY
    print(f"DEBUG: API Key loaded: {bool(GOOGLE_API_KEY)}, Length: {len(GOOGLE_API_KEY) if GOOGLE_API_KEY else 0}")
    if GOOGLE_API_KEY:
        print(f"DEBUG: API Key start: {GOOGLE_API_KEY[:5]}...")
    else:
        print("DEBUG: API Key is MISSING or EMPTY")
    init_db()

app.include_router(auth_router)
app.include_router(chat_router)

@app.get("/")
def root():
    return {"message": "Perspectiq API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}