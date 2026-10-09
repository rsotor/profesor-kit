#!/usr/bin/env node
'use strict';
// PreToolUse (Read|Bash): a key never reaches the chat, and a commit never carries one.
//   Read of a secret file (.env*, keys; not .env.example/.sample/.template) -> deny.
//   Bash that dumps a .env (cat/head/grep… on it) or prints a key-shaped variable (echo $X_TOKEN, env,
//   printenv) -> deny, with the safe way: check length (`wc -c`, `[ -n ]`) or open the file in the
//   person's editor (`open`, `code`). Loading (`set -a && source .env`) and names only (`cut -f1`) pass.
//   Bash running `git commit` -> the commit check (pre-commit.js); hits -> deny.
//   Dangerous commands: force push, `rm -rf` outside temp dirs, reading credential stores -> deny;
//   commands that destroy local work (reset --hard, clean -f, branch -D, checkout/restore .) -> ask.
//   Windows (Codex runs commands through PowerShell): Get-Content/gc/type/Select-String, $env:X and %X%,
//   Get-ChildItem Env:, Remove-Item -Recurse -Force and rd /s, backslash paths -> judged like the POSIX twin.
//   A wrapper (`cmd /c X`, `powershell -Command X`, `bash -c X`) is judged by X.
// Fails open on its own errors (a bug must not stop all work), with a warning. Read-only.
const path = require('node:path');
const S = require('./lib/secrets');
const { scanRepo, describe, BLOCK_HELP } = require('./pre-commit');

