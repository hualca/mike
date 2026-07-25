// Build the Q1 autonomous-build feasibility brief as a Word doc for CAI research input.
// Output: docs/cc-runs/2026-05-28-mike-autonomous-build-feasibility.docx

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageBreak, PageNumber, ExternalHyperlink, HeadingLevel,
  TableOfContents,
} = require('docx');

// ---------- helpers ----------

const FONT = 'Arial';

const border = { style: BorderStyle.SINGLE, size: 6, color: 'BFBFBF' };
const borders = { top: border, bottom: border, left: border, right: border };

const P = (text, opts = {}) => new Paragraph({
  spacing: { after: 120 },
  ...opts,
  children: Array.isArray(text)
    ? text
    : [new TextRun({ text, ...(opts.run || {}) })],
});

const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 180 },
  children: [new TextRun({ text })],
});
const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 140 },
  children: [new TextRun({ text })],
});
const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 220, after: 100 },
  children: [new TextRun({ text })],
});

const bullet = (text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  spacing: { after: 80 },
  children: typeof text === 'string'
    ? [new TextRun({ text })]
    : text,
});

const number = (text) => new Paragraph({
  numbering: { reference: 'numbers', level: 0 },
  spacing: { after: 80 },
  children: typeof text === 'string'
    ? [new TextRun({ text })]
    : text,
});

const bold = (text) => new TextRun({ text, bold: true });
const italic = (text) => new TextRun({ text, italics: true });
const code = (text) => new TextRun({ text, font: 'Consolas', size: 20 });
const plain = (text) => new TextRun({ text });

// Table cell helper. fill='header' shades the cell.
const cell = (content, opts = {}) => {
  const paragraphs = Array.isArray(content)
    ? content
    : [new Paragraph({ children: [new TextRun({ text: content, size: 20 })] })];
  return new TableCell({
    borders,
    width: { size: opts.width || 0, type: WidthType.DXA },
    shading: opts.fill === 'header'
      ? { fill: 'E7E6E6', type: ShadingType.CLEAR }
      : (opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined),
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: paragraphs,
  });
};

const cellBold = (text, opts = {}) => {
  return new TableCell({
    borders,
    width: { size: opts.width || 0, type: WidthType.DXA },
    shading: { fill: 'E7E6E6', type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 20 })]
    })],
  });
};

