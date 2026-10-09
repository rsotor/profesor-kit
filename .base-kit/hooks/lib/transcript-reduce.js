'use strict';
// Reduces a Claude Code transcript (JSONL) to what the person typed, each turn with the tail of the assistant
// text just before it (what the person was answering or correcting). Everything else is dropped:
//   - tool results, isMeta entries, sidechain (subagent) entries, non-string content;
//   - messages the harness relays as user turns: agent messages, task notifications, system reminders,
//     slash-command wrappers and their output, bash-mode input/output, hook output, "[SYSTEM NOTIFICATION";
//   - entries whose `origin.kind` is set and is not "human".
// A message the person typed while the assistant was working arrives as an `attachment` entry of type
// `queued_command` (origin.kind "human", commandMode "prompt"): it is a person turn like any other.
// Used by hooks/capture.js. Pure: no writes.
const fs = require('node:fs');

const BEFORE_CHARS = 300; // assistant tail kept before each turn
const TURN_CHARS = 2500;  // a pasted document is cut: the head carries the person's request

const WRAPPER_TAGS = [
  'agent-message', 'task-notification', 'system-reminder', 'cross-session-message',
  'command-name', 'command-message', 'command-args', 'command-stdout', 'command-stderr',
  'local-command-stdout', 'local-command-stderr', 'local-command-caveat',
  'bash-input', 'bash-stdout', 'bash-stderr',
  'user-prompt-submit-hook', 'hook-output', 'hook_output', 'session-start-hook',
];
const WRAPPED = new RegExp(`^\\s*(?:Another Claude session sent a message:\\s*)?<(?:${WRAPPER_TAGS.join('|')})\\b`, 'i');
// The harness's own notes typed as user turns.
const HARNESS = /^\s*(\[SYSTEM NOTIFICATION|\[Request interrupted|Caveat: The messages below|Another Claude session sent a message)/i;

function isPersonTurn(o) {
  if (!o || o.isMeta || o.isSidechain) return null;
  let c;
  let origin = o.origin;
  if (o.type === 'attachment') {
    const a = o.attachment;
    if (!a || a.type !== 'queued_command' || (a.commandMode && a.commandMode !== 'prompt')) return null;
    origin = a.origin;
    if (!origin || origin.kind !== 'human') return null; // relayed agent messages, task notifications
    c = a.prompt;
  } else if (o.type === 'user') {
    c = o.message && o.message.content;
  } else return null;
  if (typeof c !== 'string') return null; // tool_result / content blocks
  if (origin && typeof origin === 'object' && origin.kind && origin.kind !== 'human') return null;
  if (WRAPPED.test(c) || HARNESS.test(c)) return null;
  const t = c.trim();
  return t || null;
}

function assistantText(o) {
  if (!o || o.type !== 'assistant' || o.isSidechain) return '';
  const c = o.message && o.message.content;
  if (typeof c === 'string') return c;
  if (!Array.isArray(c)) return '';
  return c.filter(b => b && b.type === 'text' && typeof b.text === 'string').map(b => b.text).join('\n');
}

const tail = (s, n) => (s.length > n ? '…' + s.slice(-n) : s);
const head = (s, n) => (s.length > n ? `${s.slice(0, n)} […${s.length - n} chars cut]` : s);

// lines: array of JSONL lines. fromLine: first line index to emit turns from (earlier lines still feed the
// assistant tail). -> { turns: [{ line, text, before, sdk }], lineCount, charsIn }
function reduceLines(lines, fromLine = 0) {
  const turns = [];
  let lastAssistant = '';
  let charsIn = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    if (i >= fromLine) charsIn += l.length;
    let o;
    try { o = JSON.parse(l); } catch { continue; }
    const a = assistantText(o);
    if (a.trim()) { lastAssistant = a.trim(); continue; }
    const text = isPersonTurn(o);
    if (!text) continue;
    const h = head(text, TURN_CHARS);
    // a message sent twice (or queued mid-turn and then delivered) counts once
    if (i >= fromLine && !turns.slice(-3).some(p => p.text === h)) {
      turns.push({ line: i, text: h, before: tail(lastAssistant.replace(/\s+/g, ' '), BEFORE_CHARS), sdk: o.promptSource === 'sdk' });
    }
    lastAssistant = '';
  }
  return { turns, lineCount: lines.length, charsIn };
}

// Complete lines only: a line still being written (no trailing newline) is left for the next run.
function readLines(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split('\n');
  lines.pop(); // '' after the last newline, or a partial line
  return lines;
}

function reduceFile(file, fromLine = 0) {
  return reduceLines(readLines(file), fromLine);
}

// A one-shot headless run (`claude -p` automation): one prompt turn, sent by an SDK entrypoint.
// Nothing in it answers the assistant, so there is nothing to capture.
function isHeadless(turns) {
  return turns.length === 1 && turns[0].sdk && !turns[0].before;
}

// Plain-text rendering for the model; also what the measurement counts as "chars out".
function render(turns) {
  return turns.map((t, i) => `### Turn ${i + 1}\n${t.before ? `[assistant, just before] ${t.before}\n` : ''}[person] ${t.text}`).join('\n\n');
}

module.exports = { reduceLines, reduceFile, readLines, isPersonTurn, isHeadless, render, BEFORE_CHARS, TURN_CHARS };

if (require.main === module) {
  // node transcript-reduce.js <file>... -> chars in -> chars out per file (measurement), or --print <file>.
  const args = process.argv.slice(2);
  if (args[0] === '--print') { process.stdout.write(render(reduceFile(args[1]).turns) + '\n'); return; }
  for (const f of args) {
    const r = reduceFile(f);
    const out = render(r.turns).length;
    console.log(`${f.split('/').pop()}\t${r.charsIn}\t${out}\t${r.turns.length} turns`);
  }
}
