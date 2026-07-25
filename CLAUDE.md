# Mike — CLAUDE.md

Orientation for agent sessions (Claude Code and Codex both auto-load this file).

## What this is

**Mike** is a legal document assistant — Next.js frontend, Express backend, Supabase Auth/Postgres, Cloudflare R2-compatible object storage.  Public site: mikeoss.com.  This workspace is **Hugh's fork**:

- `origin` = `hualca/mike` (push here)
- `upstream` = `willchen96/mike` (fetch-only; never push upstream)
- Working branch as of 2026-07-10: `track-a/p1-complete`

Workspace lives at `C:\Users\hughc\mike` — intentionally **outside OneDrive** (node_modules sync hell).

## Layout

- `frontend/` — Next.js application
- `backend/` — Express API, Supabase access, document processing, DB schema
- `backend/schema.sql` — Supabase schema for fresh databases
- `backend/migrations/` — incremental DB updates for existing deployments
- `docs/cc-runs/` — session reports and analyses (the standing convention; write reports here)
- `scripts/`, `.logs/`

## Prerequisites & setup

Per `README.md`: Node 20+, a Supabase project, an R2/S3-compatible bucket, at least one model-provider API key (Anthropic / Gemini / OpenAI), and **LibreOffice** locally for DOC/DOCX→PDF conversion.  Follow README for env/database setup — do not invent env var names.

## Infra notes

- Railway CLI is expected on PATH for Railway-touching work (deploys/diagnostics); long or unattended jobs go to a Railway worker, never the laptop (see global guidance).
- Supabase work: schema changes go through `backend/migrations/`, not ad-hoc edits.

## History pointers

Prior research and decisions live in `docs/cc-runs/` (e.g. the 2026-05-28 build-vs-buy and vendor-survey series).  Read those before re-opening an already-settled question.
