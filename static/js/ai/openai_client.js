/* eslint-env browser */
// static/js/ai/openai_client.js
import { applyAIActions } from './ai_actions.js';

export async function askAI(query, editorInstance) {
  console.log('Sending AI query:', query);

  const res = await fetch('/ai_query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();

  if (!data.success) {
    // If AI is unavailable, still try to apply the user's original query locally
    console.warn('AI Error or fallback:', data.error || data.message);
    try {
      await applyAIActions(query, editorInstance);
    } catch (err) {
      console.error('Local AI-action parsing failed:', err);
    }
    return data.message || (data.error || 'AI error.');
  }

  const text = data.message;
  console.log('AI Response text:', text);

  // Parse & apply potential actions (camera, entities, sensors)
  await applyAIActions(text, editorInstance);

  return text;
}
