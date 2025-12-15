// static/js/ui.js

import { getViewer, clearAllEntities } from "./scene.js";
import { enableSensorPlacement } from "./sensors/sensor_dragdrop.js";

export function initUI() {
    console.log("UI initialized.");

    // Enable sensor drag & drop AFTER scene is ready
    enableSensorPlacement();

    // Home camera button
    document.getElementById("centerHome")?.addEventListener("click", () => {
        const viewer = getViewer();
        if (!viewer) {
            console.warn("Viewer not ready yet");
            return;
        }
        viewer.camera.flyHome(1.5);
    });

    // Clear entities button
    document.getElementById("clearEntities")?.addEventListener("click", () => {
        clearAllEntities();
    });

    // AI button
    document.getElementById("askAiBtn")?.addEventListener("click", () => {
        handleAIQuery();
    });
}

// -------------------------
// AI Query Handler
// -------------------------
async function handleAIQuery() {
    const inputEl = document.getElementById("aiInput");
    if (!inputEl) return;

    const input = inputEl.value.trim();
    if (!input) return;

    const res = await fetch("/ai_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input })
    });

    const data = await res.json();
    console.log("AI Response:", data.message);

    const consoleDiv = document.getElementById("consoleOutput");
    if (consoleDiv) {
        consoleDiv.innerText = data.message;
    }
}
