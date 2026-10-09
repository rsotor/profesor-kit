#!/usr/bin/env node
'use strict';
// Action rules (`knowledge.actions`): injects `common` + an action's rules file into context, once per agent.
//   SessionStart (startup|resume|clear|compact)  main agent: prunes marker dirs older than 14 days; on clear/compact
//                              clears this agent's markers; injects `common`; on startup/resume also runs the
//                              sweep and, when it is not all clear, asks the agent to tell the person in one line.
//   UserPromptSubmit           prompt matches a `prompt` regex (flags 'iu') or starts with `/<skill>`.
//   PreToolUse                 Skill call whose skill is in `skills`, or a configured tool
//                              (`Bash:<prefix>` matches the parsed command, not a loose regex; with
//                              `skipProjectRepo` not in the project's own repo — `cwd` + `cd`/`git -C`). A configured TOOL
//                              (not Skill) whose rules this agent has not seen is denied once: the rules arrive
//                              with the denial, the agent checks the call against them and retries (allowed).
//   PostToolUse (Write|Edit)   backstop: a write to a `paths` glob before the rules arrived -> inject
//                              with a "check and fix only what clashes" note. Never denies.
// Order: main agent -> queued, common, triggered. A subagent has no SessionStart, so its triggered action goes
// first and common after (queued when it does not fit).
// Agent key = transcript_path + agent_id (Claude Code sets agent_id only inside a subagent).
// Markers live in the run state (.git/base-kit/action-rules/). `--sweep` prints a plain-language review.
// No `knowledge.actions` -> silent no-op. Fails open on any error.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadConfig, section, projectRoot, stateDir } = require('./lib/config');
const A = require('./lib/actions');
const { countWords } = require('./word-cap');

// Markers, pending and notice: run state, in .git/base-kit/action-rules (lib/config.js stateDir), never in .base-kit/.
const STATE_DIR = 'action-rules';
const stateBase = baseKitDir => path.join(stateDir(baseKitDir), STATE_DIR);
// Claude Code saves hook context over ~10,000 chars to a file and shows only a preview, so each output stays
// under this budget; what does not fit is queued (PENDING) and delivered on the agent's next hook event.
const MAX_CHARS = 9500;
const PENDING = '.pending';
const PRUNE_DAYS = 14;
const deniedFile = (dir, action) => path.join(dir, `.denied-${encodeURIComponent(action)}`);

function agentKey(input) {
  const id = `${input.transcript_path || input.session_id || ''}\0${input.agent_id || ''}`;
  return crypto.createHash('sha256').update(id).digest('hex').slice(0, 32);
}
const markerDir = (baseKitDir, input) => path.join(stateBase(baseKitDir), agentKey(input));
const markerFile = (dir, action) => path.join(dir, encodeURIComponent(action));

