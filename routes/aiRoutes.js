const express = require("express");

const {
  generateSummary,
  generateQuiz,
  generateFlashcards,
  chatbot,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/summary", generateSummary);
router.post("/quiz", generateQuiz);
router.post("/flashcards", generateFlashcards);
router.post("/chat", chatbot);

module.exports = router;