// /* global Cesium */
// // static/js/ai/ai_actions.js
// import { viewer } from "../scene.js";

// export function applyAIActions(text, editorInstance) {
//     if (!text) return;

//     const lower = text.toLowerCase();

//     // -------------------------------------
//     // AI requests to insert or run code
//     // -------------------------------------

//     // AI raw JS execution
// if (lower.includes("run this")) {
//     const cleaned = text.replace(/run this/i, "").trim();

//     editorInstance.setValue(cleaned);
//     runCodeFromAI(editorInstance);

//     return;
// }
// // AI raw JS execution
// if (lower.includes("run this")) {
//     const cleaned = text.replace(/run this/i, "").trim();

//     editorInstance.setValue(cleaned);
//     runCodeFromAI(editorInstance);

//     return;
// }


//     // -------------------------------------
//     // Add point instruction (AI-generated)
//     // -------------------------------------
//     if (lower.includes("add point at")) {
//         const match = text.match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
//         if (match) {
//             const lon = parseFloat(match[1]);
//             const lat = parseFloat(match[2]);

//             viewer.entities.add({
//                 position: Cesium.Cartesian3.fromDegrees(lon, lat),
//                 point: { pixelSize: 12, color: Cesium.Color.YELLOW }
//             });
//         }
//     }
// }

// // Execute directly in browser
// function runCodeFromAI(editor) {
//     try {
//         const func = new Function("viewer", editor.getValue());
//         func(window.viewer);
//         console.log("AI code executed.");
//     } catch (err) {
//         console.error("AI code execution error:", err);
//     }
// }


/* global Cesium */
// static/js/ai/ai_actions.js
// import { viewer } from "../scene.js"; // IMPORTANT: scene.js must export `viewer` or a getter

// export function applyAIActions(text, editorInstance) {
//     if (!text) return;
//     const lower = text.toLowerCase();

//     // RAW JS execution
//     if (lower.includes("run this")) {
//         const cleaned = text.replace(/run this/i, "").trim();
//         if (editorInstance && typeof editorInstance.setValue === "function") {
//             editorInstance.setValue(cleaned);
//         }
//         runCodeFromAI(cleaned);
//         return;
//     }

//     // CAMERA: flyTo
//     if (lower.includes("fly to")) {
//         const match = text.match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
//         if (match) {
//             const lon = parseFloat(match[1]);
//             const lat = parseFloat(match[2]);
//             viewer.camera.flyTo({
//                 destination: Cesium.Cartesian3.fromDegrees(lon, lat, 3000),
//                 duration: 2
//             });
//             return;
//         }
//     }

//     // ADD POINT
//     if (lower.includes("add point at")) {
//         const match = text.match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
//         if (match) {
//             const lon = parseFloat(match[1]);
//             const lat = parseFloat(match[2]);
//             viewer.entities.add({
//                 position: Cesium.Cartesian3.fromDegrees(lon, lat),
//                 point: { pixelSize: 12, color: Cesium.Color.YELLOW }
//             });
//             return;
//         }
//     }

//     console.warn("AI sent unsupported or plain text:", text);
// }

// function runCodeFromAI(rawCode) {
//     try {
//         const func = new Function("viewer", rawCode);
//         func(viewer);
//         console.log("AI code executed.");
//     } catch (err) {
//         console.error("AI code execution error:", err);
//     }
// }


/* global Cesium */
// static/js/ai/ai_actions.js
import { viewer } from "../scene.js"; // IMPORTANT: scene.js must export `viewer` or a getter

export function applyAIActions(text, editorInstance) {
    if (!text) return;
    const lower = text.toLowerCase();

    // RAW JS execution
    if (lower.includes("run this")) {
        const cleaned = text.replace(/run this/i, "").trim();
        if (editorInstance && typeof editorInstance.setValue === "function") {
            editorInstance.setValue(cleaned);
        }
        runCodeFromAI(cleaned);
        return;
    }

    // CAMERA: flyTo
    if (lower.includes("fly to")) {
        const match = text.match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
        if (match) {
            const lon = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(lon, lat, 3000),
                duration: 2
            });
            return;
        }
    }

    // ADD POINT
    if (lower.includes("add point at")) {
        const match = text.match(/(-?\d+\.\d+)[^\d]+(-?\d+\.\d+)/);
        if (match) {
            const lon = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                point: { pixelSize: 12, color: Cesium.Color.YELLOW }
            });
            return;
        }
    }

    console.warn("AI sent unsupported or plain text:", text);
}

function runCodeFromAI(rawCode) {
    try {
        const func = new Function("viewer", rawCode);
        func(viewer);
        console.log("AI code executed.");
    } catch (err) {
        console.error("AI code execution error:", err);
    }
}
