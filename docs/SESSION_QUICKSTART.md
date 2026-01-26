# Session Management - Quick Start Guide

## 🎯 Overview

The Digital Twin IDE now has **session persistence** using **IndexedDB**. Save your work, manage multiple projects, and never lose your progress!

## 🚀 Getting Started

### 1. Start the IDE

```powershell
# Start the Flask server
python Server_Host.py
```

Open http://127.0.0.1:5000 in your browser.

### 2. Create Your First Session

1. Click the **"Sessions"** tab in the left sidebar
2. Click **"New"** button
3. Enter a session name (e.g., "My First Project")
4. Start working!

### 3. Your Session is Auto-Saved

Every 30 seconds, your current session is automatically saved. No need to manually save constantly!

### 4. Manual Save

Click **"Save"** button in the Sessions tab to save immediately.

## 📋 Common Workflows

### Scenario 1: Working on Multiple Projects

```
1. Create "Building Design" session
2. Add entities, write code, adjust camera
3. Click "New" to create "City Planning" session
4. Work on the new project
5. Double-click "Building Design" to switch back
```

### Scenario 2: Sharing Your Work

```
1. Complete your scene
2. Save the session
3. Take screenshots/recordings
4. Export code from editor
5. (Future: Export session as JSON file)
```

### Scenario 3: Recovering Lost Work

```
1. Oops! Browser crashed
2. Reopen the IDE
3. Go to Sessions tab
4. Your sessions are still there!
5. Double-click to restore
```

## 🎮 UI Guide

### Sessions Tab

```
┌─────────────────────────────────┐
│ Sessions                         │
│ ┌─────────┐ ┌─────────┐        │
│ │  New    │ │  Save   │        │
│ └─────────┘ └─────────┘        │
│                                  │
│ [Search sessions...]            │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ My Project           📂 🗑️ │ │
│ │ 1/26/2026 10:30 AM          │ │
│ └─────────────────────────────┘ │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ City Scene          📂 🗑️  │ │
│ │ 1/25/2026 3:45 PM           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

- 📂 **Load** - Click to restore this session
- 🗑️ **Delete** - Click to permanently delete
- **Double-click** - Quick load
- **Search** - Filter sessions by name

## 🧪 Testing the Feature

### Browser Console Tests

```javascript
// Load the test suite
const script = document.createElement('script');
script.type = 'module';
script.src = '/static/js/test_session_management.js';
document.head.appendChild(script);

// Wait a moment, then run tests
setTimeout(() => {
    testSessionManagement.runAllTests();
}, 1000);
```

### Manual Testing Checklist

- [ ] Create a new session
- [ ] Add some entities to the scene
- [ ] Write code in the editor
- [ ] Move the camera
- [ ] Save the session
- [ ] Create another session
- [ ] Switch back to first session
- [ ] Verify entities, code, and camera restored
- [ ] Delete a session
- [ ] Verify it's gone from the list
- [ ] Refresh the page
- [ ] Verify sessions persist after reload

## 🔧 Technical Details

### What Gets Saved

- ✅ Camera position and orientation
- ✅ Editor code content
- ✅ All entities (models, points, etc.)
- ✅ Scene settings (lighting, terrain options)

### What Doesn't Get Saved

- ❌ Simulation state (running/paused)
- ❌ Temporary UI state (sidebar collapsed, etc.)
- ❌ Network-loaded data (unless explicitly captured)
- ❌ Console output

### Storage Location

Sessions are stored in **IndexedDB** in your browser:
- **Database**: `DigitalTwinIDE`
- **Store**: `sessions`
- **Location**: Browser local storage (not on server)

### Data Size

Typical session sizes:
- **Empty scene**: ~200 bytes
- **10 entities**: ~2-5 KB
- **100 entities**: ~20-50 KB
- **Large project**: ~500 KB

You can easily store **hundreds of sessions** without issues!

## 🐛 Troubleshooting

### Sessions not appearing

**Check browser console** for errors:
1. Press F12
2. Look for red errors
3. Verify IndexedDB is enabled

**Try incognito mode disabled?**
IndexedDB doesn't work in private browsing mode in some browsers.

### Can't load session

**Verify session exists**:
```javascript
import { getAllSessions } from '/static/js/session_manager.js';
const sessions = await getAllSessions();
console.log(sessions);
```

### Auto-save not working

**Check if session is active**:
```javascript
import { getCurrentSessionId } from '/static/js/session_manager.js';
console.log('Current session:', getCurrentSessionId());
```

If `null`, create or load a session first.

### Clear all sessions (nuclear option)

**Browser console**:
```javascript
indexedDB.deleteDatabase('DigitalTwinIDE');
location.reload();
```

## 🎓 API Examples

### Programmatic Session Management

```javascript
// Import the session manager
import * as SM from '/static/js/session_manager.js';

// Initialize
await SM.initSessionManager();

// Create new session
const id = await SM.createNewSession('API Test');

// Capture state without saving
const state = SM.captureState();
console.log('Entities:', state.entities.length);

// Save current session
await SM.saveCurrentSession();

// List all sessions
const all = await SM.getAllSessions();
console.log('Sessions:', all.map(s => s.name));

// Load specific session
await SM.loadSessionById(id);

// Delete session
await SM.deleteSessionById(id);
```

### Custom State Management

```javascript
import { captureState, restoreState } from '/static/js/session_manager.js';

// Capture current state
const backup = captureState();

// Make risky changes
// ... experimental code ...

// Restore if needed
await restoreState(backup);
```

## 📚 Additional Resources

- Full documentation: `docs/SESSION_MANAGEMENT.md`
- Source code: `frontend/static/js/session_*.js`
- Related: `templates/digital_twin.html` (Sessions tab)

## 💡 Tips & Tricks

1. **Name sessions descriptively**: Use dates, project names, or milestones
2. **Save before experiments**: Create a "backup" session before trying risky code
3. **Use search**: Filter sessions quickly with the search box
4. **Regular cleanup**: Delete old sessions you no longer need
5. **Auto-save is your friend**: Wait 30 seconds after changes for auto-save

## 🎉 What's Next?

Future enhancements planned:
- Session thumbnails/previews
- Export/import sessions as files
- Cloud sync (optional)
- Session tags and categories
- Version history

---

**Happy coding! 🚀**
