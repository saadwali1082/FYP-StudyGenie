const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const { askGemini } = require("../config/gemini");
const { db } = require("../config/firebase");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Uploads folder created");
}

const extractTextFromBuffer = async (buffer) => {
  try {
    const data = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let text = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }

    return text.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

const summarizePdf = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    console.log("📄 Processing PDF:", req.file.originalname);

    const fileBuffer = fs.readFileSync(req.file.path);
    const extractedText = await extractTextFromBuffer(fileBuffer);

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: "No readable text found in PDF",
      });
    }

    console.log("📄 Extracted text length:", extractedText.length);

    const summary = await askGemini(
      `Summarize this PDF study material in simple student-friendly language:\n\n${extractedText}`
    );

    console.log("✅ Summary generated, saving to Firebase...");

    // Save to Firebase - using 'summaries' collection instead of 'pdfSummaries'
    const savedDoc = await db.collection("summaries").add({
      userId: userId || "guest",
      fileName: req.file.originalname,
      originalText: extractedText,
      summary: summary,
      type: "pdf",
      createdAt: new Date(),
    });

    console.log("✅ Saved to Firebase with ID:", savedDoc.id);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      fileName: req.file.originalname,
      summary: summary,
    });
  } catch (error) {
    console.error("❌ PDF summary error:", error);
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const summarizePdfBase64 = async (req, res) => {
  try {
    const { userId, fileName, base64 } = req.body;

    if (!base64) {
      return res.status(400).json({
        success: false,
        message: "Base64 PDF is required",
      });
    }

    const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const fileBuffer = Buffer.from(cleanBase64, "base64");

    const extractedText = await extractTextFromBuffer(fileBuffer);

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: "No readable text found in PDF",
      });
    }

    const summary = await askGemini(
      `Summarize this PDF study material in simple student-friendly language:\n\n${extractedText}`
    );

    // Save to Firebase - using 'summaries' collection
    const savedDoc = await db.collection("summaries").add({
      userId: userId || "guest",
      fileName: fileName || "study-material.pdf",
      originalText: extractedText,
      summary: summary,
      type: "pdf",
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      fileName: fileName || "study-material.pdf",
      summary: summary,
    });
  } catch (error) {
    console.error("❌ PDF summary error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  summarizePdf,
  summarizePdfBase64,
};
