/**
 * session_manager.js
 * 
 * High-level session management interface for the Digital Twin IDE.
 * Handles capturing, restoring, and managing IDE sessions.
 * 
 * Ultra-Simple Design: Store ONLY the editor code!
 * 
 * Why? Because the user's code recreates EVERYTHING:
 * ✓ Entities (viewer.entities.add)
 * ✓ Camera (flyTo, camera.setView)
 * ✓ Scene settings (viewer.scene.*)
 * ✓ Animations, sensors, models
 * 
 * Benefits:
 * - Tiny storage (just text, typically 1-10 KB)
 * - Editable (users can modify saved code)
 * - Reproducible (same code = same scene)
 * - Version-controllable (it's just JavaScript)
 */

import { saveSession, loadSession, listSessions, deleteSession, getSessionCount, initDB } from './session_storage.js';

// Get viewer from global scope (defined in the template)
function getViewer() {
    return window.viewer;
}

// Current active session
let currentSessionId = null;
let autoSaveInterval = null;

/**
 * Initialize session manager
 */
export async function initSessionManager() {
    await initDB();
    
    // Migrate old sessions with buggy code
    await migrateOldSessions();
    
    // Try to restore last session
    const sessions = await listSessions();
    if (sessions.length > 0) {
        console.log(`Found ${sessions.length} existing session(s)`);
    }
    
    // Setup auto-save (every 30 seconds)
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(autoSaveCurrentSession, 30000);
}

/**
 * Migrate old sessions that have buggy viewer.scene code
 */
async function migrateOldSessions() {
    try {
        const sessions = await listSessions();
        let migratedCount = 0;
        
        for (const session of sessions) {
            if (!session.state || !session.state.editor) continue;
            
            let code = session.state.editor;
            let needsUpdate = false;
            
            // Fix skyAtmosphere access
            if (code.includes('viewer.scene.skyAtmosphere.show') && 
                !code.includes('if (viewer.scene.skyAtmosphere)')) {
                code = code.replace(
                    /viewer\.scene\.skyAtmosphere\.show\s*=\s*true;?/g,
                    'if (viewer.scene.skyAtmosphere) {\n    viewer.scene.skyAtmosphere.show = true;\n  }'
                );
                needsUpdate = true;
            }
            
            // Fix fog access
            if (code.includes('viewer.scene.fog.enabled') && 
                !code.includes('if (viewer.scene.fog)')) {
                code = code.replace(
                    /viewer\.scene\.fog\.enabled\s*=\s*true;?/g,
                    'if (viewer.scene.fog) {\n    viewer.scene.fog.enabled = true;\n  }'
                );
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                session.state.editor = code;
                await saveSession(session.id, session.name, session.state);
                migratedCount++;
            }
        }
        
        if (migratedCount > 0) {
            console.log(`✓ Migrated ${migratedCount} session(s) with defensive property checks`);
        }
    } catch (e) {
        console.warn('Session migration failed:', e);
    }
}

/**
 * Capture current IDE state
 * @returns {Object} Current state snapshot
 */
export function captureState() {
    const state = {
        editor: ''
    };

    // Capture editor content (CodeMirror) - THIS IS ALL WE NEED!
    // The editor code recreates the ENTIRE scene including:
    // - All entities (via viewer.entities.add)
    // - Camera position (via flyTo, camera.setView, etc.)
    // - Scene settings (can be in user code too)
    try {
        const editorElement = document.querySelector('.CodeMirror');
        if (editorElement && editorElement.CodeMirror) {
            state.editor = editorElement.CodeMirror.getValue();
        }
    } catch (e) {
        console.warn('Could not capture editor state:', e);
    }

    return state;
}

// Entity serialization removed - not needed!
// The user's code in the editor recreates all entities when executed.

/**
 * Restore state to the IDE
 * @param {Object} state - State snapshot
 */
