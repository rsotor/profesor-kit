#!/usr/bin/env node
'use strict';
// Capture (`capture` in config/base-kit.json): proposes the rules and corrections the person stated in past
// sessions, into an inbox file the person confirms. Never applies anything.
//   SessionStart (startup|resume)  spawns `capture.js --run` detached (never blocks) and, when the inbox has open
//                                  items, asks the agent to tell the person in one line (at most once a day
//                                  while the count and the oldest item stay the same).
//   --run                          sweeps this project's Claude Code transcripts, newest first: at most
//                                  `maxPerRun` per run, skipping any modified in the last `quietMinutes`.
//                                  First run ever: only the newest `maxPerRun`; the older ones are marked
//                                  backlog (swept only by --backlog). Paused while the inbox is full.
//   --close <transcript|session id> sweeps one transcript now (for a close routine), ignoring the quiet rule.
//   --backlog                      sweeps up to `maxPerRun` backlog transcripts.
//   --done <id>... / --reject <id>... removes items from the inbox once applied / dropped; their quote hash
//                                  goes to a ledger so they are never proposed again.
// Per transcript: an atomic lock (mkdir) and a marker = line offset, written only after the inbox write
// succeeds, so a resumed session sweeps only its new turns. A failed model call is retried on the next runs at
// most `maxFailures` times, then logged and skipped.
// Verification (capture.verify, default on): after the post-filter, the items are batched per destination and a
// cheap model (`capture.verifyModel`, hooks/capture-verify-prompt.md) reads each batch with the destination's
// content (an action/person file: the file; a folder such as patterns/ or findings/: the 12 files with the most
// key-term hits; working-rule items: also the project rules file and the global rules file) plus the 2 best hits
// elsewhere in the knowledge stores. Verdict per item: present (file:line) -> logged, not proposed; conflicts ->
// proposed as a change quoting both; new -> proposed. A failed verification call proposes the items unverified.
// Model: `claude -p --model <model>` with the prompt on stdin; BASE_KIT_CAPTURE_CMD (a shell command reading the
// prompt on stdin, BASE_KIT_CAPTURE_STAGE=extract|verify in its env) replaces both calls (tests).
// State: <project>/.base-kit/state/capture/. Fails open.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { loadConfig, section, projectRoot, stateDir } = require('./lib/config');
const A = require('./lib/actions');
const R = require('./lib/transcript-reduce');

// Markers, lock and log: run state, in .git/base-kit/capture (lib/config.js stateDir), never in .base-kit/ (task 4).
const STATE_DIR = 'capture';
const DEFAULTS = { inbox: 'capture-inbox.md', model: 'sonnet', verify: true, verifyModel: 'haiku', maxPerRun: 5, quietMinutes: 10, maxOpen: 15, staleDays: 14, maxChars: 40000, maxFailures: 2 };
const ORIGINS = ['his-initiative', 'correction-of-claude', 'acceptance-of-claude'];
const KINDS = ['always-rule', 'situational', 'domain', 'person', 'new-action'];
const LOCK_STALE_MS = 30 * 60e3;
const DAY = 864e5;

// ---- config / paths ----
function getCapture(cfg) {
  const c = section(cfg, 'capture');
  if (!c) return null;
  const out = { ...DEFAULTS };
  if (typeof c.inbox === 'string' && c.inbox) out.inbox = c.inbox;
  if (typeof c.model === 'string' && c.model) out.model = c.model;
  if (typeof c.verifyModel === 'string' && c.verifyModel) out.verifyModel = c.verifyModel;
  if (c.verify === false) out.verify = false;
  if (c.auto === false) out.auto = false;
  for (const k of ['maxPerRun', 'quietMinutes', 'maxOpen', 'staleDays', 'maxChars', 'maxFailures']) {
    if (Number.isFinite(c[k]) && c[k] >= 0) out[k] = c[k];
  }
  return out;
}

// Claude Code keeps a project's transcripts in ~/.claude/projects/<root with every non-alphanumeric as '-'>.
const projectSlug = root => root.replace(/[^a-zA-Z0-9]/g, '-');
function transcriptsDir(root, env) {
  return env.BASE_KIT_TRANSCRIPTS_DIR || path.join(os.homedir(), '.claude', 'projects', projectSlug(root));
}

function context(baseKitDir, env = process.env, now = Date.now()) {
  const cfg = loadConfig(baseKitDir);
  const cap = getCapture(cfg);
  if (!cap) return null;
  const root = projectRoot(cfg, env);
  const state = path.join(stateDir(baseKitDir), STATE_DIR);
  return { cfg, cap, root, env, now, state, baseKitDir, inbox: A.resolveIn(root, cap.inbox), dir: transcriptsDir(root, env) };
}

