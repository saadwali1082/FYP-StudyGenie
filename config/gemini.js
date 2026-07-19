// config/gemini.js
const { GoogleGenAI } = require("@google/genai");

let aiInstance = null;

const getGeminiInstance = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return aiInstance;
};

const askGemini = async (prompt) => {
  try {
    const ai = getGeminiInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};

module.exports = { askGemini, getGeminiInstance };
