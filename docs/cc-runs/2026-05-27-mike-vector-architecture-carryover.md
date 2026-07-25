# Carryover — Mike vector retrieval architecture review

**Date**: 2026-05-27
**Branch**: track-a/p1-complete
**Purpose**: Hand a proposed architecture to a fresh CC session for critique and improvement before any code is drafted.
**Status of work**: Architecture proposed; **not yet finalized; no code to be written this round.**

---

## What you (the new session) are being asked to do

1.  Read this whole document.
2.  Read the referenced source files and verify the current state of the codebase matches what is asserted here.  Flag drift.
3.  Critique the proposed architecture below.  Be specific.  Look for:
    -  Wrong design choices (e.g., pgvector vs. a purpose-built vector DB at the target scale).
    -  Missing layers or capabilities (e.g., things Harvey/Legora do that this design omits).
    -  Underestimated complexity or hidden gotchas.
    -  Better orderings (what could be deferred? what must come first?).
    -  Cheaper or simpler equivalents that meet the requirements.
    -  Anything that looks like cargo-culted "best practice" rather than load-bearing.
4.  Propose concrete improvements.  Where you disagree, say what you would do instead and why.
5.  **Do not draft implementation code yet.**  Once Hugh finalizes the architecture from your feedback, a subsequent session will be authorized to draft code and execute.

Output expected: a written critique + revised architecture, written to `docs/cc-runs/2026-05-27-mike-vector-architecture-review.md`.  Keep it specific and decisional — no vague "consider X."  If you say "use Y instead of X," explain the tradeoff in one or two sentences.

---

## Project context (read this if you have no prior context on Mike)

Mike is an open-source legal document assistant.

- **Upstream repo**: `https://github.com/willchen96/mike.git` (configured as `upstream` remote).
- **This fork**: `https://github.com/hualca/mike.git` (origin), owned by Hugh Carlson.
- **Marketing site**: `mikeoss.com`.
- **Stack**: Next.js frontend, Express backend, Supabase Auth/Postgres for metadata, Cloudflare R2 for document storage, Railway-hosted Postgres (`mike-db`) as the application DB.
- **Model providers**: Anthropic, Google Gemini, OpenAI (BYO key per user).
- **Current document handling**: documents uploaded to R2, metadata in `documents` and `document_versions` tables.  Retrieval is **explicit + keyword-only** — users select documents into a project; the chat tools `read_document` (full text dump) and `find_in_document` (Ctrl+F-style keyword search with context) operate on the selected docs.
- **No vector retrieval exists today.**  No embeddings, no semantic search, no vector store.

Key files to verify current state:
- `README.md` — project overview.
- `backend/schema.sql` lines 99–118 — current `documents` table (13 columns, no vector column).
- `backend/src/lib/chatTools.ts`:
  -  `read_document` tool implementation around lines 1490–1600.
  -  `find_in_document` tool around lines 288–317.
  -  `buildProjectDocContext()` around lines 3138–3230 (queries `documents` filtered by `status='ready'`).
- `backend/src/routes/projectChat.ts` lines 92–101 — invokes `buildProjectDocContext()`.
- `backend/src/lib/storage.ts` — R2 upload/download primitives.
- `backend/src/lib/documentVersions.ts` — versioning of edited documents (each edit produces a new R2 object).

## Recent decision context (read this before critiquing)

Read `docs/cc-runs/2026-05-24-track-a-p1-complete.md` in full.  Key points:

- Live `documents` table has 1 row (a single docx, status `ready`).  Effectively a clean slate.
- The Railway `mike-db` Postgres 15 image **does not include pgvector**.  Verified by `pg_available_extensions` returning 0 rows for `vector`, and `CREATE EXTENSION vector` failing with "extension control file missing."
- This puts pgvector adoption in the "image change required" bucket, not the "privilege grant required" bucket.
- The TCP Proxy on `mike-db` was enabled for the diagnostic and should be disabled now; do not poke the live DB unless necessary.

## The target use case (this is what the architecture must serve)

Hugh's primary intended workload for Mike is **full arbitration records**.

- A single arbitration record can run **100,000+ pages**.
- One arbitration ≈ ~50M tokens.  This is ~250× Claude's 200k context window.  Long-context-only solutions are **not viable**.
- Document mix: pleadings, exhibits (often thousands per matter), witness statements, expert reports, hearing transcripts, procedural orders, awards, legal authorities.
- ~70–90% of exhibits are scanned PDFs → OCR is on the critical path.
- The lawyer's tasks include: finding specific factual assertions, tracing argument lineage, cross-referencing exhibits, building timelines, finding inconsistencies across witness statements, locating authority, **excerpting verbatim with pinpoint citations** (exhibit number + page + Bates range + paragraph; transcripts cite day/page/line).
- Misquoting is a credibility killer; tribunals and opposing counsel verify quotes.  **Verbatim accuracy and citation precision are not "nice to have" — they are the entire product.**

## Reference systems (what to benchmark against)

Hugh asked the architecture to be assessed against what Harvey and Legora offer.  Public-source summary (treat as a starting point, not gospel — verify and extend):

