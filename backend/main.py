from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth.routes import router as auth_router
from chat.routes import router as chat_router
from db.database import init_db

app = FastAPI(title="Perspectiq", version="1.0.0")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://perspecti.vercel.app",
    "https://perspecti.vercel.app/",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

app.include_router(auth_router)
app.include_router(chat_router)

@app.get("/")
def root():
    return {"message": "Perspectiq API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}