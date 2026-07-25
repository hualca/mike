# Mike — Buy vs.  Build: 2026 Vendor Landscape Scan

**Date:** 2026‑05‑28
**For:** Hugh Carlson (Three Crowns LLP, Generative Legal, HLS)
**Purpose:** Decide whether to keep building Mike or buy a finished product for the current international arbitration matter (100k+ pages, ~50M tokens, 70–90% scanned exhibits, citations must open the source PDF at the right page with the span highlighted).
**Method:** Web research as of 2026‑05‑28.  Vendor pricing is mostly hidden; ranges below come from third‑party trackers and recent press.  Sources inline.

---

## TL;DR

- Only **two** vendors plausibly fit Hugh's profile as a buy‑today option for a sole practitioner running a 100k+ page arbitration record with span‑level PDF citations: **Hebbia Matrix** and **Thomson Reuters CoCounsel**.  Of those, only Hebbia is engineered for the "ask any question of 10k–100k+ heterogeneous documents with click‑to‑source highlights" pattern Hugh actually needs.
- The most arbitration‑native option — **Legora + Jus Mundi** — does not sell to solos in the US today, and the pricing floor (~$30k/yr, 10‑seat minimum) prices Hugh out absent enterprise negotiation.
- **Harvey is out.**  Per‑seat $1.2k–$2k/mo, 25‑seat minimum, no solo motion.
- **CoCounsel** is the cheapest "real" option (~$225/user/mo standalone) and will ingest a matter, but its citation UX is "see Document X" with hyperlinked excerpt — not a span‑highlighted PDF deep‑link.
- The eDiscovery incumbents (**Disco, Relativity aiR, Everlaw**) all now ship citation‑backed Q&A on huge corpora and are the best fit *technically*, but they price on hosted GB ($2k–$5k/mo base + $18–$35/GB) and ship a "review platform" UX, not a practitioner Q&A UX.  A 100k‑page arbitration record at ~200–500 GB processed gets to $50k–$150k/matter fast.
- **Mike's unique value** vs.  anything on this list is: (i) the pinpoint span‑highlight citation that opens the actual exhibit PDF, (ii) per‑matter cost in dollars instead of thousands of dollars, and (iii) ownership.  Hebbia is the only commercial product that matches (i); none match (ii) or (iii).

**Recommendation if Hugh wanted to stop building today:** Demo **Hebbia Matrix** for the current matter and ask for a 1‑seat Professional trial (~$10k/yr list, often negotiated lower for solos with referenceable use cases).  Backstop with **CoCounsel Core** (~$225/mo, month‑to‑month) for the legal‑research and drafting layer.  Skip everything else.

---

## Vendor‑by‑vendor matrix

