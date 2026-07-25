# mike-frontend deploy diagnostic — 2026-05-21

**Dispatch**: mike-frontend-deploy-diag-v1 (read-only)
**Spend**: $0 LLM (pure CLI / curl / log inspection)
**Workspace**: `C:\Users\hughc\mike`
**Tools**: Railway CLI 4.59.0, git, curl

## Headline

**The mike-frontend Railway service is not sourced from `hualca/mike` at all — its source repo is `Shinyduo/mike-frontend`, whose Dockerfile hard-codes a clone of `willchen96/mike` main.**  Hugh's push to `hualca/mike` therefore triggered zero Railway activity, and even a manual rebuild of the currently-bound source would not pick up commit `f59621d` because the Dockerfile would still pull `willchen96/mike` (which does not contain that commit).  Confidence: **high** — this is established directly from `railway status --json` (source `repo: Shinyduo/mike-frontend`) and the build log (`RUN git clone --branch main https://github.com/willchen96/mike.git`).  All other layers (env vars, build pipeline, DNS, the Railway-generated host) are healthy.

---

## STEP 0 — Preconditions

| Check | Result | Source |
|---|---|---|
| Working dir | `/c/Users/hughc/mike` ✓ | `pwd` |
| Railway CLI | 4.59.0 | `railway --version` |
| Auth | hugh.carlson@gmail.com ✓ | `railway whoami` |
| Project link | `triumphant-connection` ✓ (env `production`) | `railway status` |
| main HEAD | `f59621d22c4cec24d7179d03ce008d8b5cb60eed` ✓ (begins `f59621d`) | `git log -1 --format='%H %cI' main` |
| Commit timestamp | `2026-05-21T20:08:57-04:00` → **2026-05-22T00:08:57Z UTC** | same |
| Local git remotes | `origin = hualca/mike`, `upstream = willchen96/mike` | `git remote -v` |

No HARD HALT conditions hit.

---

## STEP 1 — Served-content matrix

Single curl pass per cell, counted with `grep -c`.  NEW marker = `forked version of mike oss for threec.ai`; OLD marker = `MikeOSS.com is currently a demo`.

| Host | Path | new | old |
|---|---|---|---|
| https://mike.threec.ai | /login | **0** | 1 |
| https://mike.threec.ai | /signup | **0** | 1 |
| https://mike-frontend-production-3fb6.up.railway.app | /login | **0** | 1 |
| https://mike-frontend-production-3fb6.up.railway.app | /signup | **0** | 1 |

**Interpretation**: both the custom domain AND Railway's own generated host serve OLD on both pages.  This rules out a DNS / Cloudflare / edge-cache problem at mike.threec.ai — **the new build is not live anywhere**.  The problem is in the build/deploy chain, not in serving.

Source: the `for host in ...; for path in ...; do curl ... | grep -c ...; done` matrix in this run's terminal.

---

## STEP 2 — Deployment state

Source: `railway status --json` (with `mike-frontend` linked via `railway service mike-frontend`).

Active deployment of mike-frontend, in environment `production`:

| Field | Value |
|---|---|
| deployment id | `a7f56fbe-87b1-48bc-9315-0033e484de9a` |
| createdAt | `2026-05-21T22:37:21.287Z` |
| instance status | `RUNNING` |
| deploymentStopped | `false` |
| reason | `redeploy` (i.e., not a fresh push trigger) |
| commit author | `Shinyduo` |
| commit hash | `e2c38befe39cca2cd319e03d01da65a63849361a` |
| commit message | "Fix: set placeholder Supabase defaults for build-time static page generation" |
| branch | `main` |
| **source repo** | **`Shinyduo/mike-frontend`** ← key finding |
| rootDirectory | `null` |
| builder | `DOCKERFILE`, dockerfilePath `/Dockerfile` |
| restartPolicy | `ALWAYS` |

**Timing comparison vs. the f59621d push:**

- Active deployment createdAt: `2026-05-21T22:37:21Z` UTC
- f59621d commit timestamp: `2026-05-22T00:08:57Z` UTC
- Active deployment is **~1h 31m OLDER** than the f59621d commit, AND its `reason` is `redeploy` (not push-triggered).  There is no newer deployment.

→ The push to `hualca/mike` main triggered no rebuild.  The currently-running deployment was built from a different repo (`Shinyduo/mike-frontend`) and a different commit (`e2c38be`, authored by `Shinyduo`) ~90 min before f59621d ever existed.

---

## STEP 3 — Build logs

Source: `railway logs --build --service mike-frontend | tail -150`.

Key build steps (Dockerfile, builder stage):

```
[builder 2/7] RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates
[builder 3/7] RUN git clone --depth 1 --branch main https://github.com/willchen96/mike.git /tmp/mike
[builder 4/7] WORKDIR /app
[builder 5/7] RUN cp -r /tmp/mike/frontend/. . && rm -rf /tmp/mike
[builder 6/7] RUN npm install --legacy-peer-deps
[builder 7/7] RUN npm run build
```

