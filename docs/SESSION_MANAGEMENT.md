# Session Management Feature

## Overview

The Digital Twin IDE now includes **session persistence** using **IndexedDB** for storing and managing IDE sessions. This allows users to save their work, switch between different projects, and restore their workspace state seamlessly.

## Why IndexedDB?

We chose **IndexedDB** over localStorage for the following reasons:

1. **Storage Capacity**: IndexedDB can store much larger amounts of data (GBs) compared to localStorage's 5-10MB limit
2. **Structured Data**: Native support for complex objects without JSON serialization overhead
3. **Async Operations**: Non-blocking operations that won't freeze the UI during save/load
4. **Performance**: Better performance for reading/writing large session states
5. **Future-proof**: Easily extensible to store additional data like screenshots, camera paths, etc.

## What Gets Saved

Each session stores a **lightweight, serializable** snapshot of the IDE state:

- **Camera State**: Position, direction, and up vector
- **Editor Content**: CodeMirror editor text content
- **Entities**: Serialized version of all Cesium entities (models, points, etc.)
- **Scene Settings**: Lighting, depth testing, and other scene configurations
- **Metadata**: Session name, timestamp, unique ID

## Architecture

### Core Modules

1. **`session_storage.js`** - Low-level IndexedDB wrapper
   - Database initialization
   - CRUD operations (Create, Read, Update, Delete)
   - Session counting and listing

2. **`session_manager.js`** - High-level session management
   - State capture and restoration
   - Auto-save functionality (every 30 seconds)
   - Session creation and switching
   - Entity serialization/deserialization

3. **`session_ui.js`** - UI helper functions
   - Session list rendering
   - User interaction handlers
   - Search/filter functionality

### Data Flow

```
User Action (UI)
    ↓
session_ui.js / inline handlers
    ↓
session_manager.js (capture/restore state)
    ↓
session_storage.js (IndexedDB operations)
    ↓
IndexedDB (persistent storage)
```

## Usage

### In Templates

The session management is integrated into `templates/digital_twin.html`:

1. **Sessions Tab** - New sidebar tab with session list
2. **Action Buttons**:
   - **New** - Create a new blank session
   - **Save** - Save current session (or create new if none exists)
3. **Session Items**:
   - **Load** (folder icon) - Restore session state
   - **Delete** (trash icon) - Delete session permanently
   - **Double-click** - Quick load session

### In Modular Setup

For the modular template (`digital_twin.modular.html`), import and initialize:

```javascript
import { initSessionManager } from './session_manager.js';

// During boot sequence
await initSessionManager();
```

### Programmatic API

```javascript
import * as SessionManager from './session_manager.js';

// Create new session
const sessionId = await SessionManager.createNewSession('My Project');

// Save current session
await SessionManager.saveCurrentSession();

// Load session by ID
await SessionManager.loadSessionById(sessionId);

// Get all sessions
const sessions = await SessionManager.getAllSessions();

// Delete session
await SessionManager.deleteSessionById(sessionId);

// Get current session ID
const currentId = SessionManager.getCurrentSessionId();

// Capture current state (without saving)
const state = SessionManager.captureState();

// Restore state (without loading from DB)
await SessionManager.restoreState(state);
```

## Auto-Save

Sessions are **automatically saved every 30 seconds** if a session is active. This ensures minimal data loss in case of browser crashes or accidental tab closes.

To disable auto-save:
```javascript
// In session_manager.js, comment out the auto-save interval
// if (autoSaveInterval) clearInterval(autoSaveInterval);
// autoSaveInterval = setInterval(autoSaveCurrentSession, 30000);
```

## Entity Serialization

Entities are serialized to a lightweight format:

```javascript
{
  id: "entity-123",
  name: "My Model",
  position: { x: 1234.5, y: 6789.0, z: 100.0 },
  modelUri: "/static/assets/models/cars/sedan.glb",
  // OR for points:
  point: {
    pixelSize: 10,
    color: { red: 1.0, green: 0.0, blue: 0.0, alpha: 1.0 }
  }
}
```

Only essential, serializable properties are stored. Complex Cesium objects are reconstructed on restore.

## Storage Limits

- **IndexedDB**: Typically 50% of available disk space (hundreds of GB on modern systems)
- **Per-session size**: Generally < 1MB for typical scenes (10-100 entities)
- **Recommended limit**: 1000 sessions or 100MB total (well within limits)

## Browser Compatibility

| Browser | IndexedDB Support |
|---------|-------------------|
| Chrome | ✅ v24+ |
| Firefox | ✅ v16+ |
| Safari | ✅ v10+ |
| Edge | ✅ All versions |

## Security Considerations

- Sessions are stored **locally in the browser** (not on server)
- Data is **not encrypted** by default (stored in plaintext in IndexedDB)
- Sessions are **per-origin** (isolated by domain)
- **No authentication** - any user with access to the browser can view sessions

For sensitive projects, consider:
- Adding encryption before storing state
- Implementing user authentication
- Server-side session backup

## Troubleshooting

### Sessions not loading
1. Check browser console for errors
2. Verify IndexedDB is enabled (not in private/incognito mode)
3. Check if storage quota is exceeded
4. Try clearing browser data and starting fresh

### Auto-save not working
1. Verify a session is active (create one first)
2. Check console for auto-save logs
3. Ensure page stays open for 30+ seconds

### Large session size
1. Clear unnecessary entities before saving
2. Avoid storing large textures or custom geometries
3. Use model URIs instead of inline geometry

## Future Enhancements

Potential improvements:
- [ ] Session thumbnails/previews
- [ ] Export/import sessions as JSON files
- [ ] Session tagging and categorization
- [ ] Session version history
- [ ] Cloud sync (optional server-side backup)
- [ ] Session sharing via export codes
- [ ] Compression for large sessions
- [ ] Selective state persistence (choose what to save)

## Testing

Test the session management:

```javascript
// In browser console:

// Create test session
await SessionManager.createNewSession('Test Session');

// Add some entities
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 100),
  point: { pixelSize: 20, color: Cesium.Color.RED }
});

// Save
await SessionManager.saveCurrentSession();

// Clear scene
viewer.entities.removeAll();

// Reload session
const sessions = await SessionManager.getAllSessions();
await SessionManager.loadSessionById(sessions[0].id);

// Entity should reappear
```

## Files Modified/Created

### New Files
- `frontend/static/js/session_storage.js` - IndexedDB wrapper
- `frontend/static/js/session_manager.js` - Session management logic
- `frontend/static/js/session_ui.js` - UI helper functions
- `docs/SESSION_MANAGEMENT.md` - This documentation

### Modified Files
- `templates/digital_twin.html` - Added Sessions tab and UI integration
- `frontend/static/js/main.js` - Added session manager initialization

## License

Same as parent project.
