#!/usr/bin/env node
'use strict';
// Commit check: blocks a commit that adds a secret, a secret-named file (.env, keys) or — in the person's
// own repos — a company term. Run by secret-guard.js before a `git commit` (Claude hook), or by hand
// (`node pre-commit.js`, exit 1 = blocked). No LLM, only the diff: milliseconds.
// Company terms: checked when the origin's owner is one of the person's owners in the local terms list,
// or when there is no origin yet; skipped in anyone else's repo (e.g. a company repo, where the terms are
// normal). Missing terms list: says so and checks secrets only — never silent.
// Output names file:line and the kind of hit, never the value or the term.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const S = require('./lib/secrets');

const git = (dir, args) => {
  try { return execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }); }
  catch { return null; }
};

// Owner from https://host/OWNER/repo(.git) or git@host-alias:OWNER/repo(.git).
function remoteOwner(dir) {
  const url = (git(dir, ['remote', 'get-url', 'origin']) || '').trim();
  if (!url) return null;
  const m = url.match(/[:/]([^/:]+)\/[^/]+?(\.git)?\/?$/);
  return m ? m[1].toLowerCase() : null;
}

// Added lines per file with their line numbers in the new version, from a -U0 diff.
function addedLines(diff) {
  const out = [];
  let file = null;
  let next = 0;
  for (const l of (diff || '').split('\n')) {
    if (l.startsWith('+++ ')) { file = l.startsWith('+++ b/') ? l.slice(6) : null; continue; }
    const h = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (h) { next = Number(h[1]); continue; }
    if (file && l.startsWith('+')) out.push({ file, line: next++, text: l.slice(1) });
  }
  return out;
}

// includeWorking: also unstaged tracked changes and untracked files — for `git add … && git commit` and
// `git commit -a`, where the files are not staged yet when the hook runs.
function scanRepo(dir, { includeWorking = false, env = process.env } = {}) {
  const hits = [];
  const notices = [];
  const list = loadTermsFor(dir, env, notices);

  const names = new Set((git(dir, ['diff', '--cached', '--name-only', '--diff-filter=d']) || '').split('\n').filter(Boolean));
  const diffs = [git(dir, ['diff', '--cached', '-U0', '--no-color'])];
  const untracked = [];
  if (includeWorking) {
    diffs.push(git(dir, ['diff', '-U0', '--no-color']));
    (git(dir, ['diff', '--name-only', '--diff-filter=d']) || '').split('\n').filter(Boolean).forEach(f => names.add(f));
    for (const f of (git(dir, ['ls-files', '--others', '--exclude-standard']) || '').split('\n').filter(Boolean)) {
      names.add(f);
      untracked.push(f);
    }
  }

  for (const f of names) if (S.isSecretName(f)) hits.push({ file: f, line: 0, kind: 'secret file' });
  // A term in a file name: the name itself must not be echoed, so the hit carries no file.
  for (const f of names) if (S.scanText(f, { terms: list ? list.terms : [] }).some(h => h.kind === 'term')) hits.push({ file: '(a staged file name)', line: 0, kind: 'term in name' });
  const opts = { terms: list ? list.terms : [] };
  const termName = f => list && S.scanText(f, { terms: list.terms }).some(h => h.kind === 'term');
  for (const a of diffs.flatMap(addedLines)) {
    if (S.isSecretName(a.file) || termName(a.file)) continue;
    for (const h of S.scanLines([a.text], { ...opts, firstLine: a.line })) hits.push({ file: a.file, ...h });
  }
  for (const f of untracked) {
    if (S.isSecretName(f) || termName(f)) continue;
    let text;
    try { text = fs.readFileSync(path.join(dir, f), 'utf8'); } catch { continue; }
    for (const h of S.scanText(text, opts)) hits.push({ file: f, ...h });
  }
  return { hits, notices };
}

function loadTermsFor(dir, env, notices) {
  const file = S.termsFile(env);
  const list = S.loadTerms(file);
  if (!list) {
    notices.push(`Company-terms list not found (${file}): company terms were NOT checked, secrets were.`);
    return null;
  }
  const owner = remoteOwner(dir);
  return owner === null || list.owners.includes(owner) ? list : null;
}

function describe(hits) {
  const kind = { secret: 'secret', term: 'company term', 'secret file': 'secret file (by name)', 'term in name': 'company term in its name' };
  return hits.map(h => `${h.line ? `${h.file}:${h.line}` : h.file} — ${kind[h.kind] || h.kind}`).join('\n');
}

const BLOCK_HELP = 'Commit blocked. Remove the value (use a variable, keep names in .env.example), unstage the file, or — for a term — rewrite it generically.';

function main() {
  const { hits, notices } = scanRepo(process.cwd());
  for (const n of notices) process.stderr.write(n + '\n');
  if (hits.length) {
    process.stderr.write(`${describe(hits)}\n${BLOCK_HELP}\n`);
    process.exit(1);
  }
  process.exit(0);
}

if (require.main === module) main();
module.exports = { scanRepo, describe, remoteOwner, addedLines, BLOCK_HELP };
