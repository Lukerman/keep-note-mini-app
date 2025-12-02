
import { GoogleGenAI } from "@google/genai";
import { config } from '../config';

const getAIClient = () => {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) {
    console.warn("Gemini API Key is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTitle = async (content: string): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, concise title (max 6 words) for the following note content. Do not include quotes or "Title:". Just the title text.\n\nNote Content:\n${content}`,
    });
    return response.text?.trim() || null;
  } catch (error) {
    console.error("AI Title Generation Error:", error);
    return null;
  }
};

export const summarizeNote = async (content: string): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following note content into a concise paragraph or bullet points if appropriate. Maintain the original tone.\n\nNote Content:\n${content}`,
    });
    return response.text?.trim() || null;
  } catch (error) {
    console.error("AI Summarization Error:", error);
    return null;
  }
};

export const fixGrammar = async (content: string): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Fix the grammar, spelling, and punctuation of the following text. Do not change the meaning or style significantly. Return only the corrected text.\n\nText:\n${content}`,
    });
    return response.text?.trim() || null;
  } catch (error) {
    console.error("AI Grammar Fix Error:", error);
    return null;
  }
};

export const elaborateNote = async (content: string): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Elaborate on the following note content. Expand on the ideas presented, adding relevant details or potential next steps. Keep it organized.\n\nNote Content:\n${content}`,
    });
    return response.text?.trim() || null;
  } catch (error) {
    console.error("AI Elaboration Error:", error);
    return null;
  }
};
