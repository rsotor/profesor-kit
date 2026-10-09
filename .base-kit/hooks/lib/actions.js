'use strict';
// Shared helpers for action rules (`knowledge.actions` in config/base-kit.json):
//   { "<action>": { "file": "<path>", "triggers": { "skills": [], "prompt": [], "tools": [], "paths": [],
//                                                   "skipProjectRepo": false } } }
// `skipProjectRepo: true`: a `Bash:` trigger does not fire for a command that runs in the project's own git repo
// (issue #5: the session-close push of the project's state is not a PR). Unknown directory -> it fires.
// `paths` globs: `*` stays in one directory, `**` crosses any depth (`initiatives/**/story-*.md`).
// `common` is special: injected together with any other action. No `actions` -> every caller no-ops.
const fs = require('node:fs');
const path = require('node:path');
const { section, expandHome } = require('./config');

const COMMON = 'common';

// -> { name: { file, triggers: { skills, prompt, tools, paths } } } or null when absent/malformed.
function getActions(cfg) {
  const k = section(cfg, 'knowledge');
  const a = k && k.actions;
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
  const out = {};
  for (const [name, entry] of Object.entries(a)) {
    if (!entry || typeof entry !== 'object' || typeof entry.file !== 'string') continue;
    const t = entry.triggers && typeof entry.triggers === 'object' ? entry.triggers : {};
    const list = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x) : []);
    out[name] = {
      file: entry.file,
      triggers: { skills: list(t.skills), prompt: list(t.prompt), tools: list(t.tools), paths: list(t.paths), skipProjectRepo: t.skipProjectRepo === true },
    };
  }
  return Object.keys(out).length ? out : null;
}

function resolveIn(root, p) {
  const e = expandHome(p);
  return path.resolve(path.isAbsolute(e) ? e : path.join(root, e));
}

// Glob -> RegExp over posix paths: `**` crosses directories, `*` and `?` do not.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      i++;
      if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}

// Path relative to the project root, posix separators; null when it is outside the root.
function relToRoot(root, p) {
  const r = path.relative(real(root), real(resolveIn(root, p)));
  if (!r || r.startsWith('..') || path.isAbsolute(r)) return null;
  return r.split(path.sep).join('/');
}

// Real path of `p`, or of its deepest existing parent plus the rest (macOS /var -> /private/var).
function real(p) {
  try { return fs.realpathSync(p); } catch { /* not there yet */ }
  const parent = path.dirname(p);
  return parent === p ? p : path.join(real(parent), path.basename(p));
}

function pathMatches(globs, root, filePath) {
  const rel = relToRoot(root, filePath);
  return rel !== null && globs.some(g => globToRegExp(g).test(rel));
}

// Splits a shell command into simple commands on `&&`, `||`, `;`, `|`, `&` and newlines, outside quotes.
// Each segment -> its words (quotes removed, leading VAR=value assignments dropped).
function parseCommands(command) {
  const segs = [];
  let words = [];
  let word = '';
  let has = false;
  let quote = null;
  const endWord = () => { if (has) words.push(word); word = ''; has = false; };
  const endSeg = () => { endWord(); if (words.length) segs.push(words); words = []; };
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && i + 1 < command.length) { word += command[++i]; }
      else word += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; has = true; continue; }
    if (c === '\\' && i + 1 < command.length) { word += command[++i]; has = true; continue; }
    if (c === ';' || c === '|' || c === '&' || c === '\n') { endSeg(); continue; }
    if (c === '(' || c === ')') { endWord(); continue; }
    if (/\s/.test(c)) { endWord(); continue; }
    word += c; has = true;
  }
  endSeg();
  return segs.map(ws => { let i = 0; while (i < ws.length - 1 && /^[A-Za-z_]\w*=/.test(ws[i])) i++; return ws.slice(i); });
}

// `git -C <dir> ...` -> { dir, words without -C }; anything else unchanged.
function gitDashC(ws) {
  let i = 1;
  let dir;
  while (ws[0] === 'git' && ws[i] === '-C' && i + 1 < ws.length) { dir = dir === undefined ? ws[i + 1] : path.join(dir, ws[i + 1]); i += 2; }
  return i === 1 ? { words: ws } : { dir, words: ['git', ...ws.slice(i)] };
}

