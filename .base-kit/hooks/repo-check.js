#!/usr/bin/env node
'use strict';
// Repo settings check (issue #6): at session start, reads the project's GitHub repo settings with `gh api` and
// tells the agent what differs from the kit's repo settings, with the command for each, so the agent offers them
// to the person (one by one, with their OK). Without it nobody knew the settings existed: the repo kept GitHub's
// defaults for days. Read-only: it never changes a setting itself.
//   SessionStart (startup|resume)  once per repo (Roberto, 2026-10-08: no need to read the settings 80 times): the
//                                  first session with a GitHub `origin` — a repo already set up, or one created
//                                  later — checks and tells; done. It checks again only when `origin` changes or the
//                                  kit's list changes (SETTINGS_VERSION, said in the CHANGELOG). gh failing → retried
//                                  next session. Off with `repoCheck.enabled: false`.
//   --run                          checks now and prints the result (e.g. after the repo goes public).
// Private repo on a free plan: only what GitHub allows there is asked for; the rest is named once as "when it goes
// public" (rulesets, auto-merge, secret scanning answer 403 or a 200 that changes nothing — issue #6).
// The `main` rule (PR required, no force push) is skipped while autosave is on: autosave pushes the current branch,
// `main` included, and the rule would block it.
// Silent when: no config, no git, no GitHub `origin`, no `gh` or not logged in, not an admin of the repo.
// State in .git/base-kit/repo-check.json. Fails open.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadConfig, section, stateDir } = require('./lib/config');

// Bump when SETTINGS changes (and say so in the CHANGELOG): every installation checks once more.
const SETTINGS_VERSION = 1;
const CALL_MS = 4_000;
const BUDGET_MS = 10_000;