const makeTable = (columnWidths, rows) => new Table({
  width: { size: columnWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths,
  rows,
});

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ---------- content ----------

const CONTENT_WIDTH = 9360; // US Letter, 1" margins

const children = [
  // ===== Cover =====
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1200, after: 240 },
    children: [new TextRun({ text: 'Mike — Autonomous Build Feasibility', bold: true, size: 44 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [new TextRun({ text: 'A research brief for further analysis', italics: true, size: 28 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Can the v1 build (Phases A–G of the recommended architecture) be delegated to an autonomous agent stack rather than executed interactively with Hugh + Claude Code?', size: 24 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 720, after: 120 },
    children: [
      new TextRun({ text: 'Prepared for: ', size: 22 }),
      new TextRun({ text: 'Hugh Carlson — Three Crowns LLP / Generative Legal / Harvard Law School', bold: true, size: 22 }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({ text: 'Prepared by: ', size: 22 }),
      new TextRun({ text: 'Claude Code research session', size: 22 }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [
      new TextRun({ text: 'Date: ', size: 22 }),
      new TextRun({ text: '2026-05-28', size: 22 }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480 },
    children: [
      new TextRun({ text: 'Purpose: ', italics: true, size: 22 }),
      new TextRun({ text: 'Provide a Claude.ai research session with the full constituent parts, cost analysis, and option set necessary to interrogate this decision in depth.  Read straight through; the appendices give vendor-by-vendor depth and the source list.', italics: true, size: 22 }),
    ],
  }),

  pageBreak(),

  // ===== TOC =====
  new Paragraph({
    spacing: { after: 240 },
    children: [new TextRun({ text: 'Contents', bold: true, size: 32 })],
  }),
  new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-3' }),

  pageBreak(),

  // ===== Section 1: How to use this brief =====
  H1('1.  How to use this brief'),
  P('This document is research input, not a decision.  It packages everything a downstream session needs to interrogate one specific question: can the Mike v1 build be delegated to an autonomous coding-agent stack rather than executed interactively with Hugh and Claude Code?'),
  P('Use it by:'),
  bullet('Reading Section 2 to ground the build that is on the table.  Without this, any answer is generic.'),
  bullet('Reading Section 3 to see every realistic agent option as of May 2026 with current pricing.'),
  bullet('Reading Section 4 for the per-phase delegation analysis — which work can plausibly be agentic and which cannot.'),
  bullet('Reading Section 5 for the cost analysis, both service cost and the cost of bad autonomous decisions.'),
  bullet('Reading Sections 6–8 for compliance, risk, and calendar-compression analysis.'),
  bullet('Reading Section 9 for the working recommendation, then Section 10 for the open questions a deeper session should answer.'),
  P([
    italic('Hugh’s prior interactive answer to this question existed but was unsatisfying — a fast verbal sketch.  This brief is the proper research version.  Verify, sharpen, and extend; do not just restate.'),
  ]),

  // ===== Section 2: The build being considered =====
  H1('2.  The build that is on the table'),
  H2('2.1  What Mike is'),
  P('Mike is an open-source legal-document assistant.  Stack: Next.js frontend, Express backend, Supabase Auth/Postgres for metadata, Cloudflare R2 for document storage, Railway-hosted Postgres (mike-db) as the application database.  Model providers: Anthropic, Google Gemini, OpenAI (BYO key per user).  Today the system has documents in R2, metadata in Postgres, and a chat path that does keyword + full-text-dump retrieval only — no embeddings, no semantic search, no vector store.'),
  P('Hugh maintains the fork (origin github.com/hualca/mike; upstream github.com/willchen96/mike).  Marketing site: mikeoss.com.  The intended primary workload is full international-arbitration records (100,000+ pages each, ~50 million tokens, 70–90% scanned exhibits) with citation precision a tribunal would accept.'),

  H2('2.2  What the v1 build adds'),
  P('Per the architecture review approved on 2026-05-27, v1 ships layers L1 through L6 (minus hybrid retrieval and reranking, deferred to v1.5).  Concretely:'),
  bullet('L1.  OCR ingest via Google Document AI Layout Parser as default, Reducto as escalation for table-heavy exhibits.'),
  bullet('L2.  Document-type-aware chunking routed by classifier (pleading / witness statement / hearing transcript / award / statute / exhibit / correspondence); small-to-big fallback for unstructured.'),
  bullet('L3.  Voyage voyage-law-2 embeddings; chunks upserted to Turbopuffer with one namespace per project, attributes for doc_id, version_id, doc_type, page, paragraph, Bates.'),
  bullet('L4.  Vector-only retrieval in v1 with LLM query rewrite (Haiku); hybrid (BM25 + vector) and rerank-2.5 deferred to v1.5.'),
  bullet('L5.  Synthesis with offset-anchored citation extraction — the LLM never produces quote text, it only selects spans.  Rendering layer substitutes chunk.text[char_start:char_end] for "quote" span types.  Misquotes become structurally impossible.'),
  bullet('L6.  Clickable citation chips in chat output; PDF viewer accepts (chunk_id, char_start, char_end) and highlights the span on the right page; transcript citation rendering (day/page/line).'),

  H2('2.3  Phase plan as approved'),
  makeTable([900, 2900, 2300, 1900, 1360], [
    new TableRow({ tableHeader: true, children: [
      cellBold('Phase', { width: 900 }),
      cellBold('Work', { width: 2900 }),
      cellBold('Calendar (interactive)', { width: 2300 }),
      cellBold('Cost (build)', { width: 1900 }),
      cellBold('Delegation', { width: 1360 }),
    ]}),
    new TableRow({ children: [
      cell('A', { width: 900 }),
      cell('Turbopuffer + Voyage + Document AI accounts; Redis on Railway; RetrievalInterface stub.  No image swap.', { width: 2900 }),
      cell('2–3 days', { width: 2300 }),
      cell('~$0', { width: 1900 }),
      cell('Mostly Hugh (accounts) + autonomous (scaffolding)', { width: 1360 }),
    ]}),
    new TableRow({ children: [
      cell('B', { width: 900 }),
      cell('Document AI integration; Haiku 4.5 metadata; type classifier; offset-aware chunking router; chunks + document_metadata + ingest_jobs schemas; BullMQ worker.', { width: 2900 }),
      cell('1.5–2 weeks', { width: 2300 }),
      cell('~$20', { width: 1900 }),
      cell('Mostly autonomous; gate on classifier eval', { width: 1360 }),
    ]}),
    new TableRow({ children: [
      cell('C', { width: 900 }),
      cell('Voyage voyage-law-2 integration; chunk batch embed; Turbopuffer upsert; idempotent retry.', { width: 2900 }),
      cell('3–4 days', { width: 2300 }),
      cell('~$1–5', { width: 1900 }),
      cell('Highly delegable', { width: 1360 }),
    ]}),
    new TableRow({ children: [
      cell('D', { width: 900 }),
      cell('Haiku query rewriter; semantic_search tool; Turbopuffer query; context expansion; JSON Schema for tool output.', { width: 2900 }),
      cell('4–5 days', { width: 2300 }),
      cell('~$5', { width: 1900 }),
      cell('Highly delegable', { width: 1360 }),
    ]}),
    new TableRow({ children: [
      cell('E', { width: 900 }),
      cell('Output schema with quote / paraphrase spans; rendering layer substitutes chunk text; citation API; cross-project leakage test.', { width: 2900 }),
      cell('1 week', { width: 2300 }),
      cell('~$10', { width: 1900 }),
      cell('Delegable with hard gate', { width: 1360 }),
    ]}),
    new TableRow({ children: [
      cell('F', { width: 900 }),
      cell('Clickable citation chips; doc viewer offset highlight; transcript day/page/line; historical-version affordance.', { width: 2900 }),
      cell('1–1.5 weeks', { width: 2300 }),
      cell('~$0', { width: 1900 }),
      cell('Delegable with Playwright gates', { width: 1360 }),
    ]}),
    new TableRow({ children: [
      cell('G', { width: 900 }),
      cell('Ingest one real arbitration; 20 queries; verifiable-citation rate, latency, recall; fix top 3 problems.', { width: 2900 }),
      cell('1 week + 6–12h ingest', { width: 2300 }),
      cell('~$1,100–$1,250 OCR + ~$5 embed', { width: 1900 }),
      cell('Cannot delegate', { width: 1360 }),
    ]}),
  ]),
  P([italic('Source: 2026-05-27 architecture review, with cost adjustment for revised Reducto pricing.')]),

  H2('2.4  Why this build is unusual for an autonomous agent'),
  P('Three features make Mike v1 a stress test for any coding agent, not a routine assignment:'),
  number('Multi-vendor API integration.  Turbopuffer, Voyage, Google Document AI, BullMQ, Anthropic — three of these have evolving APIs that an agent may have stale knowledge of, and at least one (Document AI Layout Parser proto with character text anchors) has a surface that benchmarks rarely test.'),
  number('Correctness defined by legal judgment, not tests.  "Tests pass" does not equal "citation is correct."  A misquoted paragraph can pass every unit test in the suite and still be a malpractice event in front of a tribunal.'),
  number('Privilege-bound validation data.  Real arbitration records carry client confidentiality and privilege constraints.  Not every cloud-sandbox agent is a legally appropriate place to put a 100,000-page exhibit corpus, even with enterprise tier and zero data retention.'),

  pageBreak(),

  // ===== Section 3: The autonomous-agent landscape =====
  H1('3.  The autonomous coding agent landscape (May 2026)'),
  P('Eleven products were surveyed.  Each entry below covers: vendor, current product scope, operational shape (where the work physically runs), pricing as of May 2026, and a trust assessment specific to the Mike v1 shape of work.'),

  H2('3.1  Claude Code 2.1 with /goal and Agent SDK headless (Anthropic)'),
  P([bold('Vendor: '), plain('Anthropic.')]),
  P([bold('Product: '), plain('Claude Code 2.1, released at "Code with Claude" May 2026.  Three primitives are load-bearing for this analysis.  First, /bg sends an active session to the background; sessions are listed in Agent View, a CLI dashboard.  Second, /goal sets a completion condition (e.g. "all integration tests pass and citation precision on the validation set is at least 0.95"); a small fast model checks after each turn and Claude takes another turn if the condition is not yet satisfied.  Anthropic explicitly positions /goal for runs spanning hours or days.  Third, the Agent SDK (TypeScript and Python) plus headless mode (claude -p) lets the same loop run without a TTY, inside CI, GitHub Actions, or cron.')]),
  P([bold('Operational shape: '), plain('Local terminal or headless on a server.  Not a cloud sandbox by default — runs against your repo on your machine with your real credentials.  Privileged data stays where it is.')]),
  P([bold('Models: '), plain('Opus 4.7 is the current frontier.  On Anthropic’s internal long-horizon coding evaluation, Opus 4.7 reaches 50% task completion at a ~14.5-hour autonomous horizon and lifts resolution by +13% over Opus 4.6 on a 93-task coding benchmark.  Sonnet 4.6 is the cost-efficient workhorse.')]),
  P([bold('Pricing: '), plain('Pro $20/month, Max $100/month, Max+ $200/month.  As of June 15, 2026, SDK and headless usage is moving to a separate credit pool metered at full API rates.')]),
  P([bold('Trust for Mike v1: '), bold('High, with phase gates.  '), plain('Already in Hugh’s hand; the architecture review already encodes per-phase success criteria that map naturally to /goal; the long-horizon coding benchmark targets exactly the granularity of a phase (Phase B is roughly 1.5–2 weeks of human time, plausibly 6–12 hours of /goal-driven autonomous work per sub-phase with gates between).  No vendor signup, no new IDE, no new sandbox.')]),

  H2('3.2  Devin (Cognition Labs)'),
  P([bold('Vendor: '), plain('Cognition Labs.')]),
  P([bold('Product: '), plain('Cloud-native AI software engineer.  Slack-native task assignment; integrates Sentry, Datadog, Linear, and other observability tools via an MCP marketplace.')]),
  P([bold('Operational shape: '), plain('Cloud sandbox.  Your code is checked out into Cognition-hosted VMs; agent runs there.')]),
  P([bold('Pricing: '), plain('Devin 2.0 cut the entry tier from $500 to $20/month "Core" in April 2025.  Team plan is $500/month.  Usage metered as ACUs (Agent Compute Units, ~15 min compute, ~$2.25 each on Core).')]),
  P([bold('Reliability reports: '), plain('Approximately 67% PR merge rate on well-scoped tasks (migrations, lint, framework upgrades).  Approximately 85% failure rate on ambiguous multi-component tasks without human intervention.  Multiple practitioner reports note Devin "frequently delivers 70% of a feature" — core logic works, edge cases / error handling / integration do not.  A documented "nightmare audit" of a Devin 3.0 codebase shows plausible-looking code calling nonexistent APIs and fabricating configuration.  Degrades sharply above ~500K LoC, but Mike is ~10K LoC so size is not the issue here.')]),
  P([bold('Trust for Mike v1: '), bold('Low for Phases B–E; moderate for Phase F UI polish.  '), plain('Mike v1 is exactly Devin’s failure shape: ambiguous-to-medium requirements, new vendor API integrations, schema migration ordering, and a validation phase where "looks correct" is not "produced verifiable citations."  The "70% of a feature" failure pattern is dangerous in this build because the missing 30% is the citation precision.')]),

  H2('3.3  GitHub Copilot coding agent'),
  P([bold('Vendor: '), plain('GitHub / Microsoft.')]),
  P([bold('Product: '), plain('Generally available on VS Code and JetBrains as of March 2026; Visual Studio in preview.  Pattern: assign a GitHub Issue to Copilot, it spins up an ephemeral GitHub Actions runner, branches, codes, runs tests, opens a draft PR.')]),
  P([bold('Operational shape: '), plain('PR-based, fully cloud (Actions runner sandbox).')]),
  P([bold('Models: '), plain('GPT-5 family, Claude Sonnet 4.6, others (user-selectable in Smart Mode).')]),
  P([bold('Pricing: '), plain('Bundled in Copilot Pro, Pro+, Business, or Enterprise (~$10–$39/user/month).')]),
  P([bold('Trust for Mike v1: '), bold('Moderate for individual issues, low to lead the build.  '), plain('Excellent for "fix this bug," "add this endpoint," "upgrade this dependency" — work that can be issue-ified after architecture is in place.  But the async-PR shape requires that the task graph already exists; it does not lead a multi-week design-coupled build.  Useful as a worker for Phase H (hybrid + rerank A/B switches) or Phase F (UI polish), where issues are well-scoped.')]),

  H2('3.4  OpenAI Codex (the 2025 agent, GPT-5-Codex)'),
  P([bold('Vendor: '), plain('OpenAI.')]),
  P([bold('Product: '), plain('Cloud-native agent in ChatGPT, powered by GPT-5-Codex (GPT-5 specialized for agentic coding).  Pattern matches Devin: clone repo into sandbox, edit across files, run tests, open PR.  Includes "Skills" (team-aligned conventions), parallel worktrees, and a CLI counterpart for terminal-native use.')]),
  P([bold('Operational shape: '), plain('Cloud sandbox (Codex Cloud) plus a local CLI.  Tighter ChatGPT integration than Claude Code; weaker terminal-native ergonomics for ad-hoc poking.')]),
  P([bold('Pricing: '), plain('Included in ChatGPT Plus $20 / Pro $200 / Business / Enterprise as of April 2026 (per-token, no longer per-message).  Pro tier gives 20× Plus limits; promo through May 31, 2026 bumps it to 25×.')]),
  P([bold('Trust for Mike v1: '), bold('Moderate.  '), plain('Competitive with Opus 4.7 on standard benchmarks but underperforms on Anthropic’s long-horizon eval (the dimension that matters for Mike).  The Skills + Cloud combo could work for Phase G validation, but real arbitration data should not enter a cloud sandbox.  If Hugh already uses Claude Code daily, switching cloud agents for one project introduces friction that costs more than it saves.')]),

  H2('3.5  Google Jules'),
  P([bold('Vendor: '), plain('Google Labs.')]),
  P([bold('Product: '), plain('Public beta March 2026.  Gemini 2.5 Pro backend; cloud VM; GitHub-PR workflow.  Successor "Jitro" in development.')]),
  P([bold('Operational shape: '), plain('Cloud VM + GitHub PR.')]),
  P([bold('Pricing: '), plain('Free during beta with usage caps.')]),
  P([bold('Trust for Mike v1: '), bold('Low.  '), plain('Comparable shape to Devin and Codex Cloud; less mature for new-vendor-API integration work.  Same cloud-sandbox privilege concerns.')]),

  H2('3.6  OpenHands (formerly OpenDevin)'),
  P([bold('Vendor: '), plain('All Hands AI (MIT-licensed, ~70K GitHub stars).')]),
  P([bold('Product: '), plain('Self-hostable agent framework.  Scores 53–77% on SWE-bench Verified depending on backing model.  Docker sandboxed.')]),
  P([bold('Operational shape: '), plain('Self-hosted on your own infrastructure.  This is the meaningful differentiator versus Devin / Codex / Jules — privileged data never leaves Hugh’s control.')]),
  P([bold('Pricing: '), plain('Free; you pay the underlying model API costs.')]),
  P([bold('Trust for Mike v1: '), bold('Moderate, with operational weight.  '), plain('Right shape if you want a Devin-style agent on your own infra with privileged data, at the cost of standing it up.  Setup overhead is non-trivial and the agent loop is less polished than Claude Code’s.  A serious option only if Claude Code becomes unavailable or if Hugh decides he wants a second self-hosted lane.')]),

  H2('3.7  Replit Agent 3 / 4'),
  P([bold('Vendor: '), plain('Replit.')]),
  P([bold('Product: '), plain('Up to 200-minute continuous runs (Agent 3); Agent 4 splits tasks into sub-agents.')]),
  P([bold('Operational shape: '), plain('Replit-hosted environment.')]),
  P([bold('Pricing: '), plain('$25/month Replit Core.')]),
  P([bold('Trust for Mike v1: '), bold('Low for this stack.  '), plain('Optimized for the Replit hosting environment; awkward fit for a Railway + Vercel + Cloudflare stack.  Not a serious contender.')]),

  H2('3.8  xAI Grok Build'),
  P([bold('Vendor: '), plain('xAI.')]),
  P([bold('Product: '), plain('Terminal-native CLI with up to 8 parallel sub-agents, MCP-compatible, grok-build-0.1 model.  Launched May 2026.')]),
  P([bold('Operational shape: '), plain('Local terminal CLI.')]),
  P([bold('Pricing: '), plain('Behind SuperGrok / X Premium+ subscriptions ($299/month for SuperGrok Heavy at launch; broader access from May 25, 2026).')]),
  P([bold('Trust for Mike v1: '), bold('Too new.  '), plain('No track record on multi-week TypeScript builds with vendor integrations.  Revisit in three to six months.')]),

  H2('3.9  Sourcegraph Amp (formerly Cody)'),
  P([bold('Vendor: '), plain('Sourcegraph.')]),
  P([bold('Product: '), plain('Enterprise IDE/CLI; Smart Mode supports Opus 4.7; strong on multi-repo context.')]),
  P([bold('Operational shape: '), plain('Enterprise IDE deployment.')]),
  P([bold('Pricing: '), plain('Approximately $59/user/month enterprise.')]),
  P([bold('Trust for Mike v1: '), bold('Overkill.  '), plain('A multi-repo enterprise tool for a single-repo project the size of Mike.  No reason to introduce.')]),

  H2('3.10  Cua (trycua.com)'),
  P([bold('Vendor: '), plain('Cua (Y Combinator).')]),
  P([bold('Product: '), plain('Open-source infrastructure for Computer-Use Agents — sandboxes, SDKs, and benchmarks for controlling full desktops on macOS / Linux / Windows / Android.  Provides an "isolated code execution" mode that can sandbox-wrap Claude Code or Codex CLI, but that is a runtime container, not a coding agent in its own right.')]),
  P([bold('Operational shape: '), plain('Local + sandboxed.')]),
  P([bold('Pricing: '), plain('OSS + paid sandboxes.')]),
  P([bold('Trust for Mike v1: '), bold('Wrong shape.  '), plain('Cua is desktop GUI automation infrastructure, not a coding agent.  The prior verbal take ("wrong shape for this build") is correct.  Its value here would only be sandboxing the OCR validation step if Hugh wanted ephemeral environments for privileged arbitration data — but Railway containers and Docker already cover that.')]),

  H2('3.11  Aider'),
  P([bold('Vendor: '), plain('Open-source community.')]),
  P([bold('Product: '), plain('Free, model-agnostic CLI; single-agent.')]),
  P([bold('Pricing: '), plain('Free; pay the underlying model.')]),
  P([bold('Trust for Mike v1: '), bold('Not viable as build lead.  '), plain('Cannot execute commands — only edits files.  Cannot run npm test, OCR validators, or schema migrations.  Aider is a code-editing tool, not a build-driving agent.')]),

  pageBreak(),

  // ===== Section 4: Per-phase delegation =====
  H1('4.  Per-phase delegation analysis'),
  P('Cross-referencing the phase plan in §2.3 against the capabilities of the agents in §3, here is the realistic delegation profile per phase.'),
  makeTable([800, 2200, 2200, 2200, 1960], [
    new TableRow({ tableHeader: true, children: [
      cellBold('Phase', { width: 800 }),
      cellBold('Delegation profile', { width: 2200 }),
      cellBold('Hugh’s actual involvement', { width: 2200 }),
      cellBold('Failure mode if blindly delegated', { width: 2200 }),
      cellBold('Best agent', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('A', { width: 800 }),
      cell('Cannot fully delegate.  Vendor signups need a human with a credit card and access to Three Crowns billing.  TS scaffolding can be /goal-driven.', { width: 2200 }),
      cell('One half-day of account creation; sign env vars after CC scaffolds the interface.', { width: 2200 }),
      cell('Agent burns a day attempting to create accounts without credentials it does not have.', { width: 2200 }),
      cell('Claude Code locally', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('B', { width: 800 }),
      cell('Mostly delegable, but highest risk.  Document type classifier wrong → cascades into bad chunks → bad embeddings.  Needs an explicit eval gate before letting Claude embed anything.', { width: 2200 }),
      cell('Two gate reviews: classifier eval (50 docs) and chunk schema.', { width: 2200 }),
      cell('Agent ships a classifier that mis-labels witness statements as pleadings; chunking is then wrong everywhere.  Cost ~ a day to detect, rest of week to redo.', { width: 2200 }),
      cell('Claude Code /goal', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('C', { width: 800 }),
      cell('Highly delegable.  Mechanical once B is correct.', { width: 2200 }),
      cell('One gate: confirm cross-project leakage test passes.', { width: 2200 }),
      cell('Idempotent retry logic wrong → partial batches duplicated → Turbopuffer billed extra; surface but not severe.', { width: 2200 }),
      cell('Claude Code /goal', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('D', { width: 800 }),
      cell('Highly delegable given a good test fixture.', { width: 2200 }),
      cell('One gate: 5 hand-crafted queries return sensible chunks.', { width: 2200 }),
      cell('Query rewriter strips needed filters → over-broad retrieval → relevance drops; visible to spot-check.', { width: 2200 }),
      cell('Claude Code /goal', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('E', { width: 800 }),
      cell('Delegable with hard gate.  Misquote risk is structural — citation correctness defines the product.  Anthropic search_result blocks help.', { width: 2200 }),
      cell('Critical gate: 100-quote audit comparing rendered output to source-of-truth chunk text.', { width: 2200 }),
      cell('Offsets line up against wrong chunks → rendered "quote" is wrong text → invisible until tribunal.', { width: 2200 }),
      cell('Claude Code /goal + Hugh audit', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('F', { width: 800 }),
      cell('Delegable with Playwright gates.  More interactive in practice — UI tweaks land faster with a human in the loop.', { width: 2200 }),
      cell('Visual review per UI surface.', { width: 2200 }),
      cell('Click handler wired to wrong (chunk_id, offset) tuple → citation jumps to wrong span; visible on inspection.', { width: 2200 }),
      cell('Claude Code interactive + Copilot agent for issue-scoped polish', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('G', { width: 800 }),
      cell('Cannot delegate.  Hugh selects corpus, drafts queries, judges what "right" looks like.  Real arbitration data must not enter a cloud sandbox.', { width: 2200 }),
      cell('Full week.', { width: 2200 }),
      cell('N/A — not delegable.', { width: 2200 }),
      cell('Hugh + Claude Code local', { width: 1960 }),
    ]}),
  ]),

  H2('4.1  Summary'),
  P('Of the seven phases, three (C, D, F) are highly delegable, two (B, E) are delegable with mandatory gates, one (A) requires partial human involvement for vendor signups, and one (G) is irreducibly Hugh’s.'),
  P('The same conclusion does not hold for cloud-sandbox agents.  Phase G is the dispositive constraint: privileged arbitration data should not enter Devin, Codex Cloud, Jules, or Copilot-coding-agent sandboxes.  This rules out cloud agents as the build lead even if their per-phase capabilities were comparable to Claude Code, which they currently are not.'),

  pageBreak(),

  // ===== Section 5: Cost analysis =====
  H1('5.  Cost analysis'),
  H2('5.1  Service cost ceiling per option (build period only)'),
  P('Estimated agent-service cost above Hugh’s existing baseline, for the full ~6–7 week build window:'),
  makeTable([2400, 3000, 2000, 1960], [
    new TableRow({ tableHeader: true, children: [
      cellBold('Option', { width: 2400 }),
      cellBold('Subscription / metering', { width: 3000 }),
      cellBold('Realistic build-window cost', { width: 2000 }),
      cellBold('Notes', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('Claude Code Max+ + SDK headless', { width: 2400 }),
      cell('$200/month + SDK metered at API rates from 2026-06-15', { width: 3000 }),
      cell('$400–$700 incremental', { width: 2000 }),
      cell('Already in Hugh’s stack; minimal switching cost', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('Devin Core', { width: 2400 }),
      cell('$20/month + $2.25/ACU', { width: 3000 }),
      cell('$300–$800 if used for the whole build', { width: 2000 }),
      cell('Cheap headline; ACU usage compounds on retries', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('Devin Team', { width: 2400 }),
      cell('$500/month', { width: 3000 }),
      cell('$750–$1,500', { width: 2000 }),
      cell('Includes higher ACU caps and Slack workflows', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('OpenAI Codex Cloud (ChatGPT Pro)', { width: 2400 }),
      cell('$200/month, per-token metered', { width: 3000 }),
      cell('$300–$600', { width: 2000 }),
      cell('Costs creep if Skills are wrong', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('GitHub Copilot coding agent', { width: 2400 }),
      cell('Bundled $10–$39/seat/month', { width: 3000 }),
      cell('$10–$80 over the build window', { width: 2000 }),
      cell('Cheapest but not a lead — issue-scoped only', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('Google Jules (beta)', { width: 2400 }),
      cell('Free during beta', { width: 3000 }),
      cell('$0 + model token costs', { width: 2000 }),
      cell('Beta caps; production reliability unproven', { width: 1960 }),
    ]}),
    new TableRow({ children: [
      cell('OpenHands self-hosted', { width: 2400 }),
      cell('Free framework + model API spend', { width: 3000 }),
      cell('$200–$600 model spend; ~1–2 days setup', { width: 2000 }),
      cell('Setup overhead is real cost in calendar time', { width: 1960 }),
    ]}),
  ]),
  P('Service cost is not the binding constraint — every option above is small compared with the per-arbitration OCR validation budget (~$1,000–$1,250).  The binding constraint is the cost of bad autonomous decisions.'),

  H2('5.2  Cost of a bad autonomous decision'),
  P('Five realistic failure modes, with expected dollar and calendar impact if undetected:'),
  makeTable([3000, 2000, 1700, 2660], [
    new TableRow({ tableHeader: true, children: [
      cellBold('Failure mode', { width: 3000 }),
      cellBold('Dollar impact', { width: 2000 }),
      cellBold('Calendar impact', { width: 1700 }),
      cellBold('Mitigation', { width: 2660 }),
    ]}),
    new TableRow({ children: [
      cell('Agent burns a day on the wrong chunking strategy and embeds the corpus before someone notices', { width: 3000 }),
      cell('$5–$20 wasted embeddings; $300–$700 wasted OCR if re-ingestion is needed', { width: 2000 }),
      cell('1–3 days redo', { width: 1700 }),
      cell('Gate B with 50-doc classifier eval before any embedding spend', { width: 2660 }),
    ]}),
    new TableRow({ children: [
      cell('"Ingest everything" /goal run misconfigures Document AI quota and spends $1,000 in an hour', { width: 3000 }),
      cell('Up to $1,000 unnecessary', { width: 2000 }),
      cell('Half a day to detect and unwind', { width: 1700 }),
      cell('Hard spend cap in worker; dry-run mode estimates page count before submitting', { width: 2660 }),
    ]}),
    new TableRow({ children: [
      cell('Citation pipeline ships a regression where offsets align against wrong chunks; misquotes invisible in unit tests', { width: 3000 }),
      cell('Indirect — malpractice / reputational risk', { width: 2000 }),
      cell('Catastrophic if it reaches a tribunal', { width: 1700 }),
      cell('Gate E with 100-quote audit comparing rendered output to source-of-truth chunk text', { width: 2660 }),
    ]}),
    new TableRow({ children: [
      cell('Cloud-sandbox agent uploads exhibit data into vendor VM in violation of privilege', { width: 3000 }),
      cell('Indirect — ethical and contractual exposure', { width: 2000 }),
      cell('Hard to reverse', { width: 1700 }),
      cell('Do not use cloud-sandbox agents for any phase that touches client material', { width: 2660 }),
    ]}),
    new TableRow({ children: [
      cell('Agent fabricates a Turbopuffer / Voyage / Document AI API call that does not exist (documented Devin failure mode)', { width: 3000 }),
      cell('$0–$50 wasted calls', { width: 2000 }),
      cell('Hours to days to detect on integration', { width: 1700 }),
      cell('Pin to known SDK versions; integration test against real vendor sandbox before /goal advances', { width: 2660 }),
    ]}),
  ]),

  H2('5.3  Cost comparison vs.  interactive baseline'),
  P('Interactive baseline: Hugh and Claude Code at the current Max+ subscription, no SDK headless, no additional agent.  Build window calendar: ~6–7 weeks of focused interactive work.  Hugh’s opportunity cost (his time, at a notional senior-rate equivalent) is the dominant cost — call it $X/week for a working senior practitioner.'),
  P('Autonomous-with-gates: Claude Code Max+ + SDK headless, ~$400–$700 incremental service cost over the window.  Hugh’s gated time compresses to ~2.5–3.5 weeks.  Net savings: ~3–4 weeks of Hugh’s practitioner time against ~$400–$700 extra in service spend — favorable by an order of magnitude or two for any realistic valuation of Hugh’s hours.'),
  P('Cloud-sandbox lead (Devin / Codex / Jules): comparable or lower service cost, but introduces (a) re-work probability from "70% of a feature" failure mode, (b) compliance friction from privileged data, and (c) Phase G is still irreducible.  Net savings versus Claude Code with /goal: marginal at best, negative once re-work and compliance are priced in.'),

  pageBreak(),

  // ===== Section 6: Compliance =====
  H1('6.  Compliance and data handling'),
  P('Arbitration records carry privilege and confidentiality constraints that vary by jurisdiction, by client engagement letter, and by institutional rules (ICC, LCIA, SIAC, SCC, ICSID, et al.).  Three concrete constraints inform the agent decision:'),
  number('Client material should not transit a third-party vendor sandbox without an enterprise-grade contractual basis (DPA, BAA-equivalent, zero data retention).  Anthropic’s search_result content blocks are ZDR-eligible; cloud-sandbox coding agents are typically not built around per-document privilege metadata.'),
  number('Even with ZDR and enterprise tier, several jurisdictions and ethical bodies treat the act of placing privileged content into a third-party VM as a notice / consent question that should be addressed with the client, not left to the developer’s sole discretion.  This is a question Hugh should not have to litigate inside a build sprint.'),
  number('Phase G validation requires the corpus to be reachable from the test harness.  Running locally on Hugh’s machine keeps privileged data on Hugh’s infrastructure without negotiation.  Cloud-sandbox agents would require either an enterprise contract that has been pre-cleared with the client, or scrubbing the corpus before upload — both of which destroy the value of validating on real arbitration records.'),
  P('Bottom line: Phase G runs locally.  Phases A–F can run anywhere technically, but switching infrastructure between phases is operational weight without offsetting benefit when Claude Code already runs locally and meets the autonomy requirement.'),

  // ===== Section 7: Risk =====
  H1('7.  Risk profile and gate structure'),
  P('Three hard gates, three soft gates.  Hard gates block progress; soft gates inform without blocking.'),

  H2('7.1  Hard gates'),
  number('Gate B — Classifier eval.  Document type classifier must achieve a target accuracy (e.g., ≥ 0.95 weighted F1) on a held-out 50-document set across all expected document types before any embedding spend.  Reason: B mis-routes cascade through C/D/E and are expensive to detect later.'),
  number('Gate E — 100-quote audit.  Before E ships, 100 randomly sampled "quote" spans are rendered against source-of-truth chunk text and reviewed for exact match.  Reason: misquotes are the structural failure mode; they pass unit tests; they only surface when a tribunal reads the output.'),
  number('Gate G — Real-arbitration validation.  Hugh selects the corpus, drafts 20 representative queries, and reviews verifiable-citation rate, retrieval recall, and latency.  Hard fail criteria: verifiable-citation rate below 0.95 on the validation set, or any misquote.'),

  H2('7.2  Soft gates'),
  number('Gate A — Account access confirmed.  Vendor signups complete; env vars set; smoke test against each external API succeeds.'),
  number('Gate C — Cross-project leakage test.  Two projects’ chunks coexist in Turbopuffer; project-scoped query returns zero chunks from the other project.'),
  number('Gate D — Hand-crafted query smoke test.  Five queries hand-written by Hugh return sensible chunks (not exhaustive validation, just sanity).'),

  H2('7.3  Spend cap and dry-run patterns'),
  P('Two pieces of infrastructure that should be in place before any /goal "ingest" run is authorized:'),
  bullet('Hard spend cap in the ingest worker.  Worker tracks cumulative Document AI page count and aborts with an alert if it crosses a configured ceiling per matter (default: 110% of the dry-run estimate).'),
  bullet('Dry-run mode that estimates page count, OCR cost, embedding cost, and Turbopuffer ingest cost from the matter’s metadata before submitting a single page to Document AI.  Output is human-readable and must be approved before the real run.'),

  pageBreak(),

  // ===== Section 8: Calendar compression =====
  H1('8.  Calendar compression analysis'),
  P('Concrete numbers, expressed as "Hugh’s gated time" — the calendar hours that actually require his attention — under three execution models:'),
  makeTable([2200, 2400, 2400, 2360], [
    new TableRow({ tableHeader: true, children: [
      cellBold('Phase', { width: 2200 }),
      cellBold('Fully interactive (baseline)', { width: 2400 }),
      cellBold('/goal + Hugh on gates (recommended)', { width: 2400 }),
      cellBold('Cloud-sandbox lead (rejected)', { width: 2360 }),
    ]}),
    new TableRow({ children: [
      cell('A.  Foundations', { width: 2200 }),
      cell('2–3 days focused', { width: 2400 }),
      cell('Half a day (accounts + env sign-off)', { width: 2400 }),
      cell('Half a day, plus enterprise procurement friction', { width: 2360 }),
    ]}),
    new TableRow({ children: [
      cell('B.  Ingestion v1', { width: 2200 }),
      cell('1.5–2 weeks focused', { width: 2400 }),
      cell('~1 day (two gate reviews)', { width: 2400 }),
      cell('~1 day reviews + likely re-work cycle (70%-feature failure mode)', { width: 2360 }),
    ]}),
    new TableRow({ children: [
      cell('C.  Embedding + index', { width: 2200 }),
      cell('3–4 days focused', { width: 2400 }),
      cell('Half a day (leakage test gate)', { width: 2400 }),
      cell('Half a day, comparable', { width: 2360 }),
    ]}),
    new TableRow({ children: [
      cell('D.  Retrieval v1', { width: 2200 }),
      cell('4–5 days focused', { width: 2400 }),
      cell('Half a day (smoke test gate)', { width: 2400 }),
      cell('Half a day, comparable', { width: 2360 }),
    ]}),
    new TableRow({ children: [
      cell('E.  Synthesis + citations', { width: 2200 }),
      cell('1 week focused', { width: 2400 }),
      cell('~1.5 days (100-quote audit + offset spot-check)', { width: 2400 }),
      cell('~1.5 days, higher re-work probability', { width: 2360 }),
    ]}),
    new TableRow({ children: [
      cell('F.  UI citations', { width: 2200 }),
      cell('1–1.5 weeks focused', { width: 2400 }),
      cell('~2–3 days visual review', { width: 2400 }),
      cell('~2–3 days; PR async slows wall-clock', { width: 2360 }),
    ]}),
    new TableRow({ children: [
      cell('G.  Real-arbitration validation', { width: 2200 }),
      cell('1 week focused (irreducible)', { width: 2400 }),
      cell('1 week focused (irreducible)', { width: 2400 }),
      cell('1 week focused; cloud sandbox blocked on privilege', { width: 2360 }),
    ]}),
    new TableRow({ children: [
      cellBold('Total Hugh-time', { width: 2200 }),
      cellBold('~6–7 weeks focused', { width: 2400 }),
      cellBold('~2.5–3.5 weeks gated', { width: 2400 }),
      cellBold('~2.5–3.5 weeks gated + re-work overhead', { width: 2360 }),
    ]}),
  ]),
  P('Calendar wall-clock under /goal + Hugh-on-gates is similar to or slightly longer than the interactive baseline (~8–10 calendar weeks elapsed versus ~6–7 weeks focused), because /goal runs are not free in real time.  The compression is in Hugh’s engagement, not in calendar weeks.  For a working practitioner with arbitration matters to handle, this is the relevant axis.'),

  // ===== Section 9: Recommendation =====
  H1('9.  Working recommendation'),
  P('Use Claude Code 2.1 with /goal per phase, headless via the Agent SDK on Opus 4.7.  Do not delegate the build lead to Devin, Codex Cloud, Copilot coding agent, or Jules.  Reserve cloud agents for issue-scoped post-validation work after v1 ships (Copilot agent for Phase H A/B switches; Devin Core for off-critical-path dependency upgrades and test-coverage backfills).'),
  H3('Why'),
  P('Mike v1 is the exact failure-mode shape where cloud coding agents underperform: vendor-API integration where the API surface is unfamiliar; schema migration ordering; citation correctness measured against legal judgment rather than tests; and a privilege-bound validation corpus.  Claude Code’s /goal primitive plus Opus 4.7’s ~14.5-hour autonomous horizon is the only product whose benchmarks explicitly target multi-hour autonomous work on coupled, decision-laden code at the granularity of a Mike phase.  The trust loop is already in Hugh’s hand — no new IDE, no new sandbox, no new vendor.  Compression of Hugh’s gated time from ~6–7 weeks to ~2.5–3.5 weeks is realistic against the gate structure in §7.'),
  H3('What would change this'),
  P('Two contingencies would shift the recommendation:'),
  bullet('Hugh decides that privileged data can leave his infrastructure under an enterprise contract that has been pre-cleared with the client.  This opens cloud-sandbox lead as a real option, though it does not by itself make those agents better than Claude Code on the task shape.'),
  bullet('Claude Code 2.1 experiences a serious regression in long-horizon performance, or Anthropic’s pricing changes materially.  In that case OpenHands self-hosted on Opus 4.7 via the Anthropic API becomes the natural fallback — same model, same autonomy primitives, more setup overhead.'),

  // ===== Section 10: Open questions =====
  H1('10.  Open questions for the deeper research session'),
  P('The downstream session should attempt to resolve or strengthen the following:'),
  number('Real-world long-horizon benchmark comparison.  Anthropic publishes internal long-horizon coding evaluations; OpenAI publishes SWE-bench Verified; Cognition publishes ACU metrics.  These are not directly comparable.  Is there a third-party benchmark that explicitly targets multi-hour autonomous work on coupled multi-component TypeScript with new-vendor-API integration as of May 2026?  If so, where do Claude Code Opus 4.7, Codex GPT-5-Codex, and Devin 3.x rank?'),
  number('Privilege precedent.  Have any bar associations, arbitral institutions, or major firms published guidance specifically on the use of cloud-sandbox coding agents (Devin / Codex Cloud / Jules) when handling privileged client material, as opposed to general AI-tool guidance?  This brief assumes the answer is "treat as you would any third-party VM hosting privileged material," but a published standard would sharpen the recommendation.'),
  number('Hebbia / Harvey / Legora developer-platform parity.  Is any direct-competitor vendor offering an Agent Builder or workflow primitive that an external developer could use to assemble a Mike-equivalent without writing code?  Harvey Agent Builder was announced; what is the actual current state and how much of the v1 phase plan could it replace?'),
  number('Anthropic search_result content block production maturity.  This was GA in 2026 per Anthropic’s public docs.  How are early adopters using it in practice?  Are there known failure modes (rate limits, citation drift, ZDR limits) that would change Phase E’s design?'),
  number('SDK headless metering economics.  Anthropic’s June 15, 2026 billing change moves SDK and headless usage to a separate credit pool metered at full API rates.  What is the realistic token throughput of a Phase B /goal run, and does the $400–$700 service-cost ceiling in §5.1 hold up under closer modeling?'),
  number('Voyage AI / MongoDB roadmap.  Voyage was acquired by MongoDB in February 2025.  Has MongoDB signaled changes to Voyage’s standalone API or rerank pricing that would affect Mike’s C/D phases?  If so, what is the realistic switching cost to Cohere embed-v4 + rerank-4 as a fallback?'),
  number('Document AI Layout Parser v1.6 GA timing.  Currently in preview with Gemini 3 Flash / Pro backends.  When does it GA, and does the table-accuracy improvement obsolete the Reducto escalation tier?'),
  number('OpenHands at production scale.  This brief treats OpenHands as a fallback option only.  Is there practitioner experience driving a Mike-shaped 6-week build via OpenHands self-hosted on Opus 4.7 that would lift it from "fallback" to "co-equal" with Claude Code?'),

  // ===== Appendix =====
  H1('Appendix A.  Sources'),
  P('Each entry below is the page the underlying claim was verified against between 2026-05-24 and 2026-05-28.'),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Anthropic — Enabling Claude Code to work more autonomously', style: 'Hyperlink' })], link: 'https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Claude Code /goal command docs', style: 'Hyperlink' })], link: 'https://code.claude.com/docs/en/goal' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'explainx.ai — Claude Code 2.1 Agent View and /goal', style: 'Hyperlink' })], link: 'https://explainx.ai/blog/anthropic-claude-code-agent-view-goal-command' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'MindStudio — Claude Code Q1 2026 update roundup', style: 'Hyperlink' })], link: 'https://www.mindstudio.ai/blog/claude-code-q1-2026-update-roundup' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Codersera — Anthropic June 15, 2026 billing change', style: 'Hyperlink' })], link: 'https://codersera.com/blog/anthropic-june-2026-billing-change-claude-code/' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Anthropic — Claude Sonnet 4.6', style: 'Hyperlink' })], link: 'https://www.anthropic.com/claude/sonnet' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Qubrid — Sonnet 4.6 vs Opus 4.7', style: 'Hyperlink' })], link: 'https://www.qubrid.com/blog/claude-sonnet-46-vs-claude-opus-47-which-model-wins-for-your-workload' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Devin pricing', style: 'Hyperlink' })], link: 'https://devin.ai/pricing/' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'VentureBeat — Devin 2.0 cuts price to $20/mo', style: 'Hyperlink' })], link: 'https://venturebeat.com/programming-development/devin-2-0-is-here-cognition-slashes-price-of-ai-software-engineer-to-20-per-month-from-500' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Idlen — Devin 2026 review and limitations', style: 'Hyperlink' })], link: 'https://www.idlen.io/blog/devin-ai-engineer-review-limits-2026/' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'DEV.to — I audited a Devin 3.0 codebase', style: 'Hyperlink' })], link: 'https://dev.to/saqibshahdev/i-audited-a-codebase-written-by-devin-30-it-was-a-nightmare-ppb' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'GitHub Copilot coding agent GA', style: 'Hyperlink' })], link: 'https://github.com/orgs/community/discussions/159068' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'GitHub Docs — Copilot cloud agent', style: 'Hyperlink' })], link: 'https://docs.github.com/copilot/concepts/agents/coding-agent/about-coding-agent' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'OpenAI Codex', style: 'Hyperlink' })], link: 'https://openai.com/codex/' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Codex pricing', style: 'Hyperlink' })], link: 'https://chatgpt.com/codex/pricing/' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'The New Stack — Codex vs Claude Code', style: 'Hyperlink' })], link: 'https://thenewstack.io/openai-codex-claude-code/' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Google Jules announcement', style: 'Hyperlink' })], link: 'https://blog.google/innovation-and-ai/models-and-research/google-labs/jules/' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'OpenHands', style: 'Hyperlink' })], link: 'https://www.openhands.dev/' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Replit Agent 3', style: 'Hyperlink' })], link: 'https://blog.replit.com/introducing-agent-3-our-most-autonomous-agent-yet' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'xAI Grok Build / Engadget', style: 'Hyperlink' })], link: 'https://www.engadget.com/2173482/xai-coding-agent-grok-build/' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Sourcegraph Amp practical guide', style: 'Hyperlink' })], link: 'https://medium.com/@focusfaithfirst/sourcegraph-amp-a-practical-guide-for-leaders-who-care-about-speed-safety-and-control-65681f0cf2c6' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'trycua/cua on GitHub', style: 'Hyperlink' })], link: 'https://github.com/trycua/cua' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Aider review (Automation Atlas)', style: 'Hyperlink' })], link: 'https://automationatlas.io/tools/aider' })]),
  bullet([new ExternalHyperlink({ children: [new TextRun({ text: 'Anthropic search_result content block (GA 2026)', style: 'Hyperlink' })], link: 'https://platform.claude.com/docs/en/build-with-claude/search-results' })]),
];

// ---------- document ----------

const doc = new Document({
  creator: 'Generative Legal',
  title: 'Mike — Autonomous Build Feasibility',
  description: 'Research brief: can the Mike v1 vector-retrieval build be delegated to an autonomous coding-agent stack?',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: '1F3864' },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: '2E74B5' },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 23, bold: true, font: FONT, color: '2E74B5' },
        paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: 'Mike — Autonomous Build Feasibility / 2026-05-28', size: 18, color: '7F7F7F' })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Page ', size: 18, color: '7F7F7F' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '7F7F7F' }),
          new TextRun({ text: ' of ', size: 18, color: '7F7F7F' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '7F7F7F' }),
        ],
      })] }),
    },
    children,
  }],
});

const outputPath = path.join('docs', 'cc-runs', '2026-05-28-mike-autonomous-build-feasibility.docx');
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log('Wrote ' + outputPath);
});