// Only what the person typed triggers by prompt: messages the harness relays as prompts (agent reports,
// task notifications) mention every action and would inject them all. And only the opening of a long
// prompt (a pasted document mentions everything too).
const RELAYED = /^\s*(<(agent-message|task-notification|system-reminder|cross-session-message)\b|\[SYSTEM NOTIFICATION)/i;
const PROMPT_HEAD = 400;
function personPrompt(p) {
  if (typeof p !== 'string' || RELAYED.test(p)) return null;
  return p.slice(0, PROMPT_HEAD);
}

// Which actions fire for this event (before the once-per-agent filter).
function matchActions(input, actions, root) {
  const hits = [];
  const ev = input.hook_event_name;
  for (const [name, a] of Object.entries(actions)) {
    if (name === A.COMMON) continue;
    const t = a.triggers;
    if (ev === 'UserPromptSubmit') {
      const p = personPrompt(input.prompt !== undefined ? input.prompt : input.user_input);
      if (p && A.promptMatches(t, p)) hits.push(name);
    } else if (ev === 'PreToolUse') {
      const ti = input.tool_input || {};
      if (input.tool_name === 'Skill' && A.skillMatches(t.skills, ti.skill || ti.skill_name || ti.name)) hits.push(name);
      else if (typeof input.tool_name === 'string') {
        const scope = { cwd: input.cwd || null, skipRepo: t.skipProjectRepo ? root : null };
        if (t.tools.some(x => A.toolTriggerMatches(x, input.tool_name, ti, scope))) hits.push(name);
      }
    } else if (ev === 'PostToolUse') {
      const fp = input.tool_input && input.tool_input.file_path;
      if (/^(Write|Edit|MultiEdit)$/.test(input.tool_name) && typeof fp === 'string' && t.paths.length && A.pathMatches(t.paths, root, fp)) hits.push(name);
    }
  }
  return hits;
}

function readRules(root, file) {
  try { return fs.readFileSync(A.resolveIn(root, file), 'utf8').trim(); } catch { return ''; }
}

// The block injected for one action (also what the sweep measures against MAX_CHARS).
function partFor(name, file, text) {
  const part = `## Rules for ${name} (${file}) — apply them every time\n\n${text}`;
  return part.length > MAX_CHARS
    ? `## Rules for ${name}: ${file} is too long to inject (${text.length} chars, limit ${MAX_CHARS}) — Read the whole file now, before acting.`
    : part;
}

// .pending: one queued action per line, `<name>` or `<name>\tbackstop\t<written file>` (deferred from a
// PostToolUse backstop, so its "arrived after your write" note survives the wait).
function readPending(file, actions) {
  let lines = [];
  try { lines = fs.readFileSync(file, 'utf8').split('\n'); } catch { return []; }
  return lines.map(l => l.split('\t')).filter(([n]) => n && actions[n])
    .map(([name, flag, written]) => ({ name, backstop: flag === 'backstop', written: written || '', carried: true }));
}
function writePending(file, items) {
  if (!items.length) { fs.rmSync(file, { force: true }); return; }
  fs.writeFileSync(file, items.map(i => (i.backstop ? `${i.name}\tbackstop\t${i.written || ''}` : i.name)).join('\n') + '\n');
}

// Injects `want` (in order) for this agent within MAX_CHARS; queues the rest; writes markers.
function inject(root, dir, actions, want) {
  const seen = name => fs.existsSync(markerFile(dir, name));
  const parts = [];
  const injected = [];
  const deferred = [];
  const names = new Set();
  let used = 0;
  for (const item of want) {
    if (names.has(item.name) || seen(item.name)) continue;
    names.add(item.name);
    const text = readRules(root, actions[item.name].file);
    if (!text) continue; // empty or missing file: nothing to say, and no marker so it arrives once filled
    const part = partFor(item.name, actions[item.name].file, text);
    if (parts.length && used + part.length > MAX_CHARS) { deferred.push(item); continue; }
    parts.push(part);
    injected.push(item);
    used += part.length;
  }
  fs.mkdirSync(dir, { recursive: true });
  writePending(path.join(dir, PENDING), deferred);
  for (const { name } of injected) fs.writeFileSync(markerFile(dir, name), new Date().toISOString() + '\n');
  return { parts, injected, deferred };
}

function render(actions, { parts, injected, deferred }) {
  if (!parts.length) return null;
  const lines = [`base-kit action rules: ${injected.map(i => i.name).join(', ')}.`];
  for (const i of injected) {
    if (!i.backstop || i.name === A.COMMON) continue;
    lines.push(i.carried
      ? `rules for ${i.name} arrived after your write to ${i.written || 'a file it covers'}: check that file against them and fix only what clashes.`
      : `rules for ${i.name} arrived after this write: check the file against them and fix only what clashes.`);
  }
  if (deferred.length) {
    lines.push(`Still to come (too long for one message): ${deferred.map(i => `${i.name} (${actions[i.name].file})`).join(', ')} — it arrives with your next tool call; if you are about to write before that, Read it first.`);
  }
  return `${lines.join('\n')}\n\n${parts.join('\n\n')}`;
}

// Removes marker dirs untouched for PRUNE_DAYS (sessions long gone).
function pruneMarkers(baseKitDir, now = Date.now()) {
  const base = stateBase(baseKitDir);
  let entries = [];
  try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const d = path.join(base, e.name);
    try { if (now - fs.statSync(d).mtimeMs > PRUNE_DAYS * 864e5) fs.rmSync(d, { recursive: true, force: true }); } catch { /* next */ }
  }
}

