# Mike — Managed‑RAG Vendor Survey (2026‑05‑28)

Decisional research for choosing between the custom stack (Turbopuffer + Voyage + Document AI + custom citation) and a managed‑RAG core that replaces L3–L5 of Mike's 7‑layer architecture.

Load‑bearing requirement throughout: **citations must open the source PDF at the right page with the cited span visually highlighted** — i.e. offset‑anchored or coordinate‑anchored back into the original document, not just "see Document X, page 78."

---

## TL;DR up front

1. **No managed‑RAG vendor in 2026 ships a true character‑offset citation back into the original PDF.**  All credible vendors stop at *page number + extracted text excerpt*.  Span‑level highlighting in the original page image still has to be done in Mike's UI by re‑locating the excerpt on the rendered page (text‑layer search, or bounding‑box re‑OCR).  This means **L5–L6 citation fidelity remains Mike's problem regardless of vendor choice.**
2. The closest fit to Mike's requirement is **Anthropic's `search_result` content block** (GA in 2026), combined with Mike‑owned L1/L2 that injects offset/page metadata into the content Mike hands Claude.  This preserves Claude‑grade citations *and* lets Mike keep the offset anchors it cares about.
3. If Hugh wants to outsource L3–L5 wholesale, **Pinecone Assistant** is the most production‑grade RAG‑as‑a‑service: namespace‑per‑tenant isolation, multimodal PDF ingest GA, citation highlights with page + excerpt + signed URL.  **Azure AI Search 2026‑04‑01 GA** is the only vendor that returns explicit `offset` + `length` spans (via Content Understanding grounding) but it's the heaviest integration.
4. **Vectara, Cohere Compass/North, Vertex AI Search, AWS Bedrock KBs** all produce grounded answers but with weaker citation precision than Pinecone Assistant or Azure CU for Mike's use case.
5. **Voyage AI is now a MongoDB product, not Anthropic.**  This is a material change to assumptions in the current architecture review: the Voyage‑3 embedding + rerank‑2.5 path Mike already plans to use is now MongoDB‑owned, with roadmap risk leaning toward Atlas‑native workflows.

---

## 1. AWS Bedrock Knowledge Bases

**Scope (2026):** End‑to‑end managed RAG.  Replaces **L3 + L4 + part of L5**.  Does not replace L1 OCR (you bring already‑extracted text or let it call Textract), and does not own L6/L7.

**Vector backends:** As of 2026 you can pick Aurora PostgreSQL (pgvector), OpenSearch Serverless, Neptune Analytics, MongoDB Atlas, Pinecone, Redis Enterprise, or the new **Amazon S3 Vectors** (preview→GA in 2025–26, cost‑optimised, claims ~90% cheaper than dedicated vector DBs, trillions of vectors).  Chunking options: fixed, semantic, hierarchical.

**Citation quality — the load‑bearing test:** Bedrock KB returns `Citation` objects containing `retrievedReferences[]`, each with `content` (cited text), `location` (S3 URI / web / Confluence / etc.), and `metadata` (your filter attributes).  **There is no `start`/`end` character offset and no page‑coordinate field in the public Citation schema** — you get the chunk text and its source document, not where inside the document it lives.  Page numbers are available via the S3 Vectors backend and the new `documentPage` location type, but multiple users have reported the `ConverseStream` API returning empty `web: {}` locations instead of `DocumentPageLocation` (open SDK bug as of 2026).  Verdict for Mike: **insufficient citation precision unless paired with significant post‑processing.**

**Pricing:** Usage‑based.  No KB subscription floor itself; you pay the underlying vector store (Aurora/OpenSearch hourly, S3 Vectors per‑GB, etc.), Bedrock model invocation, and per‑request overhead.

**Multi‑tenancy:** Metadata‑filter pattern.  Bedrock KB doesn't natively expose per‑tenant namespaces — you tag chunks with a tenant ID and pass a filter at query time.  Isolation guarantee is logical, not physical.  For arbitration matters where opposing parties are inside the same AWS account, this is a **real concern** — opposing‑side leakage is a single filter misconfiguration away.

