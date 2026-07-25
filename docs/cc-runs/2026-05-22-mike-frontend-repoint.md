# mike-frontend-repoint-v2 — Run-log

**Dispatch**: `mike-frontend-repoint-v2` (supersedes v1).
**When**: 2026-05-22 (local).
**Workspace**: `C:\Users\hughc\mike\` (linked to Railway project `triumphant-connection`, env `production`, service `mike-frontend`).
**Spend**: $0.

---

## Headline

**Repoint SUCCEEDED on first try.**  mike-frontend now builds from `hualca/mike` (branch `main`, root `frontend/`, Railpack v0.23.0), and the live `mike.threec.ai/login` + `/signup` pages serve the new `forked version of mike oss for threec.ai` marker on both the custom domain and the Railway host.  No build retries, no fallback to a Dockerfile, no env-var or domain re-configuration needed.

---

## Results

### STEP 2 — Divergence gate

**Cited commands**: `git fetch upstream`; `git log --oneline upstream/main..origin/main`; `git diff --stat upstream/main...origin/main -- frontend/`; `git log --oneline origin/main..upstream/main`.

**Gains** (origin not in upstream — 2 commits, frontend only):

```
f59621d Merge chore/replace-demo-notice
db3d4f7 Replace MikeOSS demo notice with threec.ai alpha notice
```

Diff stat scoped to `frontend/`:

```
 frontend/src/app/login/page.tsx  | 5 +----
 frontend/src/app/signup/page.tsx | 5 +----
 2 files changed, 2 insertions(+), 8 deletions(-)
```

**Drops** (upstream not in origin): **empty**.  No upstream commits would be dropped by the cutover.

Gate passed automatically — gains = the two expected demo-notice files, drops = none.

### STEP 3 — Build-safety changes

**New main SHA**: `a1e4f4cd2a6ab1c2016bc75ca3f2af4c04b097eb` (was `f59621d22c4cec24d7179d03ce008d8b5cb60eed`).

Two files changed, no dependency edits, lockfile untouched:

- `frontend/.npmrc` (new): `legacy-peer-deps=true`
- `frontend/package.json`: added `"engines": { "node": ">=20" }`

Sanity check: `node -e "require('./frontend/package.json')"` parsed cleanly with `engines = {"node":">=20"}`.  Working tree before commit had only `docs/cc-runs/` untracked (unrelated), so no stash needed.

Commit message:

```
Railpack build config for hualca/mike: .npmrc legacy-peer-deps + node>=20 engines
```

Push: `f59621d..a1e4f4c  main -> main` (origin = `hualca/mike`).

### STEP 4 — Manual repoint (Hugh)

Hugh saved Source = `hualca/mike` branch `main`, root `frontend/`, Builder = Railpack/auto.  Auto-deploy fired without manual trigger.

### STEP 5 — Repoint confirmation + build + runtime

**Cited command**: `railway status --json` (parsed via Python).

| Field | Before (STEP 0.4) | After |
|---|---|---|
| source.repo | Shinyduo/mike-frontend | **hualca/mike** ✓ |
| latestDeployment id | a7f56fbe-87b1-48bc-9315-0033e484de9a | **37741b83-049f-4a68-931a-62b8842569ab** (new) ✓ |
| createdAt | 2026-05-21T22:37:21Z | **2026-05-22T12:06:51Z** ✓ |
| status | — | **SUCCESS** ✓ |
| meta.repo | Shinyduo/mike-frontend | **hualca/mike** ✓ |
| commitHash | e2c38be | **a1e4f4c** (the SHA we just pushed) ✓ |
| instance status | RUNNING | **RUNNING** ✓ |

**Build pattern** (`railway logs --build --service mike-frontend --lines 500`, filtered):

```
using build driver railpack-v0.23.0
[railpack] secrets hash
load build definition from ./railpack-plan.json
[railpack] merge $packages:apt:runtime, $packages:mise, $build, $build
$ next build
```

No `git clone … willchen96` step.  No `ERESOLVE` / `ERR`.  Railpack 0.23.0 generated a `railpack-plan.json`, used mise to provision Node, ran `next build`.  The `.npmrc` accommodated peer-dep resolution and avoided the `npm ci` lockfile-sync failure mode that was the principal first-build risk.

**Runtime** (`railway logs --service mike-frontend --lines 100`): only `Starting Container` printed to stdout.  Next.js standalone server does not emit a visible "Ready" line in this configuration, but Railway reports `instance status: RUNNING` and the live HTTP probe in STEP 6 returns 200 for the application's pages.

### STEP 6 — Live-surface verification matrix

**Cited command**: `curl` against both hosts and both paths, counting marker strings.

```
https://mike.threec.ai/login                                    HTTP=200  new=1  old=0
https://mike.threec.ai/signup                                   HTTP=200  new=1  old=0
https://mike-frontend-production-3fb6.up.railway.app/login      HTTP=200  new=1  old=0
https://mike-frontend-production-3fb6.up.railway.app/signup     HTTP=200  new=1  old=0
```

All four entries match the success criterion (`new=1 old=0`).  Repoint is verifiably live on both the custom domain and the Railway service domain.

---

## Rollback (kept for record; not needed)

- **Previous deployment id**: `a7f56fbe-87b1-48bc-9315-0033e484de9a`
- **Previous source**: `Shinyduo/mike-frontend` branch `main`
- **Previous commit**: `e2c38befe39cca2cd319e03d01da65a63849361a` ("Fix: set placeholder Supabase defaults for build-time static page generation")

To revert: Railway → mike-frontend → Settings → Source → set back to `Shinyduo/mike-frontend` branch `main`; OR Deployments tab → redeploy `a7f56fbe-...`.

---

## Files

- This run-log: `C:\Users\hughc\mike\docs\cc-runs\2026-05-22-mike-frontend-repoint.md`
- Prior diags: `2026-05-21-mike-frontend-deploy-diag.md`, `2026-05-21-mike-backend-deploy-diag.md`

**Spend**: $0.

---

## Next (per dispatch tail)

The backend repoint follows the same procedure with two deltas (paraphrased from the dispatch):
- `nixpacks` not Railpack (the upstream has `backend/nixpacks.toml`).
- Verify LibreOffice returns to the runtime image — the Shinyduo wrapper Dockerfile dropped it (only `postgresql-client` is installed), so any backend feature that depends on `libreoffice` is currently degraded.  Worth confirming whether the upstream nixpacks config restores it.