| Vendor | Scope | Arbitration features | Citation UX | Solo can buy? | Price (2026) | 100k+ pages? |
|---|---|---|---|---|---|---|
| **Harvey** (Assistant / Vault / Workflows / Agent Builder) | Generalist legal AI; Vault is doc Q&A; Agent Builder for custom workflows.  Used by litigation and arbitration teams (B.  Cremades, Youssef + Partners, Schoenherr). | No arbitration‑specific product.  Customer case studies in arbitration.  Recent push into agentic workflows + "Legal Agent Bench" benchmark (May 2026). | Vault returns answers with linked citations and a verify/edit/flag workflow per cell.  Public docs describe citation links to source documents but do not confirm span‑level PDF page highlights as the default UX. | **No.**  Enterprise‑only.  25+ seat minimums reported. | **$1,200–$2,000+/seat/month**; enterprise contracts; 25‑seat floor.  No published pricing. | Vault: 100,000 files/project, 500 MB/file cap.  Review Tables tested to ~10k docs.  Technically fits, commercially does not. |
| **Legora** (Assistant / Tabular Review / Markup / Editor) | Stockholm‑based; $5.6B valuation April 2026; US offices in NY, Houston, Chicago.  Tabular Review = grid where rows are docs, cols are AI prompts.  Word add‑in. | **Best arbitration story of any generalist:** March 2026 agent‑to‑agent integration with Jus Mundi; SCC Arbitration Institute partnership.  Citation‑backed answers grounded in Jus Mundi awards/treaties/rules. | Linked citations to source documents; Word add‑in shows citations inline.  Specific PDF span‑highlight behavior not documented publicly. | **Effectively no.**  10‑seat minimum, ~$30k/yr floor; enterprise sales motion; no solo plan. | **~$3,000/user/year list**, 10‑seat min → **~$30k/yr floor**.  Reported 40–60% discounts on pushback. | Tabular Review designed for "hundreds or thousands of documents at scale."  Not advertised at 100k+. |
| **Spellbook** | Transactional / contract drafting; Word add‑in.  Not a matter‑Q&A product. | None.  Wrong category for arbitration records. | Citations relevant only inside contract review context. | **Yes.** | **~$99–$165/user/mo** (solo); enterprise ~$350/user/mo with 6‑mo minimum. | No — not designed for matter‑scale corpora. |
| **Thomson Reuters CoCounsel** (post‑Casetext) | Legal research + doc review + drafting; tightly bundled with Westlaw.  May 2026: DealCloser embed for transactions. | Generic litigation, not arbitration‑specific.  Will ingest a doc set and answer with Westlaw‑style citations. | "Every answer contains a cite to the material on which it based its response."  Cites link to underlying excerpt; document review surfaces results in sortable tables.  Not documented as opening the exhibit PDF at the page with the span highlighted. | **Yes.**  No seat minimum; per‑user pricing. | **CoCounsel Core ~$225/user/mo standalone**; Basic Research $220/user/mo; On‑Demand $75/task; Westlaw bundle pushes total to **$300–$600/user/mo**. | Marketing claims "thousands of documents at once."  Not optimized for 100k+ page heterogeneous arbitration records. |
| **LexisNexis Lexis+ AI / Protégé** | Research + drafting + contract analysis + uploaded‑doc Q&A.  Protégé is the agentic layer. | Generic litigation. | Conversational answers with Lexis‑sourced citations; document analysis on uploads.  Span‑highlight behavior on uploaded PDFs not documented. | **Yes** (Lexis sells to solos). | **$128–$494/user/mo** standard tiers; **$500–$1,000+/user/mo** full Protégé.  Lexis+ AI add‑on ~$50–$125/user/mo on top of Lexis+ base. | Not advertised for 100k+ matter corpora. |
| **Westlaw Precision AI** | Research + Brief Analyzer + drafting.  Doc upload is for brief analysis, not matter Q&A. | Generic litigation. | Brief Analyzer cites cases in uploaded briefs and flags negative treatment.  Not a "Q&A over 100k pages" tool. | **Yes.** | **$12k–$30k+/yr** per attorney; CoCounsel layer +$150–$300/user/mo. | No — not the product shape. |
| **Disco (Cecilia AI)** | eDiscovery platform with Cecilia Q&A (multi‑step reasoning), Auto Review (~25k docs/hr), Doc Summaries, Deposition Summaries.  All‑inclusive per‑GB pricing announced Feb 2026. | Built for litigation/eDiscovery; arbitration use is incidental.  Cecilia Q&A is the closest analog to Mike. | "Streamlined Cecilia citation navigation" (April 2026 release); "Copy with citations" includes the underlying text.  Citation navigation is in‑platform; not documented as opening the source PDF at the highlighted span outside the Disco viewer. | **Technically yes**, practically rare — Disco sells to firms, not solos. | Per‑GB processed, no separate AI charge; "$0.11–$0.50/doc" review market range cited.  No solo pricing posted. | **Yes** — Cecilia is engineered for very large data sets. |
| **Relativity aiR** | aiR for Review, aiR Assist (NL search), aiR for Case Strategy (fact extraction, chronologies, deposition prep, witness/transcript summaries).  Nov 2025: unlimited fixed‑fee per‑GB pricing for aiR. | Generic litigation; aiR for Case Strategy is the most arbitration‑adjacent. | Citation‑backed inside Relativity Review viewer. | **No** in practice — Relativity sells through service providers; solos buy via a hosting partner. | **$500–$25,000+/mo** depending on tier; aiR previously $0.20–$0.25/doc with token‑based doc counting; now moving to unlimited per‑GB. | **Yes** — designed for it.  Cost is the issue. |
| **Everlaw (AI Deep Dive)** | eDiscovery platform; Deep Dive (GA Dec 2025) = NL Q&A over entire corpus with confidence‑ranked, citation‑backed answers and explicit "I don't know" behavior.  Storybuilder for fact chronologies.  Writing Assistant, Deposition Analyzer, Single Doc Review Assistant now included. | Generic litigation; American Arbitration Association president on stage at 2025 Summit — signaling intent but no arbitration‑specific product. | Deep Dive returns confidence‑ranked answers with cited resources; Resources panel links back to documents in the platform.  Span‑highlight in source PDF: in‑platform viewer, not external. | **Technically yes**, practically rare. | **$2,000–$5,000/mo base + $18–$35/GB** hosted.  Example: 500 GB / 20 reviewers / 6 mo ≈ $66k–$155k. | **Yes** — Deep Dive marketed for 10M+ doc interrogation. |
| **Hebbia (Matrix)** | "Ask any question of any docs."  Spreadsheet‑like analytical engine; "Verifiable Fact Layer" with click‑to‑source highlights on the source PDF.  Used by hedge funds, PE, M&A and complex‑litigation teams.  Seyfarth deal‑execution partnership. | Not arbitration‑specific, but **the product shape (heterogeneous huge corpus + cell‑level cited answer + click to highlighted PDF sentence)** is the closest commercial analog to Mike. | **Best in class for Hugh's spec:** every cell links to a clickable citation that opens the source PDF and highlights the exact sentence.  Hover‑to‑highlight in‑document. | **Yes, in theory.**  Sold via sales; deals usually start with a "handful of Professional seats" — a 1‑seat purchase is plausible. | **Professional: $10,000/seat/yr** (unlimited reasoning + agent building + integrations).  **Lite: $3,000–$3,500/seat/yr** (consume outputs only). | **Yes** — designed for document‑intensive work at scale. |
| **Paxton AI** | Research + drafting + doc analysis; AI medical chronologies; appellate+ case law coverage. | Generic, US‑centric.  Not arbitration. | Citations to case law/research; doc analysis on uploads. | **Yes.** | Student **$25**; Pro **$159–$199/user/mo**; Enterprise custom. | Not designed for 100k+ page matters. |
| **Eve** | **Plaintiff‑only.**  PI / employment; intake; demand letters; medical chronologies. | None — wrong practice area. | Cites case facts in generated drafts. | Plaintiff firms only. | Est.  $100–$300/user/mo; not published. | No. |
| **Robin AI** | Contract review / Word add‑in; Query, Reports, Review, Draft, Agent. | None — contracts only.  **Commercial status uncertain in early 2026** — failed $50M raise late 2025, managed‑services arm acquired by Scissero (Dec 2025), engineering team absorbed by Microsoft (Jan 2026). | N/A | N/A | Custom — but **deprioritize, ongoing existence uncertain**. | No. |
| **Jus Mundi / Jus AI** | **The arbitration‑native database.**  Awards, treaties, institutional rules from 100+ arbitral bodies.  Jus AI is an agentic assistant over that corpus; ISO 27001/42001, SOC 2 Type 1.  Multilingual (EN/FR/ES/PT/AR/+).  Can also ingest user‑uploaded documents. | **Yes — purpose‑built.** | Citation‑linked to verified legal sources; step‑by‑step reasoning shown.  Behavior on user‑uploaded PDFs (span highlight in the source) not publicly documented. | **Yes** — Jus Mundi has long sold to individual practitioners and academics. | "AI Premium" plan only; pricing not posted.  Historically the Essentials tier is in the low‑four‑figures/yr range. | Designed primarily for research, not 100k+ page evidentiary records.  Useful as a *complement* to a matter‑Q&A tool. |
| **Opus 2** | Disputes platform: case management, hearing room, transcripts, AI Assist (post‑Uncover acquisition) — outlines, summaries, transcript generation, entity extraction. | **Yes — built for international arbitration.**  Used by arbitral institutions.  2026 winter release added AI Assist tools. | Citation behavior in AI Assist not publicly documented at span‑highlight detail. | **No** in practice — sells to firms and institutions; not a solo product. | Not posted. | Built for hearings, not for 100k+ page Q&A specifically. |