export async function restoreState(state) {
    if (!state) return;

    const viewer = getViewer();

    // 1. Restore editor content
    if (state.editor) {
        try {
            const editorElement = document.querySelector('.CodeMirror');
            if (editorElement && editorElement.CodeMirror) {
                editorElement.CodeMirror.setValue(state.editor);
            }
        } catch (e) {
            console.warn('Failed to restore editor content:', e);
        }
    }

    // 2. Clear the scene
    if (viewer && viewer.entities) {
        viewer.entities.removeAll();
    }

    // 3. Auto-execute the code to recreate the scene
    try {
        if (typeof window.runCode === 'function') {
            // Give the editor a moment to update, then run
            setTimeout(() => {
                try {
                    window.runCode();
                } catch (e) {
                    console.warn('Failed to execute restored code:', e);
                }
            }, 100);
        }
    } catch (e) {
        console.warn('Failed to execute user code:', e);
    }
}

/**
 * Auto-save current session
 */
async function autoSaveCurrentSession() {
    if (!currentSessionId) return;
    
    try {
        const session = await loadSession(currentSessionId);
        if (!session) return;

        const state = captureState();
        await saveSession(currentSessionId, session.name, state);
        console.log(`Auto-saved session: ${session.name}`);
    } catch (e) {
        console.warn('Auto-save failed:', e);
    }
}

/**
 * Save a new session
 * @param {string} name - Session name
 * @returns {Promise<string>} Session ID
 */
async function saveNewSession(name) {
    const state = captureState();
    const id = `session_${Date.now()}`;
    await saveSession(id, name, state);
    currentSessionId = id;
    console.log(`New session created: ${name}`);
    return id;
}

/**
 * Load a session by ID
 * @param {string} id - Session ID
 * @returns {Promise<boolean>}
 */
export async function loadSessionById(id) {
    try {
        const session = await loadSession(id);
        if (!session) return false;

        await restoreState(session.state);
        currentSessionId = id;
        console.log(`Session loaded: ${session.name}`);
        return true;
    } catch (e) {
        console.error('Failed to load session:', e);
        return false;
    }
}

/**
 * Update current session (manual save)
 * @returns {Promise<boolean>}
 */
export async function saveCurrentSession() {
    if (!currentSessionId) {
        // No current session - signal caller to create a new one with a prompt
        return false;
    }

    try {
        const session = await loadSession(currentSessionId);
        if (!session) return false;

        const state = captureState();
        await saveSession(currentSessionId, session.name, state);
        console.log(`Session updated: ${session.name}`);
        return true;
    } catch (e) {
        console.error('Failed to save session:', e);
        return false;
    }
}

/**
 * Delete a session by ID
 * @param {string} id - Session ID
 * @returns {Promise<boolean>}
 */
export async function deleteSessionById(id) {
    try {
        await deleteSession(id);
        if (currentSessionId === id) {
            currentSessionId = null;
        }
        console.log(`Session deleted: ${id}`);
        return true;
    } catch (e) {
        console.error('Failed to delete session:', e);
        return false;
    }
}

/**
 * Get all sessions
 * @returns {Promise<Array>}
 */
export async function getAllSessions() {
    return await listSessions();
}

/**
 * Get current session ID
 * @returns {string|null}
 */
export function getCurrentSessionId() {
    return currentSessionId;
}

/**
 * Create a new blank session
 * @param {string} name - Session name
 * @returns {Promise<string>} New session ID
 */
export async function createNewSession(name) {
    // Clear current state
    const viewer = getViewer();
    if (viewer) {
        viewer.entities.removeAll();
    }

    // Clear editor
    try {
        const editorElement = document.querySelector('.CodeMirror');
        if (editorElement && editorElement.CodeMirror) {
            editorElement.CodeMirror.setValue('');
        }
    } catch (e) {}

    // Save as new session
    return await saveNewSession(name || `New Session ${new Date().toLocaleString()}`);
}

// Re-export saveSession for rename functionality
export { saveSession };

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
});