**Lock‑in:** Moderate.  The vector embeddings and underlying data store are portable (pgvector dump, OpenSearch reindex).  The `RetrieveAndGenerate` orchestration is proprietary.  Chunking strategy is configurable but ingestion is one‑way through Bedrock.

---

## 2. Pinecone Assistant

**Scope (2026):** Fully managed RAG layer — ingest, chunk, embed, store, retrieve, generate.  Replaces **L3 + L4 + L5** end‑to‑end.  Pinecone now ships a Claude Code plugin (mike‑relevant) and "multimodal PDF" ingestion GA, so charts/diagrams/scanned exhibits become part of context.

**Citation quality:** Best of the vendors that ship a turnkey UI surface.  The chat completions response includes `citations[]` where each entry has:

- `position` — character offset *in the generated answer text* (not the source PDF)
- `references[].file.signed_url` — pre‑signed URL to the source PDF
- `references[].pages[]` — page numbers in the source
- `references[].highlight` — the precise excerpt used (when `include_highlights=true`)

This gets Mike to **page + verbatim excerpt + signed URL**.  Pinecone's own guidance for "open the PDF at the right page" is `signed_url#page=N` — Chrome/Adobe will navigate, but **span highlighting in the PDF page is left to your UI.**  Mike's existing `pdf-anchor-mvp` text‑layer search code would still be needed to draw the highlight rectangle.

**Pricing (2026):** Usage‑based.  Starter is free (3 assistants, 1 GB files, 1.5M LLM tokens).  Standard has a **$50/month minimum**.  Assistant‑hours billed at $0.05/hr; "context processed tokens" at $5 per 1M.  Multimodal PDF ingestion bills at ~2× standard ingest unit rate.

**Multi‑tenancy:** Strong.  Namespace‑per‑tenant gives **physical isolation in serverless** (each namespace stored separately, no noisy neighbours).  Each project/index/namespace gets its own Key Encryption Key.  Million‑scale namespaces supported.  This is the closest vendor pattern to Mike's per‑matter requirement.

**Lock‑in:** Moderate.  Vectors are not directly exportable; you'd reingest into another store.  Chunking and metadata are Pinecone‑shaped.  Files themselves are stored externally (S3/GCS) so the raw corpus is always portable.

---

## 3. Vectara

**Scope (2026):** RAG‑as‑a‑service.  Replaces **L3 + L4 + L5**.  Distinctive features are HHEM‑2.1 hallucination scoring and the Hallucination Leaderboard.

**Citation quality:** Vectara returns answers with inline citations and per‑sentence factual consistency scores from HHEM‑2.1.  Citations carry document ID, document part, and any metadata you indexed.  **No character offsets to the original document, no page coordinates** — citations are at the granularity of the chunks ("parts") Vectara stores.  Vectara's value proposition is *answer trustworthiness* (HHEM) more than *citation locator precision*.

**Pricing:** Two tiers — Growth (free with caps) and Scale (contact sales).  Scale unlocks customer‑managed keys and backups.  Real pricing is private; multiple third‑party reviews put production usage in the low‑thousands/month range.

**Multi‑tenancy:** Corpus‑per‑tenant is the supported pattern.  Corpora are isolated; per‑corpus API keys; filter_attributes for finer slicing.  Reasonable but more coarse than Pinecone namespaces.

**Lock‑in:** Higher.  Vectara owns the chunking, embedding model, and retrieval — none of which are user‑swappable.  Raw documents are exportable; vector representations are not.

---

## 4. Voyage AI — STATUS CHANGE

**Critical correction to prior assumptions:** Voyage AI was acquired by **MongoDB on 2025‑02‑24 for ~$220M**.  It is **not** an Anthropic product.  This matters for Mike because the current Track‑A plan leans on voyage‑3 embeddings and rerank‑2.5 as primitives.

**Scope in 2026:** Voyage continues to ship embedding models (voyage‑4 family launched Jan 2026, first production MoE embedding) and rerank models (rerank‑2.5 leads benchmarks, rerank‑2.5‑lite cheaper).  It is **not** a managed RAG product — no ingest, no vector store, no synthesis.  It's L3 components only.