---

## Synthesis — "If Hugh wanted to just buy something today"

The honest answer depends on which job he's hiring the tool for.

**If the job is: "Answer questions about my current arbitration matter's 100k‑page record with click‑to‑PDF‑span citations," the only commercial product whose architecture matches the spec is Hebbia Matrix.**  Every cell has a clickable citation that opens the source PDF and highlights the exact sentence — this is the same "Verifiable Fact Layer" pattern Mike is building.  Hebbia sells via sales and deals "usually start with a handful of Professional seats" — meaning a one‑seat trial is realistic.  At $10k/yr list per Professional seat (negotiable down, especially with a Three Crowns / Generative Legal / HLS reference story), this is the closest "buy instead of build" answer.  The cost is real but not absurd compared to the partner‑hour savings on a single 100k‑page matter.  **Caveat:** Hebbia is not arbitration‑native and won't know Jus Mundi treaties or institutional rules — pair it with Jus AI for the research layer.

**If the job is: "Get an arbitration‑native research and document workflow stack, money no object, willing to wait for a real sales cycle," the answer is Legora + Jus Mundi.**  The March 2026 agent‑to‑agent integration is genuinely first‑of‑its‑kind, the SCC partnership is real, and the Tabular Review UX is closer to how arbitration lawyers actually work than Harvey's Vault.  But the ~$30k/yr / 10‑seat floor means Hugh has to negotiate hard or wait until Legora launches a smaller‑firm tier.  As a *practitioner*, this is the most credible long‑term answer; as a *purchase today for a solo*, it's not yet a clean fit.

