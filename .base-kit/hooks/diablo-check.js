#!/usr/bin/env node
'use strict';
// PreToolUse (matcher `mcp__.*`): denies a gated tool call while the file it publishes still holds an
// open `@diablo` callout (`> [!warning] @diablo — ...`). Callouts inside code fences do not count.
// Fails open on any error; unreadable path -> allow + warning. Read-only.
const fs = require('node:fs');
const path = require('node:path');
const { loadConfig, section, projectRoot, expandHome } = require('./lib/config');

// Tool-name patterns: exact name, or `*` wildcard (e.g. `mcp__wksp__*`).
function toolMatches(patterns, name) {
  return patterns.some(p => typeof p === 'string' &&
    new RegExp('^' + p.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(name));
}

function pathsFrom(toolInput, keys) {
  const out = [];
  for (const k of keys) {
    const v = toolInput && toolInput[k];
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) out.push(...v.filter(x => typeof x === 'string'));
  }
  return out;
}

// Returns line numbers (1-based) of open callouts outside code fences.
function findOpenDiablo(text) {
  const hits = [];
  let fence = null; // the fence marker that opened the current block
  text.split('\n').forEach((line, i) => {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      return;
    }
    if (!fence && /^\s*>\s*\[![a-z]+\][+-]?\s*@diablo\b/i.test(line)) hits.push(i + 1);
  });
  return hits;
}

// -> { decision: 'allow'|'deny', reason?, warning? }
function check(input, baseKitDir, env = process.env) {
  const cfg = loadConfig(baseKitDir);
  const d = section(cfg, 'diablo');
  if (!d || !Array.isArray(d.tools) || !Array.isArray(d.pathKeys)) return { decision: 'allow' };
  if (typeof input.tool_name !== 'string' || !toolMatches(d.tools, input.tool_name)) return { decision: 'allow' };
  const root = projectRoot(cfg, env);
  const denials = [];
  const warnings = [];
  for (const p of pathsFrom(input.tool_input, d.pathKeys)) {
    const expanded = expandHome(p);
    const abs = path.isAbsolute(expanded) ? expanded : path.join(root, expanded);
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); } catch { warnings.push(`diablo-check: cannot read ${p}; not checked`); continue; }
    for (const line of findOpenDiablo(text)) denials.push(`${p}:${line}`);
  }
  if (denials.length) {
    return { decision: 'deny', reason: `Open @diablo callout(s) at ${denials.join(', ')}. Resolve them (answer, apply, delete the callout) before publishing.` };
  }
  return warnings.length ? { decision: 'allow', warning: warnings.join('; ') } : { decision: 'allow' };
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    try {
      const r = check(JSON.parse(raw), path.join(__dirname, '..'));
      if (r.decision === 'deny') {
        process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: r.reason } }) + '\n');
      } else if (r.warning) {
        process.stdout.write(JSON.stringify({ systemMessage: r.warning }) + '\n');
      }
    } catch (e) { if (process.env.BASE_KIT_DEBUG) console.error(e); /* fail open */ }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { check, findOpenDiablo, toolMatches };
