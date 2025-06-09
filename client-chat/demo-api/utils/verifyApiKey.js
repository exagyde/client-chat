import keys from "../keys.json" with { type: "json" };

export default function verifyApiKey(req, res, next) {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || !keys.valid.includes(apiKey)) {
        return res.status(403).json({ error: "Invalid or empty API key" });
    }
    next();
}
