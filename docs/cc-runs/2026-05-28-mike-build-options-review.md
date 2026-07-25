# Mike build options — autonomous execution and buy‑vs‑build review

**Date**: 2026‑05‑28
**Branch**: `track-a/p1-complete`
**Status**: Strategy and research only.  No code, no DB writes, no vendor signups performed.
**Reviewer**: fresh CC session, working from `2026-05-28-mike-build-options-carryover.md`.
**Methodology**: four parallel research streams (autonomous coding agents; direct legal competitors; managed‑RAG infrastructure; document‑parsing vendors), all verified against current 2026 vendor pages, press, and product docs.  Sources cited inline and in the supporting research files referenced below.

---

## TL;DR for the sign‑off call

1.  **Build, don't buy.**  Of the thirteen vendors surveyed across the three tiers, none simultaneously (a) ships span‑level PDF citation as Mike does, (b) sells to solo arbitration practitioners, and (c) costs less than the per‑matter ingest spend of the custom build.  Hebbia Matrix is the only commercial product with comparable citation UX, and it costs roughly Mike's annual run‑rate per seat per year.

2.  **Delegate the build to Claude Code in `/goal`+headless mode on Opus 4.7.  Do not use Devin, Codex Cloud, or Jules to lead this build.**  Cloud coding agents fail at exactly the shape of work Mike requires — vendor‑integration heavy, citation‑correctness defined, privilege‑bound data.  Realistic compression of Hugh's calendar: ~6–7 weeks of focused interactive work becomes **~2.5–3.5 weeks of Hugh‑gated time**, dominated by Phase G validation (which is irreducible).

3.  **Three corrections to the 2026‑05‑27 architecture review, none of them fatal, all of them inputs to the next session:**
    -  **Voyage AI is MongoDB now**, not Anthropic — acquired Feb 24, 2025 for ~$220M.  Voyage models stay in use; the single‑vendor‑billing argument for Voyage + Claude weakens.  Track but do not block.
    -  **Reducto pricing is materially lower than the architecture review assumed** (floor ~$0.015/page at low volume, scaling down further) — the table‑heavy escalation tier is cheaper than budgeted.  Revise the cost model.
    -  **Anthropic shipped `search_result` content blocks (GA 2026)** — Mike can hand Claude tool output as cited content with Mike‑defined `source` URIs, and Claude returns citations that point at Mike's own offset anchors.  This is a small but real refinement to L5 that improves citation fidelity at zero infrastructure cost.

4.  **Recommended path: build Mike as architected, with the three corrections above absorbed into Phase B/C/E, executed mostly autonomously by Claude Code with Hugh on gates at B, E, and G.**  Hugh can simultaneously trial Hebbia Matrix on his current matter as a market benchmark and an immediate practice tool — but do not sign anything before Mike v1 ships.

---

## Question 1 — Can the v1 build be delegated to an autonomous agent stack?

### Verified state of the autonomous‑agent landscape (May 2026)

