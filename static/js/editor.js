import { getViewer } from "./scene.js";

let editorObj = null;

export function initEditor() {
    const textArea = document.getElementById("editor");

    editorObj = CodeMirror.fromTextArea(textArea, {
        lineNumbers: true,
        mode: "javascript",
        theme: "dracula",
        matchBrackets: true,
        autoCloseBrackets: true
    });

    editorObj.setSize("100%", "100%");
    setupButtons();
}

function setupButtons() {
    document.getElementById("runButton").onclick = runCode;
    document.getElementById("stopButton").onclick = clearOutput;
    document.getElementById("saveButton").onclick = saveScript;
}

function runCode() {
    clearOutput();
    const code = editorObj.getValue();

    const viewer = getViewer();
    if (!viewer) {
        logOutput("Viewer not ready.");
        return;
    }

    try {
        const func = new Function("viewer", code);
        func(viewer);
        logOutput("Script executed successfully.");
    } catch (err) {
        logOutput("Error: " + err.message);
    }
}

function logOutput(msg) {
    const div = document.getElementById("consoleOutput");
    div.innerText += msg + "\n";
}

function clearOutput() {
    document.getElementById("consoleOutput").innerText = "";
}

function saveScript() {
    localStorage.setItem("userScript", editorObj.getValue());
    logOutput("Saved.");
}
