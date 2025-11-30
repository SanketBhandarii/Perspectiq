from langchain_community.chat_message_histories import ChatMessageHistory

chat_sessions = {}

def get_or_create_memory(session_id: int):
    if session_id not in chat_sessions:
        chat_sessions[session_id] = {
            "memory": ChatMessageHistory(),
            "context": {}
        }
    return chat_sessions[session_id]

def add_user_message(session_id: int, message: str):
    session = get_or_create_memory(session_id)
    session["memory"].add_user_message(message)

def add_ai_message(session_id: int, persona: str, message: str):
    session = get_or_create_memory(session_id)
    session["memory"].add_ai_message(f"[{persona}]: {message}")

def get_conversation_history(session_id: int):
    session = get_or_create_memory(session_id)
    messages = []
    for msg in session["memory"].messages:
        messages.append({
            "type": msg.type,
            "content": msg.content
        })
    return messages

def update_context(session_id: int, key: str, value):
    session = get_or_create_memory(session_id)
    session["context"][key] = value

def get_context(session_id: int):
    session = get_or_create_memory(session_id)
    return session["context"]

def clear_session(session_id: int):
    if session_id in chat_sessions:
        del chat_sessions[session_id]