| Product | Vendor | Operational shape | Pricing | Trust for a 6‑week, vendor‑integration‑heavy TS build |
|---|---|---|---|---|
| **Claude Code 2.1 + `/goal` + Agent SDK headless** | Anthropic | Local + headless; `/bg` background sessions; `/goal` runs spanning hours to days; Opus 4.7 hits ~14.5‑hour autonomous horizon | Pro $20 / Max $100 / Max+ $200 per month; SDK/headless meters separately at API rates from June 15, 2026 | **High, with phase gates.**  The product already in Hugh's hand. |
| **Devin (Cognition)** | Cognition Labs | Cloud sandbox; Slack‑native | $20/mo Core (was $500); $500/mo Team; ACUs metered | **Low.**  67% merge on well‑scoped tasks but ~85% failure on ambiguous multi‑component work; documented "70% of a feature" and "fabricated API call" failures.  Mike is exactly the failure shape. |
| **GitHub Copilot coding agent** | GitHub/MSFT | PR‑based; Actions runner sandbox; multiple model backends (GPT‑5, Sonnet 4.6, others) | Bundled in Copilot Pro / Pro+ / Business ($10–$39/seat/mo) | **Moderate for issue‑scoped work, low to lead.**  Excellent for "fix this bug" or "upgrade this dep"; cannot lead a design‑coupled build. |
| **OpenAI Codex (2025 agent / GPT‑5‑Codex)** | OpenAI | Cloud sandbox + local CLI | ChatGPT Plus $20 / Pro $200 / Business; per‑token since Apr 2026 | **Moderate.**  Competitive with Opus on standard benchmarks; weaker on Anthropic's long‑horizon eval, which is the dimension that matters for Mike. |
| **Google Jules** | Google | Cloud VM + GitHub PR workflow | Free in beta with usage caps | **Low.**  Same shape as Devin/Codex.  Newer, less mature on new‑vendor‑API integration work. |
| **OpenHands** | Open source (All Hands) | Self‑hostable; Docker sandboxed | Free; you pay the model | **Moderate, with operational weight.**  53–77% on SWE‑bench Verified.  Right shape if you want a Devin‑style agent on your own infra with privileged data, at the cost of standing it up. |
| **Replit Agent 3 / 4** | Replit | Replit‑hosted; up to 200‑min runs | $25/mo Replit Core | **Low for Mike.**  Optimized for the Replit hosting environment; awkward fit for Railway + Vercel + Cloudflare. |
| **xAI Grok Build** | xAI | Terminal CLI; up to 8 parallel sub‑agents; MCP‑compatible | Behind SuperGrok / Premium+ ($299/mo Heavy at launch) | **Too new.**  May 2026 launch; no track record on multi‑week TypeScript builds. |
| **Sourcegraph Amp (was Cody)** | Sourcegraph | Enterprise IDE/CLI; multi‑repo context | ~$59/user/mo enterprise | **Overkill** for single‑repo Mike. |
| **Cua (trycua.com)** | Cua | Sandboxed desktop CUA infra | OSS + paid sandboxes | **Wrong shape.**  Desktop GUI automation infra, not a coding agent.  Prior verbal take was correct. |
| **Aider** | OSS | CLI; single‑agent | Free; pay the model | **Not viable as lead** — can edit files but cannot execute commands (no `npm test`, no migrations, no OCR validators). |

### Which phases delegate cleanly and which require Hugh

The 2026‑05‑27 architecture review broke v1 into Phases A–G.  Cross‑referenced against what autonomous agents do well today:

| Phase | What it is | Delegation profile | Hugh's actual involvement |
|---|---|---|---|
| **A.  Foundations** | Turbopuffer, Voyage, Google Document AI accounts; Redis on Railway; `RetrievalInterface` stub; env vars | **Cannot fully delegate.**  Vendor signups need a human with a credit card and access to the Three Crowns billing.  The TS scaffolding can be `/goal`‑driven. | One half‑day of account creation; sign env vars after CC scaffolds the interface. |
| **B.  Ingestion v1** | Document AI integration; Haiku 4.5 metadata extraction; document type classifier; offset‑aware chunking router; small‑to‑big fallback; `chunks` / `document_metadata` schema; BullMQ worker | **Mostly delegable, but the highest‑risk phase.**  Document type classifier wrong → cascades into bad chunks → bad embeddings.  Needs an explicit eval gate before letting Claude embed anything. | **Gate review on classifier eval (50 docs).  Gate review on chunk schema.** |
| **C.  Embedding + index** | Voyage `voyage-law-2`; chunk batch embed; Turbopuffer upsert with `project_id` namespace + attrs; idempotent retry | **Highly delegable.**  Mechanical once B is correct. | One gate: confirm cross‑project leakage test passes. |
| **D.  Retrieval v1** | Haiku query rewriter; `semantic_search` chat tool; Turbopuffer vector‑only query; context expansion | **Highly delegable** given a good test fixture. | One gate: 5 hand‑crafted queries return sensible chunks. |
| **E.  Synthesis + offset‑anchored citations** | Output schema with `quote`/`paraphrase` spans; rendering layer; citation API; cross‑project leakage test | **Delegable with a hard gate.**  Misquote risk is structural — citation correctness defines the product.  Anthropic `search_result` (see Q2 below) materially helps here. | **Critical gate**: 100‑quote audit comparing rendered output to source‑of‑truth chunk text. |
| **F.  UI citations** | Clickable citation chips; doc viewer offset highlight; transcript day/page/line; historical‑version affordance | **Delegable with Playwright gates.**  More interactive in practice — UI tweaks land faster with a human in the loop. | Visual review per UI surface. |
| **G.  Real‑workload validation** | Ingest one real arbitration; 20 queries; verifiable‑citation rate, latency, recall; fix top 3 problems | **Cannot delegate.**  Hugh selects the corpus, drafts the queries, judges what "right" looks like.  Real arbitration data may not leave Hugh's machine, which kills any cloud‑sandbox agent for this phase. | **Full week.** |