function log(ctx, msg) {
  try { fs.mkdirSync(ctx.state, { recursive: true }); fs.appendFileSync(path.join(ctx.state, 'log'), `${new Date(ctx.now).toISOString()} ${msg}\n`); } catch { /* best effort */ }
}

// ---- locks (mkdir is atomic) ----
function lock(dir) {
  try { fs.mkdirSync(path.dirname(dir), { recursive: true }); fs.mkdirSync(dir); return true; } catch { /* taken */ }
  try {
    if (Date.now() - fs.statSync(dir).mtimeMs > LOCK_STALE_MS) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir); return true; }
  } catch { /* lost the race */ }
  return false;
}
const unlock = dir => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* gone */ } };
function withLock(dir, fn, waitMs = 5000) {
  const until = Date.now() + waitMs;
  while (!lock(dir)) {
    if (Date.now() > until) throw new Error(`lock busy: ${path.basename(dir)}`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
  }
  try { return fn(); } finally { unlock(dir); }
}

// ---- markers ----
const markerPath = (ctx, id) => path.join(ctx.state, 'markers', `${id}.json`);
function readMarker(ctx, id) {
  try { return JSON.parse(fs.readFileSync(markerPath(ctx, id), 'utf8')); } catch { return null; }
}
function writeMarker(ctx, id, m) {
  const f = markerPath(ctx, id);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + '.tmp', JSON.stringify(m) + '\n');
  fs.renameSync(f + '.tmp', f);
}

function listTranscripts(dir) {
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => n.endsWith('.jsonl')); } catch { return []; }
  return names.map(n => {
    const file = path.join(dir, n);
    try { const st = fs.statSync(file); return { id: n.slice(0, -6), file, mtime: st.mtimeMs, size: st.size }; } catch { return null; }
  }).filter(Boolean).sort((a, b) => b.mtime - a.mtime);
}

// ---- ledgers (quote hashes never proposed again) ----
const norm = s => String(s).normalize('NFC').replace(/[\s ]+/g, ' ').trim().toLowerCase();
const quoteHash = q => crypto.createHash('sha256').update(norm(q)).digest('hex').slice(0, 12);
const ledgerPath = (ctx, name) => path.join(ctx.state, name);
function readLedger(ctx, name) {
  try { return new Set(fs.readFileSync(ledgerPath(ctx, name), 'utf8').split('\n').map(s => s.trim()).filter(Boolean)); } catch { return new Set(); }
}
function appendLedger(ctx, name, ids) {
  if (!ids.length) return;
  fs.mkdirSync(ctx.state, { recursive: true });
  fs.appendFileSync(ledgerPath(ctx, name), ids.join('\n') + '\n');
}

// ---- inbox ----
const HEADER = `# Capture inbox

Rules and corrections the person stated in past sessions, proposed by base-kit capture
(\`.base-kit/hooks/capture.js\`). Nothing here is applied until the person says so; one OK for the batch is enough.

How to apply (the agent, in session):
1. Show the open items in one block: quote, destination, proposal. The person answers apply / drop per item.
2. Apply: write the proposal into its destination. An action file stays within its word cap (condensing goes
   through the usual blind diff); a how-to entry declares its scope; "new action <x>?" is proposed as a config
   entry + file first. Then run \`node .base-kit/hooks/capture.js --done <id>...\`.
3. Drop: \`node .base-kit/hooks/capture.js --reject <id>...\` (removed here and never proposed again).
4. "conflicts with: <file:line>": the proposal changes that existing rule; applying it replaces the old text.
5. "maybe already present: <file:line>" (unverified items only): read that line first; if it already says it,
   drop the item.
`;

