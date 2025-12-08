// static/js/editor.js
import { viewer } from "./scene.js";

let editorObj = null;

export function initEditor() {
    const textArea = document.getElementById("editor");

    editorObj = CodeMirror.fromTextArea(textArea, {
        lineNumbers: true,
        mode: "javascript",
        theme: "dracula",
        matchBrackets: true,
        autoCloseBrackets: true,
    });

    editorObj.setSize("100%", "100%");

    setupButtons();
}

function setupButtons() {
    document.getElementById("runButton").onclick = () => runCode();
    document.getElementById("stopButton").onclick = () => clearOutput();
    document.getElementById("saveButton").onclick = () => saveScript();
}

// -------------------------
// Execute code
// -------------------------
function runCode() {
    clearOutput();
    const code = editorObj.getValue();
    try {
        const func = new Function("viewer", code);
        func(viewer);
        logOutput("Script executed successfully.");
    } catch (err) {
        logOutput("Error: " + err);
    }
}

// -------------------------
// Console Output
// -------------------------
function logOutput(msg) {
    const div = document.getElementById("consoleOutput");
    div.innerText += msg + "\n";
}

function clearOutput() {
    document.getElementById("consoleOutput").innerText = "";
}

// -------------------------
// Save Script (LocalStorage)
// -------------------------
function saveScript() {
    const code = editorObj.getValue();
    localStorage.setItem("userScript", code);
    logOutput("Saved.");
}
