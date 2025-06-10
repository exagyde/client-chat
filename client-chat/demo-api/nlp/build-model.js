import { NlpManager } from "node-nlp";
import intents from "../config/intents.json" with { type: "json" };
import entities from "../config/entities.json" with { type: "json" };
import data from "../data/database.json" with { type: "json" };

const LANGUAGE = "fr";
const manager = new NlpManager({ languages: ["fr"], forceNER: true });

// Load intents from config
for (const intent of intents.intents) {
    for (const utterance of intent.utterances) {
        manager.addDocument("fr", utterance, intent.intent);
    }
    for (const answer of intent.answers) {
        manager.addAnswer("fr", intent.intent, answer);
    }
}

// Add static entities from JSON database
const cards = new Set();
const collections = new Set();

for (const collection of data.collections) {
    collections.add(collection.name);
    for (const card of collection.cards) {
        cards.add(card.name);
    }
}

// Add dynamic entities with static values
[...cards, ...(entities.name || [])].forEach(name =>
  manager.addNamedEntityText("name", name, [LANGUAGE], [name.toLowerCase()])
);

[...collections, ...(entities.collection || [])].forEach(col =>
  manager.addNamedEntityText("collection", col, [LANGUAGE], [col.toLowerCase()])
);

(async () => {
    // Train the model
    await manager.train();
    manager.save("model.nlp");
    console.log("Model trained successfully");
})();