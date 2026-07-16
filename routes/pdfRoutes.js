const express = require("express");
const upload = require("../middleware/upload");
const {
  summarizePdf,
  summarizePdfBase64,
} = require("../controllers/pdfController");

const router = express.Router();

router.post("/summary", upload.single("pdf"), summarizePdf);
router.post("/summary-base64", summarizePdfBase64);

module.exports = router;