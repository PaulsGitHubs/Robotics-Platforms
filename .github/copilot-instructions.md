# Copilot / AI Agent Instructions — Robotics Platforms

Quick orient: this file contains the minimal, repo-specific facts an AI coding agent needs to be productive (what runs where, how to run tests, important patterns and security gotchas).

## Big picture (what to know first) ✅

- Two runtime modes co-exist:
  - **FastAPI backend**: `backend/src/server.py` — exposes public APIs: `/api/geo`, `/api/public-data`, `/api/telecom`, `/api/simulation`, `/health`. Tests target this server using FastAPI's `TestClient`.
  - **Flask IDE server**: `Server_Host.py` — serves the in-browser Digital Twin IDE, templates and a working `/ai_query` endpoint (used by the front-end to ask the AI engine).
- Frontend assets live under `frontend/` and `frontend/static` (served directly by both servers in different contexts). The templates are in `templates/` and demos in `demos/`.
- AI glue:
  - Backend AI wrapper: `ai_integration/ai_integration.py` (OpenAI client usage).
  - IDE endpoint: `/ai_query` in `Server_Host.py` (the FastAPI server does _not_ currently expose `/ai_query`).
  - Client: `frontend/static/js/ai/openai_client.js` → calls `/ai_query`, responses are interpreted by `frontend/static/js/ai/ai_actions.js`.

## How to run & debug locally 🔧

- Backend (API):
  - Install deps: `python -m pip install -r backend/requirements.txt`
  - Run dev server (uses PYTHONPATH=repo-root): `py -3 -m uvicorn backend.src.server:app --reload --port 8000` (or use `scripts/run_uvicorn.bat` / `.ps1` which set PYTHONPATH for you).
- IDE (Flask):
  - Install deps: `pip install flask python-dotenv openai` (see `documentation/readme.md`)
  - Run: `python Server_Host.py` → opens IDE on `http://127.0.0.1:5000`.
- Serve static templates only: `python scripts/serve_templates.py` (starts on port 5500)
- Tests:
  - Run: `python -m pytest backend/tests`
  - Backend tests use `fastapi.testclient.TestClient(app)` and rely on the FastAPI app object at `backend.src.server:app`.
- Frontend E2E (Playwright): `npm install` then from `frontend/` run `npm run test:e2e`.

## Project-specific conventions & patterns 💡

- External failure tolerance: public endpoints (e.g. `public_data_routes.py`) swallow upstream errors and return safe defaults (e.g., `[]`) so keep changes compatible with that resilience pattern.
- Simulation endpoints are intentionally simple/stubbed (e.g., `/api/simulation/zone`) to avoid importing heavy/missing dependencies — follow the established pattern for lightweight stubs in tests.
- Defensive imports: several optional modules may not exist at runtime (the Flask server wraps AI import in try/except). Follow this pattern when adding optional integrations.
- Client-driven AI actions: `ai_actions.js` parses free text and executes actions (including executing JS via `new Function` when text starts with `run `). This is a deliberate developer convenience and a security risk—treat `run` as dev-only.

## Integration & external dependencies 🔗

- OpenAI is used by `ai_integration/ai_integration.py` (calls `OpenAI(api_key=...)`).
- OSM Overpass endpoint used in `backend/src/services/osm_services.py` (env var `OSM_OVERPASS_URL` overrides the default).
- Cesium Ion token is read by `Server_Host.py` (`CESIUM_ION_TOKEN`) to enable the 3D viewer.

## Security & secrets (IMPORTANT) ⚠️

- A `.env` file exists in the repository with keys (OPENAI_API_KEY, CESIUM_ION_TOKEN). **This is a leak** — rotate those keys immediately and remove `.env` from the repo.
- Action items for maintainers:
  - Remove committed `.env` and add a `.env.example` with placeholders.
  - Add a short note in README and CI to check for secrets on PRs or use `git-secrets`/`pip-audit` in CI.
- Do not enable or ship the `run` JS execution behaviour to production without strict sandboxing and authentication checks.

## Concrete examples & files to inspect 📚

- API routing and endpoints: `backend/src/server.py`, `backend/src/routes/*.py`
- Upstream logic: `backend/src/services/osm_services.py` (look at the catch-and-return-empty behavior)
- AI endpoint: `Server_Host.py` (endpoint `/ai_query`) and AI wrapper `ai_integration/ai_integration.py`
- Client AI behavior: `frontend/static/js/ai/openai_client.js` and `frontend/static/js/ai/ai_actions.js`
- Tests: `backend/tests/*.py` (use these as canonical test patterns)
- Static/demo serving helpers: `scripts/serve_templates.py`, `scripts/run_uvicorn.*`

## Good first tasks for agent contributions ✅

- Add a FastAPI `/ai_query` route that delegates to `ai_integration.AIEngine` (mirrors Flask behaviour) and add tests.
- Add `.env.example` and remove committed `.env` (plus docs to rotate keys). Mark as high priority.
- Add a safe, configurable sandbox for `run`-style AI-executed code, or disable it behind a dev-only flag.
- Add CI workflow to run Playwright E2E tests (currently README references CI but `.github/workflows` isn't present/complete).

## How to produce PRs here 🧾

- Ensure `backend` tests pass (`python -m pytest backend/tests`).
- If changing frontend, run Playwright tests locally (`npm run test:e2e`) where possible.
- Don't commit secrets; include `.env.example` and update README if you change env vars.

---

If anything above is unclear or you'd like me to expand any area (security remediation steps, adding FastAPI `/ai_query`, or drafting an immediate PR to remove the leaked `.env`), tell me which piece to iterate on and I'll prepare a small, focused patch. ✨
