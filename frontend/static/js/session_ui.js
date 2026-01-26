/**
 * session_ui.js
 * 
 * UI helper functions for session management.
 * Can be imported and used by any template/UI layout.
 */

import { 
    getAllSessions, 
    loadSessionById, 
    deleteSessionById, 
    saveCurrentSession,
    createNewSession,
    getCurrentSessionId 
} from './session_manager.js';

/**
 * Render sessions list to a container element
 * @param {HTMLElement} container - Container element for sessions list
 */
export async function renderSessionsList(container) {
    if (!container) return;

    try {
        const sessions = await getAllSessions();
        const currentId = getCurrentSessionId();

        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="session-empty">
                    <i class="fas fa-inbox"></i>
                    <div>No sessions yet</div>
                    <div style="margin-top: 8px; font-size: 12px;">Create your first session</div>
                </div>
            `;
            return;
        }

        container.innerHTML = sessions.map(session => {
            const date = new Date(session.timestamp);
            const isActive = session.id === currentId;

            return `
                <div class="session-item ${isActive ? 'active' : ''}" data-session-id="${session.id}">
                    <div class="session-header">
                        <div class="session-name">${escapeHtml(session.name)}</div>
                        <div class="session-actions">
                            <button class="session-action-btn load" title="Load session">
                                <i class="fas fa-folder-open"></i>
                            </button>
                            <button class="session-action-btn delete" title="Delete session">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="session-timestamp">
                        ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                    </div>
                </div>
            `;
        }).join('');

        // Attach event handlers
        container.querySelectorAll('.session-item').forEach(item => {
            const sessionId = item.dataset.sessionId;

            item.querySelector('.load')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                await loadSessionById(sessionId);
                await renderSessionsList(container);
            });

            item.querySelector('.delete')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Delete this session? This cannot be undone.')) {
                    await deleteSessionById(sessionId);
                    await renderSessionsList(container);
                }
            });

            // Double-click to load
            item.addEventListener('dblclick', async () => {
                await loadSessionById(sessionId);
                await renderSessionsList(container);
            });
        });

    } catch (e) {
        console.error('Failed to render sessions list:', e);
        container.innerHTML = '<div class="session-empty">Error loading sessions</div>';
    }
}

/**
 * Handle new session button click
 */
export async function handleNewSession() {
    const name = prompt('Enter session name:', `Session ${new Date().toLocaleDateString()}`);
    if (!name) return;

    try {
        await createNewSession(name);
        return true;
    } catch (e) {
        console.error('Failed to create session:', e);
        alert('Failed to create session');
        return false;
    }
}

/**
 * Handle save session button click
 */
export async function handleSaveSession() {
    try {
        const success = await saveCurrentSession();
        if (!success) {
            // No current session, create a new one
            return await handleNewSession();
        }
        return true;
    } catch (e) {
        console.error('Failed to save session:', e);
        alert('Failed to save session');
        return false;
    }
}

/**
 * Filter sessions list based on search term
 * @param {string} searchTerm - Search term
 * @param {HTMLElement} container - Container with session items
 */
export function filterSessions(searchTerm, container) {
    if (!container) return;

    const items = container.querySelectorAll('.session-item');
    const term = searchTerm.toLowerCase();

    items.forEach(item => {
        const name = item.querySelector('.session-name')?.textContent.toLowerCase() || '';
        item.style.display = name.includes(term) ? 'block' : 'none';
    });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