// Directory a simple command runs in: `cwd`, moved by earlier `cd X` and its own `git -C X`. null when it cannot be
// told from the text (no cwd, `cd -`, `cd $VAR`, a subshell). Heuristic by design: null keeps the trigger firing.
function resolveDir(base, arg) {
  if (base === null || arg === undefined || /[$`*?~]/.test(arg.replace(/^~(?=\/|$)/, ''))) return null;
  return path.resolve(base, expandHome(arg));
}

// Each simple command whose words start with `prefix` -> the directory it runs in (null = unknown).
function bashMatchDirs(prefix, command, cwd = null) {
  const want = prefix.trim().split(/\s+/).filter(Boolean);
  const opaque = /[()`]|\$\(/.test(command); // a subshell can undo a `cd`: stop tracking it
  let dir = typeof cwd === 'string' && cwd ? cwd : null;
  const out = [];
  for (const ws of parseCommands(command)) {
    if (ws[0] === 'cd') {
      dir = opaque || ws.length > 2 ? null : resolveDir(dir, ws.length === 1 ? '~' : ws[1] === '-' ? undefined : ws[1]);
      continue;
    }
    const g = gitDashC(ws);
    if (!want.every((w, i) => g.words[i] === w)) continue;
    out.push(g.dir === undefined ? dir : resolveDir(dir, g.dir));
  }
  return out;
}

// True when one simple command in `command` starts with the words of `prefix` (e.g. "gh pr create").
function bashMatches(prefix, command) {
  return bashMatchDirs(prefix, command).length > 0;
}

// Top of the git repo that holds `dir` (nearest ancestor with a `.git` entry), real path; null when none.
function repoTop(dir) {
  let d = real(dir);
  for (;;) {
    if (fs.existsSync(path.join(d, '.git'))) return d;
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
}

// Tool-name pattern: exact, or with `*` wildcards (e.g. `mcp__docs__*`).
function nameMatches(pattern, name) {
  return new RegExp('^' + pattern.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(name);
}

// Tool trigger: "Bash:<command prefix>" matches the parsed command; anything else matches the tool name.
// `skipRepo` (the project root, from `skipProjectRepo`): a Bash match that runs in that root's git repo does not count.
function toolTriggerMatches(trigger, toolName, toolInput, { cwd = null, skipRepo = null } = {}) {
  const m = trigger.match(/^Bash:(.*)$/);
  if (m) {
    const cmd = toolInput && toolInput.command;
    if (toolName !== 'Bash' || typeof cmd !== 'string') return false;
    const dirs = bashMatchDirs(m[1], cmd, cwd);
    if (!skipRepo) return dirs.length > 0;
    const own = repoTop(skipRepo);
    return dirs.some(d => d === null || own === null || repoTop(d) !== own);
  }
  return nameMatches(trigger, toolName);
}

// A skill matches by its name, with or without a `plugin:` prefix.
function skillMatches(skills, name) {
  if (typeof name !== 'string' || !name) return false;
  const bare = name.replace(/^\//, '');
  const short = bare.includes(':') ? bare.slice(bare.lastIndexOf(':') + 1) : bare;
  return skills.some(s => s === bare || s === short);
}

// Prompt regexes compile with flags 'iu'. In JS `\b` is ASCII-only even with `u`: it sees no boundary
// before `é` ("épica") and a false one inside "publícalo". For words that may carry an accent use
// `(?<![\p{L}])word(?![\p{L}])`. A regex that does not compile never matches (the sweep reports it).
const PROMPT_FLAGS = 'iu';
function compilePrompt(r) {
  try { return new RegExp(r, PROMPT_FLAGS); } catch { return null; }
}

function promptMatches(trigger, prompt) {
  if (typeof prompt !== 'string') return false;
  const trimmed = prompt.trimStart();
  if (trigger.skills.some(s => new RegExp('^/' + s.replace(/[.+?^${}()|[\]\\*]/g, '\\$&') + '(?:\\s|$)').test(trimmed))) return true;
  return trigger.prompt.some(r => { const re = compilePrompt(r); return !!re && re.test(prompt); });
}

module.exports = {
  COMMON, getActions, resolveIn, globToRegExp, relToRoot, pathMatches, parseCommands, bashMatches,
  bashMatchDirs, repoTop,
  nameMatches, toolTriggerMatches, skillMatches, promptMatches, compilePrompt, real,
};
