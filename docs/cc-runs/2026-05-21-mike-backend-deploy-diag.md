# mike-backend-deploy-diag-v1 — Run-log

**Dispatch**: `mike-backend-deploy-diag-v1` (read-only).
**When**: 2026-05-21 (local).
**Workspace**: `C:\Users\hughc\mike\` (linked to Railway project `triumphant-connection`, env `production`, service `mike-backend`).
**Spend**: $0 — no LLM calls; CLI + curl/urllib + Python parsing only.

---

## Headline

The mike-backend service IS bound to a Shinyduo wrapper repo (`Shinyduo/mike`) whose Dockerfile clones `willchen96/mike` at build time and copies its `backend/` directory — **the same wrapper disease as mike-frontend.  `hualca/mike` is never built.**  However, the dispatch's leading hypothesis — that this also explains widespread HTTP 500s via schema drift — is **REFUTED**: (a) all seven anchor tables exist in the live `mike-db` per a service-role PostgREST probe, and (b) the most recent HTTP request logs show **no 5xx responses** — `/projects`, `/chat`, `/user/profile`, `/workflows`, `/single-documents`, `/tabular-review` all returning 200.  The 500s described in the handoff appear to have been already resolved before this diagnostic ran.  Confidence: **high**.

Unified-vs-distinct verdict: the **source binding** is a unified problem with mike-frontend (both bound to Shinyduo wrappers).  The **runtime 500s** are no longer a problem.  The remediation campaign can therefore be scoped to **repoint mike-frontend (and optionally mike-backend) → `hualca/mike`** without a coupled schema-fix step — the live `mike-db` schema is compatible with the `willchen96/mike` backend currently serving requests, and (since `willchen96/mike` is downstream of `hualca/mike`) the schema is likely compatible with `hualca/mike` too.  Validate before cutover.

---

## Results

### STEP 1 — Source binding for mike-backend

**Cited command**: `railway service mike-backend`; `railway status --json` (full JSON saved to harness tool-results, parsed with Python).

mike-backend serviceInstance fields:

| Field | Value |
|---|---|
| serviceId | `e8f06f43-33c9-4801-9f34-b45a9990c6b4` |
| serviceInstance id | `87b0350f-e9f6-4597-bd77-be0ee9447ea6` |
| environment | `production` (`5204224f-cfbe-47b5-a7dc-408dd05ef432`) |
| **source.repo** | **`Shinyduo/mike`** |
| source.image | null |
| latestDeployment | `83761361-acfd-4321-aa36-9ee5f3fdeaf4` |
| customDomain | `mike-api.threec.ai` → port 3001 |
| serviceDomain | `mike-backend-production-0e37.up.railway.app` |

Active deployment metadata:

| Field | Value |
|---|---|
| deployment id | `83761361-acfd-4321-aa36-9ee5f3fdeaf4` |
| createdAt | `2026-05-21T22:37:48.300Z` |
| instance status | `RUNNING` |
| branch | `main` |
| commitHash | `b80caaa4ee82cc87a92c519cc87833ffec78b27f` |
| commitAuthor | `Shinyduo` |
| commitMessage | "Add TEMPLATE_DESCRIPTION.md (9969 chars) with Cloudinary images" |
| **meta.repo** | **`Shinyduo/mike`** |
| builder | `DOCKERFILE` |
| dockerfilePath | (root Dockerfile, configFile=`/railway.toml`) |
| imageDigest | `sha256:e7ebbd4dde9065e9ff5d84583437b12a8a621cd66292f2137ca11b67027db8cf` |

**Source verdict**: `meta.repo === source.repo === Shinyduo/mike` → **SAME DISEASE as mike-frontend**.  `hualca/mike` is NOT the source of truth for the running backend.

**Reachability** (curl): `GET https://mike-api.threec.ai/` → HTTP 404; `GET https://mike-api.threec.ai/health` → HTTP 200 `{"ok":true}`.  Process is up and routing.

### STEP 2 — Built-code provenance

**Cited command**: `railway logs --build --service mike-backend`.

The Dockerfile in `Shinyduo/mike` follows the wrapper pattern exactly as in the frontend disease:

```
[builder 2/7] RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates ...
[builder 3/7] RUN git clone --depth 1 --branch main https://github.com/willchen96/mike.git /tmp/mike
[builder 4/7] WORKDIR /app
[builder 5/7] RUN cp -r /tmp/mike/backend/. . && rm -rf /tmp/mike
[builder 6/7] RUN npm install
[builder 7/7] RUN npm run build

# stage-1 (runtime):
[stage-1 1/6] FROM node:22-bookworm-slim
[stage-1 2/6] RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client ...
[stage-1 3/6] WORKDIR /app
[stage-1 4/6] COPY --from=builder /app .
[stage-1 5/6] COPY entrypoint.sh /app/entrypoint.sh
[stage-1 6/6] RUN chmod +x /app/entrypoint.sh
```

The image therefore contains `willchen96/mike`'s `backend/` at whatever HEAD of `willchen96/mike:main` was at build time (2026-05-21T22:37 UTC).  Note: the Shinyduo wrapper Dockerfile does NOT include `libreoffice` — only `postgresql-client` — so any backend feature that depends on LibreOffice in the runtime image would silently degrade.  Worth flagging if .docx/.pdf conversion is in scope.

### STEP 3 — Runtime/error logs

**Cited commands**: `railway logs --service mike-backend --lines 500`; `railway logs --http --service mike-backend --lines 1000`; `railway logs --deployment --service mike-backend --lines 500 | grep -iE "error|fail|undefined|relation|column|JWT|secret"`.

Process logs (stdout): only two lines emitted across the full lifetime of the current deployment:

```
Starting Container
Mike backend running on port 3001
```

No application-level error logging.  Backend stdout is intentionally sparse, matching the handoff note.

HTTP request logs — recent window (2026-05-21T23:38Z through 2026-05-22T00:38Z):

| Method | Path | Status (sample latency) |
|---|---|---|
| GET | `/projects` | **200** (112–368 ms, many occurrences) |
| GET | `/chat` | **200** (114–386 ms, many occurrences) |
| GET | `/user/profile` | **200** (151–432 ms) |
| PATCH | `/user/profile` | **200** (299–519 ms) |
| GET | `/workflows` | **200** (207 ms) |
| GET | `/single-documents` | **200** (155 ms) |
| GET | `/tabular-review` | **200** (225 ms) |
| GET | `/` | 404 (5 ms; expected, no root route) |
| GET | `/.env` `/secrets.yml` `/.git/config` etc. | 404 (bot probes) |
| GET | `/health` | 200 (120 ms; one curl from this diag) |

**Zero 5xx responses across 1000-line HTTP log window.**  Grep of deployment logs for `error|fail|undefined|relation|column|JWT|secret` returned **no matches**.  The 500s in the handoff are not currently reproducing.

### STEP 4 — Live schema vs expected (the decisive drift probe)

**Cited command** (read-only, service-role key → PostgREST via Kong gateway at `$SUPABASE_URL/rest/v1/...`; service-role bypasses RLS so this isolates "table exists" from access-control layers):

```
for t in projects chats chat_messages user_profiles documents user_api_keys workflows; do
  curl -s -o /tmp/r.json -w "%{http_code}" \
    -H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY" \
    "$SB_URL/rest/v1/$t?select=*&limit=1"
done
```

(Executed via Python `urllib` for cleaner output; secrets read from a tempfile and never echoed.)

| Table | HTTP | Verdict |
|---|---|---|
| projects | 200 | **EXISTS** (empty array — table present, no rows for service-role) |
| chats | 200 | **EXISTS** (≥1 row) |
| chat_messages | 200 | **EXISTS** |
| user_profiles | 200 | **EXISTS** (≥1 row) |
| documents | 200 | **EXISTS** |
| user_api_keys | 200 | **EXISTS** (empty array) |
| workflows | 200 | **EXISTS** (empty array) |

Schema-drift hypothesis is **REFUTED for the anchor set** — no `42P01` relation-not-found, no `42703` column-not-found, no 401/403 gateway error.  Live `mike-db` exposes all seven tables that the dispatch flagged as critical.

Local `backend/schema.sql` defines 16 tables (the seven anchors above plus `project_subfolders`, `document_versions`, `document_edits`, `hidden_workflows`, `workflow_shares`, `tabular_reviews`, `tabular_cells`, `tabular_review_chats`, `tabular_review_chat_messages`).  The anchor set is sufficient evidence that the schema-binding-equals-drift theory is wrong; the remaining nine tables can be confirmed later via a full `information_schema` diff if needed.

