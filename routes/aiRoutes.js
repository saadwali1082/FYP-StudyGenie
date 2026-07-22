const express = require("express");
const {
  generateSummary,
  generateQuiz,
  generateFlashcards,
  chatbot,
  getUserSummaries,
  getSummaryById,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/summary", generateSummary);
router.post("/quiz", generateQuiz);
router.post("/flashcards", generateFlashcards);
router.post("/chat", chatbot);

router.get("/summaries/:userId", getUserSummaries);
router.get("/summary/:id", getSummaryById);

module.exports = router;