### Compliance and data handling

Arbitration records carry privilege and confidentiality constraints.  Cloud‑sandbox coding agents (Devin, Codex Cloud, Jules, Copilot coding agent runners) all execute in third‑party VMs with vendor‑side telemetry.  Even with enterprise tier and ZDR, putting real client material into those sandboxes is a hard ethical and contractual question Hugh should not have to litigate inside a build sprint.

**Claude Code running locally on Hugh's machine against Hugh's repo is the only operational shape that keeps privileged data on Hugh's infrastructure without negotiation.**  This alone narrows the field for Phases B/E/G.

### Cost — service cost and the cost of bad agentic decisions

-  **Service cost.**  Claude Code Max+ ($200/mo) plus headless SDK usage at API rates is the dominant agent‑service cost during the build.  A realistic ceiling for Phases A–G is **$200–$500 of additional Anthropic spend** above what Hugh already pays for Claude Code — small compared to the OCR validation budget ($1,000–$1,350 per arbitration).
-  **Cost of a bad autonomous decision.**  The realistic failure modes are (1) the agent burns a day on the wrong chunking strategy and embeds the corpus before someone notices; (2) a `/goal` "ingest everything" run blows past a Document AI quota and spends $1,000 in an hour; (3) the citation pipeline ships a regression that's structurally invisible (offsets line up against the wrong chunk).  Mitigations: hard spend caps in the worker, a dry‑run mode that estimates page count before submitting, and the gate audits at B and E.

### Decisional recommendation — Q1

**Use Claude Code with `/goal` per phase, headless via the Agent SDK on Opus 4.7.  Do not delegate to Devin, Codex Cloud, Copilot coding agent, or Jules as the build lead.**

**Why.**  Mike v1 is the exact failure‑mode shape where cloud coding agents underperform: vendor‑API integration where the API surface is unfamiliar, schema migration ordering, citation correctness measured against human legal judgment rather than tests, and a privilege‑bound validation corpus.  Claude Code's `/goal` primitive, combined with Opus 4.7's ~14.5‑hour long‑horizon coding performance, is the only product whose benchmarks explicitly target multi‑hour autonomous work on coupled, decision‑laden code at the granularity of a Mike phase.  And the trust loop is already in Hugh's hand — no new IDE, no new sandbox, no new vendor.

**Where to actually use the cloud agents.**  *After* v1 ships:
-  **GitHub Copilot coding agent** for Phase H A/B switches and well‑scoped post‑validation issues.
-  **Devin Core** ($20/mo) for off‑critical‑path dependency upgrades and test‑coverage backfills on the validated codebase.

**Compression of Hugh's calendar involvement.**  From the architecture review's 6–7 weeks of focused human work to:

| Phase | Hugh's actual time |
|---|---|
| A.  Foundations | Half a day (account creation, env vars sign‑off). |
| B.  Ingestion v1 | Two gate reviews ≈ 1 day total (classifier eval, chunk schema). |
| C.  Embedding + index | One gate review ≈ half a day (leakage test). |
| D.  Retrieval v1 | One gate review ≈ half a day. |
| E.  Synthesis + citations | Two gate reviews ≈ 1.5 days (100‑quote audit + offset spot‑check). |
| F.  UI citations | More interactive; ~2–3 days of visual review. |
| G.  Real‑workload validation | **Full week, irreducible.**  Corpus selection + 20 queries + judgment on results. |
| **Total** | **~2.5–3.5 weeks of Hugh‑gated time over an ~8–10 calendar‑week elapsed period.** |