const DUMPERS = /^(cat|head|tail|less|more|bat|grep|egrep|rg|sed|awk|nl|strings|xxd|od|hexdump|tac|sort|uniq|diff|cp|base64)$/;
const WIN_DUMPERS = /^(get-content|gc|type|select-string|sls)$/i; // PowerShell is case-insensitive
const WIN_RM = /^(remove-item|ri|rmdir|rd|del|erase)$/i;
const WIN_LS = /^(get-childitem|gci|dir|ls)$/i;
const slashes = s => s.replace(/\\/g, '/').replace(/^['"]|['"]$/g, '');
const EDITORS = /^(open|code|cursor|subl|vim|nvim|nano|vi|emacs)$/;
// A key-shaped name has one of these as a whole `_`-separated part: GITHUB_TOKEN, API_KEY — not PATH.
// `PAT` only in upper case: `$pat` is a loop variable for a pattern far more often than a personal access token.
const KEY_NAME_RE = /(^|_)(TOKEN|KEY|SECRET|PASSWORD|PASSWD|PASS|CREDENTIALS?|AUTH|APIKEY)(_|$)/i;
const PAT_RE = /(^|_)PAT(_|$)/;
const KEY_NAME = { test: n => KEY_NAME_RE.test(n) || PAT_RE.test(n) };
// `$X`, `${X}`, PowerShell `$env:X` / `${env:X}`, cmd `%X%`.
const usesKeyVar = stage => [...stage.matchAll(/\$\{?(?:env:)?([A-Za-z_][A-Za-z0-9_]*)|%([A-Za-z_][A-Za-z0-9_]*)%/g)].some(m => KEY_NAME.test(m[1] || m[2]));

// Credential stores: never read (Read tool or a shell dumper).
const CRED_PATH = /(^|\/|~)\.(ssh|aws)\/|\.config\/gh[^/]*\/hosts\.yml$/;
const TEMP = /^(\/tmp\/|\/private\/tmp\/|\/var\/folders\/|\$\{?TMPDIR\}?|\$env:TE?MP\b|%TE?MP%|[A-Za-z]:\/Users\/[^/]+\/AppData\/Local\/Temp\/)/i;

function danger(stage) {
  const w = words(stage);
  if (!w.length) return null;
  const cmd = path.basename(slashes(w[0]));
  const args = w.slice(1);
  if (cmd === 'git' && args[0] === 'push' && args.some(a => /^(-f|--force(-with-lease)?(=.*)?)$/.test(a) || /^\+\S/.test(a)))
    return { decision: 'deny', reason: 'Force push is never done by Claude: it rewrites shared history. If it is really needed, the person runs it by hand.' };
  if (cmd === 'rm' || WIN_RM.test(cmd)) {
    const flags = args.filter(a => a.startsWith('-')).join(' ');
    const rec = /(^|\s)-[a-zA-Z]*[rR]|--recursive/.test(flags);
    const force = /(^|\s)-[a-zA-Z]*f|--force/.test(flags);
    // PowerShell: -Recurse / -Force, any unambiguous prefix (-r, -rec, -fo); cmd: rd /s.
    const psRec = args.some(a => /^-r(e(c(u(r(s(e)?)?)?)?)?)?$/i.test(a));
    const psForce = args.some(a => /^-fo(r(c(e)?)?)?$/i.test(a));
    const cmdRec = args.some(a => /^\/s$/i.test(a));
    const targets = args.filter(a => !a.startsWith('-') && !/^\/[a-z]$/i.test(a)).map(slashes); // cmd switches: /s, /q
    if (((rec && force) || (psRec && psForce) || cmdRec) && !(targets.length && targets.every(t => TEMP.test(t))))
      return { decision: 'deny', reason: '`rm -rf` / `Remove-Item -Recurse -Force` is not allowed outside temp dirs: move it to the Trash (Recycle Bin) instead (`mv <path> ~/.Trash/`), after looking at what it holds.' };
  }
  if ((DUMPERS.test(cmd) || WIN_DUMPERS.test(cmd)) && args.some(a => CRED_PATH.test(slashes(a))))
    return { decision: 'deny', reason: 'Reading a credential store (~/.ssh, ~/.aws, gh hosts) is not allowed.' };
  if (cmd === 'security' && /^find-(generic|internet)-password$/.test(args[0] || ''))
    return { decision: 'deny', reason: 'Reading passwords from the keychain is not allowed.' };
  if (cmd === 'git') {
    const sub = args[0];
    const ask = reason => ({ decision: 'ask', reason: `${reason} Destroys local work that is not saved anywhere: confirm.` });
    if (sub === 'reset' && args.includes('--hard')) return ask('git reset --hard.');
    if (sub === 'clean' && args.some(a => /^-[a-zA-Z]*f/.test(a) || a === '--force')) return ask('git clean -f.');
    if (sub === 'branch' && args.some(a => a === '-D' || (a === '--delete' && args.includes('--force')))) return ask('git branch -D.');
    if ((sub === 'checkout' || sub === 'restore') && !args.includes('--staged') && args[args.length - 1] === '.') return ask(`git ${sub} .`);
  }
  return null;
}

const SAFE_WAY = 'Never print a key. To check it: `printf %s "$VAR" | wc -c` or `[ -n "$VAR" ]`. To show it to the person: open the file in their editor (`open -e .env`), so the value never reaches the chat.';

// `cmd /c X`, `powershell -Command X`, `bash -c X`: judge X (quotes around it dropped).
const WRAPPER = /^\s*(?:cmd(?:\.exe)?\s+\/c|(?:powershell|pwsh)(?:\.exe)?(?:\s+-\w+)*?\s+-(?:c|command)|(?:bash|sh|zsh)\s+-l?c)\s+(.*)$/i;
function unwrap(seg) {
  for (let m; (m = WRAPPER.exec(seg));) seg = m[1].replace(/^(["'])(.*)\1$/, '$2');
  return seg;
}
const words = seg => unwrap(seg).trim().split(/\s+/).filter(Boolean);

function envFileArg(seg) {
  return words(seg).slice(1).some(w => {
    const a = slashes(w);
    return /(^|\/)\.env(\.[A-Za-z0-9_-]+)?$/.test(a) && !/\.env\.(example|sample|template)$/.test(a);
  });
}

// One stage of a pipeline -> 'deny-dump' | 'print' | null
function judgeStage(stage) {
  const w = words(stage);
  if (!w.length) return null;
  const cmd = path.basename(slashes(w[0]));
  if (EDITORS.test(cmd)) return null;
  if ((DUMPERS.test(cmd) || WIN_DUMPERS.test(cmd)) && envFileArg(stage)) return 'deny-dump';
  if (cmd === 'printenv') return w.length === 1 || w.slice(1).some(a => KEY_NAME.test(a)) ? 'print' : null;
  if (cmd === 'env') return w.length === 1 ? 'print' : null; // `env FOO=1 cmd` runs a command
  if (WIN_LS.test(cmd) && w.length === 2 && /^env:$/i.test(w[1])) return 'print'; // Get-ChildItem Env: lists every variable
  if (/^(echo|printf|write-output|write-host|write)$/i.test(cmd) && usesKeyVar(stage)) return 'print';
  if (w.length === 1 && /^\$(\{env:[A-Za-z0-9_]+\}|env:[A-Za-z0-9_]+)$/i.test(w[0]) && usesKeyVar(stage)) return 'print'; // bare `$env:X` prints it
  return null;
}

function judgeCommand(command) {
  let asked = null;
  for (const cmd of command.split(/&&|\|\||;|\n/)) {
    const stages = cmd.split('|');
    for (let i = 0; i < stages.length; i++) {
      const d = danger(stages[i]);
      if (d && d.decision === 'deny') return d;
      if (d && !asked) asked = d;
      const v = judgeStage(stages[i]);
      if (v === 'deny-dump') return { decision: 'deny', reason: `That command shows a .env file's values. ${SAFE_WAY} Names only: \`cut -d'=' -f1 .env\`.` };
      if (v === 'print') {
        const counted = stages.slice(i + 1).some(s => /^\s*wc\b/.test(s));
        if (!counted) return { decision: 'deny', reason: `That command would print a key. ${SAFE_WAY}` };
      }
    }
  }
  return asked;
}

const isCommit = command => /(^|[\s;&|(])git\b[^;&|\n]*\scommit\b/.test(command);
const stagesAtCommit = command => /\bgit\b[^;&|\n]*\sadd\b/.test(command) || /\scommit\b[^;&|\n]*\s(-[A-Za-z]*a[A-Za-z]*|--all)\b/.test(command);

// -> { decision: 'allow'|'deny', reason?, warning? }
function check(input, { env = process.env } = {}) {
  const allow = { decision: 'allow' };
  if (!input || typeof input.tool_name !== 'string') return allow;
  const ti = input.tool_input || {};
  if (input.tool_name === 'Read') {
    const f = typeof ti.file_path === 'string' ? slashes(ti.file_path) : '';
    if (CRED_PATH.test(f)) return { decision: 'deny', reason: 'Reading a credential store (~/.ssh, ~/.aws, gh hosts) is not allowed.' };
    return S.isSecretName(f) ? { decision: 'deny', reason: `Reading a secret file is not allowed. ${SAFE_WAY} Variable names: read .env.example.` } : allow;
  }
  if (input.tool_name !== 'Bash' || typeof ti.command !== 'string') return allow;
  const c = ti.command;
  const verdict = judgeCommand(c);
  if (verdict) return verdict;
  if (isCommit(c)) {
    const dir = input.cwd || env.CLAUDE_PROJECT_DIR || process.cwd();
    const { hits, notices } = scanRepo(dir, { includeWorking: stagesAtCommit(c), env });
    if (hits.length) return { decision: 'deny', reason: `${describe(hits)}\n${BLOCK_HELP}` };
    if (notices.length) return { decision: 'allow', warning: notices.join(' ') };
  }
  return allow;
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    try {
      const r = check(JSON.parse(raw));
      if (r.decision === 'deny' || r.decision === 'ask') {
        process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: r.decision, permissionDecisionReason: r.reason } }) + '\n');
      } else if (r.warning) {
        process.stdout.write(JSON.stringify({ systemMessage: r.warning }) + '\n');
      }
    } catch (e) {
      process.stdout.write(JSON.stringify({ systemMessage: `secret-guard error, not checked: ${e.message}` }) + '\n');
    }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { check, judgeCommand };
