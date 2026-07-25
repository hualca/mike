# Mike vector retrieval — architecture review

**Date**: 2026-05-27
**Branch**: track-a/p1-complete
**Status**: Design review.  No code, no image swap, no DB writes performed.
**Reviewer**: fresh CC session, working from `2026-05-27-mike-vector-architecture-carryover.md`.

---

## 1.  Verified current state

I read the files the carryover doc pointed at.  The asserted state holds with one nuance worth surfacing.

| Asserted | Verified | Notes |
|---|---|---|
| `documents` has 13 columns, no vector column. | ✅ Confirmed via `backend/schema.sql:99–112` (12 declared + `current_version_id` added at L146).  Matches live (P1 doc). | — |
| `storage_path` lives on `document_versions`, not `documents`. | ✅ Confirmed via `backend/schema.sql:123`; `loadActiveVersion()` in `documentVersions.ts:38–60` reads it from versions. | — |
| `buildProjectDocContext()` filters `status='ready'`. | ✅ Confirmed at `chatTools.ts:3157`. | — |
| `find_in_document` is keyword-only Ctrl+F. | ✅ Confirmed at `chatTools.ts:288–317`. | — |
| `read_document` dumps full text. | ✅ Confirmed at `chatTools.ts:1481–1610`.  Resolves via `loadCurrentVersionBytes()`, falls back to original `storage_path`. | One nuance below. |
| No vector retrieval, embeddings, or semantic search exists. | ✅ Confirmed — no `vector(…)`, `embedding`, or `pgvector` references in `backend/`. | — |
| pgvector not installed on Railway `mike-db`. | ✅ Confirmed by the prior P1 dispatch's verbatim error.  Image swap required. | — |
| Live `documents` has 1 row, status `ready`. | ✅ Per P1 dispatch.  Clean slate. | — |

**Nuance worth flagging (not drift, but architecturally relevant)**: `read_document` already does on-the-fly text extraction (DOCX via `extractDocxBodyText` + mammoth fallback; PDF via `extractPdfText`) per call.  This means today every "read" pays an extraction cost.  Once we have a chunk store with pre-extracted text + offsets, the same operation should become a one-row-set fetch from Postgres rather than an R2 download + extraction.  Worth keeping in mind because it means the new layer doesn't just add capability — it also retires latency from the existing path.

**One thing the carryover doc did not state but matters**: `extractDocxBodyText` flattens DOCX in a way that makes character offsets stable (this is what `edit_document` relies on for matching).  The same flattening pass is the natural source for chunk `char_offset_start/end` anchors for DOCX.  PDF text extraction does not have a comparably stable flattening today — for PDFs (especially scanned), the OCR pipeline becomes the canonical source of stable offsets, and the existing `extractPdfText` path becomes legacy once chunks exist.

---

## 2.  Decisional answers to the 11 open questions

I'm answering each with a verdict and a one-paragraph reason.  Where I'd defer, I say what changes if I do.

### Q1.  pgvector now vs. Turbopuffer directly

**Verdict: go straight to Turbopuffer.  Skip pgvector entirely.**

The "swappable interface, start with pgvector" framing is YAGNI architecture pointing the wrong direction.  Three reasons:
1.  **The workload is already known.**  100k-page arbitrations, hybrid search, per-matter filtering, multi-tenant isolation, eventually 1–5M chunks across active matters.  Turbopuffer was designed for exactly this shape (namespaces, native hybrid, filter pushdown, S3-cold/NVMe-hot tiering).  pgvector on a single Railway node is going to feel memory pressure at multi-matter scale, especially with HNSW + filter combinations.
2.  **The migration-later story is weaker than it sounds.**  A swappable interface lets you migrate the read path; it does not let you migrate the corpus for free.  Re-embedding is cheap ($6/matter for `voyage-law-2`), but re-ingesting OCR'd structured chunks, rebuilding hybrid plumbing, re-tuning filters, and re-validating retrieval quality is several days of work each time.  Better to do it once on the right primitive.
3.  **The Railway image swap is operational risk you avoid entirely.**  No swap to `pgvector/pgvector:pg15`, no `CREATE EXTENSION` migration ordering, no concern about Railway image lifecycle.  Postgres stays the metadata + relational source of truth; Turbopuffer is the search index.  Cleaner separation.