Risk is mitigated by: hard gates at B (classifier accuracy ≥ X on 50‑doc eval before any embedding spend), at E (100‑quote audit before E ships), and at G (irreducible).  Hard spend caps on the ingest worker.  Dry‑run page‑count estimation before any Document AI batch.

---

## Question 2 — Is Hugh reinventing the wheel?

### Tier 1 — Direct competitors (the finished product)

Thirteen vendors surveyed.  Full matrix in `docs/cc-runs/2026-05-28-mike-buy-vs-build-vendor-scan.md`.  Compressed verdict per vendor:

| Vendor | Sells to solos? | 100k+ pages? | Span‑highlight in source PDF? | Price floor (2026) |
|---|---|---|---|---|
| **Harvey** (Assistant / Vault / Agent Builder) | **No** — 25‑seat min | Yes (Vault) | Linked citations to source docs; span‑highlight not documented as default | $1,200–$2,000/seat/mo |
| **Legora** (Assistant / Tabular Review / Markup / Jus Mundi integration) | **No** — 10‑seat min | Up to thousands of docs; not advertised at 100k+ | Linked citations; span behavior undocumented | ~$30k/yr floor |
| **Spellbook** | Yes | No — transactional/contract focus | N/A for this workload | $99–$165/seat/mo solo |
| **CoCounsel** (Thomson Reuters / Casetext) | **Yes** — month‑to‑month | "Thousands of docs"; not optimized for 100k+ | Hyperlinked excerpt, not span‑highlight | $225/seat/mo Core |
| **Lexis+ AI / Protégé** | Yes | Not advertised for 100k+ matters | Hyperlinked excerpt | $128–$1,000+/seat/mo |
| **Westlaw Precision AI** | Yes | No — research, not matter Q&A | Brief Analyzer cites cases; not the shape | $12k–$30k+/yr per attorney |
| **Disco (Cecilia AI)** | Technically yes; rare | Yes | In‑platform citation navigation; not deep‑link to source PDF | Per‑GB; $50k–$150k/matter at 100k pages |
| **Relativity aiR** | No in practice | Yes | In‑Review viewer | $500–$25k+/mo |
| **Everlaw (Deep Dive)** | Technically yes; rare | Yes (10M+ docs marketed) | In‑platform | $2k–$5k/mo base + $18–$35/GB |
| **Hebbia Matrix** | **Yes (1‑seat plausible)** | **Yes** | **Best in class** — click‑to‑source‑sentence in original PDF (Verifiable Fact Layer) | $3k–$3.5k/seat/yr Lite; $10k/seat/yr Professional |
| **Paxton AI** | Yes | No | Hyperlinked | $159–$199/seat/mo Pro |
| **Eve** | Plaintiff‑only | No | N/A | Not for arbitration |
| **Robin AI** | **Existence uncertain** — failed $50M raise Q4 2025; managed‑services arm acquihired by Scissero; engineering to MSFT | N/A | N/A | Deprioritize |

**Three findings that change the framing.**

1.  **The span‑highlighted PDF deep‑link is rarer than expected.**  Of the thirteen products surveyed, only **Hebbia Matrix** documents click‑to‑source‑sentence in the original PDF as a default UX.  Harvey/Legora/CoCounsel/Lexis hyperlink to excerpts; Disco/Relativity/Everlaw do citation navigation *inside their viewer*, not as a deep‑link to a source PDF the user controls.  **Mike's offset‑anchored citation is more differentiated than the architecture review assumed.**

2.  **Nobody is selling arbitration AI for solos.**  The arbitration‑native plays (Legora + Jus Mundi, Opus 2, Jus AI standalone) all sell to firms and institutions.  The solo‑accessible tools (CoCounsel, Spellbook, Paxton) are not arbitration‑native.  The "arbitration AI for sole practitioners" lane is unoccupied as of May 2026.

3.  **The market is consolidating, not stabilizing.**  Robin AI collapsed Q4 2025.  Relativity reshuffled pricing twice.  Legora hit a $5.6B valuation in April 2026 without a small‑firm motion.  A tool Hugh controls outright is harder to displace than it was 18 months ago, and the "just buy" recommendation gets weaker by the quarter against this background.

### Tier 2 — Managed RAG infrastructure (would replace L3–L5)

