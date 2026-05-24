# Track-A P1-complete — Live `documents` + pgvector verdict

**Date**: 2026-05-24
**Branch**: track-a/p1-complete
**Scope**: Finish Phase-1 STEP 2/3 against the mike-db public proxy (read-only).
**Spend**: $0 (no LLM; psql only).

## Headline

- **pgvector verdict**: **NOT AVAILABLE** on the current `mike-db` Postgres image (PG15 reported by error path). Phase-2 vector schema requires a Railway image change before any privileged `CREATE EXTENSION vector` can succeed — a privilege grant alone will not unblock it.
- **`documents` shape**: 1 row total (a single `docx`, status `ready`, `project_id` null, `page_count` null, `structure_tree` is a 30-top-node array with at least one null `page_number` and at least one flat (empty-children) node). Live schema matches `backend/schema.sql` — no drift.

## Results

### STEP 1 — Live `documents` columns (13)

| # | column | type | nullable |
|---|---|---|---|
| 1 | id | uuid | NO |
| 2 | project_id | uuid | YES |
| 3 | user_id | text | NO |
| 4 | filename | text | NO |
| 5 | file_type | text | YES |
| 6 | size_bytes | integer | NO |
| 7 | page_count | integer | YES |
| 8 | structure_tree | jsonb | YES |
| 9 | status | text | NO |
| 10 | folder_id | uuid | YES |
| 11 | created_at | timestamptz | NO |
| 12 | updated_at | timestamptz | NO |
| 13 | current_version_id | uuid | YES |

**Drift flag — `storage_path`**: NOT present on live `documents`, and NOT declared on `documents` in `backend/schema.sql` either — so no live-vs-schema drift here. The dispatch's premise that "code references `documents.storage_path`" did **not** hold up under check: `grep -r 'documents\.storage_path'` returned **0 matches**. All `storage_path` references in the codebase (9 files, including `backend/src/lib/documentVersions.ts`, `backend/src/routes/documents.ts`, etc.) read it from `document_versions`, which is the correct table. **No action required** on `schema.sql` for this column.

### STEP 2 — documents / structure_tree aggregates

**2.1 — by file_type:**

| file_type | n | null_tree | null_project | avg_pages |
|---|---|---|---|---|
| docx | 1 | 0 | 1 | (null) |

**2.2 — structure_tree element-aware:**

| tree_docs | avg_top_nodes | docs_any_null_pageno | docs_any_flat_node |
|---|---|---|---|
| 1 | 30.0 | 1 | 1 |

**2.3 — status distribution:**

| status | count |
|---|---|
| ready | 1 |

**What this confirms for Phase-2/3 design:**

- The live dataset is effectively empty (n=1). Aggregates are directional, not statistical. The Phase-2 schema can be designed against a clean slate without worrying about heavy backfill.
- The single sample doc has `structure_tree` populated (0 null_tree) but with both a null `page_number` and a flat (children=[]) node, so the page/token fallback chosen in the prior STEP-1 NO-GO is the right call — the outline alone cannot be trusted for chunk boundaries. (`null_project=1` is consistent with documents being uploaded outside a project context; not a defect.)
- The Phase-3 ingestion trigger should fire when `documents.status = 'ready'` (this is the value the live system actually settles on).

### STEP 3 — pgvector availability

**3.1 — `pg_available_extensions where name='vector'`:**

```
 name | default_version | installed_version
------+-----------------+-------------------
(0 rows)
```

**3.2 — `begin; create extension if not exists vector; … rollback;`** (full verbatim error):

```
BEGIN
ERROR:  extension "vector" is not available
DETAIL:  Could not open extension control file "/usr/share/postgresql/15/extension/vector.control": No such file or directory.
HINT:  The extension must first be installed on the system where PostgreSQL is running.
```

**3.3 — post-rollback `pg_extension where extname='vector'`:**

```
 extname
---------
(0 rows)
```

**Verdict**: `pgvector: NOT AVAILABLE`. The extension control file is missing from the running Postgres 15 image, which puts this in the "image change required" bucket — distinct from PERMISSION-GATED. (Note: `PGDATA=/var/lib/postgresql/data/pg19` is just a directory label; the live server is reporting itself as Postgres 15 via the control-file path.)

## Decisions for CAI

1. **pgvector / Phase-2 schema** — The migration plan must include a **Railway image change** on `mike-db` *before* the vector schema migration runs. Options to evaluate (do not pick here): swap the service Docker image to `pgvector/pgvector:pg15` (or a pinned `pg16`); or switch to Railway-managed Postgres which ships pgvector; or run vectors on a separate service. Whichever path, the privileged `CREATE EXTENSION vector` step is downstream of the image swap, not a substitute for it. Treat this as Phase-2 prep work, not part of the schema migration itself.
2. **Phase-3 ingestion trigger** — Use `documents.status = 'ready'` as the gate. Confirmed against live data; no other status values present.
3. **`schema.sql` resync** — **Not needed** for the `documents` table. Live columns and `schema.sql` agree, and the `documents.storage_path` "drift" the dispatch flagged is a false alarm (the column lives on `document_versions`, where the code reads it). No follow-up migration required for this finding.

## Operational reminder

The `mike-db` TCP Proxy was enabled to run this dispatch. **Disable it now** that the diagnostic is complete (Railway → mike-db → Settings → Networking → disable TCP Proxy) to reduce attack surface and stop egress billing.

## Files

- `docs/cc-runs/2026-05-24-track-a-p1-complete.md` (this file — only file touched)
- No code or schema changes.

## Spend

$0 — no Anthropic LLM calls; psql against the mike-db public proxy only.