The strong-consistency argument for pgvector (one DB transaction for chunk + embedding) is real but solvable: write the chunk row to Postgres first, then upsert to Turbopuffer keyed by `chunk_id`.  On failure, the chunk row is the durable record and the Turbopuffer upsert is idempotent retry.  Eventually-consistent retrieval is fine.

**What changes if you keep pgvector**: you accept the image swap cost up front, you build BM25 via `tsvector` (lower ranking quality than proper BM25), you write RRF logic in app code, and you keep the option to migrate later but pay the re-ingest cost when you do.  None of this is fatal — it's a recoverable path — but it's a strictly worse starting point given Turbopuffer exists.

### Q2.  Hybrid search implementation

**Verdict: native hybrid via Turbopuffer.**

Falls out of Q1.  Turbopuffer ships BM25 + vector in one query, returns a fused score, supports pre-filter pushdown so per-matter scoping is free.  If you stayed on Postgres, your options are (a) `tsvector` + pgvector + RRF in app code (functional, weaker FTS ranking quality), or (b) bolt on a third system (Meilisearch / Typesense / OpenSearch) for proper BM25 (more operational surface than just using Turbopuffer in the first place).

### Q3.  OCR vendor

**Verdict: Google Document AI Layout Parser as default; Reducto as escalation for known-table-heavy exhibits.**

The proposal said "Textract or Document AI."  Both are credible but they optimize for different things:
-  **Textract**: best handwriting recognition; predictable; mature.  Pricing: ~$1.50/1k pages text-only, ~$15/1k with tables, ~$50/1k with forms.
-  **Google Document AI Layout Parser**: better at reading order on multi-column legal layouts and preserving document structure; ~$10/1k pages.
-  **Reducto**: purpose-built for high-fidelity tables and complex layout; pricier (~$10–30/1k pages) but materially better when tables matter.
-  **Unstructured.io / Tesseract**: ruled out.  Unstructured's hosted accuracy is below the above for legal scans; Tesseract is the proposal's own ruled-out option.

For arbitration the failure modes that bite are: tables in financial exhibits getting mangled, multi-column court filings losing reading order, and Bates numbers in faded headers being missed.  Document AI's Layout Parser handles 1 and 2 better than Textract; for 3 (Bates), both are roughly comparable and both benefit from a regex post-pass.

**Cost reality check on this choice**: at $10/1k pages, a 100k-page arbitration is **$1,000 in OCR, not the $150–$300 the proposal estimated**.  The proposal's number assumed text-only OCR, which would mangle most exhibit tables and would not be acceptable for the target workload.  If Hugh wants the $150 floor, accept the table-fidelity cost.  More realistically:
-  Tier 1 (fast, cheap): Document AI OCR-only on all pages: $150
-  Tier 2 (default): Document AI Layout Parser on all pages: $1,000
-  Tier 3 (precision): Reducto on table-detected pages, Document AI on the rest: $300–$700 (depends on table density)

**Recommend the tiered approach**: ingest all pages through Document AI Layout Parser; flag pages where structure confidence is low or where >N% of chars are inside detected table regions; re-process those via Reducto.  This keeps the floor low for prose-heavy matters and adds precision exactly where it pays off.

### Q4.  Reranker

**Verdict: Voyage rerank-2.5.**