// -> { open: [block], stale: [block] }; a block is the raw text from its `### ` line to the next heading.
function parseInbox(text) {
  const out = { open: [], stale: [] };
  let where = null;
  let cur = null;
  const flush = () => { if (cur && where) out[where].push(cur.join('\n').trimEnd()); cur = null; };
  for (const line of String(text || '').split('\n')) {
    if (/^## /.test(line)) { flush(); where = /^## stale/i.test(line) ? 'stale' : /^## open/i.test(line) ? 'open' : null; continue; }
    if (/^### /.test(line)) { flush(); cur = [line]; continue; }
    if (cur) cur.push(line);
  }
  flush();
  return out;
}
const blockId = b => { const m = b.match(/^- id: `?([0-9a-f]{6,})`?/m); return m ? m[1] : null; };
const blockDate = b => { const m = b.match(/^- date: (\d{4}-\d{2}-\d{2})/m); return m ? Date.parse(m[1] + 'T00:00:00Z') : NaN; };

function renderInbox({ open, stale }) {
  return `${HEADER}\n## Open\n\n${open.map(b => b + '\n').join('\n')}${open.length ? '\n' : ''}## Stale\n\n${stale.map(b => b + '\n').join('\n')}`.trimEnd() + '\n';
}

// Ages out items older than staleDays; over maxOpen, the oldest open items move to stale (nothing is lost).
function normalize(inbox, cap, now) {
  const open = [];
  const stale = [...inbox.stale];
  for (const b of inbox.open) (now - blockDate(b) > cap.staleDays * DAY ? stale : open).push(b);
  open.sort((a, b) => (blockDate(a) || 0) - (blockDate(b) || 0));
  while (open.length > cap.maxOpen) stale.push(open.shift());
  return { open, stale };
}

function readInbox(ctx) {
  try { return parseInbox(fs.readFileSync(ctx.inbox, 'utf8')); } catch { return { open: [], stale: [] }; }
}
function writeInbox(ctx, inbox) {
  fs.mkdirSync(path.dirname(ctx.inbox), { recursive: true });
  fs.writeFileSync(ctx.inbox + '.tmp', renderInbox(inbox));
  fs.renameSync(ctx.inbox + '.tmp', ctx.inbox);
}
const inboxLock = ctx => path.join(ctx.state, 'locks', '.inbox');

function renderItem(it) {
  return [
    `### ${it.verdict === 'conflicts' ? 'Change: ' : ''}${it.proposal}`,
    `- id: \`${it.id}\``,
    `- quote: "${it.quote.replace(/\s+/g, ' ')}"`,
    `- origin: ${it.origin}`,
    `- kind: ${it.kind}`,
    `- destination: ${it.destination}`,
    `- session: ${it.session}`,
    `- date: ${it.date}`,
    ...(it.verdict === 'conflicts' ? [`- conflicts with: ${it.at} — "${String(it.existing || '').replace(/\s+/g, ' ').trim()}"`] : []),
    ...(it.verdict === 'new' ? ['- verified: new (not found in the destination)'] : []),
    ...(it.verdict === 'unverified' && it.maybe ? [`- maybe already present: ${it.maybe}`] : []),
  ].join('\n');
}

// Adds items under the inbox lock. -> number added.
function addToInbox(ctx, items) {
  return withLock(inboxLock(ctx), () => {
    const inbox = readInbox(ctx);
    const have = new Set([...inbox.open, ...inbox.stale].map(blockId));
    const fresh = items.filter(it => !have.has(it.id));
    if (!fresh.length && fs.existsSync(ctx.inbox)) return 0;
    inbox.open.push(...fresh.map(renderItem));
    writeInbox(ctx, normalize(inbox, ctx.cap, ctx.now));
    return fresh.length;
  });
}

// --done / --reject: removes the blocks and records their ids in the ledger. -> ids removed.
function resolveItems(ctx, ids, ledger) {
  return withLock(inboxLock(ctx), () => {
    const inbox = readInbox(ctx);
    const want = new Set(ids.map(s => s.replace(/`/g, '')));
    const gone = [];
    const keep = b => { const id = blockId(b); if (id && want.has(id)) { gone.push(id); return false; } return true; };
    const next = { open: inbox.open.filter(keep), stale: inbox.stale.filter(keep) };
    appendLedger(ctx, ledger, gone);
    if (gone.length) writeInbox(ctx, next);
    return gone;
  });
}

// ---- destinations ----
// -> [{ path, kind, label }] from knowledge.* and knowledge.actions.
// rulesFile: the project's rules file the kit installed into (installed.json), when known.
function destinations(cfg, rulesFile) {
  const k = section(cfg, 'knowledge') || {};
  const out = [];
  const actions = A.getActions(cfg) || {};
  for (const [name, a] of Object.entries(actions)) {
    if (name === A.COMMON) continue;
    out.push({ path: a.file, kind: 'always-rule', label: `always-rule for the action "${name}": read every time the assistant does "${name}" (e.g. how a ${name} is written, split or published). Put a rule here when it is about doing that action.` });
  }
  if (actions[A.COMMON]) out.push({ path: actions[A.COMMON].file, kind: 'always-rule', label: 'always-rule for EVERY action (writing and publishing rules shared by all of the actions above). Only when the rule is not about one action.' });
  if (typeof k.howTo === 'string') out.push({ path: k.howTo, kind: 'situational', label: 'situational process rule, "when X happens, do Y": read only when that situation comes up (a kind of change, a step of a process, a risk to check). Most rules about how to carry out work (not about writing an artifact) go here.' });
  if (typeof k.domain === 'string') out.push({ path: k.domain, kind: 'domain', label: 'a fact about the domain, product or APIs (true regardless of what the assistant does).' });
  if (typeof k.person === 'string') out.push({ path: k.person, kind: 'person', label: 'who the person is and what they want from the assistant in this project: role, goals, preferences, what frustrates them.' });
  if (rulesFile) out.push({ path: rulesFile, kind: 'always-rule', label: 'the project\'s working rules, loaded every session: how the assistant must work here in general (process, tooling, the kit itself). Only for a rule that applies to all work, not to one action or situation.' });
  return out;
}
function destinationsText(list) {
  const lines = list.map(d => `- \`${d.path}\` (${d.kind}) — ${d.label}`);
  lines.push('- `new action <name>?` (new-action) — an always-rule for a recurring action that has no file above.');
  return lines.join('\n');
}
// In local mode the kit's rules file (and bridge) are kept out of git: a rule written there is lost to the project
// (issue #2, 2026-10-08). There the project's own AGENTS.md / CLAUDE.md is the destination, when it has one.
function rulesFileOf(ctx) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(ctx.baseKitDir, 'installed.json'), 'utf8'));
    if (m.mode !== 'local') return typeof m.rulesFile === 'string' && m.rulesFile ? m.rulesFile : null;
    const kit = [m.rulesFile, m.bridgeFile].filter(Boolean);
    return ['AGENTS.md', 'CLAUDE.md'].find(f => !kit.includes(f) && fs.existsSync(path.join(ctx.root, f))) || null;
  } catch { return null; }
}

// ---- duplicate hint: cheap key-term grep against the destination ----
const STOP = new Set(['about', 'after', 'always', 'before', 'being', 'cuando', 'desde', 'donde', 'entre', 'every', 'never', 'nunca', 'other', 'otros', 'para', 'pero', 'porque', 'should', 'siempre', 'sobre', 'their', 'there', 'these', 'thing', 'todos', 'which', 'while', 'with', 'would', 'write', 'tiene', 'tenemos', 'hacer', 'person', 'rule', 'rules', 'into', 'from', 'that', 'this', 'when']);
function keyTerms(text) {
  const words = norm(text).normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9][a-z0-9_-]{4,}/g) || [];
  return [...new Set(words.filter(w => !STOP.has(w)))];
}
function filesUnder(abs, limit = 500) {
  let st;
  try { st = fs.statSync(abs); } catch { return []; }
  if (st.isFile()) return [abs];
  const out = [];
  (function walk(d) {
    let es = [];
    try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      if (out.length >= limit || e.name.startsWith('.')) continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.(md|json|txt)$/.test(e.name)) out.push(f);
    }
  })(abs);
  return out;
}
function maybePresent(root, destination, text) {
  if (typeof destination !== 'string' || /^new action/i.test(destination)) return null;
  const terms = keyTerms(text);
  if (terms.length < 3) return null;
  const need = Math.max(3, Math.ceil(terms.length * 0.4));
  let best = null;
  for (const f of filesUnder(A.resolveIn(root, destination))) {
    let lines;
    try { lines = fs.readFileSync(f, 'utf8').split('\n'); } catch { continue; }
    lines.forEach((l, i) => {
      const ln = norm(l).normalize('NFD').replace(/[̀-ͯ]/g, '');
      const hits = terms.filter(t => ln.includes(t)).length;
      if (hits >= need && (!best || hits > best.hits)) best = { hits, at: `${path.relative(root, f).split(path.sep).join('/')}:${i + 1}` };
    });
  }
  return best ? best.at : null;
}

