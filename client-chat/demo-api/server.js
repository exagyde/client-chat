import express from "express";
import verifyApiKey from "./utils/verifyApiKey.js";

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(verifyApiKey);

app.post("/generate", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Empty prompt" });

    try {
        const response = "API Response";
        res.json({ result: response });
    } catch (err) {
        res.status(500).json({ error: "Generation error", details: err.message });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