Cohere Rerank 3.5 and Voyage rerank-2.5 are both excellent and within tolerance of each other on legal benchmarks.  Decision is operational: Voyage embeddings + Voyage rerank + Anthropic Claude is one billing relationship, one SLA tier, one vendor pager.  Voyage is now owned by Anthropic so this consolidation will only get tighter.  Open-source `bge-reranker-large` is fine if you want to self-host eventually, but for now self-hosting a reranker is operational weight for no real gain.

### Q5.  Chunking strategy

**Verdict: document-type-aware chunking with small-to-big as the default fallback.**

The proposal's small-to-big is a sensible default but it's the wrong primary strategy for legal records.  Legal citation is paragraph- and line-precise, and the citation unit is *prescribed* by document type, not chosen by retrieval engineers:

| Document type | Citation unit | Chunk boundary |
|---|---|---|
| Pleading / brief / memorial | numbered paragraph (¶ 47) | per numbered paragraph |
| Witness statement / expert report | numbered paragraph | per numbered paragraph |
| Hearing transcript | day / page / line range (Day 3, 47:12–48:5) | per Q–A pair or per speaker turn |
| Award / decision | numbered paragraph | per numbered paragraph |
| Statute / authority | article / section | per article or major heading |
| Exhibit (contract, etc.) | section / clause | structure-aware, fallback small-to-big |
| Exhibit (table-heavy, e.g. financials) | row / table | per logical sub-table |
| Correspondence | email / letter | per email or letter |

**Route on document type** (classified during L1) and use the small-to-big 256-token fallback only when the type is unknown or the document genuinely lacks structure (random PDFs, photos of evidence).  This is more work in L1 but it is the difference between "RAG that mostly works" and "lawyers trust the citations."  Verbatim excerpting + pinpoint citation is the entire product; if you chunk a transcript by token count, you cannot cite Day 3 47:12 reliably.

RAPTOR-style hierarchical summaries are interesting but out of scope for v1.  Defer.

### Q6.  Metadata extraction model

**Verdict: Claude Haiku 4.5, first-page-only extraction, single-pass.**

Per-doc metadata (party, date, exhibit number, doc type, jurisdiction, key entities) almost always lives on the first 1–2 pages of legal documents.  Run Haiku 4.5 once per document on pages 1–2 (with a fallback to scanning the TOC if the doc is long and the first page is generic).  Expected cost: ~5,000 docs/matter × ~1k input tokens × Haiku pricing = under $10 per matter.  Trivial.

Multi-pass is overkill and adds latency.  If a particular extraction fails (low confidence, missing required fields), escalate that single doc to Sonnet — cheaper than running Sonnet on the entire corpus.

Cross-reference resolution (`Exhibit C-247` → `document_id`) is a deterministic second pass after all docs are classified.  No LLM needed for the resolution step; just normalize and join.

### Q7.  Verbatim quote verification

**Verdict: offset-anchored extraction.  Do not rely on character-match checking.**

The proposal's character-match approach has unavoidable failure modes: LLMs normalize whitespace, convert quotes, fix what they perceive as typos.  Character-matching against the LLM's output catches the gross failures but the residual hallucinated-quote risk is exactly the kind of thing that surfaces at tribunal in front of the worst possible audience.

Better pattern: **the LLM never produces the quote text; it only chooses which span to highlight.**  Output schema:

```json
{
  "text": "the Tribunal's view was that 'time was of the essence'",
  "spans": [
    {"type": "paraphrase", "from_chunk": "..."},
    {"type": "quote", "chunk_id": "ck_abc", "char_start": 1248, "char_end": 1273}
  ]
}
```

The rendering layer reads `chunks.text[char_start:char_end]` from the source chunk and substitutes that into the rendered output.  The LLM's `text` field for `type: "quote"` spans is ignored.  This makes "the LLM misquoted" structurally impossible.  Paraphrases are still allowed and labeled as such.

This pattern requires that chunks store the *original* text exactly (including OCR artifacts that may be present in the source) — do not normalize the chunk text at storage time.  Normalize at retrieval time for matching purposes only.