**Lock‑in / risk:** MongoDB's strategic narrative is "embedding + rerank belong inside the database" — i.e. Atlas Vector Search.  Roadmap risk: Voyage models may get tighter Atlas integration over time and looser standalone API parity.  For a project (Mike) that runs on Postgres/pgvector and Turbopuffer rather than Atlas, this is a slow‑burn vendor‑direction risk, not an immediate blocker.

---

## 5. Cohere Compass + North

**Scope (2026):** Compass is now integrated as the search engine inside **Cohere North** (their knowledge‑worker product).  Compass replaces **L3 + L4 + parts of L5**.  Strong on multilingual, multi‑format parsing (images, presentations, spreadsheets).  Uses Embed v4 + Rerank 4 (Rerank 4 released Dec 2025).

**Citation quality:** Compass returns chunk‑level citations with document metadata; reranking is the headline technical strength, not citation pinpointing.  No public evidence of character‑offset or page‑coordinate anchors in the API.

**Pricing:** Enterprise‑sales motion.  Available via VPC, on‑prem, or Cohere Model Vault.  Heavy investment in sovereign deployments (Cambridge, Ontario data centre co‑funded by the Canadian government, UK partnerships).

**Multi‑tenancy:** Designed for enterprise deployment patterns; VPC/on‑prem is the strongest isolation story.  Less documentation on per‑tenant namespacing inside a single Compass instance.

**Lock‑in:** High once you commit to North as the UI; lower if you only use Compass as an embedding+rerank+retrieval service.

---

## 6. Azure AI Search + Content Understanding

**Scope (2026):** Azure split the stack — **Azure AI Search** handles vectors + hybrid retrieval (L3 + L4), and **Azure AI Content Understanding** handles document parsing with grounding (sits across L1 + L2 + L5).  The **2026‑04‑01 REST API GA** ships agentic retrieval as a generally available feature.

**Citation quality — best in class on this dimension:** Content Understanding's grounding feature explicitly returns, per extracted field/answer:
- **source page number**
- **spatial coordinates (bounding box)**
- **spans with `offset` and `length` into the source text**

This is the only managed offering that returns true offset+length spans natively.  Azure's agentic retrieval response combines merged content, source references, and execution metadata.

**Pricing:** S1/S2/S3 hourly tiers.  S3 High Density is purpose‑built for multitenancy (3,000 indexes per service, hardware optimised for many small indexes).  Predictable but not cheap — S1 starts around $250/month for a baseline instance, scaling with replicas/partitions.

**Multi‑tenancy:** S3 HD is engineered for this pattern.  Per‑matter index is feasible.  Security trimming via document‑level filter expressions.

**Lock‑in:** Azure‑shaped.  If Mike's deployment is on Vercel + Supabase, adopting Azure means standing up an Azure tenant just for search — a meaningful infra footprint expansion.

---

## 7. Google Vertex AI Search

**Scope (2026):** Now branded under "Agent Search on Gemini Enterprise Agent Platform."  Replaces **L3 + L4 + L5**.  Strong on enterprise document Q&A, web + structured data unification.

**Citation quality:** GroundingMetadata returns support chunks with `support_chunk_index`, document ID, URI, **page number for PDFs**, and confidence scores.  Like Pinecone and Bedrock — **page granularity, not character offsets.**  Agent Search adds confidence‑scored citation segments mapping answer text → grounding chunk.

**Pricing:** $4 per 1,000 standard queries, $6 per 1,000 advanced queries; storage ~$1/GB/month.  Configurable (subscription) model has a **minimum 1,000 QPM + 50 GB storage commitment** — that's an enterprise floor, not a startup‑friendly entry point.  Free 10,000 queries/month for evaluation.

**Multi‑tenancy:** Data‑store‑per‑tenant or metadata‑filter pattern.  Enterprise‑scale customers get custom quotas.

**Lock‑in:** GCP‑shaped.  Same comment as Azure — meaningful infra footprint to adopt.

---

