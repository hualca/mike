# Carryover — Mike build vs. buy + autonomous-execution options

**Date**: 2026-05-28
**Branch**: track-a/p1-complete
**Purpose**: Hand a fresh CC session two strategic questions that need rigorous, decisional answers before any code is written for the vector-retrieval build.
**Status of work**: Architecture is reviewed and approved in principle (see prior docs).  Before authorizing implementation, Hugh wants a clear answer on (a) whether the build can be delegated to an autonomous agent stack, and (b) whether buying off the shelf is the smarter move than building.  Prior interactive answer was unsatisfying — needs to be done as a proper research deliverable.

---

## What you (the new session) are being asked to do

1.  Read this document fully.
2.  Read the two prior deliverables it references (architecture review + summary docx).  Skim Mike's repo enough to ground the questions in current reality.
3.  Research and answer two questions decisionally — not "here are some options," but "here is what I would do and why."
4.  Write the deliverable to `docs/cc-runs/2026-05-28-mike-build-options-review.md`.
5.  **No code.  No vendor account creation.  No infrastructure mutations.**  This is strategy-and-research only.

Hugh's stylistic preferences apply (US English, em dashes with no spaces, smart quotes, double-spacing after periods).  See `C:\Users\hughc\.claude\CLAUDE.md` and `C:\Users\hughc\CLAUDE.md`.

---

## The two questions

### Question 1 — Autonomous build feasibility

**Can the v1 build (Phases A–G of the recommended architecture) be delegated to an autonomous agent stack rather than executed interactively with Hugh + Claude Code?**

What Hugh wants to understand:
-  Which autonomous-agent products are realistic candidates today (2026-05-28).  Be specific about names, capabilities, pricing tier, and operational shape.  Cover at least: Claude Code background/autonomous modes, Devin (Cognition), GitHub Codex agent / Copilot Workspace, OpenAI's Operator and any successor, trycua.com / Cua sandboxed CUAs, and any other serious player you find.
-  Which phases of the build can realistically be agentic vs. which require a human in the loop.  Be honest — vendor account creation, real-data validation, production deploys, judgment calls on retrieval quality, sign-off on schema migrations all need Hugh.
-  Concrete compression of Hugh's calendar involvement.  If the agent does ~70% of the work, what does Hugh's actual time commitment shrink to?  Hours per week, gating events, etc.
-  Compliance and data-handling implications.  Real arbitration data has privilege and confidentiality constraints; not every autonomous-agent sandbox is appropriate.  Be specific about which data goes where.
-  Cost — both the agent-service cost and the cost of bad autonomous decisions (e.g., agent burns a day on the wrong path).
-  Risk profile — what's the worst case if an autonomous agent makes a wrong call mid-build, and how much human oversight is enough to keep risk acceptable.

The decisional output Hugh wants: "I would (use X agent / not delegate this) for (these phases), because (reason).  Hugh's expected involvement compresses to (concrete numbers).  Risk is mitigated by (specific gates)."

### Question 2 — Is Hugh reinventing the wheel?

**Do existing products already deliver the bulk of what the architecture proposes, such that buying is more rational than building?**

What Hugh wants to understand, broken into three tiers:

**Tier 1 — Direct competitors (sell the finished product).**  Vendors that sell matter-scoped legal-document Q&A with citations, the actual end-user experience Mike is being built to deliver.  Verify current 2026 state of:
-  Harvey (Vault, Workflows, Assistant)
-  Legora (Assistant, Tabular Review, Markup)
-  Spellbook
-  Thomson Reuters CoCounsel
-  LexisNexis Lexis+ AI / Protégé
-  Westlaw Precision AI
-  Disco AI, Relativity aiR, Everlaw AI (eDiscovery-rooted but operate on similar workloads)
-  Anything newer worth knowing about
For each, surface: actual current pricing tier (not vibes — search for posted pricing or known deal sizes); whether sole practitioners can buy; whether arbitration-specific workflows exist; how strong the citation/verification UX is.

**Tier 2 — Managed RAG infrastructure (would replace L3–L5 of the architecture, leaving Mike as the shell).**  Vendors that offer "upload docs, ask questions, get cited answers" as a managed service.  Verify current state of:
-  AWS Bedrock Knowledge Bases
-  Pinecone Assistant
-  Vectara
-  Voyage's managed RAG (if it exists in 2026)
-  Cohere Compass / North
-  Azure AI Search + grounding
-  Google Vertex AI Search
-  Anthropic's own RAG primitives (if any are first-class in 2026)
For each: where it sits in the stack, what it replaces in Mike's L1–L7 architecture, pricing model, citation/verification quality, lock-in risk.

