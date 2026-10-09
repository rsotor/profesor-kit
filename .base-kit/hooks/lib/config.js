'use strict';
// Reads an installation's config. Never throws: every failure mode returns { active: false } so a hook that
// uses it is a silent no-op (plan B7). Engine layout: <target>/.base-kit/{installed.json, hooks/...}.
// Two layers (task 4b, 2026-10-07): the node's own, unversioned config (<state>/config.json) wins when it
// exists; otherwise the versioned one (manifest.configFile), which is what a middle kit hands its leaves.
// Run state (feedback log, capture markers, autosave) lives in <state> = .git/base-kit/, outside everything
// a middle kit versions and distributes, and shared by a repo's worktrees (git common dir).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const INACTIVE = { active: false, config: null, root: null, reason: '' };
const off = (reason, root = null) => ({ ...INACTIVE, reason, root });

// Where this installation keeps its run state: <common .git>/base-kit. A linked worktree's `.git` is a file
// (`gitdir: <path>`) whose target holds `commondir`; no git at all → .base-kit/state (already ignored).
function stateDir(baseKitDir) {
  const root = path.dirname(baseKitDir);
  const dotGit = path.join(root, '.git');
  try {
    const st = fs.statSync(dotGit);
    if (st.isDirectory()) return path.join(dotGit, 'base-kit');
    const m = fs.readFileSync(dotGit, 'utf8').match(/^gitdir:\s*(.+)$/m);
    if (m) {
      const gitdir = path.resolve(root, m[1].trim());
      let common = gitdir;
      try { common = path.resolve(gitdir, fs.readFileSync(path.join(gitdir, 'commondir'), 'utf8').trim()); } catch { /* not a worktree */ }
      return path.join(common, 'base-kit');
    }
  } catch { /* no .git */ }
  return path.join(root, '.base-kit', 'state');
}

// Installation root = parent of the .base-kit directory that holds the manifest.
// `baseKitDir` is injectable for tests; hooks pass path.join(__dirname, '..').
function loadConfig(baseKitDir) {
  const root = path.dirname(baseKitDir);
  try {
    const manifestPath = path.join(baseKitDir, 'installed.json');
    if (!fs.existsSync(manifestPath)) return off('no manifest', root);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest || typeof manifest.configFile !== 'string') return off('manifest has no configFile', root);
    const localPath = path.join(stateDir(baseKitDir), 'config.json');
    const versionedPath = path.isAbsolute(manifest.configFile) ? manifest.configFile : path.join(root, manifest.configFile);
    const configPath = fs.existsSync(localPath) ? localPath : versionedPath;
    if (!fs.existsSync(configPath)) return off('config missing', root);
    let config;
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) {
      return off(`${configPath === localPath ? 'local config' : 'config'} error: ${e.message}`, root);
    }
    if (!config || typeof config !== 'object' || Array.isArray(config)) return off('config is not an object', root);
    if (config.status !== 'configured') return off('unconfigured', root);
    return { active: true, config, root, reason: '', configPath };
  } catch (e) {
    return off(`config error: ${e.message}`, root);
  }
}

// Returns config[name] when it is a plain object, else null (missing/malformed section -> caller no-ops).
function section(result, name) {
  if (!result || !result.active) return null;
  const s = result.config[name];
  return s && typeof s === 'object' && !Array.isArray(s) ? s : null;
}

// Project root for resolving relative paths: CLAUDE_PROJECT_DIR wins, else the installation root
// (the parent of .base-kit/, i.e. where the hook script itself lives). Codex sets no such variable
// (developers.openai.com/codex/hooks: hooks run with the session cwd), so there the installation root
// is what applies; tests/codex.test.js covers a relative path from an unrelated cwd.
function projectRoot(result, env = process.env) {
  return env.CLAUDE_PROJECT_DIR || (result && result.root) || process.cwd();
}

function expandHome(p) {
  return p === '~' || p.startsWith('~/') ? path.join(os.homedir(), p.slice(1)) : p;
}

module.exports = { loadConfig, section, projectRoot, expandHome, stateDir };