## 8. Anthropic's own RAG primitives (2026)

**This is the most consequential finding for Mike.**  In 2026 Anthropic ships **two complementary citation surfaces** in the Claude API:

### 8a. Citations on the Messages API (PDF + plain text)
- **PDF source (base64):** returns `page_location` citations with `start_page_number` + `end_page_number` (1‑indexed, exclusive end).
- **Plain text source:** returns `char_location` citations with `start_char_index` + `end_char_index` (0‑indexed, exclusive end).
- `cited_text` does not count against output tokens.
- Citations are **guaranteed** to contain valid pointers to the provided documents (not hallucinated source IDs).

### 8b. The `search_result` content block (GA in 2026)
- Mike's tool returns content as `SearchResultBlockParam` with `source` (any URI Mike chooses), `title`, and `content` (text blocks).
- Claude treats these as first‑class citable sources — same citation quality as Claude's web_search tool.
- Eligible for Zero Data Retention.
- **Mike controls the `source` field.**  This is the key: Mike can pass back a deep‑link URL that encodes `?doc=X&page=N&offset=START-END`, and Claude's natural citations will point at Mike‑authored anchors that Mike's UI already knows how to resolve.

**What this means for Mike:** Mike does not need a managed RAG vendor to get production‑grade citations.  Mike keeps L1/L2/L3/L4 on the custom stack (Document AI → custom chunking with offset metadata → Turbopuffer + Voyage), and on L5 uses Claude's `search_result` block to get Claude‑grade citations *into Mike's own offset namespace*.  This is materially better than any managed‑RAG vendor because the citation anchors are whatever Mike defines.

### 8c. Files API
Files up to 350 MB, tenant‑configurable 0–365 day retention.  Useful for pipelines that hand PDFs to Claude directly, but for 100k‑page arbitration records, you still want your own L1/L2 — the Files API is a convenience layer, not a retrieval layer.

---

## 9. Newer entrants worth knowing

### LlamaCloud / LlamaParse
Best‑in‑class document parsing.  Pricing per page, $0.00125 (Fast tier) to $0.05625 (Agentic Plus tier, structured extraction from scanned financials).  Strong for L1+L2.  SOC 2 Type 2.  Available as SaaS or in‑VPC.  Pairs naturally with any vector store you choose.  **Does not own L3–L5**, so it's complementary, not a replacement for the managed‑RAG question.

### Ragie.ai
Fully managed RAG.  Page‑based pricing ($100/month for 10k pages, scaling to $500 for 60k pages, $0.002/page overage).  Provides "Agentic OCR" with **bounding boxes** for tables, forms, charts — closer to Mike's bounding‑box citation goal than most.  But it's a small vendor; SOC 2 / arbitration‑grade enterprise governance is not the established story Pinecone or Azure have.

### Others worth a glance but not a serious contender for Mike
- **Anyscale / fixie** — neither is a credible managed‑RAG vendor for legal in 2026; both have repositioned toward inference and orchestration.
- **MongoDB Atlas Vector Search** — now Voyage's natural home; viable if Mike were on Atlas (he isn't).

---

## Citation precision matrix — the load‑bearing comparison

