// static/js/ui.js

import { getViewer, clearAllEntities } from './scene.js';
import { enableSensorPlacement } from './sensors/sensor_dragdrop.js';
import { askAI } from './ai/openai_client.js';

export function initUI() {
  console.log('UI initialized.');

  // Enable sensor drag & drop AFTER scene is ready
  enableSensorPlacement();

  // Home camera button
  document.getElementById('centerHome')?.addEventListener('click', () => {
    const viewer = getViewer();
    if (!viewer) {
      console.warn('Viewer not ready yet');
      return;
    }
    viewer.camera.flyHome(1.5);
  });

  // Clear entities button
  document.getElementById('clearEntities')?.addEventListener('click', () => {
    clearAllEntities();
  });

  // AI send button
  // Support both old id (#askAI) and newer id (#askAiBtn)
  (document.getElementById('askAI') || document.getElementById('askAiBtn'))?.addEventListener(
    'click',
    () => {
      handleAIQuery();
    }
  );

  // Send on Enter (single-line send) but allow Shift+Enter for newline
  const aiInput = document.getElementById('aiInput');
  if (aiInput) {
    aiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAIQuery();
      }
    });
    aiInput.setAttribute('aria-label', 'AI command input');
  }

  // Toggle AI panel visibility from the main UI
  document.getElementById('openAiPanel')?.addEventListener('click', () => {
    const panel = document.getElementById('ai-panel');
    if (!panel) return;
    const hidden = panel.style.display === 'none' || panel.style.display === '';
    panel.style.display = hidden ? 'flex' : 'none';
    if (hidden) {
      // focus the input to encourage user interaction
      setTimeout(() => document.getElementById('aiInput')?.focus(), 50);
    }
  });

  // AI help toggle
  document.getElementById('aiHelpBtn')?.addEventListener('click', () => {
    const help = document.getElementById('aiHelp');
    if (!help) return;
    help.style.display =
      help.style.display === 'none' || help.style.display === '' ? 'block' : 'none';
  });
}

// -------------------------
// AI Query Handler
// -------------------------
async function handleAIQuery() {
  const inputEl = document.getElementById('aiInput');
  if (!inputEl) return;

  const input = inputEl.value.trim();
  if (!input) return;

  try {
    const text = await askAI(input);
    console.log('AI Response:', text);

    const consoleDiv = document.getElementById('consoleOutput');
    if (consoleDiv) {
      consoleDiv.innerText = text;
    }
    const resp = document.getElementById('aiResponse');
    if (resp) resp.innerText = text;
  } catch (err) {
    console.error('AI query failed', err);
    const resp = document.getElementById('aiResponse');
    if (resp) resp.innerText = 'AI request failed.';
  }
}
