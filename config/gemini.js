
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-1.5-flash";

const askGemini = async (prompt) => {
  try {
    console.log("🤖 Calling Gemini with model:", MODEL_NAME);
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("❌ Gemini API error:", error);
    throw error;
  }
};

module.exports = { askGemini };