| Vendor | Page # | Verbatim excerpt | Bounding box | Char offset into source | "Open PDF at page+highlight" feasible? |
|---|---|---|---|---|---|
| Bedrock KB | Partial (bug‑prone) | Yes (chunk text) | No | No | Hard — buggy location returns |
| Pinecone Assistant | Yes | Yes | No | No (answer‑position only) | Yes via `signed_url#page=N`; highlight is Mike's UI job |
| Vectara | Chunk granularity | Yes | No | No | Page is approximate; highlight is Mike's UI job |
| Cohere Compass | Chunk granularity | Yes | No | No | Mike's UI job |
| Azure CU + Search | **Yes** | **Yes** | **Yes** | **Yes (offset+length)** | **Yes, natively** |
| Vertex AI Search | Yes | Yes (chunk) | No | No | Mike's UI job |
| **Anthropic `search_result`** | **As Mike encodes** | **Yes (Claude cites Mike's content)** | **As Mike encodes** | **As Mike encodes** | **Yes — Mike controls anchors** |

**Conclusion of the matrix:** Two paths give Mike true span‑level citation fidelity:
1. **Azure Content Understanding** — natively returns offsets+coordinates, but requires Azure infra commitment and Azure‑shaped pipeline.
2. **Anthropic `search_result` + Mike‑owned L1–L4** — Mike keeps the stack he's already building and gets Claude‑grade citations into anchors *he* defines.  No vendor lock at the citation layer.

Every other vendor stops at page + excerpt, which means **the cited‑span highlighting work in Mike's UI exists in either build path** — it is not eliminated by adopting managed RAG.

---

## Decisional recommendation

### Build‑on‑managed‑core (if Mike adopts Pinecone Assistant as L3–L5)

**What Mike still owns:**
- L1 (Document AI OCR) — unchanged; arbitration exhibits are 70–90% scanned, no managed vendor parses these as well as Document AI tuned for legal.
- L2 chunking with offset metadata — unchanged; the offset anchors are what give Mike its differentiated citation precision.
- L6 UI citation jump — unchanged; page‑highlighting on rendered PDFs is Mike's UI regardless of vendor.
- L7 agentic workflows — unchanged.

**What Mike gives up:**
- Voyage‑3/rerank‑2.5 quality.  Pinecone Assistant uses its own embedding + retrieval stack; Voyage's legal‑domain edge is not available inside Pinecone Assistant (it is inside raw Pinecone serverless, but that's not the Assistant managed product).
- Control of the retrieval/rerank pipeline.  No bespoke filter logic, no per‑matter reranker tuning, no escape from the Pinecone chunking strategy for arbitration records that benefit from custom hierarchy (exhibit → bates‑page → paragraph).
- Per‑matter cost predictability for very large corpora.  At 100k pages × 50M tokens, multimodal ingestion at ~2× standard rate plus assistant‑hour billing gets expensive fast.

**Timeline compression:** Build‑on‑managed‑core would compress Phase‑1 retrieval work (estimated 2–3 weeks) to roughly 1 week, but **does not compress L1/L2/L6/L7** (which are the majority of remaining work).  Net effect on 6–7 week plan: ~1.5 weeks saved.  Not transformational.

### Build‑as‑architected with Anthropic `search_result` for L5 (recommended)

**Architecture:**
- L1: Document AI (unchanged).
- L2: Custom chunking with `{doc_id, page, char_start, char_end, bbox}` per chunk (unchanged).
- L3: Voyage‑3 embeddings (note: MongoDB‑owned; track but not blocking).
- L4: Turbopuffer for vector + BM25 hybrid (unchanged), rerank with rerank‑2.5.
- **L5: Pass top‑K results to Claude as `search_result` blocks with `source` encoding Mike's offset anchor.  Claude's citations point at Mike's anchors.**
- L6: Mike's existing pdf‑anchor‑mvp text‑layer search + highlight rendering (unchanged).
- L7: Mike's roadmap (unchanged).

**Why this wins for Mike:**
1. **Citation fidelity is best‑in‑class** — Claude cites Mike's own offset anchors verbatim; no vendor schema in between.
2. **No managed‑core lock‑in at L3–L5.**  Each layer is swappable.
3. **No managed‑core pricing floor.**  Pay‑per‑use Claude tokens only.
4. **The architecture Mike is already building is the right architecture** — managed RAG would mostly compress one week of work in exchange for permanent constraints on citation precision and multi‑tenancy granularity.

### When build‑on‑managed‑core would beat this

Switch the recommendation if any of these become true:
- Hugh decides arbitration matter intake will grow to >50 matters and Mike needs hands‑off per‑tenant ops — Pinecone namespace‑per‑tenant ops are genuinely easier than rolling matter isolation by hand.
- Mike's customer base shifts to environments where Azure adoption is mandatory (insurance, regulated finance) — Azure CU's native offset+bbox citations become very attractive.
- Hugh wants to ship a proof of concept in 2 weeks rather than the full 6–7 week build — Pinecone Assistant + Claude Code plugin is the fastest path to a working demo, accepting lower citation precision.

