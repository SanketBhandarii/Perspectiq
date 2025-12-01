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
        messages.append({"role": "user", "content": f"Previous conversation context:\n{history_context}"})
        
    messages.append({"role": "user", "content": user_message})
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=1,
            max_tokens=8192,
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
    
    prompt = f"""You are {persona['name']}, a {persona['role']} in a corporate setting.
    
SCENARIO: {scenario}

YOUR CHARACTER:
- Role: {persona['description']}
- Frustration: {frustration}/1.0 (High=Short, blunt, difficult; Low=Open, helpful)
- Goals: {goals if goals else 'Standard role goals'}
- Motivations: {motivations if motivations else 'None specified'}
- Traits: {', '.join(persona['traits'])}

CRITICAL INSTRUCTIONS FOR REALISM:
1. WRITE LIKE A HUMAN ON SLACK/TEAMS.
2. LENGTH: 2-4 sentences. Be concise but EXPLAIN YOUR REASONING.
3. NO AI-ISMS. Never say "I understand", "As a [Role]", "Here is a list".
4. TYPING STYLE: Use sentence case. Occasional lowercase is fine. Minimal punctuation.
5. TONE: You are busy but professional. Don't just say "no" or "yes"—give context.

HANDLING USER INPUT (CRITICAL):
- **IF USER IS DISMISSIVE/LAZY** (e.g., "idk", "cool", "whatever", one-word answers):
  - **GET ANGRY/STERN.**
  - Call them out. "I need more than that.", "Can we focus?", "This isn't helpful."
- **IF USER IS PROFESSIONAL**:
  - Respond normally. Engage with their points.
  - If they make a good point, acknowledge it.
  - If you disagree, explain WHY based on your Goals/Motivations.

6. FRUSTRATION: 
   - If High (>0.5): Be pushy. Demand results. Explain why their delay hurts you.
   - If Low (<0.3): Be helpful. Offer to brainstorm (briefly).
7. DO NOT summarize what the user just said.

Remember: You are a real person. If you disagree, argue your case. If you agree, confirm next steps."""
    
    return prompt

def build_custom_prompt(partner_role: str, partner_personality: str, user_role: str, user_personality: str, scenario: str, frustration: float):
    prompt = f"""You are {partner_role} in a corporate setting.

SCENARIO: {scenario}

YOUR CHARACTER:
- Role: {partner_role}
- Personality: {partner_personality}
- Frustration: {frustration}/1.0

USER: {user_role} ({user_personality})

CRITICAL INSTRUCTIONS FOR REALISM:
1. WRITE LIKE A HUMAN ON SLACK/TEAMS.
2. LENGTH: 2-4 sentences. Be concise but EXPLAIN YOUR REASONING.
3. NO AI-ISMS. Never say "I understand", "As a [Role]", "Here is a list".
4. TYPING STYLE: Use sentence case. Occasional lowercase is fine.
5. TONE: You are busy. Get to the point, but provide context.

HANDLING USER INPUT (CRITICAL):
- **IF USER IS DISMISSIVE/LAZY**:
  - **GET ANGRY/STERN.**
  - Call them out.
- **IF USER IS PROFESSIONAL**:
  - Respond normally based on your personality.
  - Engage with their arguments.

6. ACT YOUR PERSONALITY: If "pushy", be pushy. If "shy", be hesitant.
7. If the user agrees ("ok", "sure"), accept it. Don't drag it out.
8. DO NOT summarize what the user just said.

Remember: You are a real person in a workplace. Don't tolerate wasting time, but be helpful if the user is trying."""
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
        for msg in history[-10:]
    ])
    
    return get_groq_response(system_prompt, user_message, conversation_context)

def generate_coordinator_decision(session_id: int, personas: list, scenario: str, user_message: str):
    
    personas_info = [get_persona(p) for p in personas if get_persona(p)]
    
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
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        result = json.loads(completion.choices[0].message.content)
        return result.get("persona_key"), result.get("reason")
    except:
        return personas[0], "Default selection"

