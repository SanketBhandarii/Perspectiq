from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import User, Session, Message
from datetime import datetime
import json

def get_user_by_username(username: str):
    db = SessionLocal()
    try:
        return db.query(User).filter(User.username == username).first()
    finally:
        db.close()

def create_user(username: str, role: str, age: int = None):
    db = SessionLocal()
    try:
        user = User(username=username, role=role, age=age)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()

def create_session(user_id: int, scenario: str, personas: list):
    db = SessionLocal()
    try:
        db_session = Session(
            user_id=user_id, 
            scenario=scenario, 
            personas=personas,
            created_at=datetime.utcnow(),
            is_active=True
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session.id
    finally:
        db.close()

def save_message(session_id: int, persona: str, message: str):
    db = SessionLocal()
    try:
        msg_type = 'human' if persona == 'User' else 'ai'
        db_msg = Message(
            session_id=session_id,
            type=msg_type,
            content=message,
            persona=persona if msg_type == 'ai' else None,
            timestamp=datetime.utcnow()
        )
        db.add(db_msg)
        db.commit()
    finally:
        db.close()

def get_session_messages(session_id: int):
    db = SessionLocal()
    try:
        messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.timestamp).all()
        return [
            {
                "role": "user" if msg.type == "human" else "assistant",
                "content": msg.content,
                "persona": msg.persona
            }
            for msg in messages
        ]
    finally:
        db.close()

def end_session(session_id: int):
    db = SessionLocal()
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        if session:
            session.is_active = False
            db.commit()
    finally:
        db.close()

def save_summary(session_id: int, summary: str, evaluation: str):
    db = SessionLocal()
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        if session:
            session.summary = summary
            session.evaluation = evaluation
            db.commit()
    finally:
        db.close()

def get_user_sessions(user_id: int):
    db = SessionLocal()
    try:
        sessions = db.query(Session).filter(Session.user_id == user_id).order_by(Session.created_at.desc()).all()
        results = []
        for s in sessions:
            results.append({
                "id": s.id,
                "scenario": s.scenario,
                "personas": s.personas,
                "created_at": s.created_at,
                "summary": s.summary,
                "message_count": len(s.messages)
            })
        return results
    finally:
        db.close()

def delete_session(session_id: int):
    db = SessionLocal()
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        if session:
            db.delete(session)
            db.commit()
            return True
        return False
    finally:
        db.close()