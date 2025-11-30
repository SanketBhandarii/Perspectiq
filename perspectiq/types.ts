export interface LoginRequest {
  username: string;
  role: string;
  age?: number;
}

export interface LoginResponse {
  token: string;
  user_id: number;
  username: string;
  role: string;
}

export interface Persona {
  name: string;
  description: string;
  role: string;
}

export interface PersonasResponse {
  personas: Record<string, Persona>;
  message: string;
}

export interface PersonaConfig {
  frustration: number;
  goals: string;
  motivations: string;
}

export interface StartSessionRequest {
  scenario: string;
  personas?: string[];
  persona_configs?: Record<string, PersonaConfig>;
  user_role?: string;
  partner_role?: string;
  user_personality?: string;
  partner_personality?: string;
}

export interface StartSessionResponse {
  session_id: number;
}

export interface SendMessageRequest {
  session_id: number;
  message: string;
}

export interface SendMessageResponse {
  persona: string;
  message: string;
  feedback?: {
    score: number;
    feedback: string;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  persona?: string;
  feedback?: {
    score: number;
    feedback: string;
  };
}

export interface GetMessagesResponse {
  messages: Message[];
}

export interface EndSessionRequest {
  session_id: number;
}

export interface EndSessionResponse {
  summary: string;
  evaluation: string;
}

export interface SessionHistoryItem {
  id: number;
  scenario: string;
  persona: string;
  created_at: string;
  summary: string | null;
  evaluation: string | null;
  message_count: number;
}

export interface GetHistoryResponse {
  sessions: SessionHistoryItem[];
}

export interface DeleteSessionResponse {
  message: string;
  session_id: number;
}