// ---- model ----
function buildPrompt(ctx, session, turns) {
  const tpl = fs.readFileSync(path.join(__dirname, 'capture-prompt.md'), 'utf8');
  return tpl.replace('{{DESTINATIONS}}', destinationsText(destinations(ctx.cfg, rulesFileOf(ctx)))).replace('{{SESSION}}', session).replace('{{TURNS}}', R.render(turns));
}
function callModel(ctx, prompt, { model = ctx.cap.model, stage = 'extract' } = {}) {
  const env = { ...ctx.env, BASE_KIT_CAPTURE_CHILD: '1', BASE_KIT_CAPTURE_STAGE: stage };
  const opts = { input: prompt, encoding: 'utf8', timeout: 5 * 60e3, maxBuffer: 8 * 1024 * 1024 };
  let r;
  if (ctx.env.BASE_KIT_CAPTURE_CMD) {
    r = spawnSync('/bin/sh', ['-c', ctx.env.BASE_KIT_CAPTURE_CMD], { ...opts, env });
  } else {
    delete env.CLAUDE_PROJECT_DIR;
    // Run outside the project: no project hooks (no recursion), no project transcript; nothing is persisted.
    r = spawnSync('claude', ['-p', '--model', model, '--no-session-persistence', '--strict-mcp-config', '--tools', ''], { ...opts, env, cwd: os.tmpdir() });
  }
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`model call exited ${r.status}: ${String(r.stderr || '').replace(/\s+/g, ' ').trim().slice(0, 300)}`);
  return String(r.stdout || '');
}
function parseItems(out) {
  const s = out.indexOf('[');
  const e = out.lastIndexOf(']');
  if (s < 0 || e < s) throw new Error('model output has no JSON array');
  const a = JSON.parse(out.slice(s, e + 1));
  if (!Array.isArray(a)) throw new Error('model output is not an array');
  return a;
}

