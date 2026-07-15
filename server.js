const express = require("express");
const cors = require("cors");
require("dotenv").config();

const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const pdfRoutes = require("./routes/pdfRoutes");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "bypass-tunnel-reminder"],
  })
);

app.options("*", cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("StudyGenie Backend Running Successfully");
});

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pdf", pdfRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});