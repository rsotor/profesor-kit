'use strict';
// Kit feedback: files an issue on base-kit from an installation, by itself, once the person said yes at
// configure (`feedback.auto: true` in config/base-kit.json). Pattern from profesor-kit's issue.js.
//   node .base-kit/hooks/kit-issue.js --list                                   → open kit issues
//   node .base-kit/hooks/kit-issue.js --title "[area] what happens" --body-file note.md [--issue N]
//   node .base-kit/hooks/kit-issue.js --title "[area] what happens" --me-too [--issue N]   → nothing new to add
// No cap (Roberto, 2026-10-07): the person said yes once; what keeps a loop from flooding is that the same
// problem always lands on the issue that exists. Nothing new to add (--me-too): my own issue → silence; someone
// else's → a 👍, not a comment. An issue open longer than feedback.staleDays (30) → one comment asking what is
// up with it, once. Everything stays on the issue.
// Sensitive bits are replaced, not a reason to stop (Roberto, 2026-10-06): a secret → <clave>, a company term
// → <empresa>, a whole home/absolute path → <ruta>, an email → <correo>. The exact text sent is kept in
// .git/base-kit/feedback-sent.md. Never sent — kept in .git/base-kit/feedback-pending.md with the
// reason — only when gh itself fails. The same problem already open → a comment on that issue (at most one
// per issue per day, so a loop cannot flood it), not a new issue. Sent/pending/log live in .git/base-kit/.
// Destination and account come from config (task 1, 2026-10-07): `feedback.repo` (none → off, nothing is sent
// anywhere by default) and `feedback.account` (set → that account's token, environment dropped; unset → the
// active gh account, environment respected). The body carries the kit label from config (feedback.label), never the folder.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { loadConfig, stateDir } = require('./lib/config');
const { SECRET_RE, PLACEHOLDER_RE, termsFile: defaultTermsFile, loadTerms } = require('./lib/secrets');