**Optional psql diff — gap noted**: `psql` is installed locally, but `mike-backend`'s `DATABASE_URL` resolves to `mike-db.railway.internal:5432`, which is only routable inside Railway's private network.  `mike-db` exposes `PGDATA`/`PGPASSWORD`/`POSTGRES_DB`/`POSTGRES_PASSWORD`/`PORT`/`JWT_SECRET`/`SERVICE_KEY`/`ANON_KEY` env vars but no public TCP-proxy host.  The PostgREST probe in 4.2 already answers the drift question, so skipped per dispatch.

### STEP 5 — Env-var verdicts

**Cited command**: `railway variable list --service mike-backend --kv` (dumped to `$HOME/.mb_vars.tmp.env`, parsed by Python — values never printed to terminal or this run-log).

| Variable | Verdict |
|---|---|
| SUPABASE_URL | present-and-well-formed (https://...) |
| SUPABASE_SECRET_KEY | present-and-well-formed (JWT-shape, len=180) |
| USER_API_KEYS_ENCRYPTION_SECRET | present-and-well-formed (64-hex) |
| DOWNLOAD_SIGNING_SECRET | present-and-well-formed (64-hex) |
| ANTHROPIC_API_KEY | present-and-well-formed (`sk-ant-` prefix, len=108) |
| GEMINI_API_KEY | **present-but-suspicious (len=2)** — likely placeholder/non-functional; not on the 500 critical path |
| NODE_ENV | **present-but-malformed: `'Production'` with capital P** — Express + many libs check `process.env.NODE_ENV === 'production'` (lowercase); capital-P silently disables prod-mode optimizations.  Not a 500 root cause but worth fixing. |
| FRONTEND_URL | present-and-well-formed (https://...) |
| R2_ACCESS_KEY_ID | present (len=54) |
| R2_SECRET_ACCESS_KEY | present (len=75) |
| R2_ENDPOINT_URL | present-and-well-formed (https://...) |
| R2_BUCKET_NAME | present (len=25) |
| DATABASE_URL | present-and-well-formed (postgres:// URI, host `mike-db.railway.internal`) |
| PORT | present (len=4) — `3001` per startup log |

Full key set (27 keys): includes Railway internals (`RAILWAY_*`) plus the app keys above.  No app-secret of the seven dispatch-tracked names is absent or malformed in a way that would cause auth/encrypt code paths to throw.

---

## Decisions for CAI (not executed)

Implied remediation, in priority order — **none executed by this diagnostic**:

1. **Source repoint (the real campaign).**  Repoint mike-backend's Railway service source from `Shinyduo/mike` → `hualca/mike` (root `backend/`, builder `nixpacks` per upstream, or keep DOCKERFILE but using a `hualca/mike`-native Dockerfile if one exists).  Same action recommended for mike-frontend from the prior diagnostic.  Because the schema is NOT drifted, this repoint can be done independently of any DB work — no destructive re-provision of `mike-db` required.  Cutover risk is limited to whatever code-level diff exists between `willchen96/mike:main@HEAD` and `hualca/mike:main@HEAD`; diff those first.
2. **Decide whether to keep mike-backend on Shinyduo or repoint.**  Unlike the frontend, the backend is currently *serving correctly* on Shinyduo/mike → willchen96/mike — so repoint priority is "owner discipline / single source of truth," not "fix 500s."
3. **Nits worth a separate small PR** (do NOT block the campaign on these): set `NODE_ENV=production` (lowercase) on mike-backend; set or remove the stub `GEMINI_API_KEY` (currently 2 chars).
4. **LibreOffice in runtime image.**  The Shinyduo wrapper Dockerfile installs `postgresql-client` only; if any backend feature depends on LibreOffice for .docx/.pdf conversion (the upstream handoff mentioned `libreoffice`/nixpacks setup as expected), it is currently **missing in production**.  Test before assuming this campaign is purely a source-repoint.

Frontend + backend collapse into one repoint campaign at the **service-source layer** in Railway; they do NOT collapse into one schema-fix step (no schema fix is needed).

---

## Files

- This run-log: `C:\Users\hughc\mike\docs\cc-runs\2026-05-21-mike-backend-deploy-diag.md`
- Prior diag (frontend): `C:\Users\hughc\mike\docs\cc-runs\2026-05-21-mike-frontend-deploy-diag.md`

**Spend**: $0.