**Tier 3 — Document parsing / OCR with bolted-on RAG.**  Vendors that started in document parsing and have moved up the stack.  Verify:
-  Reducto
-  Unstructured.io
-  Anything else specifically tuned for legal documents

**The strategic framing.**  For each tier, answer: would using this *replace* Mike entirely, *replace a layer of Mike*, or *complement* Mike?  What is the marginal cost of building Mike on top of a managed-RAG core vs.  on a bespoke Turbopuffer + Voyage + custom-citation stack?  What does Hugh give up either way?

The decisional output Hugh wants: a clear recommendation among the following framings (or a justified alternative):
1.  **Just buy.**  Mike's existence as a build effort is no longer rational; buy Harvey/Legora/etc.  Stop building.
2.  **Build Mike on a managed-RAG core.**  Keep Mike as the user-facing product, swap L3–L5 for Bedrock KB / Vectara / equivalent.  Save weeks of build time, lose some control.  Be specific: which vendor, why, what the revised phased plan looks like, what the revised cost/timeline is.
3.  **Build Mike as architected.**  The custom stack is worth the extra time because of (concrete reasons).  Defend the build against the "just buy" alternative.
4.  **Hybrid.**  Buy something for Hugh's current arbitration practice today; build Mike on the side for a different reason (open source, product strategy, learning).  Be specific about what gets bought for current use and what Mike's revised purpose is.

---

## Project context (read this if you have no prior context)

Mike is an open-source legal document assistant.  Hugh Carlson maintains the fork (CEO of Three Crowns LLP, co-founder of Generative Legal, Lecturer at Harvard Law School).

-  **Upstream repo**: `https://github.com/willchen96/mike.git` (configured as `upstream`).
-  **This fork**: `https://github.com/hualca/mike.git` (origin).
-  **Marketing site**: `mikeoss.com`.
-  **Stack**: Next.js frontend, Express backend, Supabase Auth/Postgres for metadata, Cloudflare R2 for document storage, Railway-hosted Postgres (`mike-db`) as the application DB.
-  **Model providers**: Anthropic, Google Gemini, OpenAI (BYO key per user).
-  **Current document handling**: documents in R2, metadata in `documents` and `document_versions` tables.  Retrieval today is **keyword + full-text-dump only** — no vector retrieval, no embeddings, no semantic search exists.

The intended primary workload is **full international arbitration records** (100,000+ pages each, ~50M tokens, ~70–90% scanned exhibits, citation precision non-negotiable).  See the architecture review for the full workload analysis.

## Prior deliverables you must read

1.  `docs/cc-runs/2026-05-24-track-a-p1-complete.md` — verified the live `documents` shape (1 row, clean slate) and the pgvector verdict (not available on the Railway image).
2.  `docs/cc-runs/2026-05-27-mike-vector-architecture-carryover.md` — the brief that authored the architecture review.
3.  `docs/cc-runs/2026-05-27-mike-vector-architecture-review.md` — the full architecture review.  Read in full.  The architecture you are critiquing the build-vs-buy decision *against* lives here:
    -  Turbopuffer as the vector store (not pgvector).
    -  Google Document AI Layout Parser as default OCR (~$10/1k pages); Reducto for table-heavy escalation.
    -  Voyage `voyage-law-2` embeddings; Voyage `rerank-2.5` reranker (v1.5).
    -  Document-type-aware chunking; offset-anchored citation extraction.
    -  v1 ships L1–L6 minus hybrid/rerank/agentic.  v1.5 adds hybrid + rerank + one workflow.
    -  Sized at ~6–7 calendar weeks to v1 (Phases A–G); ~8.5–10 weeks to v1.5 (adding H + I).
    -  One-time ingest ~$1,150–$1,350/matter; ongoing ~$15/month storage; per-query $0.04–$0.40.
4.  `docs/cc-runs/2026-05-27-mike-vector-architecture-summary.docx` — 15-page plain-English version for Hugh's review.  Same recommendations, accessible language.

## Source files worth grepping if you need codebase grounding