**Harvey**:
- *Vault*: matter-scoped document repository with cross-document Q&A and citations to source.
- *Workflows*: multi-step legal tasks (due diligence, contract review) decomposed into retrieval + extraction + synthesis.
- Architecture signals: hybrid retrieval (semantic + structured metadata), citation provenance, domain-tuned models.

**Legora** (formerly Leya):
- *Tabular review*: batch extraction of structured fields across hundreds of docs into a spreadsheet view.
- *Assistant*: grounded Q&A with citations, matter-scoped.
- *Markup*: drafting/redlining grounded in firm precedent.

**Common architectural patterns (inferred)**:
1.  Hybrid retrieval — dense (vector) + sparse (BM25) combined via Reciprocal Rank Fusion or equivalent.
2.  Cross-encoder reranking on the candidate set.
3.  Structured-extraction layer alongside retrieval (not all queries are RAG; many are SQL over extracted fields).
4.  Disciplined citation provenance with exact page/Bates/paragraph anchors.
5.  Per-matter isolation with strict access controls.
6.  Agentic decomposition of complex queries.
7.  Long-context use *after* retrieval narrows scope, not as the primary mechanism.

---

## Proposed architecture (this is what you are critiquing)

### Embedding model choice
- **Voyage `voyage-law-2`**, 1024-dim, cosine distance.  Selected because (a) trained on legal corpora, (b) Voyage is now part of Anthropic so it pairs naturally with Claude, (c) pricing is reasonable (~$0.12/M tokens).

### Vector store choice
- **Start with pgvector on Railway Postgres**, accessed via a swappable retrieval interface.
- Path: swap the Railway `mike-db` image to `pgvector/pgvector:pg15` (binary-compatible same-major-version Postgres swap; volume persists), then `CREATE EXTENSION vector;`.
- **Open question for you**: at the target scale (potentially millions of chunks across multiple arbitrations over time), is pgvector still the right call, or should the design start on Turbopuffer / Vespa / OpenSearch / Weaviate / Qdrant?  Turbopuffer in particular looks like a strong technical fit (native hybrid search, S3-backed cheap storage, filter pushdown).  Hugh wants a decisional recommendation here, not a survey.

### Phased plan
| Phase | Work |
|---|---|
| **A. Image swap** | Railway image → `pgvector/pgvector:pg15`, `CREATE EXTENSION vector;`, smoke test. ~30 min. |
| **B. Ingestion + schema** | New chunking pipeline, OCR, metadata extraction, embeddings.  Trigger on `documents.status='ready'`.  Backfill the 1 existing doc. |
| **C. Retrieval surface** | Hybrid (BM25 + cosine) → RRF → reranker.  Add `semantic_search` tool alongside `find_in_document` and `read_document`. |
| **D. Versioning loop** | Re-chunk + re-embed on new `document_versions`.  Decide retention policy for prior versions. |
| **E. UI citations** | Clickable citations that jump to highlighted source span in doc viewer. |
| **F. Agentic workflows** | Encode recurring task shapes (timeline building, exhibit index, witness inconsistency check) as multi-step plans. |

### Layer-by-layer

**L1 — Ingestion**
- OCR with layout preservation.  Proposed vendor: AWS Textract or Google Document AI (not Tesseract).
- Bates-number extraction (regex + LLM fallback).
- Document classification (LLM tags: pleading / exhibit / transcript / award / authority / correspondence).
- Per-document metadata extraction (parties, date, exhibit number, doc type, jurisdiction, key entities) → structured `document_metadata` table.
- Cross-reference resolution (e.g., "Exhibit C-247" → resolved doc ID).
- Position-preserving text extraction: every paragraph carries `(page_start, page_end, bates_start, bates_end, paragraph_index, char_offset_start, char_offset_end)`.

**L2 — Chunking**
- Structure-aware with token-cap fallback.  The P1 doc found that `structure_tree` has null `page_number` nodes and flat (empty-children) nodes, so the outline cannot be trusted alone.
- **Small-to-big strategy**: embed small chunks (~256 tokens) for retrieval precision; return surrounding parent section at synthesis time for context.
- Each chunk carries full positional metadata plus `parent_section_id`.

**L3 — Storage**
- `documents`, `document_versions` (existing).
- `document_metadata` (new) — structured per-doc fields.
- `chunks` (new) — text + positional metadata + `tsvector`.
- `chunk_embeddings` (new) — `vector(1024)`, `model_name`, `model_version`.
- Indexes: HNSW on `embedding` (cosine), GIN on `tsvector`, btree on metadata filter columns.
- Chunks hang off `document_versions.id`, not `documents.id` — historical chats must stay coherent across edits.

**L4 — Retrieval**
1.  Query understanding — LLM rewrites the user question into a retrieval plan (filters, sub-queries, expected answer shape).
2.  Hybrid candidate generation — BM25 top-50 + cosine top-50 → RRF → top-50.
3.  Cross-encoder reranking — Voyage `rerank-2.5` (or `rerank-2-lite` for cost-sensitive paths).  Keep top 10–15.
4.  Context expansion — for each surviving chunk, expand to parent section.
5.  Self-check (optional) — broaden filters and retry if retrieved set lacks answer signal.

