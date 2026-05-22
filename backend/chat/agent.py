from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
from personas.registry import get_persona
from chat.memory import get_conversation_history
import json

client = Groq(api_key=GROQ_API_KEY)

def get_groq_response(system_prompt, user_message, history_context=""):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    
    if history_context:
        messages.append({"role": "user", "content": f"Context:\n{history_context}"})
        
    messages.append({"role": "user", "content": user_message})
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"[System error: {str(e)}]"

def build_persona_prompt(persona_key: str, scenario: str, frustration: float, goals: str, motivations: str):
    persona = get_persona(persona_key)
    if not persona:
        return None
    
    goals_str = goals if goals else 'Standard role goals'
    motivations_str = motivations if motivations else 'None'
    traits_str = ', '.join(persona['traits'])
    
    prompt = f"""You are {persona['name']}, {persona['role']} in a corporate setting.
Scenario: {scenario}
Traits: {traits_str} | Frustration: {frustration}/1.0 | Goals: {goals_str} | Motivations: {motivations_str}

RULES:
- Write like a real human on Slack. 2-4 sentences max. Explain your reasoning.
- Never say "I understand", "As a [Role]", or "Here is a list".
- If user is lazy/dismissive ("idk", "whatever"): get stern, call them out.
- If user is professional: engage normally, argue if you disagree using your goals.
- Frustration>{0.5}: be pushy, demand results. Frustration<{0.3}: be helpful.
- Never summarize what user just said. You are a real busy professional."""
    
    return prompt

def build_custom_prompt(partner_role: str, partner_personality: str, user_role: str, user_personality: str, scenario: str, frustration: float):
    prompt = f"""You are {partner_role} ({partner_personality}) in a corporate setting. User is {user_role} ({user_personality}).
Scenario: {scenario}
Frustration: {frustration}/1.0

RULES:
- Write like a real human on Slack. 2-4 sentences max. Explain your reasoning.
- Never say "I understand", "As a [Role]", or "Here is a list".
- If user is lazy/dismissive: get stern. If professional: engage normally.
- Act your personality fully. If user agrees, accept it and move on.
- Never summarize what user just said. You are a real busy professional."""
    return prompt

def generate_persona_response(session_id: int, persona_key: str, scenario: str, frustration: float, 
                              goals: str, motivations: str, user_message: str,
                              user_role: str = None, partner_role: str = None,
                              user_personality: str = None, partner_personality: str = None):
    
    if user_role and partner_role:
        system_prompt = build_custom_prompt(partner_role, partner_personality, user_role, user_personality, scenario, frustration)
    else:
        system_prompt = build_persona_prompt(persona_key, scenario, frustration, goals, motivations)
        
    if not system_prompt:
        return "Error: Invalid persona configuration"
    
    history = get_conversation_history(session_id)
    
    conversation_context = "\n".join([
        f"{'User' if msg['type'] == 'human' else 'You'}: {msg['content']}"
        for msg in history[-4:]
    ])
    
    return get_groq_response(system_prompt, user_message, conversation_context)

def generate_coordinator_decision(session_id: int, personas: list, scenario: str, user_message: str):
    
    personas_info = [get_persona(p) for p in personas if get_persona(p)]
    personas_brief = json.dumps([{'key': p, 'name': personas_info[i]['name']} for i, p in enumerate(personas)])
    
    prompt = f"""Scenario: {scenario}
Personas: {personas_brief}
User said: {user_message}

Which persona should respond next? Pick who is most affected or would naturally jump in.
Respond ONLY as JSON: {{"persona_key": "XXX", "reason": "brief explanation"}}"""
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=256,
            response_format={"type": "json_object"}
        )
        result = json.loads(completion.choices[0].message.content)
        return result.get("persona_key"), result.get("reason")
    except:
        return personas[0], "Default selection"

def generate_evaluation(messages: list, scenario: str, user_role: str = None, user_personality: str = None):
    
    # Only use last 8 messages to keep token count manageable
    recent = messages[-8:] if len(messages) > 8 else messages
    conversation = "\n".join([
        f"{'User' if msg.get('role') == 'user' or msg.get('type') == 'human' else 'Persona'}: {msg['content']}"
        for msg in recent
    ])
    
    context_str = f" (User: {user_role}, Personality: {user_personality})" if user_role and user_personality else ""
    
    prompt = f"""Scenario: {scenario}{context_str}

{conversation}

Give 3-5 actionable insights to improve their communication. Be direct like a friend. One insight per line, no bullets/numbers/dots."""
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Unable to generate insights: {str(e)}"

def generate_summary(session_id: int, scenario: str):
    history = get_conversation_history(session_id)
    
    # Only use last 8 messages for summary to stay within token limits
    recent = history[-8:] if len(history) > 8 else history
    conversation = "\n".join([
        f"{'User' if msg['type'] == 'human' else 'Persona'}: {msg['content']}"
        for msg in recent
    ])
    
    prompt = f"""Scenario: {scenario}

{conversation}

2-3 sentence executive summary: what happened, outcome, user's performance."""
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=512
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Summary unavailable: {str(e)}"

def generate_instant_feedback(user_message: str, scenario: str):
    prompt = f"""Scenario: "{scenario}"
User said: "{user_message}"

Rate effectiveness 1-10 (be critical, don't default to 8). Give a 1-sentence coaching tip specific to THIS message. Rewrite the message as a 10/10 version.
Don't penalize brief professional acknowledgments like "Will do" or "Understood" — brevity is fine, score 8-10.

Respond ONLY as JSON: {{ "score": <int>, "feedback": "<string>", "suggested_response": "<string>" }}"""
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=512,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        return {"score": 0, "feedback": "", "suggested_response": ""}

def generate_scenario(role: str, difficulty: str, user_role: str = None, partner_role: str = None):
    if user_role and partner_role:
        prompt = f"Generate a realistic {difficulty}-difficulty corporate conflict between {user_role} and {partner_role}. Under 3 sentences. Focus on deliverables, deadlines, or resources."
    else:
        prompt = f"Generate a realistic {difficulty}-difficulty negotiation scenario for a {role}. Under 3 sentences. Focus on scope, deadlines, or resources."
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=256
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        return "A high-pressure negotiation is required due to shifting priorities and limited resources."

def generate_transcript_summary(transcript: str):
    # Truncate transcript to last ~2000 chars to stay within token limits
    truncated = transcript[-2000:] if len(transcript) > 2000 else transcript
    prompt = f"Summarize this negotiation in 3-4 sentences. Focus on outcome and key arguments.\n{truncated}"
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=512
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        return "Summary generation unavailable."