const escape = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Shapes on top of the shared scanner (lib/secrets.js mirrors autosave.sh and stays as is): a whole private key
// block, Anthropic and Google keys, JWTs, `password=` / `passwd:` values.
const EXTRA_SECRETS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /sk-ant-[A-Za-z0-9_-]{20,}/g,
  /AIza[0-9A-Za-z_-]{35}/g,
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}/g,
  /\b(pass(word)?|passwd|pwd)\s*[=:]\s*\S+/gi,
];
// An email needs a letter TLD and is not a git remote (`git@github.com:org/repo`): `pkg@1.2.3` stays.
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)*\.[A-Za-z]{2,}\b(?!:)/g;
// A whole absolute or home path goes: the folder names in it can name a client or a project.
const HOME_PATH = /(\/Users\/|\/home\/|~\/|[A-Za-z]:\\Users\\)[^\s`'")\]]*/g;

// -> { text, redacted: [kinds] }. Order matters: secrets first (a token may contain anything), then terms,
// emails, paths. A term matches anywhere, case-insensitive, like the commit check.
function redact(text, terms) {
  const redacted = new Set();
  const swap = (re, why, by) => { text = text.replace(re, m => { if (why === 'secret' && PLACEHOLDER_RE.test(m)) return m; redacted.add(why); return by; }); };
  for (const re of EXTRA_SECRETS) swap(re, 'secret', '<clave>');
  swap(new RegExp(SECRET_RE.source, 'g'), 'secret', '<clave>');
  for (const t of terms) swap(new RegExp(escape(t), 'gi'), 'company term', '<empresa>');
  swap(EMAIL, 'email', '<correo>');
  swap(HOME_PATH, 'home path', '<ruta>');
  return { text, redacted: [...redacted] };
}

function realGh(args, env) {
  const r = spawnSync('gh', args, { env, encoding: 'utf8' });
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trim() };
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

// Run state (sent, pending, log) lives in .git/base-kit/ (lib/config.js stateDir), never in .base-kit/.
const stateFile = (baseKitDir, name) => { const d = stateDir(baseKitDir); fs.mkdirSync(d, { recursive: true }); return path.join(d, name); };

// A held note keeps the title and the reasons, never the body: the body is what failed a check.
function hold(baseKitDir, title, reasons, now) {
  fs.appendFileSync(stateFile(baseKitDir, 'feedback-pending.md'),
    `- ${now.toISOString().slice(0, 10)} ${title} — not sent: ${reasons.join(', ')}\n`);
  return { status: 'held', reasons };
}

// -> { repo, account } from config, or null when feedback is off or has no destination.
function destination(baseKitDir) {
  const cfg = loadConfig(baseKitDir);
  const f = cfg.active && cfg.config.feedback;
  if (!f || f.auto !== true || typeof f.repo !== 'string' || !/^[^/\s]+\/[^/\s]+$/.test(f.repo)) return null;
  return { repo: f.repo, account: typeof f.account === 'string' && f.account ? f.account : null,
    staleDays: Number.isFinite(f.staleDays) ? f.staleDays : 30, label: typeof f.label === 'string' && f.label.trim() ? f.label.trim() : null };
}

// The gh environment for the destination: with `feedback.account`, that account's token and nothing else
// (GH_CONFIG_DIR, the work account set per folder, and any token in the environment are dropped); without it,
// the environment as is, so the active account signs. -> env, or { held: reason }.
function ghEnvFor({ account }, gh, env) {
  if (!account) return { ...env };
  const ghEnv = { ...env };
  for (const k of ['GH_CONFIG_DIR', 'GH_TOKEN', 'GITHUB_TOKEN']) delete ghEnv[k];
  const tok = gh(['auth', 'token', '--user', account], ghEnv);
  if (!tok.ok || !tok.out.trim()) return { held: `no gh account for ${account} on this machine` };
  ghEnv.GH_TOKEN = tok.out.trim().split('\n').pop();
  return ghEnv;
}

function run({ baseKitDir, title, body = '', issue, meToo = false, gh = realGh, termsFile = defaultTermsFile(),
  env = process.env, now = new Date() }) {
  const dest = destination(baseKitDir);
  if (!dest) return { status: 'off' };
  const { repo } = dest;

  // No terms list → nothing to match against; the note is already written without names (close, step 5).
  const termsList = loadTerms(termsFile);
  const terms = termsList ? termsList.terms : [];
  const t = redact(title, terms);
  const b = redact(body, terms);
  title = t.text;
  body = b.text;
  const redacted = [...new Set([...t.redacted, ...b.redacted])];

  const ghEnv = ghEnvFor(dest, gh, env);
  if (ghEnv.held) return hold(baseKitDir, title, [ghEnv.held], now);
  // What travels about where it runs: the kit label the config carries (set by the kit that hands the config
  // down, e.g. "profesor-kit 3.2.1 · curso-inversion") and the environment line. Never the folder, never a name
  // (Roberto, 2026-10-07: what a reader needs is kit, version, flow, expected, happened — not who).
  const kitLine = dest.label ? `**Kit:** ${redact(dest.label, terms).text}\n` : '';
  const logFile = stateFile(baseKitDir, 'feedback-log.json');
  const day = now.toISOString().slice(0, 10);
  const log = readJson(logFile, []);
  const sent = (kind, text) => fs.appendFileSync(stateFile(baseKitDir, 'feedback-sent.md'), `\n## ${now.toISOString()} ${kind}: ${title}\n\n${text}\n`);
  const remember = number => { log.push({ day, issue: number }); fs.writeFileSync(logFile, JSON.stringify(log, null, 2) + '\n'); };

  // The same problem already open → everything goes to that issue, never a new one.
  let target = issue ? Number(issue) : null;
  let found = null;
  let open = [];
  const list = gh(['issue', 'list', '--repo', repo, '--state', 'open', '--search', target ? '' : `${title} in:title`, '--json', 'number,title,author,createdAt', '--limit', '20'], ghEnv);
  if (list.ok) try { open = JSON.parse(list.out); } catch { /* unreadable list → treat as new */ }
  if (target) found = open.find(i => i.number === target) || null;
  else {
    found = open.find(i => i.title.trim().toLowerCase() === title.trim().toLowerCase()) || null;
    if (found) target = found.number;
  }

  const manifest = readJson(path.join(baseKitDir, 'installed.json'), {});
  const sistema = { darwin: 'macOS', win32: 'Windows', linux: 'Linux' }[process.platform] || process.platform;
  const fullBody = `${body.trim()}\n\n---\n${kitLine}**Entorno:** base-kit ${manifest.version || '?'} · ${manifest.agent || '?'} · ${sistema} ${os.release()} · Node ${process.versions.node}\n`;

  if (target) {
    // Open too long → ask, once, on the issue itself (everything stays there).
    const ageDays = found && found.createdAt ? Math.floor((now - new Date(found.createdAt)) / 86400000) : 0;
    let asked;
    if (ageDays > dest.staleDays && !log.some(e => e.issue === target && e.asked)) {
      const q = `¿Qué pasa con esta issue? Lleva ${ageDays} días abierta y sigue pasando (${day}).`;
      const r = gh(['issue', 'comment', String(target), '--repo', repo, '--body', q], ghEnv);
      if (r.ok) { log.push({ day, issue: target, asked: true }); sent(`asked #${target}`, q); asked = true; }
    }
    const result = (status, extra = {}) => ({ status, number: target, ...(asked ? { asked } : {}), ...extra });
    // At most one addition per issue per day: a loop adds one comment, not fifty.
    if (log.some(e => e.day === day && e.issue === target && !e.asked)) { if (asked) fs.writeFileSync(logFile, JSON.stringify(log, null, 2) + '\n'); return result('already-today'); }
    if (meToo) {
      // Nothing new: my own issue → it is filed, say nothing; someone else's → a 👍, which says "me too" without
      // repeating the error.
      const me = gh(['api', 'user'], ghEnv);
      let login = null;
      if (me.ok) try { login = JSON.parse(me.out).login; } catch { /* unknown user → treat as someone else's */ }
      const mine = login && found && found.author && login === found.author.login;
      if (mine) { if (asked) fs.writeFileSync(logFile, JSON.stringify(log, null, 2) + '\n'); return result('already-filed'); }
      const r = gh(['api', `repos/${repo}/issues/${target}/reactions`, '-f', 'content=+1'], ghEnv);
      if (!r.ok) return hold(baseKitDir, title, [`gh failed: ${r.out.split('\n')[0].slice(0, 120)}`], now);
      remember(target);
      return result('me-too');
    }
    const r = gh(['issue', 'comment', String(target), '--repo', repo, '--body', `**Otra vez (${day}):** ${fullBody}`], ghEnv);
    if (!r.ok) return hold(baseKitDir, title, [`gh failed: ${r.out.split('\n')[0].slice(0, 120)}`], now);
    remember(target);
    sent(`comment #${target}`, fullBody);
    return result('commented', { redacted, noTerms: !termsList });
  }
  if (meToo) return { status: 'none' }; // nothing to join; a new issue needs what happened

  const r = gh(['issue', 'create', '--repo', repo, '--title', title, '--body', fullBody], ghEnv);
  if (!r.ok) return hold(baseKitDir, title, [`gh failed: ${r.out.split('\n')[0].slice(0, 120)}`], now);
  const url = r.out.trim().split('\n').pop().trim();
  const n = Number((url.match(/\/issues\/(\d+)/) || [])[1]) || null;
  if (n) remember(n);
  sent('issue', fullBody);
  return { status: 'created', url, redacted, noTerms: !termsList };
}

