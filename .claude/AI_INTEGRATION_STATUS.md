# AI Integration Status: Life Dashboard

## Overview

The AI Integration project adds a "Life Dashboard" tab to Thunderbird that displays an intelligent overview of email-derived information. The dashboard is served by a FastAPI backend that provides REST API access to the email analysis system, with a React frontend and mailbox reader for Thunderbird's local mail storage.

**Current Status: 50% Complete (20/40 tasks)**

| Phase | Component | Status | Tasks |
|-------|-----------|--------|-------|
| 1 | Thunderbird Tab | ✅ Complete | 10/10 |
| 2 | FastAPI Backend | ✅ Complete | 10/10 |
| 3 | Mailbox Reader | ⏳ Pending | 0/7 |
| 4 | Dashboard UI | ⏳ Pending | 0/7 |
| 5 | Integration | ⏳ Pending | 0/6 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Thunderbird Desktop                       │
├─────────────────────────────────────────────────────────────┤
│  Tab Bar: [Mail] [Life Dashboard] [Calendar] [Chat] [+]     │
│                        │                                     │
│                        ▼                                     │
│           ┌──────────────────────┐                          │
│           │  <browser> element   │ (lifeTabBrowser)         │
│           │  id="lifeTabPanel"   │                          │
│           └──────────────────────┘                          │
│                        │                                     │
└────────────────────────│────────────────────────────────────┘
                         │ HTTP (localhost:8000)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
├─────────────────────────────────────────────────────────────┤
│  Endpoints:                                                  │
│    GET /health          - Health check                       │
│    GET /health/db       - Database connectivity check        │
│    GET /accounts        - List email accounts                │
│    GET /accounts/{id}   - Get account details                │
│    GET /entities        - List extracted entities            │
│    GET /entities/{id}   - Get entity details                 │
│    GET /entities/{id}/relationships - Entity relationships   │
│    GET /relationships   - List relationships                 │
│    GET /relationships/{id} - Get relationship details        │
│    GET /emails          - List/search emails                 │
│    GET /emails/{id}     - Get email details                  │
│    GET /emails/{id}/content - Get email body                 │
│    GET /emails/thread/{id}  - Get thread                     │
│    GET /dashboard/today     - Today's summary                │
│    GET /dashboard/summary   - Overall statistics             │
│                                                              │
│  Features:                                                   │
│    - Rate limiting (100/min per IP)                          │
│    - Request logging with duration tracking                  │
│    - Static test page at root (/)                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  Tables: accounts, emails, canonical_entities,               │
│          entity_mentions, entity_relationships               │
└─────────────────────────────────────────────────────────────┘
```

---

## Running the FastAPI Backend

### Prerequisites

1. PostgreSQL database running with email-poc schema
2. Python 3.12+
3. The email-poc monorepo cloned

### Setup

```bash
# Navigate to the API package
cd /path/to/email-poc/v1/packages/api

# Create virtual environment (if not using workspace venv)
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or: .venv\Scripts\activate  # Windows

# Install dependencies (including local packages)
pip install -e .
pip install -e ../core
pip install -e ../db

# Or if using the workspace:
cd /path/to/email-poc/v1
pip install -e packages/api -e packages/core -e packages/db
```

### Configuration

Create a `.env` file in `packages/api/` or set environment variables:

```bash
# Database connection
DATABASE_URL=postgresql://user:password@localhost/email_poc

# Optional: Server configuration
API_HOST=127.0.0.1
API_PORT=8000
DEBUG=false
```

### Running the Server

```bash
# From packages/api directory
cd /path/to/email-poc/v1/packages/api

# Option 1: Manual start (recommended for development)
uvicorn api.main:app --reload

# Option 2: Using the start script (supports background mode)
./scripts/start-server.sh               # Start in background
./scripts/start-server.sh --foreground  # Start in foreground
./scripts/start-server.sh --check       # Check if running
./scripts/start-server.sh --stop        # Stop server

# Option 3: With explicit host/port
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

The server will start at `http://localhost:8000`

### Auto-Start from Thunderbird (Optional)

Thunderbird can automatically start the backend when opening the Life tab. To enable:

1. Edit `mail/base/content/lifeTabs.js`
2. Set `LIFE_DASHBOARD_AUTO_START.backendPath` to your API scripts directory:
   ```javascript
   const LIFE_DASHBOARD_AUTO_START = {
     enabled: true,
     backendPath: "/path/to/email-poc/v1/packages/api/scripts",
     maxRetries: 3,
     retryDelay: 2000,
   };
   ```

When configured, Thunderbird will:
1. Check if the backend is running when opening the Life tab
2. If not running, execute `start-server.sh` to start it
3. Retry connection after the server starts
4. Show the error page only if all retries fail

### Verify Server is Running

```bash
# Health check
curl http://localhost:8000/health
# Expected: {"status": "ok"}

# Database health check
curl http://localhost:8000/health/db
# Expected: {"status": "ok", "database": "connected", "active_accounts": N}

# API documentation
open http://localhost:8000/docs      # Swagger UI
open http://localhost:8000/redoc     # ReDoc
```

