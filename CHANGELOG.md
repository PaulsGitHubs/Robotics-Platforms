# Changelog

All notable changes to this project will be documented in this file.

## 2026-01-26 - Session Management Feature
### Added
- **IndexedDB-based session persistence** for the Digital Twin IDE
  - Create, save, load, and delete multiple IDE sessions
  - Auto-save functionality (every 30 seconds)
  - Session search and filtering
  - Lightweight state serialization (camera, entities, editor, scene settings)
- **New "Sessions" tab** in the IDE sidebar with intuitive UI
- **Three new JavaScript modules**:
  - `session_storage.js` - IndexedDB wrapper with CRUD operations
  - `session_manager.js` - High-level session management and state capture/restore
  - `session_ui.js` - UI helper functions for session rendering
- **Comprehensive documentation**:
  - `docs/SESSION_MANAGEMENT.md` - Technical documentation and API reference
  - `docs/SESSION_QUICKSTART.md` - User-friendly quick start guide
  - `docs/IMPLEMENTATION_SUMMARY.md` - Implementation overview
- **Test suite**: `test_session_management.js` with 5 automated tests

### Modified
- Updated `templates/digital_twin.html` with session management UI and handlers
- Enhanced `frontend/static/js/main.js` to initialize session manager on boot
- Updated `README.md` with session management section

### Technical Details
- Uses IndexedDB for persistent storage (GBs capacity vs localStorage's 5-10MB)
- Async operations prevent UI blocking
- Typical session size: 2-50 KB for most projects
- Entity serialization optimized for minimal storage footprint

## 2026-01-04 - Disable Playwright E2E in CI
- Disabled automated Playwright E2E runs (removed ) because PRs were failing due to container initialization issues on GitHub Actions. Tests can still be run manually in the Actions tab or locally with .

