#!/usr/bin/env node
'use strict';
// PostToolUse (Write|Edit): warns once when a listed rules file goes over wordCap.limit, or an action
// rules file over wordCap.actionsCap.
// Read-only: writes nothing to disk, so it cannot loop. Fails open on any error.
const fs = require('node:fs');
const path = require('node:path');
const { loadConfig, section, projectRoot, expandHome } = require('./lib/config');

function countWords(text) {
  const m = text.match(/\S+/g);
  return m ? m.length : 0;
}

// TODO: entries with a placeholder such as `<proj>` (workspace's MEMORY.md path) cannot be resolved
// to one file; they are skipped until the plan decides how to match them.
function resolveListed(entry, root) {
  if (typeof entry !== 'string' || entry.includes('<')) return null;
  const p = expandHome(entry);
  return real(path.resolve(path.isAbsolute(p) ? p : path.join(root, p)));
}

// Compare real paths (macOS /var -> /private/var); a path that does not exist compares as written.
function real(p) {
  try { return fs.realpathSync(p); } catch { return p; }
}

// Limit that applies to the edited file: `limit` for a listed file, else `actionsCap` for an action
// rules file (`knowledge.actions`, paid on every injection). null = not watched.
function limitFor(cfg, cap, edited, root) {
  if (typeof cap.limit === 'number' && Array.isArray(cap.files) && cap.files.some(f => resolveListed(f, root) === edited)) return cap.limit;
  // A per-action `cap` (e.g. a smaller one for `common`, injected with every action) wins over actionsCap.
  const k = section(cfg, 'knowledge');
  const actions = k && k.actions && typeof k.actions === 'object' ? Object.values(k.actions) : [];
  const a = actions.find(x => x && resolveListed(x.file, root) === edited);
  if (!a) return null;
  if (typeof a.cap === 'number') return a.cap;
  return typeof cap.actionsCap === 'number' ? cap.actionsCap : null;
}

function check(input, baseKitDir, env = process.env) {
  const cfg = loadConfig(baseKitDir);
  const cap = section(cfg, 'wordCap');
  if (!cap) return null;
  const filePath = input && input.tool_input && input.tool_input.file_path;
  if (typeof filePath !== 'string') return null;
  const root = projectRoot(cfg, env);
  const edited = real(path.resolve(path.isAbsolute(filePath) ? filePath : path.join(root, filePath)));
  const limit = limitFor(cfg, cap, edited, root);
  if (limit === null) return null;
  const words = countWords(fs.readFileSync(edited, 'utf8'));
  if (words <= limit) return null;
  return `word-cap: ${path.basename(edited)} has ${words} words, over the limit of ${limit}. Trim before adding more.`;
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    try {
      const msg = check(JSON.parse(raw), path.join(__dirname, '..'));
      if (msg) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg } }) + '\n');
    } catch (e) { if (process.env.BASE_KIT_DEBUG) console.error(e); /* fail open */ }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { check, countWords };
