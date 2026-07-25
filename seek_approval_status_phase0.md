phase0 — Hugh dashboard step (Railway, one sitting). Marker is on hualca/mike main (commit 21992a17ffe4d6ffb475e8ac4751cdf3878ceafd) but NOT yet live.

mike-backend service → Settings:
  1. Source: change connected repo from Shinyduo/mike to hualca/mike, branch main.
  2. Build: set Root Directory to "backend" (required — nixpacks must see backend/package.json + nixpacks.toml). Set Builder to Nixpacks. Remove any custom Dockerfile path, and CLEAR any custom Build Command and Start Command carried over from the Shinyduo wrapper — leave them blank so nixpacks auto-detects build=`tsc` and start=`node dist/index.js` from package.json. A leftover Shinyduo Start/Build command is the single most likely cause of a failed cutover.
  3. GitHub identity (arm autodeploy): connect the hualca GitHub account to this Railway project with contributor access to hualca/mike, so future pushes deploy automatically.
  4. Deploy: if a deploy does not auto-trigger after the repoint, click "Deploy Latest Commit" from the command palette (Cmd/Ctrl+K).

Then re-run this same dispatch file (it will detect meta.repo=hualca/mike and run PART B to verify).
Build note: backend/nixpacks.toml installs LibreOffice, so the first build may take several minutes.
