/**
 * session_storage.js
 * 
 * IndexedDB-backed session persistence for the Digital Twin IDE.
 * 
 * Design Philosophy: Store ONLY the user's editor code!
 * 
 * When the code runs via runCode(), it recreates:
 * - All entities (via viewer.entities.add)
 * - Camera position (via flyTo, camera.setView, etc.)
 * - Scene settings (via viewer.scene.globe.*, etc.)
 * - Animations, sensors, models - everything!
 * 
 * This makes sessions:
 * - Tiny (just text)
 * - Editable (it's code!)
 * - Reproducible (same code = same scene)
 * - Version-controllable (plain JavaScript)
 */

const DB_NAME = 'DigitalTwinIDE';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

let dbInstance = null;

/**
 * Initialize IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
export async function initDB() {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create sessions object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('name', 'name', { unique: false });
            }
        };
    });
}

/**
 * Save a session to IndexedDB
 * @param {string} id - Unique session identifier
 * @param {string} name - Human-readable session name
 * @param {Object} state - Session state object
 * @returns {Promise<void>}
 */
export async function saveSession(id, name, state) {
    const db = await initDB();
    
    const session = {
        id,
        name,
        timestamp: Date.now(),
        state: {
            editor: state.editor || '' // Just the code - it recreates everything!
        }
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(session);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Load a session from IndexedDB
 * @param {string} id - Session identifier
 * @returns {Promise<Object|null>}
 */
export async function loadSession(id) {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * List all sessions
 * @returns {Promise<Array>}
 */
export async function listSessions() {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const sessions = request.result || [];
            // Sort by timestamp descending (most recent first)
            sessions.sort((a, b) => b.timestamp - a.timestamp);
            resolve(sessions);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Delete a session
 * @param {string} id - Session identifier
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get session count
 * @returns {Promise<number>}
 */
export async function getSessionCount() {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
