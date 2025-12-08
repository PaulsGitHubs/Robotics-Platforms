// static/js/ai/openai_client.js
import { applyAIActions } from "./ai_actions.js";

export async function askAI(query, editorInstance) {
    console.log("Sending AI query:", query);

    const res = await fetch("/ai_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
    });

    const data = await res.json();

    if (!data.success) {
        console.warn("AI Error:", data.error);
        return data.error || "AI error.";
    }

    const text = data.message;
    console.log("AI Response text:", text);

    // Parse & apply potential actions (camera, entities, sensors)
    applyAIActions(text, editorInstance);

    return text;
}

