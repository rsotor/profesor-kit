#!/usr/bin/env node
'use strict';
// Autosave: the project's automatic cmd-s (Roberto, 2026-10-07; docs/herencia-plan.md, delivery 2, task 8).
// Everything lands on the current branch; secrets, huge files and company terms are held back (lib/snapshot.js).
//   Stop          → sync (photo → push) inline, network capped at 15 s. Claude Code runs this hook async (the
//                   turn never waits); Codex runs it synchronously — an async Stop never ran there, and a child
//                   left detached died when `codex exec` exited (live test, 2026-10-07). `autosave.minutes` (0)
//                   can throttle these photos; a session start or end photographs regardless.
//                   Nothing while something still runs in the background (issue #11): Claude Code's Stop fires
//                   when the main turn ends even if a background subagent is mid-edit, and the photo would commit
//                   its half-done work under "autosave:" (its own commit never happened). `background_tasks` in
//                   the Stop input lists what is in flight; any running entry holds the photo — a shell too,
//                   because an agent waiting on its own background command shows up only as that shell (live
//                   test, 2026-10-09). The next Stop with nothing in flight photographs; a session end always does.
//   SessionStart  → sync inline (network capped at 15 s) and, only when there is something to say, one line in
//                   additionalContext for the person (message() below): the project came in updated, or files
//                   kept off the remote. Maintainer matters reach the kit through report(), not the person.
//   SessionEnd    → sync inline (Claude Code only; Codex caps SessionEnd at 3 s, the Stop before it covers it).
// Off with `autosave.enabled: false`; absent → on (for everyone). In a linked worktree, or when the toplevel has
// no .base-kit/installed.json, nothing. `autosave.command` runs that command (inline, in the root) instead of sync.
// After autosave.maxFailures (3) failures in a row, a kit issue (kit-issue.js), once per day.
// Fails open: an error here never stops the agent.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadConfig, section } = require('./lib/config');
const S = require('./lib/snapshot');

const DEFAULTS = { enabled: true, minutes: 0, maxFailures: 3, maxBytes: 50 * 1024 * 1024, lockMinutes: 15 };
const NET_MS = 15_000;
const LOCK_WAIT_MS = 5_000; // session start/end: wait for a Stop photo cut short (live test, 2026-10-07)

const git = (root, args) => { const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }); return r.status === 0 ? r.stdout.trim() : null; };

// Where this hook may act: the toplevel of the main worktree, with base-kit installed there.
function where(baseKitDir) {
  const root = path.dirname(baseKitDir);
  const gitDir = git(root, ['rev-parse', '--git-dir']);
  if (gitDir === null) return { reason: 'not a git repository' };
  const common = git(root, ['rev-parse', '--git-common-dir']);
  if (common !== null && path.resolve(root, gitDir) !== path.resolve(root, common)) return { reason: 'linked worktree: only the main worktree autosaves' };
  const top = git(root, ['rev-parse', '--show-toplevel']);
  if (!top) return { reason: 'no toplevel' };
  if (!fs.existsSync(path.join(top, '.base-kit', 'installed.json'))) return { reason: 'no base-kit at the toplevel' };
  return { root: top };
}

function settings(baseKitDir) {
  const cfg = loadConfig(baseKitDir);
  if (!cfg.active) return null;
  const a = section(cfg, 'autosave') || {};
  if (a.enabled === false) return null;
  const num = (k, d) => (Number.isFinite(a[k]) && a[k] >= 0 ? a[k] : d);
  return { cfg, command: typeof a.command === 'string' && a.command.trim() ? a.command.trim() : null,
    minutes: num('minutes', DEFAULTS.minutes), maxFailures: num('maxFailures', DEFAULTS.maxFailures),
    maxBytes: num('maxBytes', DEFAULTS.maxBytes), lockMinutes: num('lockMinutes', DEFAULTS.lockMinutes) };
}