// One line for the person from the sweep, or null when it is all clear — at most once a day while the
// findings stay the same (a pending decision told at every session start becomes noise).
const NOTICE = '.last-notice';
function sweepSummary(baseKitDir, env, root, now = Date.now()) {
  const { lines } = sweep(baseKitDir, env);
  if (lines.length === 1 && /all clear/.test(lines[0])) return null;
  if (root) {
    const f = path.join(stateBase(baseKitDir), NOTICE);
    const sig = crypto.createHash('sha256').update(lines.join('\n')).digest('hex');
    try {
      const [old, at] = fs.readFileSync(f, 'utf8').split('\n');
      if (old === sig && now - Number(at) < 864e5) return null;
    } catch { /* first notice */ }
    try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, `${sig}\n${now}\n`); } catch { /* best effort */ }
  }
  const top = lines.filter(l => !/^\s/.test(l)).join(' ');
  return `Tell the person in one line: ${top.length > 600 ? top.slice(0, 597) + '...' : top} (full list: node .base-kit/hooks/action-rules.js --sweep)`;
}

// -> { event, context: string|null, deny?: string } or null; writes markers for what it injects.
function languageRule(cfg) {
  const l = cfg && cfg.active ? cfg.config.language : null;
  if (typeof l !== 'string' || !l.trim() || /^TODO\b/.test(l.trim())) return null;
  return `Language (project rule): ${l.trim()}`;
}

// Kit feedback on (`feedback.auto: true` + `feedback.repo`, the same test as kit-issue.js): the agent files kit
// issues itself, when it finds the gap — the yes was given at configure (issue #4, 2026-10-08). The note lives in
// the run state, outside the tree, so autosave never pushes it.
function feedbackRule(cfg) {
  const f = cfg && cfg.active ? cfg.config.feedback : null;
  if (!f || f.auto !== true || typeof f.repo !== 'string' || !/^[^/\s]+\/[^/\s]+$/.test(f.repo)) return null;
  return `Kit feedback is on (authorized at configure for ${f.repo}): when base-kit gets in the way or could do better, `
    + 'file it yourself when you find it, no need to ask — write the note to .git/base-kit/feedback-note.md, then '
    + '`node .base-kit/hooks/kit-issue.js --title "[area] what happens" --body-file .git/base-kit/feedback-note.md` '
    + '(same problem already open → `--me-too`); tell the person in the same turn what was sent. The `Del kit:` close line stays.';
}