### Revised phased plan estimate

| Phase | Custom (current) | Managed‑core (Pinecone Assistant) | Hybrid (recommended: Anthropic search_result + custom L1–L4) |
|---|---|---|---|
| L1 OCR (Document AI) | 1 wk | 1 wk | 1 wk |
| L2 chunking + offset metadata | 1 wk | 0.5 wk | 1 wk |
| L3 embeddings + L4 retrieval | 1.5 wk | 0 (managed) | 1.5 wk |
| L5 synthesis + citation glue | 1 wk | 0.5 wk (managed) | 0.5 wk (search_result is mostly drop‑in) |
| L6 PDF anchor UI | 1 wk | 1 wk | 1 wk |
| L7 workflows + polish | 1 wk | 1 wk | 1 wk |
| **Total** | **6.5 wk** | **4 wk** | **6 wk** |

The hybrid path saves 0.5 week over pure custom while preserving every architectural choice Mike already validated.  The managed‑core path saves 2.5 weeks but compromises citation precision and multi‑tenant control.

---

## Sources

- [AWS Bedrock Knowledge Base Citation API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_Citation.html)
- [AWS Bedrock RetrievedReference schema](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_RetrievedReference.html)
- [AWS S3 Vectors for Bedrock KBs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-bedrock-kb.html)
- [Bedrock converse citations bug — empty web location](https://github.com/aws/aws-sdk-js-v3/issues/7497)
- [Pinecone Assistant — citation highlights](https://www.pinecone.io/learn/pinecone-assistant-citation-highlights/)
- [Pinecone Assistant pricing and limits](https://docs.pinecone.io/guides/assistant/pricing-and-limits)
- [Pinecone multitenancy via namespaces](https://docs.pinecone.io/guides/index-data/implement-multitenancy)
- [Pinecone Assistant GA blog](https://www.pinecone.io/blog/pinecone-assistant-generally-available/)
- [Vectara HHEM leaderboard](https://www.vectara.com/blog/introducing-the-next-generation-of-vectaras-hallucination-leaderboard)
- [Vectara multi‑tenancy management APIs](https://www.vectara.com/blog/managing-multi-tenancy-with-vectaras-new-management-apis)
- [Vectara pricing page](https://www.vectara.com/pricing)
- [MongoDB acquires Voyage AI (2025‑02‑24)](https://www.mongodb.com/press/mongodb-announces-acquisition-of-voyage-ai)
- [Voyage AI homepage](https://www.voyageai.com/)
- [Cohere Compass product page](https://cohere.com/compass)
- [Cohere Rerank](https://cohere.com/rerank)
- [Azure AI Search what's new (2026‑04‑01 API)](https://github.com/MicrosoftDocs/azure-ai-docs/blob/main/articles/search/whats-new.md)
- [Azure Content Understanding — grounding with offset+span](https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/document/enrichments)
- [Azure AI Search S3 High Density multitenancy](https://learn.microsoft.com/en-us/azure/search/search-sku-tier)
- [Vertex AI grounded answers with RAG](https://cloud.google.com/generative-ai-app-builder/docs/grounded-gen)
- [Vertex AI GroundingMetadata reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1beta1/GroundingMetadata)
- [Vertex Agent Search pricing](https://cloud.google.com/generative-ai-app-builder/pricing)
- [Anthropic Citations API (page_location, char_location)](https://docs.anthropic.com/en/docs/build-with-claude/citations)
- [Anthropic search_result content block (GA 2026)](https://platform.claude.com/docs/en/build-with-claude/search-results)
- [Anthropic Citations launch announcement](https://claude.com/blog/introducing-citations-api)
- [LlamaCloud pricing](https://www.llamaindex.ai/pricing)
- [LlamaParse GA announcement](https://www.llamaindex.ai/blog/announcing-our-series-a-and-llamacloud-general-availability)
- [Ragie homepage](https://www.ragie.ai/)
- [Ragie pricing](https://www.ragie.ai/pricing)
