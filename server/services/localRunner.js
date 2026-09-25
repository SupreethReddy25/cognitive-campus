/**
 * Local Runner — dependency-free code execution fallback.
 *
 * Used when no Piston instance is reachable (the public Piston API is now whitelist-only and
 * Docker is not always available on a student's laptop). Runs code in a throw-away temp
 * directory with a hard wall-clock timeout, a scrubbed environment (no server secrets leak into
 * user code), and capped output.
 *
 *   JavaScript  → the current Node binary
 *   Python      → `python` / `python3` if installed
 *   Java        → `javac` + `java` if a JDK is installed
 *   C++         → `g++` / `clang++` if installed
 *
 * ⚠  This is a *development* convenience, not a hardened sandbox. It is disabled in production
 * unless ALLOW_LOCAL_EXEC=true; production deployments should run Piston.
 *
 * @module localRunner
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const logger = require('../utils/logger');

const MAX_OUTPUT = 512 * 1024;

const isEnabled = () => process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCAL_EXEC === 'true';

const probe = (cmd, args = ['--version']) => {
  try {
    const r = spawnSync(cmd, args, { timeout: 4000, encoding: 'utf8', windowsHide: true });
    return !r.error && r.status === 0;
  } catch {
    return false;
  }
};

let toolchain = null;
const detectToolchain = () => {
  if (toolchain) return toolchain;
  const python = ['python', 'python3', 'py'].find((c) => probe(c));
  const javac = probe('javac', ['-version']);
  const java = probe('java', ['-version']);
  const cpp = ['g++', 'clang++'].find((c) => probe(c));
  toolchain = {
    javascript: true,
    python: python || null,
    java: javac && java,
    cpp: cpp || null
  };
  logger.info('Local runner toolchain', { python: python || 'none', java: !!(javac && java), cpp: cpp || 'none' });
  return toolchain;
};

const isLanguageAvailable = (language) => {
  if (!isEnabled()) return false;
  const t = detectToolchain();
  return !!t[language];
};

const scrubbedEnv = () => {
  const keep = ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'LANG', 'PATHEXT', 'COMSPEC', 'JAVA_HOME'];
  const env = {};
  keep.forEach((k) => { if (process.env[k] !== undefined) env[k] = process.env[k]; });
  env.PYTHONIOENCODING = 'utf-8';
  env.PYTHONDONTWRITEBYTECODE = '1';
  return env;
};

/**
 * Spawns a process with timeout + output caps, feeding `stdin`.
 * @returns {Promise<{stdout:string, stderr:string, exitCode:number, timedOut:boolean, time:number}>}
 */
const run = (cmd, args, { cwd, stdin = '', timeoutMs = 6000 }) =>
  new Promise((resolve) => {
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let child;
    try {
      child = spawn(cmd, args, { cwd, env: scrubbedEnv(), windowsHide: true });
    } catch (err) {
      return resolve({ stdout: '', stderr: err.message, exitCode: -1, timedOut: false, time: 0 });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch { /* already gone */ }
    }, timeoutMs);

    child.stdout.on('data', (d) => { if (stdout.length < MAX_OUTPUT) stdout += d.toString(); });
    child.stderr.on('data', (d) => { if (stderr.length < MAX_OUTPUT) stderr += d.toString(); });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: stderr + err.message, exitCode: -1, timedOut, time: Date.now() - started });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: timedOut ? -1 : code ?? -1, timedOut, time: Date.now() - started });
    });
    child.stdin.on('error', () => { /* process ended before reading stdin */ });
    child.stdin.end(stdin);
  });

/** Hide temp paths and interpreter-internal stack frames from user-visible errors. */
const sanitize = (text, dir) =>
  String(text || '')
    .split(dir).join('.')
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => !/^\s+at .*(node:internal|\(node:)/.test(l))
    .join('\n')
    .trim();

/**
 * Execute source code locally.
 *
 * @returns {Promise<{stdout:string, stderr:string, exitCode:number, time:number}>}
 */
const runLocal = async (language, code, stdin = '', timeoutMs = 5000) => {
  const tools = detectToolchain();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-run-'));
  const cleanup = () => fs.rm(dir, { recursive: true, force: true }, () => {});

  try {
    let result;
    if (language === 'javascript') {
      fs.writeFileSync(path.join(dir, 'solution.js'), code);
      result = await run(process.execPath, ['--max-old-space-size=256', 'solution.js'], { cwd: dir, stdin, timeoutMs });
    } else if (language === 'python') {
      fs.writeFileSync(path.join(dir, 'solution.py'), code);
      const args = tools.python === 'py' ? ['-3', 'solution.py'] : ['solution.py'];
      result = await run(tools.python, args, { cwd: dir, stdin, timeoutMs });
    } else if (language === 'java') {
      fs.writeFileSync(path.join(dir, 'Main.java'), code);
      const compiled = await run('javac', ['Main.java'], { cwd: dir, timeoutMs: 20000 });
      if (compiled.exitCode !== 0) {
        return { stdout: '', stderr: `Compilation error:\n${sanitize(compiled.stderr, dir)}`, exitCode: 1, time: compiled.time };
      }
      result = await run('java', ['-Xmx256m', '-cp', dir, 'Main'], { cwd: dir, stdin, timeoutMs: timeoutMs + 2000 });
    } else if (language === 'cpp') {
      fs.writeFileSync(path.join(dir, 'solution.cpp'), code);
      const exe = process.platform === 'win32' ? 'solution.exe' : 'solution';
      const compiled = await run(tools.cpp, ['-O2', '-std=c++17', '-o', exe, 'solution.cpp'], { cwd: dir, timeoutMs: 30000 });
      if (compiled.exitCode !== 0) {
        return { stdout: '', stderr: `Compilation error:\n${sanitize(compiled.stderr, dir)}`, exitCode: 1, time: compiled.time };
      }
      result = await run(path.join(dir, exe), [], { cwd: dir, stdin, timeoutMs });
    } else {
      return { stdout: '', stderr: `Unsupported language: ${language}`, exitCode: -1, time: 0 };
    }

    if (result.timedOut) {
      result.stderr = `Time Limit Exceeded (${timeoutMs / 1000}s)\n${result.stderr}`.trim();
    }
    return { stdout: result.stdout, stderr: sanitize(result.stderr, dir), exitCode: result.exitCode, time: result.time };
  } finally {
    cleanup();
  }
};

module.exports = { runLocal, isLanguageAvailable, detectToolchain, isEnabled };