// `owner/repo` from a GitHub remote URL (https or ssh, with or without .git), or null.
function githubRepo(url) {
  const m = String(url || '').trim().match(/github\.com[:/]([^/:\s]+)\/([^/\s]+?)(?:\.git)?\/?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

function realGh(args, env) {
  const r = spawnSync('gh', args, { env, encoding: 'utf8', timeout: CALL_MS });
  return { ok: r.status === 0, out: `${r.stdout || ''}`.trim(), err: `${r.stderr || ''}${r.error ? r.error.message : ''}` };
}

function originOf(root) {
  const r = spawnSync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

const notFound = r => !r.ok && /\b404\b|Not Found/i.test(r.err);
const json = r => { try { return r.ok ? JSON.parse(r.out) : null; } catch { return null; } };

// The kit's repo settings. `privateFree`: GitHub applies it on a private repo with a free plan.
// `check(ctx)` -> true (as wanted), false (differs) or null (could not tell: say nothing).
const SETTINGS = [
  {
    id: 'squash', label: 'squash merges only, titled by the PR', privateFree: true,
    check: ({ repo }) => repo.allow_squash_merge === true && repo.allow_merge_commit === false && repo.allow_rebase_merge === false,
    cmd: R => `gh api -X PATCH repos/${R} -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY`,
  },
  {
    id: 'delete-branch', label: 'delete head branches on merge', privateFree: true,
    check: ({ repo }) => repo.delete_branch_on_merge === true,
    cmd: R => `gh api -X PATCH repos/${R} -F delete_branch_on_merge=true`,
  },
  {
    id: 'dependabot-alerts', label: 'Dependabot alerts', privateFree: true,
    check: ({ call, R }) => { const r = call(['api', `repos/${R}/vulnerability-alerts`]); return r.ok ? true : notFound(r) ? false : null; },
    cmd: R => `gh api -X PUT repos/${R}/vulnerability-alerts`,
  },
  {
    id: 'dependabot-fixes', label: 'Dependabot security updates', privateFree: true,
    check: ({ call, R }) => { const j = json(call(['api', `repos/${R}/automated-security-fixes`])); return j && typeof j.enabled === 'boolean' ? j.enabled : null; },
    cmd: R => `gh api -X PUT repos/${R}/automated-security-fixes`,
  },
  {
    id: 'auto-merge', label: 'auto-merge', privateFree: false,
    check: ({ repo }) => repo.allow_auto_merge === true,
    cmd: R => `gh api -X PATCH repos/${R} -F allow_auto_merge=true`,
  },
  {
    id: 'secret-scanning', label: 'secret scanning + push protection', privateFree: false,
    check: ({ repo }) => {
      const s = repo.security_and_analysis;
      if (!s || !s.secret_scanning || !s.secret_scanning_push_protection) return null;
      return s.secret_scanning.status === 'enabled' && s.secret_scanning_push_protection.status === 'enabled';
    },
    cmd: R => `gh api -X PATCH repos/${R} -f 'security_and_analysis[secret_scanning][status]=enabled' -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'`,
  },
  {
    id: 'main-rule', label: 'rule on the default branch (PR required, no force push, no deletion)', privateFree: false, notWithAutosave: true,
    check: ({ call, R, repo }) => {
      const b = repo.default_branch;
      if (!b) return null;
      const rules = json(call(['api', `repos/${R}/rules/branches/${encodeURIComponent(b)}`]));
      if (Array.isArray(rules) && rules.some(x => x && x.type === 'pull_request')) return true;
      const classic = call(['api', `repos/${R}/branches/${encodeURIComponent(b)}/protection`]);
      return classic.ok ? true : notFound(classic) && Array.isArray(rules) ? false : null;
    },
    cmd: () => 'Settings → Rules → Rulesets → New branch ruleset (default branch; restrict deletions, block force pushes, require a PR with 0 approvals, required check: the CI summary)',
  },
];

// -> { repo: 'owner/repo', private, missing: [{label, cmd}], later: [label] } or { skip: reason }.
function inspect({ root, autosaveOn, gh = realGh, env = process.env, origin = originOf }) {
  const R = githubRepo(origin(root));
  if (!R) return { skip: 'no GitHub origin' };
  const started = Date.now();
  const call = args => (Date.now() - started > BUDGET_MS ? { ok: false, out: '', err: 'budget' } : gh(args, env));
  const repo = json(call(['api', `repos/${R}`]));
  if (!repo) return { skip: 'repo not readable (gh missing, not logged in, or no access)' };
  if (!repo.permissions || repo.permissions.admin !== true) return { skip: 'not an admin of the repo' };
  const priv = repo.private === true;
  const missing = [];
  const later = [];
  for (const s of SETTINGS) {
    if (s.notWithAutosave && autosaveOn) continue;
    if (priv && !s.privateFree) { later.push(s.label); continue; }
    let ok = null;
    try { ok = s.check({ repo, call, R }); } catch { ok = null; }
    if (ok === false) missing.push({ label: s.label, cmd: s.cmd(R) });
  }
  return { repo: R, private: priv, missing, later };
}

function message(r) {
  if (!r.missing.length) return null;
  const lines = [
    `Repo settings: ${r.repo}${r.private ? ' (private)' : ''} differs from the kit's repo settings in ${r.missing.length}. `
      + 'Tell the person in one line and offer to apply them, one by one, only with their OK (check each in the web after: a 2xx can change nothing):',
    ...r.missing.map(m => `- ${m.label}: \`${m.cmd}\``),
  ];
  if (r.private && r.later.length) lines.push(`While private on a free plan GitHub does not allow: ${r.later.join(', ')} — mention it once; when the repo goes public, \`node .base-kit/hooks/repo-check.js --run\` lists them.`);
  return lines.join('\n');
}

function readState(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } }

// -> { context } | null. `deps` injectable for tests.
function handle(input, baseKitDir, deps = {}) {
  const { gh = realGh, env = process.env, now = Date.now(), origin = originOf } = deps;
  if (!input || input.hook_event_name !== 'SessionStart' || !['startup', 'resume'].includes(input.source)) return null;
  const cfg = loadConfig(baseKitDir);
  if (!cfg.active) return null;
  const rc = section(cfg, 'repoCheck') || {};
  if (rc.enabled === false) return null;
  const root = path.dirname(baseKitDir);
  const R = githubRepo(origin(root));
  if (!R) return null; // no repo yet: checked in the first session that has one
  const file = path.join(stateDir(baseKitDir), 'repo-check.json');
  const st = readState(file);
  if (st.repo === R && st.version >= SETTINGS_VERSION) return null;
  const a = section(cfg, 'autosave') || {};
  const r = inspect({ root, autosaveOn: a.enabled !== false, gh, env, origin: () => `https://github.com/${R}` });
  if (r.skip && r.skip !== 'not an admin of the repo') return null; // gh missing or offline: next session
  const done = { repo: R, version: SETTINGS_VERSION, checkedAt: new Date(now).toISOString(), missing: r.missing ? r.missing.map(m => m.label) : [] };
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(done, null, 2) + '\n'); } catch { /* best effort */ }
  const text = r.skip ? null : message(r);
  return text ? { context: text } : null;
}

function main() {
  const baseKitDir = path.join(__dirname, '..');
  if (process.argv.includes('--run')) {
    const cfg = loadConfig(baseKitDir);
    const a = section(cfg, 'autosave') || {};
    const r = inspect({ root: path.dirname(baseKitDir), autosaveOn: a.enabled !== false });
    console.log(r.skip ? `Repo settings: not checked (${r.skip}).` : message(r) || `Repo settings: ${r.repo} has the kit's repo settings.`);
    return;
  }
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    try {
      const r = handle(JSON.parse(raw || '{}'), baseKitDir);
      if (r) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: r.context } }) + '\n');
    } catch { /* fails open */ }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { handle, inspect, message, githubRepo, SETTINGS, SETTINGS_VERSION };