function handle(input, baseKitDir, env = process.env) {
  const ev = input && input.hook_event_name;
  const cfg = loadConfig(baseKitDir);
  const actions = A.getActions(cfg);
  // `language`: how this project handles languages, in the person's own words (asked once at configure; no
  // schema). Injected at every session start, with or without action rules (Roberto, 2026-10-07).
  const language = languageRule(cfg);
  const feedback = feedbackRule(cfg);
  if (!actions && !(ev === 'SessionStart' && (language || feedback))) return null;
  const root = projectRoot(cfg, env);
  const dir = actions ? markerDir(baseKitDir, input) : null;
  const pendingFile = dir ? path.join(dir, PENDING) : null;

  if (ev === 'SessionStart') {
    const src = input.source;
    if (!['startup', 'resume', 'compact', 'clear'].includes(src)) return null;
    const out = [language, feedback]; // first: inside the preview when the whole message runs long
    if (actions) {
      try { pruneMarkers(baseKitDir); } catch { /* best effort */ }
      if (src === 'compact' || src === 'clear') fs.rmSync(dir, { recursive: true, force: true });
      const want = [...readPending(pendingFile, actions), ...(actions[A.COMMON] ? [{ name: A.COMMON }] : [])];
      out.push(render(actions, inject(root, dir, actions, want)));
      if (src === 'startup' || src === 'resume') {
        try { out.push(sweepSummary(baseKitDir, env, root)); } catch { /* fail open */ }
      }
    }
    const context = out.filter(Boolean).join('\n\n');
    return context ? { event: ev, context } : null;
  }
  if (!actions) return null;

  if (!['UserPromptSubmit', 'PreToolUse', 'PostToolUse'].includes(ev)) return null;
  const pending = readPending(pendingFile, actions);
  const hits = matchActions(input, actions, root);
  if (!hits.length && !pending.length) return null;
  const seenBefore = new Set(hits.filter(n => fs.existsSync(markerFile(dir, n))));
  const backstop = ev === 'PostToolUse';
  const written = backstop ? (A.relToRoot(root, input.tool_input.file_path) || input.tool_input.file_path) : '';
  const hitItems = hits.map(name => ({ name, backstop, written }));
  const common = hits.length && actions[A.COMMON] ? [{ name: A.COMMON }] : [];
  // Queued first (they were due earlier). The main agent got common at SessionStart (or gets it before the
  // action); a subagent gets the action it needs now first, common after.
  const want = input.agent_id ? [...pending, ...hitItems, ...common] : [...pending, ...common, ...hitItems];
  const r = inject(root, dir, actions, want);
  const context = render(actions, r);

  let deny;
  if (ev === 'PreToolUse' && input.tool_name !== 'Skill') {
    const arrived = new Set([...r.injected, ...r.deferred].map(i => i.name));
    const fresh = hits.filter(n => !seenBefore.has(n) && arrived.has(n) && !fs.existsSync(deniedFile(dir, n)));
    if (fresh.length) {
      for (const n of fresh) fs.writeFileSync(deniedFile(dir, n), new Date().toISOString() + '\n');
      const files = [...new Set([...r.injected, ...r.deferred].map(i => actions[i.name].file))];
      deny = `Rules for ${fresh.join(', ')} just arrived (see context): check what you are about to do against them, then retry. If they are not in your context, Read ${files.join(', ')} first.`;
    }
  }
  if (!context && !deny) return null;
  return { event: ev, context, ...(deny ? { deny } : {}) };
}

// ---- --sweep ----
function listJson(dir) {
  let st;
  try { st = fs.statSync(dir); } catch { return []; }
  if (st.isFile()) return dir.endsWith('.json') ? [dir] : [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('.')) return [];
    const full = path.join(dir, e.name);
    return e.isDirectory() ? listJson(full) : (e.name.endsWith('.json') ? [full] : []);
  });
}

