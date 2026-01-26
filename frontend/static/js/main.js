// static/js/main.js
import { initScene, getViewer } from "./scene.js";
import { initUI } from "./ui.js";
import { initEditor } from "./editor.js";
import { initSessionManager } from "./session_manager.js";

console.log("Digital Twin IDE starting...");

// Boot sequence
(async function boot() {
    await initScene();        // create Cesium viewer
    initEditor();             // create CodeMirror editor
    initUI();                 // bind buttons, AI, sensors
    await initSessionManager(); // initialize session persistence

    console.log("Digital Twin IDE loaded.");
})();