**L5 — Synthesis with citations**
- Claude Opus 4.7 for complex; Sonnet 4.6 for routine.
- Output schema enforces: every factual claim has at least one citation `chunk_id`.
- Verbatim excerpts: delimited quote tokens, post-processing checks character-for-character match against source chunk.  If no match → mark as paraphrase or reject.

**L6 — Verification UI**
- Citation → doc viewer at correct page with span highlighted.
- "Show all candidates" view (what ranked, what was used, what wasn't).
- Confidence indicator per claim from rerank score + cross-chunk agreement.

**L7 — Agentic workflows**
- Recurring task shapes encoded as multi-step plans.
- First candidate workflows: chronological exhibit index, cross-examination prep, witness-statement inconsistency-finder, timeline-from-correspondence.

### Honest sizing
- **6–10 weeks** for a proper v1 with OCR + hybrid + rerank + citation UI + one agentic workflow.
- Per-arbitration cost (one-time ingest of 100k pages): roughly $150–$300 (OCR dominates).
- Per-query cost: small.
- Storage: trivial (~600 MB / arbitration for embeddings).
- Mike will not match Harvey/Legora head-to-head; the goal is to be specifically excellent for Hugh's arbitration practice.

---

## Open questions to resolve in your critique

1.  **Vector store choice**: pgvector now and migrate later, or go directly to Turbopuffer / other?  Decisional answer please.
2.  **Hybrid search implementation**: Postgres `tsvector` for BM25-ish, or punt FTS to a real engine from day one?  Postgres FTS ranking quality vs. operational simplicity tradeoff.
3.  **OCR vendor**: AWS Textract vs. Google Document AI vs. Azure Document Intelligence vs. something else (Unstructured.io, Reducto, etc.)?  For legal/arbitration scanned exhibits specifically.
4.  **Reranker**: Voyage `rerank-2.5` vs. Cohere Rerank vs. open-source (bge-reranker-large)?  Latency / quality / cost tradeoff.
5.  **Chunking strategy**: small-to-big (proposed) vs. hierarchical (Llamaindex-style parent-doc retrieval) vs. RAPTOR-style clustered summaries — what wins for arbitration records specifically?
6.  **Metadata extraction model**: which model and which prompting strategy?  Per-document one-shot vs. multi-pass?  How do we keep it cheap at 100k pages?
7.  **Verbatim-quote verification**: is the proposed character-match check sufficient, or do we need a stricter scheme (offset-anchored re-extraction from source text only)?
8.  **Multi-tenant isolation**: per-matter scoping — schema-level, row-level (RLS), or application-level?  What does Supabase RLS already give us, and is that enough for ethical-wall guarantees?
9.  **Re-embedding on version**: keep prior-version embeddings (storage cost) or hard-replace (loses historical chat coherence)?  Reasonable default?
10.  **Agentic workflow framework**: roll our own, use a framework (LangGraph, Anthropic SDK's tool-use loop, Claude Agent SDK)?  What's the right primitive given Mike already uses chat tools heavily?
11.  **Scope discipline**: is the 7-layer design too ambitious for a v1?  What is the **minimum** that delivers genuine value on a real 100k-page arbitration?  What can be deferred to v2 without compromising the core promise (verbatim excerpting + pinpoint citation + natural-language search)?

## Constraints you should respect

- Hugh's CLAUDE.md preferences (this is in `C:\Users\hughc\.claude\CLAUDE.md` and `C:\Users\hughc\CLAUDE.md`).  Notably:
  -  Working code over fast delivery.  Test before declaring done.
  -  Verify API URLs work before delivering; add error logging.
  -  No global sed on TSX files; surgical edits.
  -  Test locally before deploying; one feature at a time.
  -  All TypeScript; no `any` types.
  -  US English; em dashes with no spaces; smart quotes; double-spacing after periods.
- The upstream OSS project is a fork point.  Major architectural changes that diverge sharply from upstream are fine for Hugh's fork but should be flagged so the divergence cost is visible.
- Railway hosts the DB; Cloudflare R2 hosts files; Supabase hosts auth.  Don't propose ripping any of these out without a strong reason.
- The single live document in the DB is the only existing data; backfill is trivial.  Take advantage of the clean slate.

## What "done" looks like for this round

You write `docs/cc-runs/2026-05-27-mike-vector-architecture-review.md` containing:
1.  Verified or corrected version of the "current state" facts in this doc.
2.  Decisional answers to the 11 open questions above (or a justified "defer to v2" with what changes if so).
3.  A revised architecture diagram in prose (or ASCII) — explicit about what changed from the proposal and why.
4.  A revised phased plan (A through whatever) with realistic sizing.
5.  A flagged list of any assumptions you're making that Hugh should confirm before code is drafted.
6.  No code changes.  No image swaps.  No DB writes.  This is design review only.

When Hugh signs off on the revised architecture, a follow-on session will be authorized to begin Phase A.