### Q8.  Multi-tenant isolation

**Verdict for v1: application-layer enforcement of `project_id` on every read, with cross-project leakage tests in the test suite.  Defer formal ethical-wall isolation (per-tenant DB / per-namespace) to v2.**

Supabase RLS gives row-level isolation by user, which is what's already wired up.  For per-matter scoping the right pattern is:
1.  Vector store: one Turbopuffer namespace per `project_id`.  The retrieval interface accepts `project_id` and never queries across namespaces.
2.  Postgres: every chunk row carries `project_id` (denormalized for filter efficiency) and the retrieval interface always includes it in the WHERE clause.
3.  Test: an integration test that ingests two projects' docs and asserts that a query on project A returns zero results for project B chunks — both at the Turbopuffer call layer and at the synthesis output layer.

This is genuinely sufficient for the current use case (sole-practitioner-style + small teams).  For *ethical walls* (the formal Chinese-wall guarantee where a firm has positively conflicted-out members from a matter and must demonstrate they technically cannot access it), defer to v2.  When that's needed, the right answer is per-matter namespaces in Turbopuffer plus per-matter encryption keys, which is straightforward but adds enough complexity that it shouldn't be in v1 scope.

### Q9.  Re-embedding on version

**Verdict: chunks hang off `document_versions.id` (proposal got this right).  Keep prior-version chunks indefinitely; mark superseded; default UI behavior is to query the current version, with an opt-in toggle to include historical versions.**

The infra answer is straightforward: storage and embedding are cheap, version coherence in historical chats matters, so keep everything.  Re-embedding a re-versioned 100k-page corpus is ~$6 in Voyage tokens and ~$1,000 in fresh OCR (if the version differs in pages); skipping pages whose hash hasn't changed brings the OCR cost way down.

The harder question is UX: when a user looks back at last Tuesday's chat that cited "Cl. Memorial v3 ¶ 47," what should the citation show today if the doc is now v5?  Three sensible defaults:
1.  Show the historical text (what was cited at the time), with a "current version is v5" affordance.
2.  Show the current text with a "this paragraph has been edited since" affordance.
3.  Show both side-by-side.

Recommend (1) as the default — historical chats should be historically faithful — with a "show current" toggle.  This is a UX decision Hugh should sign off on; the infra (keep all version chunks) is independent of which UX wins.

### Q10.  Agentic workflow framework

**Verdict: Claude Agent SDK (TypeScript).**

Mike already runs the Anthropic SDK tool-use loop heavily (`chatTools.ts` is the centerpiece).  The Claude Agent SDK is the natural extension of that primitive: same vendor, same TS stack, designed for exactly the orchestration pattern you want (multi-step plans, tool composition, intermediate checks).  LangGraph is heavier, Python-native, and adds a framework dependency that Mike doesn't otherwise want.  Don't bolt on framework weight when the existing primitive already does the job.

For the workflows themselves: store each as a TypeScript function that orchestrates tool calls + LLM checks.  No DSL.  No metaprogramming.  The "Workflow" type Mike already has (in the `workflows` table) is fine as a UX surface for templated parameters; the orchestration logic is just code.

### Q11.  Scope discipline — what is the true v1?

**Verdict: 7 layers is too much.  True v1 is L1 through L6 with vector-only retrieval (no hybrid, no rerank, no agentic workflows).  Validate on one real arbitration.  Then earn the right to add L4-hybrid, L4-rerank, and L7-workflows.**

The minimum that genuinely delivers value on a 100k-page arbitration is:
-  Reliable OCR with structure preservation (L1)
-  Document-type-aware chunking (L2)
-  Embeddings in Turbopuffer with `project_id` filter (L3)
-  Vector-only retrieval with LLM query rewrite (L4 simplified)
-  Synthesis with offset-anchored citations (L5)
-  Clickable citations in the doc viewer (L6) — **this is the trust layer; without it the system is unverifiable and lawyers will not adopt it**

