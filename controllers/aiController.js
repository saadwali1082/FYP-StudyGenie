// controllers/aiController.js
const { askGemini } = require("../config/gemini");
const { db } = require("../config/firebase");

const generateSummary = async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Study text is required",
      });
    }

    console.log("📄 Generating summary for text length:", text.length);

    const summary = await askGemini(
      `Summarize this study material in easy student language:\n\n${text}`
    );

    console.log("✅ Summary generated, saving to Firebase...");

    const savedDoc = await db.collection("summaries").add({
      userId: userId || "guest",
      originalText: text,
      summary: summary,
      type: "text",
      createdAt: new Date(),
    });

    console.log("✅ Saved to Firebase with ID:", savedDoc.id);

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      summary: summary,
    });
  } catch (error) {
    console.error("❌ Summary error:", error);
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

    console.log("📝 Generating quiz for text length:", text.length);

    const quiz = await askGemini(
      `Create 5 quiz questions with answers from this study material. Format as JSON with questions array containing question, options, and correctAnswer:\n\n${text}`
    );

    console.log("✅ Quiz generated, saving to Firebase...");

    const savedDoc = await db.collection("quizzes").add({
      userId: userId || "guest",
      originalText: text,
      quiz: quiz,
      type: "quiz",
      createdAt: new Date(),
    });

    console.log("✅ Saved to Firebase with ID:", savedDoc.id);

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      quiz: quiz,
    });
  } catch (error) {
    console.error("❌ Quiz error:", error);
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

    console.log("🃏 Generating flashcards for text length:", text.length);

    const flashcards = await askGemini(
      `Create 10 flashcards from this study material. Format as JSON array with question and answer fields:\n\n${text}`
    );

    console.log("✅ Flashcards generated, saving to Firebase...");

    const savedDoc = await db.collection("flashcards").add({
      userId: userId || "guest",
      originalText: text,
      flashcards: flashcards,
      type: "flashcards",
      createdAt: new Date(),
    });

    console.log("✅ Saved to Firebase with ID:", savedDoc.id);

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      flashcards: flashcards,
    });
  } catch (error) {
    console.error("❌ Flashcards error:", error);
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

    console.log("💬 Chatbot question:", question.substring(0, 50) + "...");

    const answer = await askGemini(
      `You are StudyGenie, a helpful AI study assistant. Answer this student question clearly and concisely:\n\n${question}`
    );

    console.log("✅ Answer generated, saving to Firebase...");

    const savedDoc = await db.collection("chatHistory").add({
      userId: userId || "guest",
      question: question,
      answer: answer,
      type: "chat",
      createdAt: new Date(),
    });

    console.log("✅ Saved to Firebase with ID:", savedDoc.id);

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      answer: answer,
    });
  } catch (error) {
    console.error("❌ Chatbot error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all summaries for a user
const getUserSummaries = async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db
      .collection("summaries")
      .where("userId", "==", userId || "guest")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const summaries = [];
    snapshot.forEach((doc) => {
      summaries.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({
      success: true,
      data: summaries,
    });
  } catch (error) {
    console.error("❌ Get summaries error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single summary by ID
const getSummaryById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection("summaries").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Summary not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("❌ Get summary error:", error);
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
  getUserSummaries,
  getSummaryById,
};
