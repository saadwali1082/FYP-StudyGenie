const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const ai = require("../config/gemini");
const { db } = require("../config/firebase");

const askGemini = async (prompt) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
};

const extractTextFromBuffer = async (buffer) => {
  const data = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let text = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }

  return text.trim();
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

    const fileBuffer = fs.readFileSync(req.file.path);
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

    const savedDoc = await db.collection("pdfSummaries").add({
      userId: userId || "guest",
      fileName: req.file.originalname,
      extractedText,
      summary,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      fileName: req.file.originalname,
      summary,
    });
  } catch (error) {
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

    const savedDoc = await db.collection("pdfSummaries").add({
      userId: userId || "guest",
      fileName: fileName || "study-material.pdf",
      extractedText,
      summary,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      fileName: fileName || "study-material.pdf",
      summary,
    });
  } catch (error) {
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