def generate_evaluation(messages: list, scenario: str, user_role: str = None, user_personality: str = None):
    
    conversation = "\n".join([
        f"{'User' if msg.get('role') == 'user' or msg.get('type') == 'human' else 'Persona'}: {msg['content']}"
        for msg in messages
    ])
    
    context_str = ""
    if user_role and user_personality:
        context_str = f"\nUSER CONTEXT:\nRole: {user_role}\nTarget Personality: {user_personality}\nEvaluate if they acted according to their role and managed their personality traits effectively."
    
    prompt = f"""Analyze this product management conversation and provide Key Actionable Insights.

SCENARIO: {scenario}
{context_str}

CONVERSATION:
{conversation}

Provide a bulleted list of 3-5 specific, actionable insights for the user to improve their stakeholder management and communication skills. 
Give honest advice like a friend giving feedback to another friend. Avoid corporate jargon. Be direct but conversational. Give concised insights to point, not too long.

STRICT FORMATTING RULES:
1. Output ONLY the raw text of the insights.
2. Do NOT use bullet points, numbers, stars, or dots at the start of lines.
3. One insight per line. """
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Unable to generate insights: {str(e)}"

def generate_summary(session_id: int, scenario: str):
    history = get_conversation_history(session_id)
    
    conversation = "\n".join([
        f"{'User' if msg['type'] == 'human' else 'Persona'}: {msg['content']}"
        for msg in history
    ])
    
    prompt = f"""Summarize this product management simulation session.
    
SCENARIO: {scenario}

CONVERSATION:
{conversation}

Provide a 2-3 sentence executive summary of what happened, the key outcome, and the user's performance. Be professional and concise."""
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Summary unavailable: {str(e)}"

def generate_instant_feedback(user_message: str, scenario: str):
    prompt = f"""Analyze the user's message in the context of this scenario: "{scenario}".
    
    User Message: "{user_message}"
    
    Provide:
    1. A REALISTIC rating (1-10) on effectiveness. Do NOT default to 8. Be critical.
       - 1-4: Poor, counterproductive, or ignores key issues.
       - 5-7: Average, acceptable but could be better.
       - 8-10: Excellent, strategic, and empathetic.
    2. A 1-sentence "Coach's Tip" on SPECIFICALLY how to improve THIS message or why it was good. Avoid generic advice.
    
    IMPORTANT: Do NOT penalize short, professional acknowledgments (e.g., "Will do", "Understood", "Okay"). In a corporate setting, brevity is often a virtue. If the user acknowledges an instruction appropriately, give a good score (8-10) and a tip like "Clear and concise confirmation."
    
    Respond ONLY with a JSON object:
    {{ "score": <int>, "feedback": "<string>" }}
    """
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        return {"score": 0, "feedback": ""}

def generate_scenario(role: str, difficulty: str, user_role: str = None, partner_role: str = None):
    # If specific roles are provided, use them for a more targeted scenario
    if user_role and partner_role:
        prompt = f"""Generate a realistic corporate conflict/negotiation scenario between a {user_role} (User) and a {partner_role} (Partner).
        Difficulty: {difficulty}.
        Context: The {partner_role} should be challenging or have conflicting goals with the {user_role}.
        Keep it under 3 sentences. Focus on specific deliverables, deadlines, or resource conflicts."""
    else:
        # Fallback to generic role-based scenario
        prompt = f"""Generate a realistic negotiation scenario involving a {role}.
        Difficulty: {difficulty}.
        Keep it under 3 sentences. Focus on feature scope, deadlines, or resources."""
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        return "A high-pressure negotiation is required due to shifting priorities and limited resources."

def generate_transcript_summary(transcript: str):
    prompt = f"""Summarize the following negotiation transcript in 3-4 sentences. Focus on the outcome and key arguments.
    Transcript:
    {transcript}"""
    
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        return "Summary generation unavailable."
