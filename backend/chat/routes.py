from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from auth.routes import get_current_user
from db.crud import (create_session, save_message, get_session_messages, 
                     end_session, save_summary, get_user_sessions, delete_session)
from chat.memory import (add_user_message, add_ai_message, get_conversation_history, 
                         update_context, clear_session, get_context)
from chat.agent import generate_persona_response, generate_coordinator_decision, generate_evaluation, generate_summary, generate_instant_feedback
from personas.registry import get_all_personas

router = APIRouter(prefix="/chat", tags=["chat"])

class StartSessionRequest(BaseModel):
    scenario: str
    personas: Optional[List[str]] = None
    persona_configs: Optional[dict] = {}
    
    # Custom Mode Fields
    user_role: Optional[str] = None
    partner_role: Optional[str] = None
    user_personality: Optional[str] = None
    partner_personality: Optional[str] = None

class StartSessionResponse(BaseModel):
    session_id: int

class SendMessageRequest(BaseModel):
    session_id: int
    message: str

class MessageResponse(BaseModel):
    persona: str
    message: str
    feedback: Optional[dict] = None

class GetMessagesResponse(BaseModel):
    messages: List[dict]

class EndSessionRequest(BaseModel):
    session_id: int

class EndSessionResponse(BaseModel):
    summary: str
    evaluation: str

class SaveSummaryRequest(BaseModel):
    session_id: int
    summary: str
    evaluation: str

class DeleteSessionResponse(BaseModel):
    message: str
    session_id: int

class GetPersonasResponse(BaseModel):
    personas: dict

@router.get("/personas", response_model=GetPersonasResponse)
def get_personas():
    return GetPersonasResponse(personas=get_all_personas())

@router.post("/start", response_model=StartSessionResponse)
def start_session(request: StartSessionRequest, user=Depends(get_current_user)):
    # Determine mode
    is_custom_mode = request.user_role and request.partner_role
    
    # If custom mode, we might not have a predefined persona list. 
    # We'll use the partner_role as the persona name.
    if is_custom_mode:
        personas = [request.partner_role]
    else:
        personas = request.personas or []

    session_id = create_session(
        user_id=user['id'], 
        scenario=request.scenario, 
        personas=personas,
        user_role=request.user_role,
        partner_role=request.partner_role,
        user_personality=request.user_personality,
        partner_personality=request.partner_personality
    )
    
    update_context(session_id, "scenario", request.scenario)
    update_context(session_id, "personas", personas)
    update_context(session_id, "persona_configs", request.persona_configs)
    
    # Store custom fields in context too
    if is_custom_mode:
        update_context(session_id, "user_role", request.user_role)
        update_context(session_id, "partner_role", request.partner_role)
        update_context(session_id, "user_personality", request.user_personality)
        update_context(session_id, "partner_personality", request.partner_personality)
    
    if len(personas) == 1:
        first_persona = personas[0]
    else:
        first_persona, _ = generate_coordinator_decision(
            session_id, personas, request.scenario, 
            "Starting the conversation"
        )
    
    persona_config = request.persona_configs.get(first_persona, {})
    
    first_message = generate_persona_response(
        session_id, first_persona, request.scenario,
        persona_config.get('frustration', 0.5),
        persona_config.get('goals', ''),
        persona_config.get('motivations', ''),
        "Let's start this conversation about the situation",
        user_role=request.user_role,
        partner_role=request.partner_role,
        user_personality=request.user_personality,
        partner_personality=request.partner_personality
    )
    
    add_ai_message(session_id, first_persona, first_message)
    save_message(session_id, first_persona, first_message)
    
    return StartSessionResponse(session_id=session_id)

@router.post("/message", response_model=MessageResponse)
def send_message(request: SendMessageRequest, user=Depends(get_current_user)):
    add_user_message(request.session_id, request.message)
    
    context = get_context(request.session_id)
    
    scenario = context.get("scenario", "")
    personas = context.get("personas", [])
    persona_configs = context.get("persona_configs", {})
    
    # Custom Mode Fields
    user_role = context.get("user_role")
    partner_role = context.get("partner_role")
    user_personality = context.get("user_personality")
    partner_personality = context.get("partner_personality")
    
    if len(personas) == 1:
        responding_persona = personas[0]
    else:
        responding_persona, reason = generate_coordinator_decision(
            request.session_id, personas, scenario, request.message
        )
    
    persona_config = persona_configs.get(responding_persona, {})
    
    feedback = generate_instant_feedback(request.message, scenario)
    
    save_message(request.session_id, "User", request.message, feedback)
    
    response = generate_persona_response(
        request.session_id, responding_persona, scenario,
        persona_config.get('frustration', 0.5),
        persona_config.get('goals', ''),
        persona_config.get('motivations', ''),
        request.message,
        user_role=user_role,
        partner_role=partner_role,
        user_personality=user_personality,
        partner_personality=partner_personality
    )
    
    add_ai_message(request.session_id, responding_persona, response)
    save_message(request.session_id, responding_persona, response)
    
    return MessageResponse(persona=responding_persona, message=response, feedback=feedback)

@router.get("/messages/{session_id}", response_model=GetMessagesResponse)
def get_messages(session_id: int, user=Depends(get_current_user)):
    messages = get_session_messages(session_id)
    return GetMessagesResponse(messages=messages)

@router.post("/end", response_model=EndSessionResponse)
def end_session_route(request: EndSessionRequest, user=Depends(get_current_user)):
    context = get_context(request.session_id)
    scenario = context.get("scenario", "")
    user_role = context.get("user_role")
    user_personality = context.get("user_personality")
    
    evaluation = generate_evaluation(request.session_id, scenario, user_role, user_personality)
    
    messages = get_session_messages(request.session_id)
    summary = generate_summary(request.session_id, scenario)
    
    end_session(request.session_id)
    save_summary(request.session_id, summary, evaluation)
    clear_session(request.session_id)
    
    return EndSessionResponse(summary=summary, evaluation=evaluation)

@router.post("/summary")
def save_summary_route(request: SaveSummaryRequest, user=Depends(get_current_user)):
    save_summary(request.session_id, request.summary, request.evaluation)
    return {"status": "success"}

@router.delete("/delete/{session_id}", response_model=DeleteSessionResponse)
def delete_session_route(session_id: int, user=Depends(get_current_user)):
    success = delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return DeleteSessionResponse(message="Session deleted", session_id=session_id)

@router.get("/history")
def get_history(user=Depends(get_current_user)):
    sessions = get_user_sessions(user['id'])

    formatted = []
    for s in sessions:
        formatted.append({
            "id": s["id"],
            "scenario": s["scenario"],
            "persona": s["personas"][0] if s["personas"] and len(s["personas"]) > 0 else "Unknown",
            "created_at": s["created_at"].isoformat() if s["created_at"] else None,
            "summary": s["summary"],
            "evaluation": s["evaluation"],
            "message_count": s["message_count"]
        })

    return {"sessions": formatted}