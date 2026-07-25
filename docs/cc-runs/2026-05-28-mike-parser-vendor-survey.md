# Mike — Document parsing / OCR vendor survey (2026‑05‑28)

Decisional research for whether the architecture's choice of **Google Document AI Layout Parser** as default OCR with **Reducto** as escalation for table‑heavy exhibits is still right in 2026, or whether a parser‑first vendor moved up the stack in a way that materially beats it for the arbitration workload (100k+ pages, 70–90% scanned exhibits, citation precision non‑negotiable).

---

## 1.  Reducto

**Scope.**  Parse + chunking + classify + extract via composable endpoints; bbox citations as first‑class output.  Increasingly looks like the front end of a managed RAG pipeline but does not own the vector store (publishes patterns for pairing with Elasticsearch).
**Pricing (2026).**  Floor **$0.015/page** at low volume.  Growth / Enterprise tiers are quote‑based; volume discounts substantial.  This is materially lower than the architecture review's "Reducto $10–30/1k" assumption.
**Citations / offsets.**  Bounding‑box citations are first‑class (pixel coords normalized per page).  Text anchors returned.  Character‑offset anchoring supported via structured JSON output.
**Accuracy.**  Vendor‑reported 99.24% on parse; leads RD‑TableBench.  Strong on dense financial tables, mixed language, visually dense forms — i.e., the exhibit profile.
**Legal posture.**  Public case study with August Law for legal/compliance workflows.
Sources: [Reducto pricing](https://reducto.ai/pricing), [Reducto citations docs](https://docs.reducto.ai/v/legacy/extraction/citations), [Reducto vs Google Doc AI](https://reducto.ai/compare/reducto-vs-google-document-ai), [Enterprise RAG blog](https://reducto.ai/blog/reducto-ingestion-rag-enterprise-scale).

## 2.  Unstructured.io

**Scope.**  Three SKUs — OSS library, Serverless API (parse only), Platform (managed enterprise ETL with scheduling/connectors/scaling; still BYO vector DB).
**Pricing.**  OSS free.  Serverless API **from $1/1,000 pages**.  Platform sales‑quoted.
**Citations / offsets.**  Element‑level metadata with coordinates; weaker than Reducto on bbox fidelity in independent benchmarks.  Page‑level anchoring reliable.
**Accuracy.**  Internal benchmarks claim leadership; third‑party benchmarks put it behind Reducto and LlamaParse on table‑heavy and scanned content.
**Legal posture.**  None specific.
Sources: [Unstructured pricing](https://unstructured.io/pricing), [Serverless API blog](https://unstructured.io/blog/introducing-unstructured-serverless-api), [Atlan enterprise RAG comparison](https://atlan.com/know/enterprise-rag-platforms-comparison/).

## 3.  LlamaParse / LlamaCloud

**Scope.**  Full managed RAG stack — LlamaParse (parsing), managed ingestion, managed indexes + Retriever API, hybrid/rerank/metadata filtering.  Most "replace L1–L2" candidate on the list.
**Pricing.**  Credits at $1.25/1,000 credits.  Parse‑no‑AI ≈ 1 credit/page (~$0.00125/pg); Cost‑Effective ≈ 3 credits (~$0.00375/pg); Agentic ≈ tens of credits; **Agentic Plus w/ Sonnet ≈ 90 credits/page (~$0.11/pg)**.  Plans: Free (10k credits/mo), Starter $50, Pro $500, Enterprise.
**Citations / offsets.**  Page‑level anchoring and bbox for figures/tables; markdown‑first output.  Character‑offset anchoring through the index layer is workable but not headline.
**Accuracy.**  Best‑in‑class for clean markdown from complex layouts; Agentic tiers run frontier models per page, where cost balloons.
**Legal posture.**  Not legal‑specific; used widely in legal pilots because of cleanliness of output.
Sources: [LlamaParse pricing](https://www.llamaindex.ai/pricing), [LlamaParse v2 blog](https://www.llamaindex.ai/blog/introducing-llamaparse-v2-simpler-better-cheaper), [LlamaCloud Index docs](https://developers.llamaindex.ai/python/framework/module_guides/indexing/llama_cloud_index/).

## 4.  Mistral OCR (v3)

**Scope.**  Pure OCR / document understanding.  No managed RAG.  Markdown + HTML‑table output.
**Pricing.**  **$2/1,000 pages**, **$1/1,000 with batch API**.  Cheapest serious option by an order of magnitude.
**Citations / offsets.**  Page‑level, token coordinates in markdown; weaker structured output than Reducto.
**Accuracy.**  Reducto's RD‑FormsBench (Mar 2025) had Mistral OCR at ~45% on dense financial tables / handwritten forms vs ~80% for Gemini 2.0 Flash.  v3 (2026) improves this but no independent benchmark yet shows it closing the gap on scanned exhibits.
**Legal posture.**  None.
Sources: [Mistral OCR 3 announcement](https://mistral.ai/news/mistral-ocr-3/), [Mistral pricing](https://mistral.ai/pricing/).

## 5.  Google Document AI Layout Parser

**Scope.**  Parse + chunking.  Not RAG.
**Pricing (2026 confirmed).**  **$10/1,000 pages flat**, no volume tiers.  Form Parser $30/1k (drops to $20/1k at high volume).
**Citations / offsets.**  Bounding poly + character text‑anchor offsets in the `Document` proto — **best‑in‑class for character‑offset anchoring among cloud OCRs**.  v1.6 with Gemini 3 Flash / Pro in preview as of Jan 2026.
**Legal posture.**  None specific; widely used.
Sources: [Doc AI pricing](https://cloud.google.com/document-ai/pricing), [Layout parser docs](https://docs.cloud.google.com/document-ai/docs/layout-parse-chunk), [release notes](https://docs.cloud.google.com/document-ai/docs/release-notes).

## 6.  AWS Textract

**Scope.**  OCR + Layout + Tables + Forms.  No RAG.
**Pricing.**  DetectText $1.50/1k; **Tables (incl. Layout) $15/1k; Forms $50/1k**; both = $65/1k.  Volume tiers cut moderately.
**Citations / offsets.**  Geometry/bbox per block; no native character offsets across the document.
**Legal posture.**  None.
Source: [Textract pricing](https://aws.amazon.com/textract/pricing/).

## 7.  Azure Document Intelligence

**Scope.**  Prebuilt + custom models.  No RAG.
**Pricing.**  **$10/1,000 pages** for prebuilt (incl. Layout); high‑volume commitment can drop to ~$0.53/1k at 8M pages/mo.
**Citations / offsets.**  Bbox + spans (offset+length into the returned text) — character‑offset anchoring is good.
**Legal posture.**  None specific.
Source: [Azure DI pricing](https://azure.microsoft.com/en-us/pricing/details/document-intelligence/).

## 8.  Anthropic Claude PDF / Files API

**Scope.**  Native PDF ingestion in the model.  Not a parser product — pages converted to images + extracted text and passed to the model.
**Constraints.**  **Hard 100‑page cap per PDF**, 32 MB.  Page‑level citations are returned (PDF viewer page numbers).  No bbox, no character offsets.
**Pricing.**  Per‑token, no per‑page rate.
**Verdict.**  Useless as an L1/L2 replacement for 100k‑page arbitration records.  Useful only as a downstream reasoning layer over already‑parsed chunks.
Sources: [Anthropic PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support), [Claude PDF Q&A guide](https://claudeapi.com/en/blog/dev-guides/claude-api-pdf-document-qa-guide/).

## 9.  Legal‑specific players

**CaseMark** (GA Feb 2026 for Court Reporters) — summarization product over depositions/exhibits with arbitration summaries as a built‑in workflow.  Closed source, output‑focused, not a parsing API.  **Briefpoint** — discovery drafting, not parsing.  **LandingAI ADE** — generic Agentic Document Extraction, credit‑based, HIPAA option; no legal tuning.  **ExhibitManager / LegalView** — exhibit management UIs, not parsers.

No vendor in 2026 targets international arbitration exhibit parsing specifically.  That is still whitespace.

Sources: [CaseMark for Court Reporters](https://casemark.com/court-reporting), [LawSites coverage](https://www.lawnext.com/2026/02/casemark-launches-white-label-platform-for-court-reporting-firms-turning-transcripts-into-revenue-generating-summaries.html), [LandingAI ADE pricing](https://docs.landing.ai/ade/ade-pricing).

---

## Decisional recommendation

**Keep Document AI Layout Parser as default + Reducto as escalation.**  This is the right architecture in 2026, with one assumption to correct and one watch‑item.

Why:

1.  **Citation precision rules out the cheap options.**  Mistral OCR ($1–2/1k) is tempting but its scanned‑table / handwritten accuracy gap is real, and it lacks first‑class character offsets.  For arbitration where a missed line in an exhibit is malpractice‑adjacent, the savings are not worth it.

2.  **Character‑offset anchoring is a Document AI strength.**  Google's `Document` proto returns text anchors with offsets that map cleanly to spans in the canonical text — this is the foundation for citation precision and Mike's L1 architecture leans on it correctly.  Azure DI is comparable; AWS Textract and Mistral are weaker here.

3.  **Reducto remains the right escalation.**  It leads independent table benchmarks, has bbox citations as a first‑class feature, and is now cheaper than the architecture review assumed (floor $0.015/page, not $10–30/1k).  The escalation policy for table‑heavy exhibits is correct.

4.  **None of the "parser + RAG" vendors actually replace L1–L2 cleanly.**  LlamaCloud is the closest, but (a) the high‑accuracy Agentic Plus tier costs ~$0.11/page — 10× Document AI — and (b) handing chunking + retrieval to a managed service trades away the citation‑grounding control that Mike's architecture is built around.  For an open‑source project where users may self‑host, vendor‑locked managed RAG is also a strategic mismatch.

**Correction to the architecture review's pricing assumption.**  The "Reducto ~$10–30/1k" figure is stale.  Current floor is $15/1k at low volume and meaningfully less at scale.  This changes the escalation math: Reducto‑on‑every‑table‑heavy‑page is more affordable than the docs assume, and the threshold for escalating to Reducto can probably be lowered.  Per‑arbitration ingest cost lands toward the bottom of the $1,150–$1,350 range, not the top.

**Watch‑item.**  Google's Layout Parser v1.6 (Gemini 3 Flash, preview Jan 2026) and v1.6‑pro (Gemini 3 Pro, preview Dec 2025) are in preview.  If these GA and close the table‑accuracy gap with Reducto at the same $10/1k, the escalation tier could collapse into Document AI alone.  Re‑benchmark on a representative arbitration exhibit set when those GA.

**Bottom line:** no parser‑first vendor in 2026 materially beats Document AI + Reducto for this workload.  Keep the architecture; refresh the Reducto cost assumption; re‑evaluate when Document AI v1.6 GAs.
