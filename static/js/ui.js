// static/js/ui.js

import { viewer, clearAllEntities } from "./scene.js";

    // Drag-drop sensors (real implementation in next batch)
   import { enableSensorPlacement } from "./sensors/sensor_dragdrop.js";
enableSensorPlacement();


export function initUI() {
    console.log("UI initialized.");

    // Buttons
    document.getElementById("centerHome").onclick = () => {
        viewer.camera.flyHome(1.5);
    };

    document.getElementById("clearEntities").onclick = () => {
        clearAllEntities();
    };

    // AI button
    const aiSend = document.getElementById("aiSend");
    aiSend.onclick = () => handleAIQuery();

}

// -------------------------
// AI Query Handler
// -------------------------
async function handleAIQuery() {
    const input = document.getElementById("aiInput").value.trim();
    if (!input) return;

    const res = await fetch("/ai_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input })
    });

    const data = await res.json();
    console.log("AI Response:", data.message);

    // Inject into console
    const consoleDiv = document.getElementById("consoleOutput");
    consoleDiv.innerText = data.message;
}

// -------------------------
// Sensor Drag–Drop Setup
// -------------------------
export function setupSensorDragDrop() {
    const sensors = document.querySelectorAll(".sensor-item");

    sensors.forEach(item => {
        item.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("sensorType", item.dataset.sensorType);
        });
    });

    const viewerDiv = document.getElementById("viewer");

    viewerDiv.addEventListener("dragover", (e) => e.preventDefault());

    viewerDiv.addEventListener("drop", (e) => {
        e.preventDefault();

        // Example: add point where dropped
        const type = e.dataTransfer.getData("sensorType");
        console.log("Dropped sensor:", type);

        alert(`Sensor "${type}" placed (actual render in next batch).`);
    });
}

