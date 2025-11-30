import google.generativeai as genai
from config import GOOGLE_API_KEY, GOOGLE_MODEL
from personas.registry import get_persona
from chat.memory import get_conversation_history
import json

genai.configure(api_key=GOOGLE_API_KEY)

def build_persona_prompt(persona_key: str, scenario: str, frustration: float, goals: str, motivations: str):
    persona = get_persona(persona_key)
    if not persona:
        return None
    
    prompt = f"""You are roleplaying as a {persona['name']} in a corporate scenario.

SCENARIO: {scenario}

YOUR CHARACTER:
- Role: {persona['description']}
- Current Frustration Level: {frustration}/1.0 (higher = more frustrated and difficult)
- Your Goals: {goals if goals else 'Standard role goals'}
- Hidden Motivations: {motivations if motivations else 'None specified'}
- Personality Traits: {', '.join(persona['traits'])}

BEHAVIOR RULES:
1. Stay in character at all times
2. Your responses should reflect your frustration level
3. When frustrated (>0.5), be more challenging, pushy, or defensive
4. When calm (<0.3), be more collaborative and open
5. Reference your goals and motivations naturally in conversation
6. React realistically to what the user says - if they address your concerns, you may calm down
7. If they ignore your concerns or are dismissive, increase pushback
8. Keep responses natural and conversational (2-4 sentences typical)
9. Show emotion appropriate to the situation
10. Be a realistic corporate stakeholder, not a chatbot
11. If the user agrees or acknowledges with short phrases ("ok", "sure", "yes sir"), accept it as confirmation and move forward or end the conversation naturally. Do NOT interpret respectful brevity as lack of confidence unless you specifically asked for detail.

Remember: You are NOT helping the user - you are a challenging stakeholder they need to manage, but you should respond reasonably to agreement."""
    
    return prompt

def generate_persona_response(session_id: int, persona_key: str, scenario: str, frustration: float, 
                              goals: str, motivations: str, user_message: str):
    
    system_prompt = build_persona_prompt(persona_key, scenario, frustration, goals, motivations)
    if not system_prompt:
        return "Error: Invalid persona"
    
    history = get_conversation_history(session_id)
    
    conversation_context = "\n".join([
        f"{'User' if msg['type'] == 'human' else 'You'}: {msg['content']}"
        for msg in history[-10:]
    ])
    
    model = genai.GenerativeModel(
        model_name=GOOGLE_MODEL,
        system_instruction=system_prompt
    )
    
    prompt = f"""Previous conversation:
{conversation_context}

User just said: {user_message}

Respond in character. Be realistic, challenging if appropriate, and true to your role."""
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"[System error generating response: {str(e)}]"

def generate_coordinator_decision(session_id: int, personas: list, scenario: str, user_message: str):
    
    personas_info = [get_persona(p) for p in personas if get_persona(p)]
    
    model = genai.GenerativeModel(model_name=GOOGLE_MODEL)
    
    prompt = f"""You are a conversation coordinator managing a multi-stakeholder meeting.

SCENARIO: {scenario}

AVAILABLE PERSONAS:
{json.dumps([{'key': p, 'name': personas_info[i]['name'], 'description': personas_info[i]['description']} 
             for i, p in enumerate(personas)], indent=2)}

USER JUST SAID: {user_message}

TASK: Decide which persona should respond next and why. Consider:
- Who is most affected by what the user said?
- Whose concerns are being addressed or ignored?
- What would create realistic conversation flow?
- Who would naturally jump in at this moment?

Respond ONLY with a JSON object:
{{"persona_key": "XXX", "reason": "brief explanation"}}"""
    
    try:
        response = model.generate_content(prompt)
        result = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
        return result.get("persona_key"), result.get("reason")
    except:
        return personas[0], "Default selection"

def generate_evaluation(session_id: int, scenario: str):
    
    history = get_conversation_history(session_id)
    
    conversation = "\n".join([
        f"{'User' if msg['type'] == 'human' else 'Persona'}: {msg['content']}"
        for msg in history
    ])
    
    model = genai.GenerativeModel(model_name=GOOGLE_MODEL)
    
    prompt = f"""Analyze this product management conversation and provide Key Actionable Insights.

SCENARIO: {scenario}

CONVERSATION:
{conversation}

Provide a bulleted list of 3-5 specific, actionable insights for the user to improve their stakeholder management and communication skills. 
Give honest advice like a friend giving feedback to another friend. Avoid corporate jargon. Be direct but conversational. Give concised insights to point, not too long.

STRICT FORMATTING RULES:
1. Start directly with the first bullet point.
2. Output ONLY the bullet points of dots.
3. Don't put such stars *first* """
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Unable to generate insights: {str(e)}"

def generate_summary(session_id: int, scenario: str):
    history = get_conversation_history(session_id)
    
    conversation = "\n".join([
        f"{'User' if msg['type'] == 'human' else 'Persona'}: {msg['content']}"
        for msg in history
    ])
    
    model = genai.GenerativeModel(model_name=GOOGLE_MODEL)
    
    prompt = f"""Summarize this product management simulation session.
    
SCENARIO: {scenario}

CONVERSATION:
{conversation}

Provide a 2-3 sentence executive summary of what happened, the key outcome, and the user's performance. Be professional and concise."""
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Summary unavailable: {str(e)}"

def generate_instant_feedback(user_message: str, scenario: str):
    model = genai.GenerativeModel(model_name=GOOGLE_MODEL)
    
    prompt = f"""Analyze the user's message in the context of this scenario: "{scenario}".
    
    User Message: "{user_message}"
    
    Provide:
    1. A REALISTIC rating (1-10) on effectiveness. Do NOT default to 8. Be critical.
       - 1-4: Poor, counterproductive, or ignores key issues.
       - 5-7: Average, acceptable but could be better.
       - 8-10: Excellent, strategic, and empathetic.
    2. A 1-sentence "Coach's Tip" on SPECIFICALLY how to improve THIS message or why it was good. Avoid generic advice.
    
    If the message is just a short acknowledgment (e.g., "ok", "sure", "thanks"), give a score of -1 and feedback "Acknowledgment".
    
    Respond ONLY with a JSON object:
    {{ "score": <int>, "feedback": "<string>" }}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(text)
    except:
        return {"score": 0, "feedback": ""}