### API Endpoints Reference

| Endpoint | Method | Description | Query Parameters |
|----------|--------|-------------|------------------|
| `/health` | GET | Basic health check | - |
| `/health/db` | GET | Database connectivity | - |
| `/accounts` | GET | List accounts | `limit`, `offset`, `active_only` |
| `/accounts/{id}` | GET | Get account | - |
| `/entities` | GET | List entities | `account_id` (required), `entity_type`, `search`, `limit`, `offset` |
| `/entities/{id}` | GET | Get entity | - |
| `/entities/{id}/relationships` | GET | Entity relationships | - |
| `/relationships` | GET | List relationships | `account_id` (required), `relationship_type`, `include_entity_values`, `limit`, `offset` |
| `/relationships/{id}` | GET | Get relationship | `include_entity_values` |

---

## Building and Running Thunderbird

### Prerequisites

1. Thunderbird build environment set up (see [Mozilla Build Instructions](https://firefox-source-docs.mozilla.org/setup/index.html))
2. Thunderbird source with the Life tab changes applied

### Build Commands

```bash
# Navigate to thunderbird-desktop repo
cd /path/to/thunderbird-desktop

# Bootstrap (first time only)
./mach bootstrap

# Configure (if needed)
./mach configure

# Build
./mach build

# Run
./mach run
```

### Life Tab Files Added/Modified

**New Files:**
- `mail/base/content/lifeTabs.js` - Tab type definition
- `mail/base/content/life-tab-panel.inc.xhtml` - Panel markup
- `mail/base/content/life-keys.inc.xhtml` - Keyboard shortcut

**Modified Files:**
- `mail/base/jar.mn` - Added lifeTabs.js to chrome package
- `mail/base/content/messenger.xhtml` - Includes for panel and keys
- `mail/base/content/spacesToolbar.inc.xhtml` - Life button in spaces bar
- `mail/base/content/spacesToolbar.js` - Space definition
- `mail/base/content/messenger-menubar.inc.xhtml` - Go menu item

### Opening the Life Dashboard

Once Thunderbird is running, you can open the Life Dashboard via:

1. **Spaces Toolbar**: Click the "Life Dashboard" button (heart icon) in the left sidebar
2. **Go Menu**: Go → Life Dashboard
3. **Keyboard Shortcut**: `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (Mac)

---

## Testing the Integration

### Test 1: Backend Only

```bash
# Start the FastAPI server
cd /path/to/email-poc/v1/packages/api
uvicorn api.main:app --reload

# In another terminal, test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/accounts
curl "http://localhost:8000/entities?account_id=1"
curl "http://localhost:8000/relationships?account_id=1"
```

### Test 2: Thunderbird Tab (Backend Not Running)

1. Build and run Thunderbird without starting the backend
2. Open Life Dashboard (Ctrl+Shift+L)
3. **Expected**: Error page with "Backend Unavailable" message and instructions
4. The error page includes a "Retry Connection" button

### Test 3: Full Integration

1. Start the FastAPI backend:
   ```bash
   cd /path/to/email-poc/v1/packages/api
   uvicorn api.main:app --reload
   ```

2. Build and run Thunderbird:
   ```bash
   cd /path/to/thunderbird-desktop
   ./mach run
   ```

3. Open Life Dashboard (Ctrl+Shift+L)

4. **Expected**: The browser should load the test page from `http://localhost:8000`
   - "Life Dashboard Connected" heading appears
   - Current time displays and updates every second
   - API Status shows "Connected" with green indicator
   - "Test All Endpoints" button tests all API endpoints

5. Click "Test All Endpoints" to verify:
   - `/health` - Should show "OK"
   - `/health/db` - Should show "OK" if database connected
   - `/accounts` - Should show "OK"
   - `/entities?account_id=1` - May show error if no data
   - `/dashboard/today?account_id=1` - May show error if no data

### Test 4: Run API Unit Tests

```bash
cd /path/to/email-poc/v1/packages/api

# Install test dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Run specific test file
pytest tests/test_accounts.py -v
pytest tests/test_entities.py -v
pytest tests/test_relationships.py -v
```

---

## Current Limitations

1. **No Dashboard UI**: The backend serves a basic test HTML page at root, but a full
   React frontend is not yet implemented. The test page shows API connection status
   and can test endpoint availability.

2. **Graph Traversal Not Implemented**: The planned `GET /graph/path` endpoint for
   finding paths between entities was deferred - the repository layer doesn't support
   graph traversal queries.

3. **No Mailbox Reader**: The mailbox reader for Thunderbird's local mail storage
   (Phase 3) is not yet implemented. Currently requires manual database population.

---

## Remaining Work

### Phase 2: Backend API ✅ COMPLETE

All Phase 2 tasks have been completed:
- Task 2.7: Email Query Endpoints (`/emails`, `/emails/{id}`, `/emails/{id}/content`, `/emails/thread/{id}`)
- Task 2.8: Dashboard Aggregation (`/dashboard/today`, `/dashboard/summary`)
- Task 2.9: Rate Limiting and Request Logging (slowapi, middleware)
- Task 2.10: End-to-End Integration Test (static test page, integration tests)

### Phase 3: Mailbox Reader (Tasks 3.1-3.7)

| Task | Description | Effort |
|------|-------------|--------|
| 3.1 | Research Thunderbird Storage Format | Small |
| 3.2 | Create Mailbox Package Structure | Small |
| 3.3 | Implement Thunderbird Profile Discovery | Medium |
| 3.4 | Implement Mbox Reader Core | Medium |
| 3.5 | Implement Incremental Sync Tracking | Medium |
| 3.6 | Integrate with Ingestion Pipeline | Medium |
| 3.7 | Add File Watching for Real-time Updates | Medium |

### Phase 4: Dashboard UI (Tasks 4.1-4.7)

| Task | Description | Effort |
|------|-------------|--------|
| 4.1 | Scaffold React Dashboard Application | Small |
| 4.2 | Implement API Client Layer | Medium |
| 4.3 | Build Today Dashboard View | Medium |
| 4.4 | Build Entity Explorer View | Medium |
| 4.5 | Build Email Browser View | Medium |
| 4.6 | Add Navigation and Layout | Small |
| 4.7 | Implement Loading States and Error Handling | Small |

### Phase 5: Integration (Tasks 5.1-5.6)

| Task | Description | Effort |
|------|-------------|--------|
| 5.1 | Configure FastAPI to Serve React Dashboard | Small |
| 5.2 | Update Thunderbird Tab for Dashboard | Small |
| 5.3 | Implement Click-to-Open in Thunderbird | Medium |
| 5.4 | Add Backend Auto-Start Capability | Medium |
| 5.5 | Comprehensive End-to-End Testing | Medium |
| 5.6 | Performance Optimization | Medium |

### Task Files

- **Phases 1-2.6** (Complete): `.claude/ralph-loop-tasks.md`
- **Phases 2.7-5**: `.claude/ralph-loop-tasks-phases-3-5.md`
- **Ralph Loop Prompt**: `.claude/ralph-loop-prompt-phases-3-5.md`

---

## Troubleshooting

### Backend won't start

```
ModuleNotFoundError: No module named 'core'
```
→ Install the local packages: `pip install -e ../core -e ../db`

```
sqlalchemy.exc.OperationalError: could not connect to server
```
→ Check PostgreSQL is running and DATABASE_URL is correct

### Thunderbird build fails

```
error: lifeTabs.js not found
```
→ Ensure `mail/base/jar.mn` includes the lifeTabs.js entry

### Life tab shows error page

→ Start the FastAPI backend before opening the tab
→ Check the backend is running on port 8000
→ Check browser console (Ctrl+Shift+J) for connection errors

### CORS errors in browser console

→ The backend includes CORS middleware for `localhost` and `chrome://messenger`
→ If using a different origin, add it to `cors_origins` in `config.py`

---

## File Reference

### Thunderbird (thunderbird-desktop repo)

| File | Purpose |
|------|---------|
| `mail/base/content/lifeTabs.js` | Tab type: lifecycle, browser loading, error handling |
| `mail/base/content/life-tab-panel.inc.xhtml` | Browser element markup |
| `mail/base/content/life-keys.inc.xhtml` | Ctrl+Shift+L keyboard shortcut |
| `mail/base/jar.mn` | Chrome package manifest (includes lifeTabs.js) |
| `mail/base/content/messenger.xhtml` | Main window (includes panel, keys, script) |
| `mail/base/content/spacesToolbar.inc.xhtml` | Life button in spaces bar |
| `mail/base/content/spacesToolbar.js` | Space definition for "life" |
| `mail/base/content/messenger-menubar.inc.xhtml` | Go → Life Dashboard menu item |

### Backend (email-poc repo)

| File | Purpose |
|------|---------|
| `v1/packages/api/src/api/main.py` | FastAPI app, routers, health endpoints |
| `v1/packages/api/src/api/config.py` | Settings (CORS, database URL, etc.) |
| `v1/packages/api/src/api/dependencies.py` | Dependency injection for repositories |
| `v1/packages/api/src/api/models/` | Pydantic request/response models |
| `v1/packages/api/src/api/routes/accounts.py` | Account endpoints |
| `v1/packages/api/src/api/routes/entities.py` | Entity endpoints |
| `v1/packages/api/src/api/routes/relationships.py` | Relationship endpoints |
| `v1/packages/api/tests/` | pytest test suites |
| `v1/packages/api/scripts/start-server.sh` | Server startup script (for auto-start) |
| `v1/packages/api/scripts/build-dashboard.sh` | Dashboard build script |

---

*Last updated: 2025-01-14*
*Overall Progress: 50% (20/40 tasks) | Phase 1: Complete | Phase 2: Complete | Phases 3-5: Pending*