Build verdict:
- **Build SUCCEEDED**: "✓ Compiled successfully in 5.1s", TypeScript clean, 14/14 static pages generated, container image pushed.
- **Commit actually built**: not `f59621d`.  Per the Dockerfile, the build always clones `willchen96/mike` main fresh — so the built code reflects whatever `willchen96/mike` main was at build time (2026-05-21T22:39:12Z UTC, per the containerimage `org.opencontainers.image.created` annotation).  That is independent of any commit on `hualca/mike`.
- **No prerender / `Invalid supabaseUrl` failure** — the prerender step succeeded for all 14 static pages, ruling out the env-misconfig failure mode seen locally.

Deploy/runtime logs (`railway logs --deployment --service mike-frontend`): `Starting Container`, `▲ Next.js 16.2.6`, `✓ Ready in 90ms`.  No crashes, no startup errors.

---

## STEP 4 — Frontend build-time env (verdicts only, redacted)

Source: `railway variables --service mike-frontend --kv`, keys filtered to `NEXT_PUBLIC_*`.  Values pattern-matched, never printed.

| Variable | Verdict |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **real-url** (https-prefixed, no placeholder literal) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | **present-non-url** (correct — this is an anon key, not a URL) |
| `NEXT_PUBLIC_API_BASE_URL` | **real-url** |

Env is healthy.  Not the cause.

---

## STEP 5 — Source binding verdict

Source: `railway status --json` → `meta.repo` = `Shinyduo/mike-frontend` (CLI-derived; no dashboard step needed).

**The mike-frontend service is bound to `Shinyduo/mike-frontend` on branch `main`, builder DOCKERFILE, dockerfile `/Dockerfile`.**  That Dockerfile (per STEP 3 build log) does `git clone --depth 1 --branch main https://github.com/willchen96/mike.git` and uses its `frontend/` subtree.  Neither of those is `hualca/mike`.

Inferred verdict (matches CLI-derived verdict): the push to `hualca/mike` triggered no rebuild because Railway is not watching `hualca/mike`.

---

## Decisions for CAI (not executed)

The chain is broken at the **source-binding layer**.  Three remediation paths, in order of cleanness, all to be decided by Hugh:

1.  **Repoint Railway source to `hualca/mike` and switch builder to a normal repo build** (preferred long-term).
    - Railway dashboard → mike-frontend → Settings → Source → set Repo = `hualca/mike`, Branch = `main`, Root Directory = `frontend/`, ensure Automatic Deploys is on.
    - Switch builder away from the "clone-inside-Dockerfile" pattern: either delete the wrapper Dockerfile so Nixpacks builds `frontend/` directly, OR replace it with a Dockerfile that does NOT re-clone (it should `COPY . .` from the build context, not `git clone` over the top).
    - The current `Shinyduo/mike-frontend` Dockerfile clones `willchen96/mike` regardless of which source repo Railway hands it — that is the second bug to fix once the source pointer is changed.

2.  **Update the `Shinyduo/mike-frontend` Dockerfile to clone `hualca/mike` instead of `willchen96/mike`** (a stopgap that preserves the wrapper-repo pattern).
    - Edit the Dockerfile's `git clone` line to point at `https://github.com/hualca/mike.git` branch `main`.
    - Commit/push to `Shinyduo/mike-frontend`; Railway will then redeploy and produce a build that contains `f59621d`.
    - Caveat: this keeps the awkward "Dockerfile-clones-a-different-repo" indirection.  Every future change still has to land on `hualca/mike` main AND something has to trigger Railway to rebuild (a no-op push on `Shinyduo/mike-frontend` would do it).

3.  **One-shot manual deploy from this workspace, no source change** (fastest unblock, smallest blast radius).
    - From `C:\Users\hughc\mike\frontend\`, run `railway up --service mike-frontend` to upload the local source as a one-off build context.
    - This builds the *local* tree (which is at `f59621d`) directly on Railway, bypassing the `Shinyduo/mike-frontend` Dockerfile's `git clone`.
    - Does NOT fix the underlying source-binding misconfig; the next push to `hualca/mike` will still be ignored.  Use as a bridge only.

Other layers verified healthy (no remediation needed):
- Env vars on Railway: `NEXT_PUBLIC_SUPABASE_URL`, anon key, and `NEXT_PUBLIC_API_BASE_URL` all set and well-formed.
- Build pipeline itself succeeds end-to-end (compile, TS check, 14/14 prerender, image push).
- Cloudflare DNS / mike.threec.ai serving: not stale — it correctly mirrors what the Railway host serves; both show OLD because both are pointing at the same (wrong-source) deployment.

---

## Files

- This run-log: `C:\Users\hughc\mike\docs\cc-runs\2026-05-21-mike-frontend-deploy-diag.md`

## Spend

$0 LLM.  No mutations to Railway, no git writes, no secret values printed.
