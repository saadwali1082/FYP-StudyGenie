const { askGemini } = require("../config/gemini");
const { db } = require("../config/firebase");

const askGemini = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini error:", error);
    throw error;
  }
};

const generateSummary = async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Study text is required",
      });
    }

    const summary = await askGemini(
      `Summarize this study material in easy student language:\n\n${text}`
    );

    const savedDoc = await db.collection("summaries").add({
      userId: userId || "guest",
      originalText: text,
      summary,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const generateQuiz = async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Study text is required",
      });
    }

    const quiz = await askGemini(
      `Create 5 quiz questions with answers from this study material:\n\n${text}`
    );

    const savedDoc = await db.collection("quizzes").add({
      userId: userId || "guest",
      originalText: text,
      quiz,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const generateFlashcards = async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Study text is required",
      });
    }

    const flashcards = await askGemini(
      `Create flashcards from this study material. Format each as Question and Answer:\n\n${text}`
    );

    const savedDoc = await db.collection("flashcards").add({
      userId: userId || "guest",
      originalText: text,
      flashcards,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      flashcards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const chatbot = async (req, res) => {
  try {
    const { question, userId } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const answer = await askGemini(
      `You are StudyGenie, a helpful AI study assistant. Answer this student question clearly:\n\n${question}`
    );

    const savedDoc = await db.collection("chatHistory").add({
      userId: userId || "guest",
      question,
      answer,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      answer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateSummary,
  generateQuiz,
  generateFlashcards,
  chatbot,
};
