import express from "express";
import verifyApiKey from "./utils/verifyApiKey.js";

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(verifyApiKey);

const cleanText = (text) => {
    const phrases = text.match(/[^.!?]+[.!?]/g) || [];
    return phrases.map(p => p.trim()).join(' ');
}

app.post("/generate", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Empty prompt" });

    try {
        const response = cleanText("API Response");
        res.json({ result: response });
    } catch (err) {
        res.status(500).json({ error: "Generation error", details: err.message });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
