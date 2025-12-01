import { api } from './api';

export const generateScenario = async (role: string, difficulty: string, userRole?: string, partnerRole?: string): Promise<string> => {
  try {
    const response = await api.chat.generateScenario({ role, difficulty, user_role: userRole, partner_role: partnerRole });
    return response.scenario;
  } catch (error) {
    console.error("Scenario generation failed", error);
    return "A high-pressure negotiation is required due to shifting priorities and limited resources.";
  }
};

export const generateSummary = async (transcript: string): Promise<string> => {
  try {
    const response = await api.chat.generateTranscriptSummary({ transcript });
    return response.summary;
  } catch (error) {
    console.error("Summary generation failed", error);
    return "Summary generation unavailable.";
  }
};
