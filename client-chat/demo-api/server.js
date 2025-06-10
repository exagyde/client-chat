import express from "express";
import { NlpManager } from "node-nlp";
import verifyApiKey from "./utils/verifyApiKey.js";

const app = express();
const PORT = process.env.PORT || 3030;

const DEFAULT_RESPONSE = "Désole, je n'ai pas la réponse.";
const manager = new NlpManager({ languages: ["fr"], forceNER: true });
manager.load("./nlp/model.nlp");

app.use(express.json());
app.use(verifyApiKey);

app.post("/generate", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Empty prompt" });

    try {
        const response = await manager.process("fr", prompt);
        console.log(response);
        res.json({ result: response.answer || DEFAULT_RESPONSE });
    } catch (err) {
        res.status(500).json({ error: "Generation error", details: err.message });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