// What the agent tells the person at the start, in plain words (issue #3, Roberto 2026-10-08): the project
// came in updated from elsewhere → news; files kept off the remote → a question only the person can answer.
// Maintainer matters (diverged, push failing, stale push) go to the kit through report(), never to the person;
// another autosave's lock, to no one. Nothing new → silence ("up to date" would be false offline).
// The held-files question is asked once per day for the same files (state.notice).
function message({ root, result, now }) {
  const bits = [];
  const { snapshot, incoming } = result;
  if (incoming && incoming.count) {
    const own = incoming.subjects.filter(x => !/^autosave:/.test(x)).slice(0, 3).map(x => `"${x.slice(0, 80)}"`);
    const what = own.length ? `${incoming.count} change(s), among them ${own.join(', ')}` : `${incoming.count} change(s) made on another computer`;
    bits.push(`this project was just updated with what was done elsewhere (${what}). In your first reply, next to your greeting or answer, tell the person in one plain line, in their language and without git words, that it is up to date with a new version and, briefly, what changed.`);
  }
  if (snapshot.held && snapshot.held.length) {
    const kinds = [...new Set(snapshot.held.map(h => h.kind))].sort();
    const sig = `held:${snapshot.held.length}:${kinds.join(',')}`;
    const day = now.toISOString().slice(0, 10);
    const state = S.readState(root);
    if (!(state.notice && state.notice.sig === sig && state.notice.day === day)) {
      bits.push(`${snapshot.held.length} file(s) are kept only on this computer, not saved to the shared copy (${kinds.join(', ')}). In your first reply, tell the person in one plain line, in their language, that you need to check one thing with them: whether those files should stay only here.`);
      try { fs.mkdirSync(path.dirname(S.statePath(root)), { recursive: true }); fs.writeFileSync(S.statePath(root), JSON.stringify({ ...state, notice: { sig, day } }, null, 2) + '\n'); } catch { /* best effort */ }
    }
  }
  return bits.length ? `Autosave: ${bits.join(' Also: ')}` : undefined;
}

// After maxFailures in a row, tell the kit once a day (kit-issue dedupes the rest).
function report({ root, baseKitDir, state, cfg, maxFailures, now, kitIssue }) {
  if (!state || (state.failures || 0) < maxFailures) return;
  const day = now.toISOString().slice(0, 10);
  if (state.issueDay === day) return;
  const reason = state.lastFailure && state.lastFailure.reason ? state.lastFailure.reason : 'unknown';
  try {
    kitIssue({ baseKitDir, title: '[autosave] push keeps failing', body: `Autosave could not push ${state.failures} times in a row.\n\nLast reason: ${reason}\n\nExpected: the photo reaches the remote on the current branch.`, now });
    S.readState(root); // no-op read, keeps the state file's shape
    fs.writeFileSync(S.statePath(root), JSON.stringify({ ...state, issueDay: day }, null, 2) + '\n');
  } catch { /* best effort */ }
}

// -> { action: 'none' | 'command' | 'synced', reason?, message?, result? }
function handle(input, baseKitDir, deps = {}) {
  const { env = process.env, now = new Date(), host = S.OS_LABEL, sync = S.sync, runCommand = runShell, kitIssue = defaultKitIssue } = deps;
  const event = input && input.hook_event_name;
  if (!['Stop', 'SessionStart', 'SessionEnd'].includes(event)) return { action: 'none', reason: 'not an autosave event' };
  if (event === 'Stop' && inFlight(input)) return { action: 'none', reason: 'background work still running (an agent, or a command one waits on)' };
  const s = settings(baseKitDir);
  if (!s) return { action: 'none', reason: 'autosave off' };
  const w = where(baseKitDir);
  if (!w.root) return { action: 'none', reason: w.reason };
  const opts = { root: w.root, env, now, host, minutes: s.minutes, maxBytes: s.maxBytes, lockMinutes: s.lockMinutes, netTimeoutMs: NET_MS };
  if (s.command) { runCommand({ shell: s.command, root: w.root }); return { action: 'command' }; }
  // A session start or end closes what is pending whatever the throttle says (`force`); Stop respects it.
  const result = sync(event === 'Stop' ? opts : { ...opts, force: true, lockWaitMs: LOCK_WAIT_MS });
  const out = { action: 'synced', result };
  if (event === 'SessionStart') {
    out.message = message({ root: w.root, result, now });
    report({ root: w.root, baseKitDir, state: S.readState(w.root), cfg: s.cfg, maxFailures: s.maxFailures, now, kitIssue });
  }
  return out;
}

// Anything still running in the Stop input's background_tasks (Claude Code; absent elsewhere → nothing in flight).
// Every kind counts (subagent, workflow, shell, monitor…): an agent parked on its own background command is
// listed only as that command. A finished entry does not hold the photo.
const FINISHED = /^(completed|done|failed|killed|cancell?ed|stopped)$/i;
function inFlight(input) {
  const tasks = input && Array.isArray(input.background_tasks) ? input.background_tasks : [];
  return tasks.some(t => t && !FINISHED.test(String(t.status || '')));
}

function runShell({ shell, root }) {
  try { spawnSync(shell, { shell: true, stdio: 'ignore', cwd: root, env: process.env, timeout: 60_000 }); } catch { /* silent */ }
}

function defaultKitIssue(o) { return require('./kit-issue').run(o); }

function main() {
  const baseKitDir = process.env.BASE_KIT_DIR || path.join(__dirname, '..');
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    try {
      const r = handle(JSON.parse(raw || '{}'), baseKitDir);
      if (r.message) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: r.message } }) + '\n');
    } catch { /* fails open */ }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { handle, message, inFlight, DEFAULTS };