Eight vendors surveyed.  Full matrix in `docs/cc-runs/2026-05-28-mike-managed-rag-vendor-survey.md`.  Compressed verdict on the load‑bearing dimension:

| Vendor | Citation precision back into source PDF |
|---|---|
| AWS Bedrock Knowledge Bases | Page partial, buggy `web: {}` returns; no character offsets |
| **Pinecone Assistant** | Page + verbatim excerpt + signed URL via `signed_url#page=N`; **no character offsets**; highlight remains Mike's UI job |
| Vectara | Chunk‑level only; HHEM trustworthiness is the headline, not pinpointing |
| Cohere Compass / North | Chunk‑level only |
| **Azure AI Search + Content Understanding (2026‑04‑01 GA)** | **Best of class natively** — returns `offset` + `length` spans, page numbers, and bounding boxes |
| Google Vertex AI Search | Page only; configurable tier has a 1,000 QPM + 50 GB enterprise floor that prices out a small project |
| **Anthropic `search_result` content block (GA 2026)** | **Mike encodes the anchors** — Claude cites whatever `source` URI Mike returns from a tool, with the same fidelity as the web_search citation surface |
| LlamaCloud / Ragie | Parser+RAG; do not replace the citation question |

**The single most consequential finding in this round.**  Anthropic shipped two complementary citation surfaces in the Messages API in 2026:

-  **Existing Citations API** — returns `char_location` for plain text sources (0‑indexed `start_char_index` / `end_char_index`) and `page_location` for PDF sources (1‑indexed page numbers).  Citations are guaranteed to be valid pointers — no hallucinated source IDs.
-  **`search_result` content block (GA 2026)** — Mike's tool returns content as `SearchResultBlockParam` with a `source` field Mike controls.  Claude treats these as first‑class citable sources with web_search‑grade citation quality.  Eligible for Zero Data Retention.

**What this means for Mike.**  Mike does not need a managed RAG vendor to ship Claude‑grade citations.  Mike keeps L1/L2/L3/L4 custom (Document AI → offset‑aware chunking → Voyage → Turbopuffer), and at L5 hands Claude `search_result` blocks whose `source` URIs encode Mike's offset anchors directly (e.g., `mike://doc/<doc_id>?version=<v>&char_start=<n>&char_end=<m>`).  Claude's natural citation output then points at Mike's own anchors.  The architecture review's offset‑anchored extraction pattern (§5.6) remains correct; `search_result` slots into the synthesis layer cleanly and reduces the bespoke citation‑schema code from "build it" to "use Claude's native primitive."

**Voyage AI ownership correction.**  Voyage AI was acquired by **MongoDB** on Feb 24, 2025 for ~$220M — not Anthropic.  Voyage models stay in production (voyage‑4 family launched Jan 2026; rerank‑2.5 still leads benchmarks), but MongoDB's strategic narrative is "embeddings and rerank belong inside the database" — i.e. Atlas Vector Search.  For Mike (Postgres + Turbopuffer, not Atlas), the immediate impact is zero, but the single‑vendor‑billing argument for Voyage + Claude that the architecture review used for Q4 is now wrong.  Cohere `embed-v4` + `rerank-4` becomes a credible fallback if Voyage's standalone API drifts toward Atlas exclusivity.

### Tier 3 — Document parsing / OCR vendors

Nine vendors surveyed.  Full matrix in `docs/cc-runs/2026-05-28-mike-parser-vendor-survey.md` (and inline in the parent research below).  Compressed verdict:

