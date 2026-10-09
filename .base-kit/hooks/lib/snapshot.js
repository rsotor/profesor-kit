'use strict';
// Autosave by hooks (docs/herencia-plan.md, delivery 2, 2026-10-07): the photo and its push, as plain functions
// over git — no interface, no network beyond `git push`. Every call returns { status, reasons, ... }, never throws
// on a git failure: the hook that calls this must stay silent and cheap.
//   snapshot(opts) → commit what is uncommitted on the current branch ("autosave: <os> <date>"), holding back
//                    secrets, huge files and company terms (lib/secrets.js, the same check as `git commit`).
//                    Skips, without waiting, whenever someone else may be working on the index.
//   push(opts)     → push the current branch; rejected because the remote moved → `pull --ff-only` and retry;
//                    not fast-forward → the local photos are rebased onto the remote; a conflict aborts the rebase
//                    (`diverged`, nothing touched); no network / no remote → held. Never --force.
//   sync(opts)     → snapshot + pull --ff-only (clean tree, remote ahead) + push: what the hooks run. Also
//                    returns `incoming` ({ count, subjects }): the remote commits this sync brought in.
// Design (Roberto, 2026-10-07): an automatic cmd-s of the project. Everything lands on the current branch, no
// rescue refs; a photo at every Stop (`minutes`, optional, throttles that), pushed right away.
// opts: { root, env, now, host, minutes = 0, maxBytes = 50 MB, lockMinutes = 15, git = runGit, netTimeoutMs = 60 s, force, lockWaitMs = 0 }.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const S = require('./secrets');
const { stateDir } = require('./config');
const { scanRepo } = require('../pre-commit');

const MB = 1024 * 1024;
// The photo names only the operating system — never the machine or the user (Roberto, 2026-10-07).
const OS_LABEL = { darwin: 'macOS', win32: 'Windows', linux: 'Linux' }[process.platform] || process.platform;
const NET_TIMEOUT_MS = 60_000;
// Git must never sit waiting for credentials: no terminal prompt, no credential-manager dialog, no askpass
// program (empty, not `true`: Windows + PowerShell has no `true` on the PATH — diablo, 2026-10-07), and a
// timeout on the network. Stored credentials (keychain, GCM, SSH keys) still work: helpers are not askpass.
const QUIET_ENV = { GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GIT_ASKPASS: '', SSH_ASKPASS: '' };

const runGit = (args, opts) => spawnSync('git', args, { encoding: 'utf8', ...opts });

const lockPath = root => path.join(stateDir(path.join(root, '.base-kit')), 'autosave.lock');
const statePath = root => path.join(stateDir(path.join(root, '.base-kit')), 'autosave-state.json');
const stamp = now => now.toISOString().replace(/\.\d{3}Z$/, 'Z');

function makeGit({ root, env, git = runGit, netTimeoutMs = NET_TIMEOUT_MS }) {
  const base = { ...process.env, ...env, ...QUIET_ENV };
  return (args, extra = {}) => {
    const r = git(args, { cwd: root, env: base, timeout: extra.net ? netTimeoutMs : undefined });
    return { ok: r.status === 0, out: String(r.stdout || '').trim(), err: String(r.stderr || '').trim() };
  };
}

const sleepMs = ms => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch { /* no SharedArrayBuffer */ } };
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

// mkdir is atomic: whoever creates the directory holds the lock. A lock of a dead pid, or older than
// `lockMinutes`, is a leftover and is taken over.
function takeLock(root, now, lockMinutes) {
  const dir = lockPath(root);
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try { fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'pid'), String(process.pid)); return true; } catch { /* taken */ }
    let pid = NaN; let mtime = 0;
    try { pid = Number(fs.readFileSync(path.join(dir, 'pid'), 'utf8').trim()); mtime = fs.statSync(dir).mtimeMs; } catch { /* half-written */ }
    const stale = !Number.isFinite(pid) || !alive(pid) || now.getTime() - mtime > lockMinutes * 60e3;
    if (!stale) return false;
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* lost the race */ }
  }
  return false;
}
const releaseLock = root => { try { fs.rmSync(lockPath(root), { recursive: true, force: true }); } catch { /* nothing */ } };