// Open kit issues, so the agent can tell whether this is a problem already filed (then --issue N).
function listOpen({ baseKitDir, gh = realGh, env = process.env }) {
  const dest = destination(baseKitDir);
  if (!dest) return null;
  const ghEnv = ghEnvFor(dest, gh, env);
  if (ghEnv.held) return null;
  const r = gh(['issue', 'list', '--repo', dest.repo, '--state', 'open', '--json', 'number,title', '--limit', '50'], ghEnv);
  if (!r.ok) return null;
  try { return JSON.parse(r.out); } catch { return null; }
}

if (require.main === module) {
  const arg = name => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; };
  if (process.argv.includes('--list')) {
    const open = listOpen({ baseKitDir: path.join(__dirname, '..') });
    console.log(open ? (open.map(i => `#${i.number} ${i.title}`).join('\n') || 'no open kit issues') : 'could not list kit issues (gh)');
    process.exit(0);
  }
  const title = arg('--title');
  const bodyFile = arg('--body-file');
  const meToo = process.argv.includes('--me-too');
  if (!title || (!bodyFile && !meToo)) { console.error('usage: kit-issue.js --list | --title "[area] what happens" (--body-file note.md | --me-too) [--issue N]'); process.exit(64); }
  const r = run({ baseKitDir: path.join(__dirname, '..'), title, body: bodyFile ? fs.readFileSync(bodyFile, 'utf8') : '', issue: arg('--issue'), meToo });
  const replaced = (r.redacted && r.redacted.length ? ` (replaced: ${r.redacted.join(', ')})` : '')
    + (r.noTerms ? ' (no company terms list on this machine: only the note itself kept names out)' : '');
  const say = {
    created: () => `Del kit: issue created ${r.url}${replaced}`,
    commented: () => `Del kit: added to #${r.number}${replaced}`,
    'already-today': () => `Del kit: #${r.number} already updated today`,
    'already-filed': () => `Del kit: #${r.number} is already filed (yours, nothing new)`,
    'me-too': () => `Del kit: 👍 on #${r.number} (someone else's, nothing new)`,
    none: () => 'Del kit: no open issue to join — file it with --body-file',
    held: () => `Del kit: not sent (${r.reasons.join(', ')}) — kept in .git/base-kit/feedback-pending.md`,
    off: () => 'Del kit: feedback is off (feedback.auto false, or no feedback.repo) — say it in the close line instead',
  }[r.status];
  console.log(say() + (r.asked ? ` — asked on #${r.number} what is up with it` : ''));
}

module.exports = { run, redact, listOpen };