| Vendor | What it does | Price (2026) | Citation/offset capability |
|---|---|---|---|
| **Reducto** | Parse + chunking + classify + extract via composable endpoints; BYO vector store; case study with August Law (legal/compliance) | **Floor $0.015/page** at low volume; quote‑based at higher tiers | Bounding‑box citations first‑class; character offsets via structured JSON |
| Unstructured.io | OSS + Serverless API + Platform | Serverless from **$1/1,000 pages** | Element‑level metadata; weaker than Reducto on bbox fidelity |
| LlamaParse / LlamaCloud | Full managed RAG ingestion + index; markdown‑first | Credit pricing; ~$0.00125/pg cheap tier to ~$0.11/pg Agentic Plus | Markdown anchors; bbox for figures/tables; weaker for offset‑anchor design |
| Mistral OCR (v3) | Pure OCR, markdown + HTML‑table output | **$2/1,000 pages** ($1 with batch) | Page + token coords; weaker on scanned tables and offsets |
| **Google Document AI Layout Parser** | Parse + chunking; `Document` proto with character `text_anchor` offsets | **$10/1,000 pages** flat; Form Parser $30/1k | **Best‑in‑class character‑offset anchoring** among cloud OCR |
| AWS Textract | OCR + Layout + Tables + Forms | $1.50–$65/1,000 pages | Bbox per block; no native cross‑document character offsets |
| Azure Document Intelligence | Prebuilt + custom models | $10/1,000 pages prebuilt; volume tiers down to ~$0.53/1k | Bbox + offset+length spans; comparable to Doc AI |
| Anthropic PDF / Files API | Native PDF ingestion in Claude | Per‑token | **100‑page cap; useless for 100k‑page records** as an L1 replacement |
| Legal‑specific (CaseMark, Briefpoint, LandingAI ADE) | Either summarization or generic | Various | None target arbitration exhibit parsing specifically |

**The Reducto pricing correction matters.**  The 2026‑05‑27 architecture review carried "Reducto ~$10–30/1k pages."  Current Reducto pricing has a public floor of **$0.015/page** (i.e. $15/1k) at low volume, with substantial discounts at higher tiers.  Reducto‑on‑every‑table‑heavy‑page is materially cheaper than the architecture review assumed; the escalation threshold can probably be lowered, and the per‑arbitration ingest cost lands toward the bottom of the original $1,150–$1,350 range, not the top.

**Watch‑item.**  Google's Layout Parser v1.6 (Gemini 3 Flash, preview Jan 2026) and v1.6‑pro (Gemini 3 Pro, preview Dec 2025) are in preview.  If these reach GA and close the table‑accuracy gap with Reducto at the same $10/1k, the escalation tier may collapse into Document AI alone.  Re‑benchmark when those GA.

### Cross‑tier strategic framing

The four framings from the carryover, evaluated:

**1.  Just buy.**  Mike's existence is no longer rational; buy Harvey/Legora/etc.

-  **Rejected.**  Harvey and Legora do not sell to solo practitioners with cost floors under five figures per month.  None of the buyable products (CoCounsel, Lexis+, Hebbia) deliver Mike's full pinpoint‑PDF citation UX in the way Mike's architecture does — Hebbia comes closest but is not arbitration‑native and costs ~$10k/seat/year list.  The "just buy" framing loses on cost‑per‑matter, on practitioner accessibility, and on citation precision for the workload.

**2.  Build Mike on a managed‑RAG core.**  Swap L3–L5 for Bedrock KB / Pinecone Assistant / Vectara / equivalent.

-  **Rejected as a wholesale swap.**  Build time saved is **~1.5 weeks at most** (not transformational), and the load‑bearing citation requirement is **not** satisfied by any managed‑RAG vendor except Azure CU.  The Azure CU path requires Azure infra commitment that Mike's stack (Vercel + Supabase + Railway + Cloudflare) does not have, and Azure adoption is a meaningful operational footprint expansion for one feature.
-  **Adopted as a *layer refinement*:** Use Anthropic `search_result` blocks (Tier 2 above) at L5 as the citation primitive.  This is a managed‑RAG primitive in the loosest sense — it is a vendor‑provided content shape — but it does not lock in a vendor for L3 or L4 and it lets Mike keep its custom anchors.  Net save: small (~0.5 week at L5); net gain: Claude‑native citation surface with Mike‑defined anchors.

**3.  Build Mike as architected.**  The custom stack is worth the time because of citation control, per‑matter cost, ownership, and the unoccupied "arbitration AI for solos" market lane.

-  **Adopted, with three corrections:**
    -  Voyage AI is MongoDB; treat as standalone embedding/rerank vendor with watch‑item on Atlas drift.
    -  Reducto pricing is cheaper than budgeted; relax the table‑escalation threshold and revise the per‑arbitration cost to ~$1,100–$1,250 (low end of the prior range).
    -  Use Anthropic `search_result` at L5 for citation grounding; keep `quote`/`paraphrase` span schema as the rendering contract.

