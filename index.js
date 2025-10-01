equire("dotenv").config();
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const axios = require("axios");

const app = express();
const upload = multer();
app.use(cors());

const HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base";

app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const data = await pdfParse(req.file.buffer);
        const text = data.text.slice(0, 2000);

        const prompt = `
    Generate 5 study flashcards from the following text.
    Each flashcard must be a JSON object with "question" and "answer".
    Return only a JSON array.
    Text: ${text}
    `;

        const response = await axios.post(
            HF_API_URL,
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        let flashcards = [];
        try {
            const output = response.data[0].generated_text;
            flashcards = JSON.parse(output);
        } catch {
            flashcards = [{ question: "Error", answer: "Could not parse model output" }];
        }

        res.json({ flashcards });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate flashcards" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