// Post-filter: shape, origin (acceptance dropped), the quote must be the person's verbatim words, dedupe against
// the inbox and both ledgers, plus a "maybe already present" hint. -> items ready for the inbox.
function filterItems(ctx, raw, { turns, session, known }) {
  const said = turns.map(t => norm(t.text));
  const seen = new Set(known);
  const date = new Date(ctx.now).toISOString().slice(0, 10);
  const out = [];
  for (const it of raw) {
    if (!it || typeof it !== 'object') continue;
    const quote = typeof it.quote === 'string' ? it.quote.trim().replace(/^["“«']+|["”»']+$/g, '') : '';
    const proposal = typeof it.proposal === 'string' ? it.proposal.replace(/\s+/g, ' ').trim() : '';
    if (!quote || !proposal || typeof it.destination !== 'string' || !it.destination.trim()) continue;
    if (!ORIGINS.includes(it.origin) || it.origin === 'acceptance-of-claude') continue;
    const nq = norm(quote).replace(/…$|\.\.\.$/, '').trim();
    if (!said.some(s => s.includes(nq))) continue; // not the person's words (paraphrase or the assistant's)
    const id = quoteHash(quote);
    if (seen.has(id)) continue;
    seen.add(id);
    const kind = KINDS.includes(it.kind) ? it.kind : 'situational';
    out.push({ id, quote, proposal, origin: it.origin, kind, destination: it.destination.trim(), session, date, maybe: maybePresent(ctx.root, it.destination.trim(), `${proposal} ${quote}`) });
  }
  return out;
}

// ---- verification pass ----
const VERIFY_FILE_CHARS = 14000;   // one file shown to the verifier, cut beyond this
const VERIFY_TOTAL_CHARS = 70000;  // all files of one batch
const DIR_HITS = 12;               // a folder destination: its best files by key-term hits (5 missed an existing pattern in the eval)
const ELSEWHERE_HITS = 2;          // best hits in the other knowledge stores (a misrouted item may be present there)

const relPath = (root, f) => path.relative(root, f).split(path.sep).join('/');
function globalRulesFile(ctx) {
  if (ctx.env.BASE_KIT_GLOBAL_RULES !== undefined) return ctx.env.BASE_KIT_GLOBAL_RULES || null;
  return path.join(os.homedir(), '.claude', 'CLAUDE.md');
}
// Every file or folder in the knowledge stores.
function knowledgeRoots(ctx) {
  const k = section(ctx.cfg, 'knowledge') || {};
  const out = [];
  for (const key of ['person', 'voice', 'howTo', 'domain']) if (typeof k[key] === 'string') out.push(k[key]);
  for (const a of Object.values(A.getActions(ctx.cfg) || {})) if (a && a.file) out.push(a.file);
  const rf = rulesFileOf(ctx);
  if (rf) out.push(rf);
  return [...new Set(out)];
}
// Files under `roots`, ranked by how many of `terms` they contain (whole-file count). -> [{ file, hits }]
function rankFiles(ctx, roots, terms) {
  const seen = new Set();
  const out = [];
  for (const r of roots) {
    for (const f of filesUnder(A.resolveIn(ctx.root, r))) {
      if (seen.has(f)) continue;
      seen.add(f);
      let t;
      try { t = norm(fs.readFileSync(f, 'utf8')).normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch { continue; }
      const name = path.basename(f).toLowerCase();
      const hits = terms.filter(w => t.includes(w)).length + terms.filter(w => name.includes(w)).length;
      if (hits) out.push({ file: f, hits });
    }
  }
  return out.sort((a, b) => b.hits - a.hits);
}
const isWorkingRule = (ctx, it) => ['situational', 'person'].includes(it.kind)
  || (A.getActions(ctx.cfg) || {})[A.COMMON]?.file === it.destination || it.destination === rulesFileOf(ctx);
// The files the verifier reads for one destination batch. -> [absolute path]
function verifyFiles(ctx, destination, items) {
  const terms = keyTerms(items.map(it => `${it.proposal} ${it.quote}`).join(' '));
  const files = [];
  const add = f => { if (f && !files.includes(f) && fs.existsSync(f) && fs.statSync(f).isFile()) files.push(f); };
  if (!/^new action/i.test(destination)) {
    const abs = A.resolveIn(ctx.root, destination);
    let st = null;
    try { st = fs.statSync(abs); } catch { /* missing destination: only the hits elsewhere */ }
    if (st && st.isFile()) add(abs);
    else if (st && st.isDirectory()) rankFiles(ctx, [destination], terms).slice(0, DIR_HITS).forEach(h => add(h.file));
  }
  if (items.some(it => isWorkingRule(ctx, it))) {
    const rf = rulesFileOf(ctx);
    if (rf) add(A.resolveIn(ctx.root, rf));
    add(globalRulesFile(ctx));
  }
  const need = Math.max(3, Math.ceil(terms.length * 0.25));
  rankFiles(ctx, knowledgeRoots(ctx), terms).filter(h => h.hits >= need && !files.includes(h.file)).slice(0, ELSEWHERE_HITS).forEach(h => add(h.file));
  return files;
}
const showPath = (ctx, f) => (f.startsWith(ctx.root + path.sep) ? relPath(ctx.root, f) : f.replace(os.homedir(), '~'));
function renderFiles(ctx, files) {
  let used = 0;
  const parts = [];
  for (const f of files) {
    let lines;
    try { lines = fs.readFileSync(f, 'utf8').split('\n'); } catch { continue; }
    let body = lines.map((l, i) => `${i + 1}: ${l}`).join('\n');
    if (body.length > VERIFY_FILE_CHARS) body = body.slice(0, VERIFY_FILE_CHARS) + '\n[… file cut]';
    if (used + body.length > VERIFY_TOTAL_CHARS) break;
    used += body.length;
    parts.push(`=== FILE ${showPath(ctx, f)} ===\n${body}`);
  }
  return parts.join('\n\n');
}
function buildVerifyPrompt(ctx, items, files) {
  const tpl = fs.readFileSync(path.join(__dirname, 'capture-verify-prompt.md'), 'utf8');
  const list = items.map((it, i) => `### Item ${i + 1}\n- destination: ${it.destination}\n- quote: "${it.quote.replace(/\s+/g, ' ')}"\n- proposal: ${it.proposal}`).join('\n\n');
  return tpl.replace('{{ITEMS}}', list).replace('{{FILES}}', renderFiles(ctx, files) || '(no file: the destination does not exist yet)');
}
// "path:line" -> valid only if the path is one of the files shown and the line exists.
function checkAt(ctx, files, at, existing) {
  const shown = new Map(files.map(f => [showPath(ctx, f), f]));
  const m = typeof at === 'string' && at.trim().match(/^`?(.+?):(\d+)(?:-\d+)?`?$/);
  if (m && shown.has(m[1])) {
    try { const n = fs.readFileSync(shown.get(m[1]), 'utf8').split('\n').length; if (+m[2] >= 1 && +m[2] <= n) return `${m[1]}:${m[2]}`; } catch { /* unreadable */ }
  }
  // fall back to finding the quoted existing text
  const want = norm(String(existing || '')).slice(0, 60);
  if (want.length >= 15) {
    for (const [rel, f] of shown) {
      const i = fs.readFileSync(f, 'utf8').split('\n').findIndex(l => norm(l).includes(want));
      if (i >= 0) return `${rel}:${i + 1}`;
    }
  }
  return null;
}
// -> { keep: [item with verdict], present: [item with at] }. Never throws: a failed call keeps items unverified.
function verifyItems(ctx, items) {
  const keep = [];
  const present = [];
  if (!ctx.cap.verify || !items.length) return { keep: items.map(it => ({ ...it, verdict: 'unverified' })), present };
  const groups = new Map();
  for (const it of items) { if (!groups.has(it.destination)) groups.set(it.destination, []); groups.get(it.destination).push(it); }
  for (const [dest, group] of groups) {
    let verdicts = [];
    const files = verifyFiles(ctx, dest, group);
    try {
      verdicts = parseItems(callModel(ctx, buildVerifyPrompt(ctx, group, files), { model: ctx.cap.verifyModel, stage: 'verify' }));
    } catch (e) { log(ctx, `verify ${dest}: failed (${e.message}); ${group.length} item(s) kept unverified`); }
    group.forEach((it, i) => {
      const v = verdicts.find(x => x && Number(x.item) === i + 1);
      const verdict = v && ['present', 'conflicts', 'new'].includes(v.verdict) ? v.verdict : null;
      const at = verdict && verdict !== 'new' ? checkAt(ctx, files, v.at, v.existing) : null;
      const why = v && typeof v.why === 'string' ? v.why.slice(0, 200) : undefined;
      if (verdict === 'present' && at) present.push({ ...it, verdict, at, why });
      else if (verdict === 'conflicts' && at) keep.push({ ...it, verdict, at, why, existing: String(v.existing || '').slice(0, 400) });
      else if (verdict) keep.push({ ...it, verdict: 'new', why }); // present/conflicts without a real line: proposed
      else keep.push({ ...it, verdict: 'unverified' });
    });
  }
  for (const it of present) log(ctx, `present (not proposed): "${it.quote.slice(0, 80)}" at ${it.at}`);
  return { keep, present };
}

function knownIds(ctx) {
  const inbox = readInbox(ctx);
  return new Set([...[...inbox.open, ...inbox.stale].map(blockId).filter(Boolean), ...readLedger(ctx, 'rejected'), ...readLedger(ctx, 'applied')]);
}

// ---- one transcript ----
// -> { status: 'done'|'locked'|'failed'|'gave-up', added, turns }
function sweepOne(ctx, t) {
  const lk = path.join(ctx.state, 'locks', t.id);
  if (!lock(lk)) return { status: 'locked', added: 0, turns: 0 };
  const marker = readMarker(ctx, t.id) || { line: 0, size: 0, failures: 0, status: 'ok' };
  let lines = [];
  try {
    lines = R.readLines(t.file);
    const from = marker.line || 0;
    let { turns } = R.reduceLines(lines, from);
    if (from === 0 && R.isHeadless(turns)) turns = [];
    // Token cap: whole turns up to maxChars; the rest waits for the next run (the marker stops before it).
    const chunk = [];
    let used = 0;
    for (const tr of turns) {
      const n = R.render([tr]).length + 2;
      if (chunk.length && used + n > ctx.cap.maxChars) break;
      chunk.push(tr);
      used += n;
    }
    const complete = chunk.length === turns.length;
    const nextLine = complete ? lines.length : turns[chunk.length].line;
    let added = 0;
    if (chunk.length) {
      const session = `${t.id.slice(0, 8)} (line ${chunk[0].line + 1})`;
      const raw = parseItems(callModel(ctx, buildPrompt(ctx, t.id.slice(0, 8), chunk)));
      const items = filterItems(ctx, raw, { turns: chunk, session, known: knownIds(ctx) });
      const { keep, present } = verifyItems(ctx, items);
      if (keep.length) added = addToInbox(ctx, keep);
      log(ctx, `${t.id}: ${chunk.length} turn(s) read, ${raw.length} proposed by the model, ${items.length} kept by the filter, ${present.length} already present, ${added} added`);
    }
    writeMarker(ctx, t.id, { line: nextLine, size: complete ? t.size : 0, failures: 0, status: 'ok' });
    return { status: 'done', added, turns: chunk.length };
  } catch (e) {
    const failures = (marker.failures || 0) + 1;
    if (failures > ctx.cap.maxFailures) {
      log(ctx, `${t.id}: gave up after ${failures} failed attempts (${e.message}); skipped up to line ${lines.length}`);
      writeMarker(ctx, t.id, { line: lines.length || marker.line || 0, size: t.size, failures: 0, status: 'failed' });
      return { status: 'gave-up', added: 0, turns: 0 };
    }
    log(ctx, `${t.id}: attempt ${failures} failed (${e.message}); retried on a later run`);
    writeMarker(ctx, t.id, { ...marker, failures });
    return { status: 'failed', added: 0, turns: 0, error: e.message };
  } finally { unlock(lk); }
}

const openCount = ctx => readInbox(ctx).open.length;

// --run / --backlog. -> [{ id, status, added }]
function run(ctx, { backlog = false } = {}) {
  if (ctx.env.BASE_KIT_CAPTURE_CHILD) return [];
  const runLock = path.join(ctx.state, 'locks', '.run');
  if (!lock(runLock)) return [];
  try {
    const list = listTranscripts(ctx.dir);
    const init = path.join(ctx.state, '.initialized');
    if (!fs.existsSync(init)) {
      for (const t of list.slice(ctx.cap.maxPerRun)) if (!readMarker(ctx, t.id)) writeMarker(ctx, t.id, { line: 0, size: 0, failures: 0, status: 'backlog' });
      fs.mkdirSync(ctx.state, { recursive: true });
      fs.writeFileSync(init, new Date(ctx.now).toISOString() + '\n');
    }
    const results = [];
    let calls = 0; // transcripts that cost a model call (or failed one); empty ones are only marked
    for (const t of list) {
      if (calls >= ctx.cap.maxPerRun) break;
      if (openCount(ctx) >= ctx.cap.maxOpen) { log(ctx, `inbox full (${ctx.cap.maxOpen} open): sweep paused`); break; }
      const m = readMarker(ctx, t.id);
      if (backlog ? !(m && m.status === 'backlog') : (m && m.status === 'backlog')) continue;
      if (m && m.status !== 'backlog' && m.size === t.size) continue; // nothing new
      if (!backlog && ctx.now - t.mtime < ctx.cap.quietMinutes * 60e3) continue; // still being written
      const r = { id: t.id, ...sweepOne(ctx, t) };
      if (r.turns > 0 || r.status === 'failed' || r.status === 'gave-up') calls++;
      results.push(r);
    }
    return results;
  } finally { unlock(runLock); }
}

// --close: one transcript now (path, or session id in this project's transcript folder).
function close(ctx, arg) {
  const file = arg && fs.existsSync(arg) ? path.resolve(arg) : path.join(ctx.dir, `${String(arg || '').replace(/\.jsonl$/, '')}.jsonl`);
  const st = fs.statSync(file);
  return sweepOne(ctx, { id: path.basename(file, '.jsonl'), file, mtime: st.mtimeMs, size: st.size });
}

// ---- SessionStart notice ----
const NOTICE = '.last-notice';
function notice(ctx) {
  const inbox = readInbox(ctx);
  const n = inbox.open.length;
  if (!n) return null;
  const oldest = Math.min(...inbox.open.map(blockDate).filter(Number.isFinite));
  const days = Number.isFinite(oldest) ? Math.floor((ctx.now - oldest) / DAY) : null;
  const sig = `${n}|${oldest}|${inbox.stale.length}`;
  const f = path.join(ctx.state, NOTICE);
  try {
    const [old, at] = fs.readFileSync(f, 'utf8').split('\n');
    if (old === sig && ctx.now - Number(at) < DAY) return null;
  } catch { /* first notice */ }
  try { fs.mkdirSync(ctx.state, { recursive: true }); fs.writeFileSync(f, `${sig}\n${ctx.now}\n`); } catch { /* best effort */ }
  const age = days === null ? 'unknown age' : days <= 0 ? 'from today' : `${days} day${days === 1 ? '' : 's'} old`;
  const rel = path.relative(ctx.root, ctx.inbox).split(path.sep).join('/') || ctx.cap.inbox;
  const extra = [n >= ctx.cap.maxOpen ? 'inbox full, capture paused' : '', inbox.stale.length ? `${inbox.stale.length} stale` : ''].filter(Boolean).join(', ');
  return `Tell the person in one line: ${n} correction${n === 1 ? '' : 's'} waiting in ${rel} (oldest ${age}${extra ? `; ${extra}` : ''}). On their go-ahead, follow the procedure at the top of that file.`;
}

// SessionStart: spawn the sweep in the background, return the notice (or null).
function handleSessionStart(input, baseKitDir, env = process.env, spawnFn = spawnSweep) {
  if (!input || input.hook_event_name !== 'SessionStart' || !['startup', 'resume'].includes(input.source)) return null;
  if (env.BASE_KIT_CAPTURE_CHILD) return null;
  const ctx = context(baseKitDir, env);
  if (!ctx) return null;
  // `capture.auto: false` → no background sweep at session start (manual `--close` / `--run` still work).
  if (!(ctx.cap && ctx.cap.auto === false)) {
    try { spawnFn(ctx); } catch (e) { log(ctx, `spawn failed: ${e.message}`); }
  }
  return notice(ctx);
}
function spawnSweep(ctx) {
  const child = spawn(process.execPath, [__filename, '--run'], { detached: true, stdio: 'ignore', cwd: ctx.root, env: { ...ctx.env, CLAUDE_PROJECT_DIR: ctx.root } });
  child.unref();
}

function main() {
  const baseKitDir = path.join(__dirname, '..');
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (cmd && cmd.startsWith('--')) {
    try {
      const ctx = context(baseKitDir);
      if (!ctx) { if (cmd !== '--run') console.log('capture: not configured (no `capture` section in config/base-kit.json).'); return; }
      if (cmd === '--run' || cmd === '--backlog') {
        const r = run(ctx, { backlog: cmd === '--backlog' });
        if (cmd === '--backlog') console.log(`capture: ${r.length} backlog transcript(s) swept, ${r.reduce((s, x) => s + x.added, 0)} item(s) added to ${ctx.cap.inbox}.`);
      } else if (cmd === '--close') {
        const r = close(ctx, argv[1]);
        console.log(`capture: ${r.status}; ${r.turns} turn(s) read, ${r.added} item(s) added to ${ctx.cap.inbox}.${r.error ? ` Error: ${r.error}` : ''}`);
      } else if (cmd === '--done' || cmd === '--reject') {
        const gone = resolveItems(ctx, argv.slice(1), cmd === '--done' ? 'applied' : 'rejected');
        console.log(`capture: removed ${gone.length} item(s) from ${ctx.cap.inbox}${gone.length < argv.length - 1 ? ' (some ids were not found)' : ''}.`);
      } else console.log('usage: capture.js --run | --backlog | --close <transcript|session id> | --done <id>... | --reject <id>...');
    } catch (e) { console.error(`capture: ${e.message}`); process.exitCode = 1; }
    return;
  }
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    try {
      const msg = handleSessionStart(JSON.parse(raw), baseKitDir);
      if (msg) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: msg } }) + '\n');
    } catch (e) { if (process.env.BASE_KIT_DEBUG) console.error(e); /* fail open */ }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = {
  getCapture, projectSlug, transcriptsDir, context, run, close, sweepOne, filterItems, parseItems, parseInbox, renderInbox,
  normalize, addToInbox, resolveItems, notice, handleSessionStart, maybePresent, keyTerms, quoteHash, destinations, readMarker,
  buildPrompt, callModel, verifyItems, verifyFiles, buildVerifyPrompt, rulesFileOf,
  STATE_DIR, DEFAULTS,
};