**4.  Hybrid.**  Buy something for Hugh's current matter; build Mike for a different reason.

-  **Partially adopted as parallel‑track:** Hugh can demo **Hebbia Matrix** on the current matter (1‑seat Professional trial plausibly negotiated below $10k/yr list, especially with a Three Crowns / Generative Legal / HLS reference story).  This (a) gives Hugh a real tool on a real matter today, (b) provides a market benchmark to compare Mike v1 against during Phase G validation, and (c) does **not** require committing to Hebbia as a permanent solution.  Skip CoCounsel as a fallback — its citation UX is materially weaker, and at $225/mo with a multi‑month commitment it adds spend without the benchmark value.

### Decisional recommendation — Q2

**Build Mike as architected, with three corrections absorbed into the existing phase plan.  In parallel, demo Hebbia Matrix on Hugh's current matter as a market benchmark and an immediate practice tool, with no commitment.  Do not sign anything else.**

---

## Revised phased plan (Mike v1, post‑review)

Net effect of the three corrections on the architecture review's plan: **the calendar stays the same; per‑matter cost drops by ~$100–$300; citation code at L5 simplifies modestly; Voyage is tracked as a slow‑burn vendor risk.**  Plan as the next session should authorize:

| Phase | Work (corrections in bold) | Calendar | Cost (build) |
|---|---|---|---|
| **A.  Foundations** | Turbopuffer account; Voyage + Google Document AI accounts; Redis on Railway; `RetrievalInterface` stub.  No image swap.  **Note Voyage = MongoDB; do not assume single‑vendor billing with Claude.** | 2–3 days | ~$0 |
| **B.  Ingestion v1** | Document AI Layout Parser; Haiku 4.5 metadata extraction; document type classifier; structure‑preserving text + offset extraction; document‑type‑aware chunking router; small‑to‑big fallback; `chunks` + `document_metadata` schema; `ingest_jobs` + BullMQ worker; backfill the existing doc.  **Reducto escalation threshold relaxed; expect ~$0.015–$0.030/page at the volumes Mike will hit.** | 1.5–2 weeks | ~$20 |
| **C.  Embedding + index** | Voyage `voyage-law-2` integration; chunk batch embed; Turbopuffer upsert with `project_id` namespace + `doc_id`/`version_id`/`doc_type`/`page`/`para`/`bates` attrs; BM25 text field for v1.5; idempotent retry. | 3–4 days | ~$1–5 |
| **D.  Retrieval v1** | LLM query rewriter (Haiku); `semantic_search` chat tool with `project_id` scope; Turbopuffer query (vector‑only); context expansion. | 4–5 days | ~$5 |
| **E.  Synthesis + offset‑anchored citations** | Output schema with `quote`/`paraphrase` spans; **synthesis layer passes top‑K to Claude as `search_result` blocks with `source` encoding Mike's offset anchors**; rendering layer substitutes chunk text into `quote` spans by offset; citation API; cross‑project leakage test. | 5–6 days | ~$10 |
| **F.  UI citations** | Clickable citation chips; doc viewer offset highlight; transcript day/page/line; historical‑version affordance.  Reuse pdf‑anchor‑mvp text‑layer search. | 1–1.5 weeks | ~$0 |
| **G.  Real‑workload validation** | Ingest one real arbitration; 20 queries; verifiable‑citation rate, latency, recall; fix top 3.  **Benchmark side‑by‑side against Hebbia Matrix on the same matter, if Hugh has a Hebbia trial seat by this phase.** | 1 week + 6–12 h ingest wall‑clock | ~$1,000–$1,250 OCR + ~$5 embed |
| **H.  Hybrid + rerank** (post‑G) | Flip Turbopuffer to hybrid (BM25 + vector); Voyage `rerank-2.5` over top‑50; A/B vs.  vector‑only. | 4–5 days | ~$5 |
| **I.  First agentic workflow** (post‑G) | Pick one (chronological exhibit index / witness inconsistency / timeline‑from‑correspondence); TS workflow on Claude Agent SDK. | 1–1.5 weeks | ~$10–20 |

