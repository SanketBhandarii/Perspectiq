import {
  LoginRequest,
  LoginResponse,
  PersonasResponse,
  StartSessionRequest,
  StartSessionResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  EndSessionRequest,
  EndSessionResponse,
  GetHistoryResponse,
  DeleteSessionResponse,
  GenerateScenarioRequest,
  GenerateTranscriptSummaryRequest
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 10 minute timeout for cold starts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorBody}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const api = {
  auth: {
    login: (data: LoginRequest) => request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getMe: () => request<{ id: number; username: string; role: string; age: number }>('/auth/me'),
  },
  chat: {
    getPersonas: () => request<PersonasResponse>('/chat/personas'),
    startSession: (data: StartSessionRequest) => request<StartSessionResponse>('/chat/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    sendMessage: (data: SendMessageRequest) => request<SendMessageResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getMessages: (sessionId: number) => request<GetMessagesResponse>(`/chat/messages/${sessionId}`),
    endSession: (data: EndSessionRequest) => request<EndSessionResponse>('/chat/end', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getHistory: () => request<GetHistoryResponse>('/chat/history'),
    saveSummary: (sessionId: number, summary: string, evaluation: string) => request<void>('/chat/summary', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, summary, evaluation }),
    }),
    generateEvaluation: (sessionId: number) => request<{ evaluation: string }>('/chat/evaluate', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),
    deleteSession: (sessionId: number) => request<DeleteSessionResponse>(`/chat/delete/${sessionId}`, {
      method: 'DELETE',
    }),
    generateScenario: (data: GenerateScenarioRequest) => request<{ scenario: string }>('/chat/generate_scenario', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    generateTranscriptSummary: (data: GenerateTranscriptSummaryRequest) => request<{ summary: string }>('/chat/generate_transcript_summary', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  system: {
    health: () => request<{ status: string }>('/health'),
  }
};