Defer to v1.5 / v2:
-  Hybrid + rerank (probably adds 10–20% precision; worth measuring before assuming)
-  Agentic workflows (high value but earned through v1 validation; first one is a thoughtful template, not a framework)
-  Self-check retrieval retry (L4 step 5)
-  "Show all candidates" view (L6) — useful for debugging more than for end users

What changes if you defer hybrid/rerank: pure-vector retrieval at scale is genuinely good for natural-language questions, less good for "find me every mention of 'tonnage shortfall'" style keyword queries.  But you already have `find_in_document` for the latter and it stays.  Lose the seamless single-tool UX; gain four weeks.

---

## 3.  Revised architecture (prose + ASCII)

```
                                         R2 (source PDFs/DOCX, immutable per version)
                                                       ▲
                                                       │ uploads, version writes
                                                       │
   ┌─────────────────────────────────────┐             │
   │  Frontend (Next.js)                 │─────────────┘
   │  - Upload, project mgmt, chat UI    │
   │  - Doc viewer w/ citation jump      │
   └────────────────┬────────────────────┘
                    │ /api/projects/:id/chat
                    ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  Backend (Express)                                               │
   │                                                                  │
   │  ┌──────────────┐   ┌──────────────────┐   ┌─────────────────┐ │
   │  │ Ingest queue │──▶│  Ingest worker   │──▶│ Chunk + embed   │ │
   │  │ (BullMQ on   │   │  - OCR (Doc AI)  │   │ - Voyage law-2  │ │
   │  │  Railway     │   │  - classify+meta │   │ - Turbopuffer   │ │
   │  │  Redis)      │   │  - chunk by type │   │   upsert        │ │
   │  └──────────────┘   └──────────────────┘   └─────────────────┘ │
   │         ▲                                            │          │
   │         │ documents.status='ready' trigger           │          │
   │         │                                            ▼          │
   │  ┌──────┴───────────────────────┐    ┌────────────────────────┐│
   │  │ Postgres (Railway mike-db)   │    │ Turbopuffer            ││
   │  │  - documents (existing)      │    │  ns: project_<uuid>    ││
   │  │  - document_versions (exist) │    │  attrs: doc_id, ver_id,││
   │  │  - chunks (NEW)              │    │   doc_type, page,      ││
   │  │  - document_metadata (NEW)   │    │   para, bates_start    ││
   │  │  - ingest_jobs (NEW)         │    │  fields: vector,       ││
   │  └──────────────────────────────┘    │   text (for BM25)      ││
   │                                       └────────────────────────┘│
   │                                                  ▲              │
   │  Chat path:                                      │ hybrid       │
   │  ┌─────────────────────────────────────────┐    │ search       │
   │  │ Query rewrite (Haiku)                   │────┘ (when v1.5)   │
   │  │   → filters + sub-queries               │                    │
   │  │ → semantic_search tool                  │                    │
   │  │   → Turbopuffer query (vector + filter) │                    │
   │  │ → rerank top-50 (Voyage)  [v1.5]        │                    │
   │  │ → context expand to parent section      │                    │
   │  │ → synthesis (Sonnet/Opus) with          │                    │
   │  │   offset-anchored citation schema       │                    │
   │  └─────────────────────────────────────────┘                    │
   └──────────────────────────────────────────────────────────────────┘
```

**What changed vs. the proposal**:

1.  **Vector store**: Turbopuffer, not pgvector.  Railway DB stays as-is — no image swap.  Phase A is now "set up Turbopuffer + retrieval interface" rather than "swap Postgres image."
2.  **Hybrid search**: native via Turbopuffer (when activated in v1.5), not a tsvector + pgvector + app-code RRF construction.
3.  **OCR vendor**: Google Document AI Layout Parser as default, with tiered escalation to Reducto on table-heavy pages.  Not Textract.
4.  **Chunking**: document-type-aware routing, with small-to-big as the fallback for unstructured cases — not small-to-big as the primary strategy.
5.  **Citation verification**: offset-anchored extraction, not LLM-output character-match.  Chunks store original text including OCR artifacts; retrieval-time normalization only.
6.  **Ingest pipeline**: explicit queue (BullMQ on Redis, or whatever Railway makes easy).  100k-page ingest is hours of work, must be async and resumable.  Adds `ingest_jobs` table for tracking + retry.
7.  **Layer compression for v1**: ship L1–L6 minus hybrid/rerank/agentic.  Validate on one real arbitration.  Earn the right to L4-hybrid and L7-workflows.
8.  **Reranker**: Voyage rerank-2.5 (deferred to v1.5 in scope, but locked in for the slot).
9.  **Tenant isolation**: per-project Turbopuffer namespace + denormalized `project_id` on `chunks` + cross-project leakage tests.  Formal ethical-wall machinery deferred to v2.
10.  **Version handling**: chunks hang off `document_versions.id` (this matches the proposal).  Default UI shows historical-version citations as-written.

**What stayed the same**:
-  Voyage `voyage-law-2` embeddings, 1024-dim, cosine.
-  R2 for source storage.
-  Supabase auth.
-  Claude Sonnet 4.6 / Opus 4.7 split for synthesis by complexity.
-  Per-doc metadata extraction (party, date, exhibit number, doc type, jurisdiction).
-  Cross-reference resolution as deterministic post-pass.

---

## 4.  Revised phased plan with realistic sizing

Time estimates assume one developer (Hugh + CC) working effectively full-time, with the usual real-world overhead.  These are **calendar weeks for a focused engineer**, not "engineer-weeks of pure coding."

| Phase | Work | Calendar | Cost (build) |
|---|---|---|---|
| **A.  Foundations** | Turbopuffer account + per-project namespace pattern; Voyage + Google Document AI accounts and env vars; Redis on Railway (or equivalent) for ingest queue; `RetrievalInterface` TS abstraction (read path stub).  No image swap. | 2–3 days | ~$0 (account setup) |
| **B.  Ingestion v1** | Document AI Layout Parser integration; per-doc metadata extraction (Haiku 4.5, first-page); document type classifier; structure-preserving text + offset extraction; document-type-aware chunking router; small-to-big fallback; `chunks` and `document_metadata` schema; `ingest_jobs` table + BullMQ worker; backfill the 1 existing doc. | 1.5–2 weeks | ~$20 (Haiku on test docs) |
| **C.  Embedding + index** | Voyage `voyage-law-2` integration; chunk batch embed; Turbopuffer upsert with `project_id` namespace + `doc_id`/`version_id`/`doc_type`/`page`/`para`/`bates` attrs; BM25 text field for v1.5; idempotent retry on partial failure. | 3–4 days | ~$1–5 (test embeddings) |
| **D.  Retrieval v1** | LLM query rewriter (Haiku) producing filters + sub-queries; `semantic_search` chat tool with `project_id` scope; Turbopuffer query (vector-only for v1); context expansion to parent section; explicit JSON Schema for tool output. | 4–5 days | ~$5 (test queries) |
| **E.  Synthesis + offset-anchored citations** | Output schema with `quote`/`paraphrase` spans; rendering layer that substitutes chunk text into `quote` spans by offset; citation API; cross-project leakage test. | 1 week | ~$10 (test syntheses) |
| **F.  UI citations** | Clickable citation chips in chat output; doc viewer accepts `chunk_id` + offsets and highlights the span on the right page; transcript citation rendering (day/page/line); historical-version affordance. | 1–1.5 weeks | ~$0 |
| **G.  Real-workload validation** | Ingest one real Hugh-selected arbitration (target: ~50k–100k pages); run 20 representative queries; measure verifiable-citation rate, median latency, retrieval recall.  Fix the top 3 problems found. | 1 week (+ ingest wall-clock time, see below) | ~$500–$1,200 OCR + ~$5 embed |
| **H.  Hybrid + rerank** (post-validation, conditional on G) | Flip Turbopuffer query to hybrid (BM25 + vector); add Voyage `rerank-2.5` over top-50; A/B against vector-only on the validation queries from G; keep whichever wins per query class. | 4–5 days | ~$5 |
| **I.  First agentic workflow** (post-validation, conditional on G) | Pick one: chronological exhibit index, witness inconsistency check, or timeline-from-correspondence.  Build it as a TS workflow on Claude Agent SDK.  Wire to Mike's existing workflow UI. | 1–1.5 weeks | ~$10–20 |