**If the job is: "Use the actual eDiscovery platform that lives where 100k+ page records live in practice," the answer is Everlaw Deep Dive or Disco Cecilia.**  Both ship the right shape (huge corpus + NL Q&A + citations) and both have GA'd the relevant features (Everlaw Dec 2025, Disco citation‑navigation April 2026).  The catch is they ship a *review platform* UX, not a *Q&A* UX — Hugh would still be working through document‑review screens rather than a clean Mike‑style interface.  And they cost $50k–$150k for a matter of this size.

**If the job is: "Cheap, available today, will at least give me document Q&A with reasonable citations," the answer is CoCounsel Core at $225/user/mo.**  It's the only enterprise‑grade legal AI that sells month‑to‑month per user with no minimums.  Citation behavior is "see Document X" with hyperlinked excerpt — not a true span‑highlighted PDF deep‑link — but it's a working tool that exists.

**Three things genuinely move the needle for Mike's build‑vs‑buy verdict:**

1. **The PDF span‑highlight citation is rarer than expected.**  Of the 13+ products surveyed, only Hebbia explicitly documents click‑to‑source‑sentence in the original PDF as a default UX.  The eDiscovery vendors do citation navigation *inside their viewer*, not as a deep‑link to the source.  Harvey, Legora, and CoCounsel hyperlink to excerpts.  Mike's pinpoint‑PDF citation is differentiated.
2. **Nobody is selling "arbitration AI for solos."**  The arbitration‑native plays (Legora, Jus Mundi, Opus 2) all sell to firms or institutions.  The solo‑accessible tools (Spellbook, Paxton, Eve, CoCounsel) aren't arbitration‑native.  This is a gap.
3. **The market is consolidating, not stabilizing.**  Robin AI collapsed Q4 2025.  Relativity moved pricing models twice in two years.  Harvey is sprinting toward agentic everything.  Legora hit $5.6B but doesn't yet have a small‑firm motion.  A self‑built tool that Hugh controls outright is harder to displace than it was 18 months ago.

**Net recommendation:** Take a free Hebbia Matrix demo this quarter to validate that its citation UX really does what Mike is building, and to benchmark Mike's UX against the best commercial analog.  Don't sign anything yet.  Keep building Mike — the moat is the pinpoint citation + per‑matter cost in dollars + ownership, and the market is still leaving the "arbitration AI for solos" lane wide open.

---

## Sources

