'use strict';
// One scanner for secrets and company terms, shared by the secret-guard hook and the commit check.
// The shapes mirror scripts/autosave.sh (SECRET_RE, PLACEHOLDER_RE, SECRET_NAME_RE, SECRET_NAME_OK);
// tests/security.test.js fails if the two drift apart.
// A hit says where (line) and what kind — never the matched value or term.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SECRET_RE = /ATATT[A-Za-z0-9_=-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer [A-Za-z0-9._~+/-]{30,}|machine [^ ]+ login [^ ]+ password [^ $<]{6,}/g;
// Applied to each match: `${X}`, `$X`, `<name>` or a prefix followed only by x/_/- is a placeholder.
const PLACEHOLDER_RE = /\$\{|\$[A-Z_]|<[A-Za-z_-]+>|^(ATATT|gh[pousr]_|github_pat_|xox[baprs]-|AKIA|Bearer |machine .* password )[xX_-]+$/;
const SECRET_NAME_RE = /(^|\/)(\.env(\..+)?|\.netrc|id_rsa[^/]*|id_ed25519[^/]*|[^/]*\.(pem|p12|key))$/;
const SECRET_NAME_OK = /(^|\/)\.env\.(example|sample|template)$/;

const isSecretName = file => SECRET_NAME_RE.test(file) && !SECRET_NAME_OK.test(file);

function hasSecret(line) {
  for (const m of line.matchAll(SECRET_RE)) if (!PLACEHOLDER_RE.test(m[0])) return true;
  return false;
}

const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A term matches wherever it appears, case-insensitive ("contains", not whole word): stricter, and no
// word-boundary gaps (user_company, companyname). Short or common terms give false positives — pick distinctive
// ones. autosave.sh does the same with `grep -iF`; a test keeps the two equal.
const termRes = terms => terms.map(t => new RegExp(escape(t), 'i'));

// -> [{ line, kind: 'secret'|'term' }], 1-based lines; `firstLine` shifts numbering for diff hunks.
function scanLines(lines, { terms = [], firstLine = 1 } = {}) {
  const res = termRes(terms);
  const hits = [];
  lines.forEach((text, i) => {
    const line = firstLine + i;
    if (hasSecret(text)) hits.push({ line, kind: 'secret' });
    if (res.some(r => r.test(text))) hits.push({ line, kind: 'term' });
  });
  return hits;
}

const scanText = (text, opts) => scanLines(text.split('\n'), opts);

// Local, untracked list (never in a repo): one company term per line; `owner:<name>` lines are the
// person's own GitHub owners (repos owned by them get the terms check). `#` comments allowed.
const termsFile = (env = process.env) =>
  env.BASE_KIT_TERMS_FILE || path.join(os.homedir(), '.config', 'base-kit', 'private-terms.txt');

function loadTerms(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  const terms = [];
  const owners = [];
  for (const raw of text.split('\n')) {
    const l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    const o = l.match(/^owner:\s*(\S+)$/i);
    if (o) owners.push(o[1].toLowerCase()); else terms.push(l);
  }
  return { terms, owners };
}

module.exports = { SECRET_RE, PLACEHOLDER_RE, isSecretName, hasSecret, scanLines, scanText, termsFile, loadTerms };
