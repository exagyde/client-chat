const SERVER_PORT = 3000;
const CONFIG = require("./config.json");

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const path = require("path");
const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/public")));

app.post("/api", async (req, res) => {
    try {
        let body = CONFIG.requestAPI.body.replace("$prompt", req.body.prompt);

        if(CONFIG.requestAPI.method === "POST") {
            const response = await axios.post(
                CONFIG.requestAPI.url, 
                JSON.parse(JSON.stringify(body)), 
                { 
                    headers: JSON.parse(CONFIG.requestAPI.headers)
                }
            );
            res.json(response.data);
        } else {
            res.json("hello client-chat world !");
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "External API call error" });
    }
});

app.get("/", (req, res) => {
    res.sendFile("public/index.html", { root: __dirname });
});

app.listen(SERVER_PORT, () => {
    console.log(`Server running on http://localhost:${SERVER_PORT}`);
});