**Totals**:
-  **v1 (A–G)**: ~6–7 calendar weeks of focused work to ingest-able, query-able, citation-verifiable system, validated on one real arbitration.
-  **v1.5 (+ H + I)**: ~8.5–10 weeks total.

This matches Hugh's "6–10 weeks of focused work" estimate at the upper end with hybrid + rerank + one workflow included.  The proposal's "6–10 weeks" was honest sizing; this revision keeps the envelope and reallocates the work.

**Important wall-clock note for Phase G**: a 100k-page ingest is not 1 week of human time + instant ingest.  Document AI runs at ~2–5 pages/sec single-threaded; parallelized across N workers it's `100,000 / (N × 3) sec` ≈ a few hours with N=20 workers.  Plus chunking + embedding + upsert.  Realistic end-to-end ingest wall-clock for a 100k-page matter: **6–12 hours unattended on the right concurrency**.  Build the ingest pipeline assuming "kick off Friday evening, query Saturday morning."  This is a UX/expectation thing more than a build-cost thing.

---

## 5.  Cost breakdown (run-rate, not build)

These are the numbers Hugh should plan to live with.

### Per-arbitration one-time ingest (100k pages, ~5,000 docs, ~50M tokens)

| Line item | Cost |
|---|---|
| OCR — Document AI Layout Parser ($10/1k pages) | $1,000 |
| OCR — Reducto escalation on ~10% table-heavy pages | +$100–$300 |
| Metadata extraction — Haiku 4.5 (5k docs × ~1k input tokens) | ~$5 |
| Embeddings — Voyage `voyage-law-2` (~$0.12/M tokens × 50M) | ~$6 |
| Turbopuffer first-month storage (hot tier, ~10GB) | ~$15 |
| **Total first-month per arbitration** | **~$1,150–$1,350** |

The proposal's $150–$300 estimate was based on text-only OCR.  The real number is ~$1,000+ if you want exhibit tables to come through readable, which the workload requires.  This is still small compared to lawyer time — for context, $1,000 is ~2 hours at a senior associate's billing rate, against potentially hundreds of hours saved over the matter's lifecycle.

### Per active arbitration ongoing

| Line item | Cost |
|---|---|
| Turbopuffer hot storage (~10GB × $1.50/GB-month) | ~$15/month |
| Turbopuffer cold tier (after matter goes dormant) | ~$1/month |
| R2 source doc storage | trivial (~$0.50/month for 10GB) |

### Per query

| Query class | Cost |
|---|---|
| Simple Q&A (Sonnet, ~10k input + ~1k output) | ~$0.04 |
| Complex / multi-hop (Opus, larger context, hybrid + rerank, citation cycle) | ~$0.20–$0.40 |
| Agentic workflow run (multi-step, multi-LLM-call) | ~$1–$5 per run |

For a working lawyer hitting Mike heavily, expect **~$20–$50/month in query cost per active matter** if they're querying 10–50 times a day.

### Build-time spend (Phases A–I)

Total LLM + OCR + vector spend during build: **~$600–$1,500**, dominated by the Phase G real-arbitration validation ingest.  All other phases are tens of dollars at most.