// -> { lines: string[], created: string[] }. Creates missing action files empty.
function sweep(baseKitDir, env = process.env) {
  const cfg = loadConfig(baseKitDir);
  const actions = A.getActions(cfg);
  if (!actions) return { lines: ['No action rules configured (knowledge.actions is absent): nothing to sweep.'], created: [] };
  const root = projectRoot(cfg, env);
  const lines = [];
  const created = ensureActionFiles(root, actions);
  for (const f of created) lines.push(`Created the empty rules file ${f} for its action.`);
  const cap = section(cfg, 'wordCap');
  for (const [name, a] of Object.entries(actions)) {
    const limit = typeof a.cap === 'number' ? a.cap : (cap && typeof cap.actionsCap === 'number' ? cap.actionsCap : null);
    if (limit === null) continue;
    const words = countWords(readRules(root, a.file));
    if (words > limit) lines.push(`The rules for ${name} (${a.file}) have ${words} words, over the cap of ${limit}: decide what to cut or move to situational.`);
  }
  for (const [name, a] of Object.entries(actions)) {
    for (const r of a.triggers.prompt) {
      if (!A.compilePrompt(r)) lines.push(`The prompt trigger ${JSON.stringify(r)} of ${name} does not compile with flags 'iu', so it never matches: fix it in the config.`);
    }
  }
  if (actions[A.COMMON]) {
    const size = name => { const t = readRules(root, actions[name].file); return t ? partFor(name, actions[name].file, t).length : 0; };
    const c = size(A.COMMON);
    // Every action over the budget, largest first — reporting only the largest hid the rest until it was fixed.
    const over = Object.keys(actions)
      .filter(name => name !== A.COMMON)
      .map(name => ({ name, n: size(name) }))
      .filter(o => c && o.n && c + o.n > MAX_CHARS)
      .sort((x, y) => y.n - x.n);
    for (const o of over) {
      lines.push(`common (${c} chars) + ${o.name} (${o.n} chars) exceed the ${MAX_CHARS}-char budget of one hook message: in a subagent or an old session ${o.name} or common arrives one call late. Trim one of them.`);
    }
  }
  const k = section(cfg, 'knowledge');
  const howTo = k && typeof k.howTo === 'string' ? A.resolveIn(root, k.howTo) : null;
  const noScope = [];
  const near = {};
  for (const f of howTo ? listJson(howTo) : []) {
    let doc;
    try { doc = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
    if (!doc || typeof doc !== 'object') continue;
    const rel = path.relative(root, f).split(path.sep).join('/');
    if (doc.scope === undefined) noScope.push(rel);
    else if (doc.scope === 'situational' && typeof doc.near === 'string' && doc.near) (near[doc.near] = near[doc.near] || []).push(rel);
  }
  if (noScope.length) {
    lines.push(`${noScope.length} how-to file(s) have no scope yet. Give each one "scope": "situational" (with a one-line scope_reason) or move its rule into the action file it always applies to:`);
    for (const f of noScope) lines.push(`  ${f}`);
  }
  for (const [x, files] of Object.entries(near)) {
    if (files.length < 3) continue;
    lines.push(actions[x]
      ? `${files.length} situational patterns sit near ${x}: check whether they are really always-rules for it (${actions[x].file}).`
      : `${files.length} situational patterns sit near "${x}": propose a new action ${x} to the person (file + triggers).`);
    for (const f of files) lines.push(`  ${f}`);
  }
  if (!lines.length) lines.push('Action rules: all clear.');
  return { lines, created };
}

// Creates each configured action file that does not exist yet, empty. -> created paths (as configured).
function ensureActionFiles(root, actions) {
  const created = [];
  for (const a of Object.values(actions)) {
    const abs = A.resolveIn(root, a.file);
    if (fs.existsSync(abs)) continue;
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, '');
    created.push(a.file);
  }
  return created;
}

function main() {
  const baseKitDir = path.join(__dirname, '..');
  if (process.argv.includes('--sweep')) {
    try { for (const l of sweep(baseKitDir).lines) console.log(l); } catch (e) { console.error(`action-rules sweep failed: ${e.message}`); process.exitCode = 1; }
    return;
  }
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    try {
      const r = handle(JSON.parse(raw), baseKitDir);
      if (r && (r.context || r.deny)) {
        const out = { hookEventName: r.event };
        if (r.deny) { out.permissionDecision = 'deny'; out.permissionDecisionReason = r.deny; }
        if (r.context) out.additionalContext = r.context;
        process.stdout.write(JSON.stringify({ hookSpecificOutput: out }) + '\n');
      }
    } catch (e) { if (process.env.BASE_KIT_DEBUG) console.error(e); /* fail open */ }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { personPrompt, handle, sweep, ensureActionFiles, agentKey, matchActions, pruneMarkers, STATE_DIR, MAX_CHARS, PRUNE_DAYS };