-  `README.md` — project overview.
-  `backend/schema.sql` lines 99–148 — current `documents` and `document_versions` tables; no vector column anywhere.
-  `backend/src/lib/chatTools.ts:1481–1610` — `read_document` (full-text dump).
-  `backend/src/lib/chatTools.ts:288–317` — `find_in_document` (keyword Ctrl+F).
-  `backend/src/lib/chatTools.ts:3138–3230` — `buildProjectDocContext` (per-project document availability).
-  `backend/src/routes/projectChat.ts:92–101` — chat invocation that builds doc context.
-  `backend/src/lib/storage.ts` — R2 storage primitives.

## Earlier conversational answer (for reference; treat as a draft to improve, not a constraint)

In the prior interactive turn Hugh got a conversational answer that covered roughly:

-  **Autonomous build**: yes, plausible via Claude Code background/autonomous mode, Devin, or Codex; trycua.com is not the right shape (it's for desktop GUI automation, not coding-agent work).  Limits: vendor account creation, real-arbitration validation, production deploys, and judgment calls need a human.  Rough compression: ~70% delegated, Hugh's calendar involvement drops from ~6 weeks to ~2 weeks of active gating.
-  **Buy vs.  build**: three tiers identified — direct competitors (Harvey, Legora, Spellbook, CoCounsel, Lexis+ AI, Westlaw Precision AI, Disco AI, Relativity aiR, Everlaw AI); managed-RAG middleware (Bedrock KB, Pinecone Assistant, Vectara, Voyage managed, Cohere); parsing-first vendors with RAG (Reducto, Unstructured).  Recommended a "build Mike on Bedrock KB or Vectara" middle path, with a "buy Harvey/Legora for current matter work" side strategy.

This was a fast verbal answer.  It needs to be redone as a written, verified deliverable with actual current pricing, current feature scope as of 2026-05-28, and a properly defended recommendation.  Do not just restate the verbal answer — verify, extend, sharpen, and write the version Hugh can act on.

---

## Method notes for your research

-  **Pricing is the soft point.**  Public pricing for these vendors moves and is sometimes intentionally obscured.  Where you can't get a hard number, say so explicitly and give a range with the source of the estimate.  Don't manufacture confidence.
-  **2026 state matters.**  Some of these vendors have shifted products materially in the last 12 months (e.g., Harvey adding agentic workflows, Legora expanding into the US, Bedrock KB picking up new features, Vectara repositioning).  Use WebSearch / WebFetch to verify current state — do not rely on training data alone.
-  **Citation/verification UX matters more than feature checklists.**  Mike's load-bearing requirement is verbatim accuracy with pinpoint citations a tribunal would accept.  Generic "RAG with citations" is not the same as "citation that opens the source PDF at the right page with the span highlighted."  Compare on that axis specifically.
-  **Sole-practitioner / small-team accessibility matters.**  Harvey and Legora historically sold only to large firms.  If they have changed that in 2026, surface it.  If not, that's a real constraint on the "just buy" framing.
-  **Be honest about what Mike loses if it sits on top of a managed RAG core.**  The offset-anchored citation extraction in §5.6 of the architecture review is not a generic feature; Vectara claims grounded citations but does not (last I checked) expose character-offset anchors.  Verify before recommending.
-  **Vendor lock-in cost is real.**  If Mike ingests 100k pages into Bedrock KB, migrating later means re-ingesting and re-paying OCR.  Factor that into the recommendation.

## Constraints

-  No code; no DB writes; no Railway image changes; no vendor account signups.  Pure research deliverable.
-  Hugh's CLAUDE.md preferences apply (formatting, US English, em dashes, double-spacing after periods).
-  The architecture review's substantive decisions stand unless your research finds a reason to revise them.  If you do find such a reason (e.g., a vendor that genuinely obsoletes the build), say so and explain the trade.
-  Don't pad.  A short, defensible, decisional answer beats a long survey.

## What "done" looks like for this round

`docs/cc-runs/2026-05-28-mike-build-options-review.md` containing:

1.  Verified state of the autonomous-agent landscape relevant to this build, with a decisional recommendation for Question 1.
2.  Verified state of the vendor landscape (all three tiers), with a decisional recommendation for Question 2 picking among the four framings (just buy / build on managed core / build as architected / hybrid).
3.  If the recommendation is "build on a managed core" or "hybrid," a revised phased plan with realistic sizing, costs, and what changes from the prior architecture review.
4.  A flagged list of open questions Hugh should confirm before code is drafted on the basis of the new recommendation.
5.  No code changes.  No vendor signups.  No DB writes.  Research and writing only.

When Hugh signs off on the revised path, a follow-on session will be authorized to begin implementation under the chosen framing.