---

## 6.  Assumptions you should confirm before code

These are choices I baked into the recommendation that depend on Hugh's actual preferences/constraints:

1.  **Turbopuffer is acceptable as a new external dependency**, given (a) the convenience of native hybrid + namespaces, (b) the pricing model, (c) the operational burden of "one more vendor."  If Hugh strongly prefers "everything in Postgres," fall back to pgvector + image swap and accept the worse hybrid story.
2.  **Google Document AI is acceptable as the default OCR vendor** vs. Textract.  This is partly a cost decision (Doc AI Layout Parser at ~$10/1k > Textract text-only at $1.50/1k) and partly a quality bet on multi-column legal layouts.  If Hugh has prior experience with one or the other in arbitration practice, defer to that.
3.  **Realistic ingest cost is ~$1,000+/matter, not $150–$300.**  If $1,000 is a blocker, the tier mix shifts toward Tier 1 (text-only OCR, ~$150) and you accept that exhibit tables will arrive mangled.  This is a real trade and Hugh should make it consciously.
4.  **v1 ships *without* hybrid search + reranker, validates, then adds them.**  If Hugh would rather ship hybrid from day one and shave a week off Phase G validation (because Turbopuffer makes hybrid cheap), that's defensible — just acknowledge the validation work measures hybrid+rerank, not the baseline.
5.  **First agentic workflow choice deferred to post-validation.**  My instinct says chronological exhibit index is the highest-value first workflow (it surfaces document organization directly and is a high-volume task in arbitration prep), but Hugh's practice may say witness-inconsistency-finder or timeline-from-correspondence pays back faster.  Pick after G.
6.  **Historical-version citation default is "show what was cited at the time."**  This is a UX assertion.  Hugh should sign off before F builds it the other way.
7.  **Multi-tenant isolation is "good enough" via app-layer enforcement + tests.**  If Hugh anticipates needing formal ethical-wall guarantees in v1 (e.g., if the system will host multiple firms or formally conflicted matters), bring that into v1 scope — adds ~1 week.
8.  **Per-paragraph chunking for pleadings/witness statements assumes paragraphs are reliably numbered in the source.**  For arbitration practice, this is usually true.  For edge cases (e.g., unnumbered correspondence drafts, very old documents), fall back to small-to-big.
9.  **Ingest concurrency target of ~20 parallel workers** for the 6–12 hour wall-clock estimate.  Railway worker provisioning and Document AI quota both need to support this.  If they don't, ingest is overnight rather than same-day; not a blocker but a real expectation.
10.  **No code, no DB writes, no image swaps.**  This review is design-only.  When Hugh signs off, the next session is authorized to start Phase A.

---

## 7.  TL;DR for the sign-off call

-  Go directly to **Turbopuffer** for vectors + native hybrid.  Skip pgvector.  No Railway image swap.
-  **Google Document AI Layout Parser** is the default OCR, **Reducto** for table-heavy escalation.  Budget **~$1,000/arbitration** for ingest OCR (not $150).
-  **Voyage `voyage-law-2` embeddings + Voyage `rerank-2.5` + Claude Sonnet/Opus** is the synthesis stack.  Single-vendor billing for the AI parts.
-  **Document-type-aware chunking** routed by classifier; small-to-big only as fallback.
-  **Offset-anchored citation extraction**, not LLM-output character-match.  Misquotes structurally impossible.
-  **v1 = L1–L6 minus hybrid/rerank/agentic.**  Ship it, validate on one real arbitration, then add H (hybrid + rerank) and I (one workflow).
-  **Timeline: ~6–7 weeks to validated v1, ~8.5–10 weeks to v1.5 with hybrid + one workflow.**  Matches the original envelope; reallocates the work.
-  **Run-rate cost per active matter**: ~$15/month storage + ~$20–$50/month queries.  One-time ingest dominates.