### Harvey
- [Harvey AI Pricing 2026 (AI Vortex)](https://www.aivortex.io/legal/ai-tools/harvey-ai-pricing-2026/)
- [Top 7 Harvey AI Alternatives for Solos & Small Firms 2026 (TheLawGPT)](https://www.thelawgpt.com/blog/harvey-ai-alternatives-solo-lawyers-small-firms)
- [Harvey Agent Builder announcement](https://www.harvey.ai/blog/introducing-agent-builder)
- [Harvey Legal Agent Bench launch (Artificial Lawyer, May 2026)](https://www.artificiallawyer.com/2026/05/06/harvey-launches-legal-agent-bench/)
- [Harvey Vault file/document limits](https://help.harvey.ai/release-notes/increased-file-upload-limits)
- [Harvey Vault scaling — file upload & management](https://www.harvey.ai/blog/scaling-harveys-document-systems-vault-file-upload-and-management)
- [Harvey customer — Youssef + Partners (arbitration)](https://www.harvey.ai/customers/youssef-and-partners)
- [Harvey customer — Schoenherr (arbitration)](https://www.harvey.ai/customers/schoenherr)

### Legora
- [Legora hits $5.6B (TechCrunch, April 2026)](https://techcrunch.com/2026/04/30/legal-ai-startup-legora-hits-5-6-valuation-and-its-battle-with-harvey-just-got-hotter/)
- [Legora $550M Series D for US expansion (Bloomberg, March 2026)](https://www.bloomberg.com/news/articles/2026-03-10/legal-ai-startup-legora-raises-550-million-for-us-expansion)
- [Legora Pricing 2026 (LawxyAI)](https://www.lawxyai.com/articles/legora-pricing-2026-real-costs-hidden-fees-better-alternatives)
- [Jus Mundi × Legora arbitration integration (Artificial Lawyer, March 2026)](https://www.artificiallawyer.com/2026/03/26/legora-partners-with-jus-mundi-for-arbitration-needs/)
- [SCC Arbitration Institute × Legora](https://legora.com/newsroom/scc-arbitration-institute-and-legora)

### Spellbook
- [Spellbook AI Pricing 2026 (AI Vortex)](https://www.aivortex.io/legal/compare/spellbook-pricing-2026/)
- [Spellbook official pricing page](https://www.spellbook.legal/pricing)

### CoCounsel
- [CoCounsel Pricing 2026 (Costbench)](https://costbench.com/software/ai-legal-tools/cocounsel/)
- [CoCounsel Review (Lawyerist, 2026)](https://lawyerist.com/reviews/artificial-intelligence-in-law-firms/cocounsel-review-artificial-intelligence-for-lawyers/)
- [CoCounsel Pricing 2026 (AI:PRODUCTIVITY)](https://aiproductivity.ai/pricing/cocounsel/)
- [Top 7 CoCounsel alternatives (TheLawGPT)](https://www.thelawgpt.com/blog/cocounsel-casetext-alternatives-affordable-legal-ai)

### Lexis+ AI / Protégé
- [Lexis+ with Protégé Pricing 2026 (AI:PRODUCTIVITY)](https://aiproductivity.ai/pricing/lexis-plus-ai/)
- [LexisNexis Protégé launch press release](https://www.lexisnexis.com/community/pressroom/b/news/posts/lexisnexis-launches-next-evolution-of-lexis-with-protege-the-legal-ai-platform-built-on-the-authority-legal-work-demands)

### Westlaw Precision AI
- [Westlaw AI Review 2026 (Elephas)](https://elephas.app/resources/westlaw-ai-review)
- [Westlaw Precision AI Review (AI Vortex)](https://www.aivortex.io/legal/guides/westlaw-precision-ai-review/)

### Disco (Cecilia AI)
- [Disco all‑inclusive eDiscovery platform (Feb 2026)](https://csdisco.com/pressrelease/disco-announces-all-inclusive-platform-for-ediscovery)
- [Disco — What's New](https://csdisco.com/whats-new)
- [Cecilia AI Q&A — DISCO product page](https://csdisco.com/offerings/ediscovery/features-ai)
- [Cecilia AI EU/UK debut (Complex Discovery)](https://complexdiscovery.com/cecilia-ai-by-disco-debuts-in-the-eu-and-uk-to-streamline-ediscovery-workflows/)
- [eDiscovery price reset 2026 (PlatinumIDS)](https://blog.platinumids.com/blog/ediscovery-pricing-revolution-2026)

### Relativity aiR
- [Relativity unveils new pricing model](https://www.relativity.com/news-events/relativity-unveils-new-pricing-model/)
- [Relativity AI products at no extra charge (Above the Law, Oct 2025)](https://abovethelaw.com/2025/10/relativity-offers-key-ai-products-at-no-extra-charge-but-thats-not-the-most-important-thing/)
- [Relativity Pricing 2026 (Costbench)](https://costbench.com/software/ai-legal-tools/relativity/)
- [Relativity aiR unlimited fixed‑fee pricing (IntrepidX)](https://intrepidx.com/relativity-launches-unlimited-fixed-fee-pricing-for-air-with-intrepidx-leading-client-rollout/)

### Everlaw
- [Everlaw Deep Dive GA & pricing changes (LawSites, Nov 2025)](https://www.lawnext.com/2025/11/everlaw-announces-general-availability-of-ai-deep-dive-as-well-as-major-pricing-changes-at-annual-summit.html)
- [Everlaw Deep Dive product page](https://www.everlaw.com/product/everlaw-ai/deep-dive/)
- [Everlaw Deep Dive — Use Deep Dive (Support)](https://support.everlaw.com/hc/en-us/articles/40125977106587-Use-Deep-Dive)
- [Everlaw Pricing 2026 (AI Vortex)](https://www.aivortex.io/legal/compare/everlaw-pricing-2026/)

### Hebbia
- [Hebbia pricing index (Metronome)](https://metronome.com/pricing-index/hebbia)
- [Hebbia revenue, valuation & funding (Sacra)](https://sacra.com/c/hebbia/)
- [Seyfarth × Hebbia partnership](https://www.seyfarth.com/news-insights/seyfarth-leads-next-phase-of-deal-execution-and-diligence-through-ai-partnership-with-hebbia.html)
- [Hebbia AI deep‑dive guide (Skywork)](https://skywork.ai/skypage/en/hebbia-ai-deep-dive-guide/1976843429248823296)
- [Hebbia — system of record for enterprise reasoning (Medium)](https://medium.com/@takafumi.endo/hebbias-edge-building-a-system-of-record-for-enterprise-reasoning-1264ab76ec6b)

### Paxton AI
- [Paxton AI Pricing 2026 (Costbench)](https://costbench.com/software/ai-legal-tools/paxton-ai/)
- [Paxton official pricing](https://www.paxton.ai/pricing)
- [Paxton AI Review (Lawyerist, 2026)](https://lawyerist.com/reviews/artificial-intelligence-in-law-firms/paxton-ai-review-artificial-intelligence-for-lawyers/)

### Eve
- [Eve Legal — AI for plaintiff firms](https://www.eve.legal/)
- [Eve Legal Pricing Explained (ProPlaintiff)](https://www.proplaintiff.ai/post/eve-legal-pricing-explained)
- [Meet Eve (Above the Law, March 2026)](https://abovethelaw.com/2026/03/meet-eve-the-ai-used-by-800-top-plaintiff-firms/)

### Robin AI
- [Robin AI in 2026 — contract‑review challenger](https://agenticcontractreview.com/vs-robin-ai/)
- [Robin AI Ultimate Guide 2026 (Skywork)](https://skywork.ai/skypage/en/robin-ai-voice-assistant-legal-tech/2029386504328388608)

### Jus Mundi / Jus AI
- [Jus AI product page](https://jusmundi.com/en/jus-ai)
- [Jus Mundi pricing](https://jusmundi.com/en/pricing)
- [Jus AI on Legaltech Hub](https://www.legaltechnologyhub.com/vendors/jus-ai-by-jus-mundi/)

### Opus 2
- [Opus 2 international arbitration solutions](https://www.opus2.com/international-arbitration)
- [Opus 2 AI Assist winter release 2026 (LawSites)](https://www.lawnext.com/2026/03/opus-2-empowers-law-firms-to-extend-innovation-beyond-disputes-with-its-adaptable-ai-enabled-software-platform/)
- [AI in arbitration — Opus 2 use cases 2026](https://www.opus2.com/arbitration-ai-use-cases/)

### Arbitration AI landscape (background)
- [Navigating AI in International Arbitration (Faegre Drinker, 2025)](https://www.faegredrinker.com/en/insights/publications/2025/5/navigating-ai-in-international-arbitration-key-insights-and-guidelines)
- [AAA‑ICDR AI Arbitrator launch (Akin)](https://www.akingump.com/en/insights/alerts/international-arbitration-ai-arbitrator-launched-by-the-aaa-icdr)
- [AI in International Arbitration (BCLP)](https://www.bclplaw.com/en-US/events-insights-news/ai-in-international-arbitration.html)
- [Guide to Evidence in International Arbitration — AI chapter (GAR)](https://globalarbitrationreview.com/guide/the-guide-evidence-in-international-arbitration/3rd-edition/article/artificial-intelligence-in-arbitration-evidentiary-issues-and-prospects)
