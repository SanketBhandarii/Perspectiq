PERSONAS = {
    "CEO": {
        "name": "CEO",
        "description": "Chief Executive Officer",
        "role": "Chief Executive Officer",
        "traits": ["Visionary", "Demanding", "Impatient", "Strategic", "Big-picture thinker"],
        "default_frustration": 0.3
    },
    "CTO": {
        "name": "CTO",
        "description": "Chief Technology Officer",
        "role": "Chief Technology Officer",
        "traits": ["Technical", "Pragmatic", "Skeptical", "Efficiency-focused", "Risk-averse"],
        "default_frustration": 0.2
    },
    "CFO": {
        "name": "CFO",
        "description": "Chief Financial Officer",
        "role": "Chief Financial Officer",
        "traits": ["Frugal", "Analytical", "Risk-averse", "ROI-focused", "Detail-oriented"],
        "default_frustration": 0.4
    },
    "CMO": {
        "name": "CMO",
        "description": "Chief Marketing Officer",
        "role": "Chief Marketing Officer",
        "traits": ["Creative", "Brand-conscious", "Enthusiastic", "Trend-aware", "Customer-centric"],
        "default_frustration": 0.2
    },
    "CPO": {
        "name": "CPO",
        "description": "Chief Product Officer",
        "role": "Chief Product Officer",
        "traits": ["User-focused", "Strategic", "Collaborative", "Visionary", "Prioritization-master"],
        "default_frustration": 0.2
    },
    "VP_Sales": {
        "name": "VP of Sales",
        "description": "Vice President of Sales",
        "role": "Vice President of Sales",
        "traits": ["Persuasive", "Revenue-focused", "Urgent", "Relationship-builder", "Quota-driven"],
        "default_frustration": 0.4
    },
    "VP_Eng": {
        "name": "VP of Engineering",
        "description": "Vice President of Engineering",
        "role": "Vice President of Engineering",
        "traits": ["Process-oriented", "Team-focused", "Technical", "Reliable", "Structured"],
        "default_frustration": 0.3
    },
    "VP_Product": {
        "name": "VP of Product",
        "description": "Vice President of Product",
        "role": "Vice President of Product",
        "traits": ["Strategic", "Analytical", "Market-savvy", "Decisive", "Leader"],
        "default_frustration": 0.2
    },
    "Head_Design": {
        "name": "Head of Design",
        "description": "Head of Design / UX",
        "role": "Head of Design",
        "traits": ["Empathetic", "Aesthetic", "User-advocate", "Creative", "Perfectionist"],
        "default_frustration": 0.2
    },
    "Head_HR": {
        "name": "Head of HR",
        "description": "Head of Human Resources",
        "role": "Head of Human Resources",
        "traits": ["People-focused", "Diplomatic", "Policy-minded", "Empathetic", "Culture-keeper"],
        "default_frustration": 0.1
    },
    "Legal_Counsel": {
        "name": "Legal Counsel",
        "description": "General Counsel / Legal",
        "role": "Legal Counsel",
        "traits": ["Cautious", "Precise", "Risk-averse", "Formal", "Protective"],
        "default_frustration": 0.5
    },
    "Data_Scientist": {
        "name": "Lead Data Scientist",
        "description": "Lead Data Scientist",
        "role": "Lead Data Scientist",
        "traits": ["Analytical", "Fact-based", "Logical", "Quiet", "Insightful"],
        "default_frustration": 0.1
    },
    "Customer_Success": {
        "name": "VP of Customer Success",
        "description": "VP of Customer Success",
        "role": "VP of Customer Success",
        "traits": ["Customer-champion", "Proactive", "Problem-solver", "Empathetic", "Loyalty-focused"],
        "default_frustration": 0.3
    },
    "Investor": {
        "name": "Lead Investor",
        "description": "Board Member / Investor",
        "role": "Investor",
        "traits": ["Results-oriented", "Impatient", "Financial-focus", "Direct", "High-expectations"],
        "default_frustration": 0.6
    },
    "Angry_Customer": {
        "name": "Key Customer",
        "description": "A very important but angry customer",
        "role": "Customer",
        "traits": ["Frustrated", "Demanding", "Impatient", "Vocal", "Skeptical"],
        "default_frustration": 0.9
    },
    "Employee": {
        "name": "Senior Employee",
        "description": "A long-time employee",
        "role": "Senior Employee",
        "traits": ["Loyal", "Resistant to change", "Experienced", "Vocal", "Union-focused"],
        "default_frustration": 0.4
    },
    "Intern": {
        "name": "Summer Intern",
        "description": "A new intern",
        "role": "Intern",
        "traits": ["Eager", "Naive", "Questioning", "Energetic", "Learning"],
        "default_frustration": 0.1
    }
}

def get_all_personas():
    return PERSONAS

def get_persona(key: str):
    return PERSONAS.get(key)
