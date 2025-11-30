import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export const generateScenario = async (role: string, difficulty: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Generate a realistic negotiation scenario involving a ${role}.
      Difficulty: ${difficulty}.
      Keep it under 3 sentences. Focus on feature scope, deadlines, or resources.`
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini generation failed", error);
    return "A high-pressure negotiation is required due to shifting priorities and limited resources.";
  }
};

export const generateSummary = async (transcript: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Summarize the following negotiation transcript in 3-4 sentences. Focus on the outcome and key arguments.
      
      Transcript:
      ${transcript}`
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini summary generation failed", error);
    return "Summary generation unavailable.";
  }
};