**Totals**:
-  **v1 (A–G), executed mostly autonomously by Claude Code with Hugh on gates B/E/G**: ~6–7 calendar weeks, ~2.5–3.5 weeks of Hugh‑gated time.
-  **v1.5 (+ H + I)**: ~8.5–10 weeks total, ~4 weeks of Hugh‑gated time.
-  **Per‑arbitration ingest**: **~$1,100–$1,250** (revised down from $1,150–$1,350).
-  **Build‑time agent‑service spend on top of existing Claude Code subscription**: ~$200–$500.

---

## Open questions Hugh should confirm before code starts

1.  **`/goal` + headless + Opus 4.7 is acceptable as the execution model for Phases A–F.**  Phase G stays interactive; Hugh selects the corpus, drafts queries, judges results.  If Hugh would rather keep Phases A–F interactive too, the plan is identical but the calendar shifts from ~2.5–3.5 weeks of gated time to ~6–7 weeks of focused interactive time.
2.  **Hebbia Matrix trial is worth Hugh's time** as a parallel‑track benchmark on his current matter.  No commitment; the value is the benchmark for Phase G validation and an immediate tool for the live matter.  Skip if Hugh's bandwidth for vendor meetings is zero.
3.  **The Voyage/MongoDB ownership change does not block Phase C.**  Mike uses Voyage as a standalone embedding + rerank vendor; the Atlas‑integration risk is a long‑term watch‑item, not a Phase A blocker.  Plan a `RetrievalInterface` abstraction that can swap to Cohere `embed-v4` + `rerank-4` later if Voyage's standalone API drifts.
4.  **Anthropic `search_result` at L5 is the right citation primitive.**  Confirmed: Mike does not need a managed RAG vendor; `search_result` with Mike‑defined `source` URIs gives Claude‑grade citations against Mike's offset anchors.  No infrastructure cost; Phase E simplifies modestly.
5.  **Reducto budget is revised downward** from "$10–30/1k pages" to "~$15/1k floor, less at volume."  Per‑arbitration ingest now lands at ~$1,100–$1,250 not ~$1,150–$1,350.  Cost cap on the ingest worker should be updated accordingly.
6.  **No cloud coding agent (Devin / Codex Cloud / Jules) touches privileged arbitration data.**  Phase G validation runs locally on Hugh's machine.  Cloud agents reserved for post‑validation issue‑scoped work after v1 ships.
7.  **The Hebbia comparison happens *during* Phase G, not before.**  Don't pre‑select for "things Hebbia does well" or "things Mike does differently" — run the same 20 representative queries on both, judge the outputs cold.  Note: only Hebbia among reviewed vendors does pinpoint‑PDF span highlighting; the comparison is partly a sanity check that Mike's citation quality holds up against the best commercial analog.
8.  **The "arbitration AI for solos" market lane is unoccupied as of May 2026.**  This is not a build justification by itself, but it changes the strategic value of Mike: an open‑source, sole‑practitioner‑accessible arbitration tool with pinpoint citations has no direct competitor.  Hugh should decide whether Mike's longer‑term identity is "Hugh's internal tool" or "the open‑source arbitration tool" — the answer affects post‑v1 priorities but does not change anything before v1.

---

## What "done" looks like for this round

`docs/cc-runs/2026-05-28-mike-build-options-review.md` (this file) plus three supporting research artifacts:

-  `docs/cc-runs/2026-05-28-mike-buy-vs-build-vendor-scan.md` — Tier 1 direct‑competitor matrix with sources.
-  `docs/cc-runs/2026-05-28-mike-managed-rag-vendor-survey.md` — Tier 2 managed‑RAG matrix, including the Anthropic `search_result` finding.
-  `docs/cc-runs/2026-05-28-mike-parser-vendor-survey.md` — Tier 3 parser matrix with revised Reducto pricing.

When Hugh signs off on the revised path, the next CC session is authorized to begin Phase A: Turbopuffer + Voyage + Google Document AI account creation, the `RetrievalInterface` stub, and the Redis/BullMQ scaffolding.  Phase A is the only phase that requires Hugh's direct hand for account signups; everything from B onward can run under `/goal` with the gate structure described above.
