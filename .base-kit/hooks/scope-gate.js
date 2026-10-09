#!/usr/bin/env node
'use strict';
// PreToolUse (Write|Edit): capture gate for the how-to store (`knowledge.howTo`). Every JSON entry there
// declares `scope`: "situational" (+ one-line `scope_reason`, optional `near: <action>`) — an always-rule
// belongs in its action's file (`knowledge.actions`), never in a pattern.
// Existing files without `scope` are grandfathered unless `actionsGate.enforceExisting` is true.
// No `knowledge.actions` -> no-op. Non-JSON files and unparseable content are allowed. Fails open. Read-only.
const fs = require('node:fs');
const path = require('node:path');
const { loadConfig, section, projectRoot } = require('./lib/config');
const A = require('./lib/actions');

// Content the file will have after this Write/Edit; null when it cannot be worked out.
function nextContent(input, abs) {
  const ti = input.tool_input || {};
  if (input.tool_name === 'Write') return typeof ti.content === 'string' ? ti.content : null;
  let cur;
  try { cur = fs.readFileSync(abs, 'utf8'); } catch { return null; }
  const edits = input.tool_name === 'MultiEdit' && Array.isArray(ti.edits) ? ti.edits : [ti];
  for (const e of edits) {
    if (typeof e.old_string !== 'string' || typeof e.new_string !== 'string') return null;
    cur = e.replace_all ? cur.split(e.old_string).join(e.new_string) : cur.replace(e.old_string, () => e.new_string);
  }
  return cur;
}

function inside(dir, file) {
  const r = path.relative(dir, file);
  return r === '' || (!r.startsWith('..') && !path.isAbsolute(r));
}

// -> { decision: 'allow'|'deny', reason? }
function check(input, baseKitDir, env = process.env) {
  const allow = { decision: 'allow' };
  if (!input || !/^(Write|Edit|MultiEdit)$/.test(input.tool_name)) return allow;
  const cfg = loadConfig(baseKitDir);
  const actions = A.getActions(cfg);
  const k = section(cfg, 'knowledge');
  if (!actions || !k || typeof k.howTo !== 'string') return allow;
  const fp = input.tool_input && input.tool_input.file_path;
  if (typeof fp !== 'string' || !fp.endsWith('.json')) return allow;
  const root = projectRoot(cfg, env);
  const abs = A.real(A.resolveIn(root, fp));
  if (!inside(A.real(A.resolveIn(root, k.howTo)), abs)) return allow;
  const text = nextContent(input, abs);
  if (text === null) return allow;
  let doc;
  try { doc = JSON.parse(text); } catch { return allow; }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return allow;
  const deny = reason => ({ decision: 'deny', reason });
  const scope = doc.scope;
  if (scope === undefined) {
    const gate = section(cfg, 'actionsGate');
    if (fs.existsSync(abs) && !(gate && gate.enforceExisting === true)) return allow; // grandfathered
    return deny('declare scope: situational or an action. Add "scope": "situational" with a one-line "scope_reason", or, if the rule applies every time an action happens, write it into that action\'s file instead.');
  }
  if (scope === 'situational') {
    const r = doc.scope_reason;
    if (typeof r !== 'string' || !r.trim() || /[\r\n]/.test(r.trim())) return deny('scope "situational" needs "scope_reason": one line saying in which specific case this applies.');
    return allow;
  }
  if (typeof scope === 'string' && actions[scope]) {
    return deny(`always-rule for ${scope}: write it into ${actions[scope].file} instead of a pattern.`);
  }
  if (scope === A.COMMON) {
    return deny('always-rule for common: write it into the common rules file (none configured yet: add knowledge.actions.common with its file) instead of a pattern.');
  }
  return deny(`new action ${JSON.stringify(scope)}? Propose it to the person: file + triggers; on OK add it to config/base-kit.json knowledge.actions and write the rule into that file.`);
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    try {
      const r = check(JSON.parse(raw), path.join(__dirname, '..'));
      if (r.decision === 'deny') {
        process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `scope-gate: ${r.reason}` } }) + '\n');
      }
    } catch (e) { if (process.env.BASE_KIT_DEBUG) console.error(e); /* fail open */ }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { check, nextContent };