// A reason the index is not ours to touch right now. Never waits: the next event tries again.
function busy(g, root) {
  const gitDir = g(['rev-parse', '--git-dir']);
  if (!gitDir.ok) return 'not a git repository';
  const dir = path.resolve(root, gitDir.out);
  if (fs.existsSync(path.join(dir, 'index.lock'))) return 'index.lock present (git running)';
  for (const marker of ['MERGE_HEAD', 'rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'BISECT_LOG'])
    if (fs.existsSync(path.join(dir, marker))) return 'merge or rebase in progress';
  if (!g(['symbolic-ref', '-q', 'HEAD']).ok) return 'detached HEAD';
  if (!g(['diff', '--cached', '--quiet']).ok) return 'staged changes (a commit is being prepared)';
  return null;
}

function snapshot({ root, env = {}, now = new Date(), host = OS_LABEL, minutes = 0, maxBytes = 50 * MB, lockMinutes = 15, git = runGit, force = false, lockWaitMs = 0 }) {
  const g = makeGit({ root, env, git });
  const reasons = [];
  const why = busy(g, root);
  if (why) return { status: 'skipped', busy: true, reasons: [why] };
  // A session start or end may wait a little for a live lock: a Stop photo cut short when the session exits
  // (Claude Code -p) holds it for a moment. Stop itself never waits.
  const deadline = Date.now() + lockWaitMs;
  let locked = takeLock(root, now, lockMinutes);
  while (!locked && Date.now() < deadline) { sleepMs(250); locked = takeLock(root, now, lockMinutes); }
  if (!locked) return { status: 'skipped', busy: true, reasons: ['locked by another autosave'] };
  try {
    // `minutes` is an optional throttle for Stop (0 = a photo at every block); a session start or end
    // (`force`) photographs regardless: it is closing what is pending.
    // Author time, not committer time: a rebase re-dates the commit but not the photo.
    const last = minutes > 0 && !force ? g(['log', '-1', '--format=%at', '--grep=^autosave: ']) : null;
    if (last && last.ok && last.out && now.getTime() / 1000 - Number(last.out) < minutes * 60)
      return { status: 'skipped', reasons: [`recent autosave (under ${minutes} min)`] };
    const dirty = g(['status', '--porcelain', '--untracked-files=all']);
    if (!dirty.ok) return { status: 'skipped', reasons: [`git status failed: ${dirty.err.split('\n')[0]}`] };
    if (!dirty.out) return { status: 'nothing', reasons: [] };
    const add = g(['add', '-A', '--ignore-errors']);
    if (!add.ok && !g(['diff', '--cached', '--quiet']).ok === false) return { status: 'skipped', reasons: [`git add failed: ${add.err.split('\n')[0]}`] };

    // Held back: the commit check's hits (secret values, secret-named files, company terms when the list exists)
    // and files over maxBytes. Unstaged, they stay local; the result names kinds, never values or terms.
    const { hits, notices } = scanRepo(root, { env: { ...process.env, ...env } });
    const held = [];
    const unstage = (file, kind) => { held.push({ file, kind }); g(['reset', '-q', '--', file]); };
    for (const h of hits) if (h.file && !h.file.startsWith('(')) unstage(h.file, h.kind);
    if (hits.some(h => h.kind === 'term in name')) {
      // The name itself is the problem: find it again without echoing it, by scanning staged names.
      for (const f of g(['diff', '--cached', '--name-only']).out.split('\n').filter(Boolean)) {
        if (S.scanText(f, { terms: (S.loadTerms(S.termsFile({ ...process.env, ...env })) || { terms: [] }).terms }).some(x => x.kind === 'term')) unstage(f, 'term in name');
      }
    }
    for (const f of g(['diff', '--cached', '--name-only', '--diff-filter=d']).out.split('\n').filter(Boolean)) {
      try { if (fs.statSync(path.join(root, f)).size > maxBytes) unstage(f, `over ${Math.round(maxBytes / MB)} MB`); } catch { /* gone */ }
    }
    const heldKinds = [...new Set(held.map(h => h.kind))];
    if (held.length) reasons.push(`held back ${held.length} file(s): ${heldKinds.join(', ')}`);
    if (g(['diff', '--cached', '--quiet']).ok) return { status: 'nothing', reasons, held, notices };

    // The commit is dated with `now` (the hook's clock), so the message, the date and the "recent" check agree.
    const date = now.toISOString();
    const commit = git(['commit', '-q', '--no-edit', '-m', `autosave: ${host} ${stamp(now)}`],
      { cwd: root, env: { ...process.env, ...env, ...QUIET_ENV, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
    if (commit.status !== 0) {
      g(['reset', '-q']); // leave the index as we found it: empty
      return { status: 'skipped', reasons: [...reasons, `git commit failed: ${String(commit.stderr || '').trim().split('\n').pop()}`], held, notices };
    }
    return { status: 'committed', commit: g(['rev-parse', 'HEAD']).out, reasons, held, notices };
  } finally {
    releaseLock(root);
  }
}

// --- Push and sync (task 7) ---
function readState(root) { try { return JSON.parse(fs.readFileSync(statePath(root), 'utf8')); } catch { return { failures: 0 }; } }
function writeState(root, state) {
  try { fs.mkdirSync(path.dirname(statePath(root)), { recursive: true }); fs.writeFileSync(statePath(root), JSON.stringify(state, null, 2) + '\n'); } catch { /* best effort */ }
}
const first = text => String(text || '').split('\n').find(l => l.trim()) || '';

// Current branch and its remote, or null (detached, no remote).
function where(g) {
  const branch = g(['symbolic-ref', '-q', '--short', 'HEAD']);
  if (!branch.ok) return null;
  const remote = g(['config', `branch.${branch.out}.remote`]).out || (g(['remote']).out.split('\n').includes('origin') ? 'origin' : '');
  return remote ? { branch: branch.out, remote } : null;
}

// Pushes the current branch. The remote moved → `pull --ff-only` (only with a clean tree) and one retry; still
// not fast-forward → `diverged`, nothing touched. No remote or no network → `held`. Never --force.
function push({ root, env = {}, now = new Date(), git = runGit, netTimeoutMs }) {
  const g = makeGit({ root, env, git, netTimeoutMs });
  const state = readState(root);
  const fail = (status, reason) => { state.failures = (state.failures || 0) + 1; state.lastFailure = { at: now.toISOString(), reason, status }; writeState(root, state); return { status, reasons: [reason] }; };
  const w = where(g);
  if (!w) return fail('held', 'no remote for the current branch');
  const reasons = [];
  let fetchedTip = null; // the remote as last fetched, before our push: what came from elsewhere ends there
  for (let attempt = 0; attempt < 2; attempt++) {
    const ahead = g(['rev-list', '--count', `${w.remote}/${w.branch}..HEAD`]);
    const fetch = g(['fetch', '-q', w.remote, w.branch], { net: true });
    if (!fetch.ok) return fail('held', `fetch failed: ${first(fetch.err) || 'no network'}`);
    const upstream = `${w.remote}/${w.branch}`;
    fetchedTip = g(['rev-parse', upstream]).out;
    const behind = g(['rev-list', '--count', `HEAD..${upstream}`]).out;
    if (behind !== '0') {
      // Only a clean tree is moved under; the photo just before sync() makes it clean.
      if (g(['status', '--porcelain', '--untracked-files=no']).out) return fail('diverged', 'remote ahead and local changes present: not pulled');
      const ff = g(['merge', '--ff-only', '-q', upstream]);
      if (ff.ok) reasons.push(`fast-forwarded to ${upstream}`);
      else {
        // Both moved: put the local photos on top of the remote (Roberto, 2026-10-07: a colleague cannot pull by
        // hand). A conflict aborts the rebase — branch and tree exactly as before — and the state stays diverged.
        const rb = g(['rebase', '-q', '--autostash', upstream]);
        if (!rb.ok) {
          g(['rebase', '--abort']);
          state.lastDiverged = now.toISOString();
          return fail('diverged', `not fast-forward and the rebase onto ${upstream} conflicts: needs a merge by hand`);
        }
        reasons.push(`rebased local photos onto ${upstream}`);
      }
    }
    if (g(['rev-list', '--count', `${upstream}..HEAD`]).out === '0') {
      // Up to date after a good fetch: the remote answered, so a failure streak ends here too.
      if (state.failures) { state.failures = 0; writeState(root, state); }
      return { status: reasons.length ? 'pushed' : 'nothing', reasons, fetchedTip };
    }
    const p = g(['push', '-q', w.remote, w.branch], { net: true });
    if (p.ok) { state.failures = 0; state.lastPushOk = now.toISOString(); writeState(root, state); return { status: 'pushed', reasons, fetchedTip }; }
    if (!/rejected|fetch first|non-fast-forward|behind/i.test(p.err)) return fail('held', `push failed: ${first(p.err) || 'no network'}`);
    // Rejected: someone pushed between our fetch and our push → loop once more (fetch, ff, push).
  }
  return fail('diverged', 'push rejected twice: the remote keeps moving');
}

// What the hooks run, in this order: (1) bring the remote in first — `fetch` and, when the remote is ahead and
// nothing local is committed on top, `merge --ff-only`, which git allows under uncommitted changes as long as
// no changed file is in the way (then it refuses and the photo goes on anyway); (2) the photo; (3) the push.
// Pulling before the photo is what keeps a machine switch a plain fast-forward instead of a divergence.
// Nothing is pulled while the index is busy (staged work, a merge in progress, a lock).
function sync(opts) {
  const g = makeGit(opts);
  const pre = [];
  const before = g(['rev-parse', '-q', '--verify', 'HEAD']).out;
  let tip = null;
  const w = where(g);
  if (w && !busy(g, opts.root)) {
    const fetch = g(['fetch', '-q', w.remote, w.branch], { net: true });
    if (fetch.ok) {
      const upstream = `${w.remote}/${w.branch}`;
      tip = g(['rev-parse', upstream]).out;
      const behind = g(['rev-list', '--count', `HEAD..${upstream}`]).out;
      const ahead = g(['rev-list', '--count', `${upstream}..HEAD`]).out;
      if (behind !== '0' && ahead === '0') {
        const ff = g(['merge', '--ff-only', '-q', upstream]);
        pre.push(ff.ok ? `fast-forwarded to ${upstream}` : `not pulled: ${first(ff.err) || 'local files in the way'}`);
      }
    } else pre.push(`fetch failed: ${first(fetch.err) || 'no network'}`);
  }
  const snap = snapshot(opts);
  // A busy index (someone's staged work, a merge, another autosave) stops everything; a photo skipped only
  // because the last one is recent still lets earlier commits go up.
  if (snap.busy) return { snapshot: snap, push: { status: 'nothing', reasons: [...pre, 'index busy: nothing pushed'] }, incoming: incoming(g, before, tip) };
  const p = push(opts);
  return { snapshot: snap, push: { ...p, reasons: [...pre, ...p.reasons] }, incoming: incoming(g, before, p.fetchedTip || tip) };
}

// What came from elsewhere during this sync (fast-forward, or a rebase of the local photos onto it): the remote
// commits that were not here before and are now part of HEAD. -> { count, subjects } or null. Our own photos are
// never in it: they are not on the fetched remote tip.
function incoming(g, before, tip) {
  if (!before || !tip || !g(['merge-base', '--is-ancestor', tip, 'HEAD']).ok) return null;
  const log = g(['log', '--no-merges', '--format=%s', `${before}..${tip}`]);
  const subjects = log.ok ? log.out.split('\n').filter(Boolean) : [];
  return subjects.length ? { count: subjects.length, subjects } : null;
}

module.exports = { snapshot, push, sync, lockPath, statePath, readState, QUIET_ENV, OS_LABEL };
