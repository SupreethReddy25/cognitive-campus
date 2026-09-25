/**
 * C++ execution harness (LeetCode-style).
 *
 * Wraps a student's `class Main { public: <ret> method(<params>) {...} };` with a main() that
 * reads one JSON-ish argument per stdin line, calls the method and prints the JSON result —
 * so C++ behaves exactly like the JavaScript / Python / Java harnesses.
 *
 * The reader/printer helpers live in harness/cpp_helpers.hpp (kept out of a JS template literal
 * so the C++ needs no escaping).
 *
 * @module cppHarness
 */

const fs = require('fs');
const path = require('path');

let helpers = null;
const getHelpers = () => {
  if (!helpers) helpers = fs.readFileSync(path.join(__dirname, 'harness', 'cpp_helpers.hpp'), 'utf8');
  return helpers;
};

/** Splits a C++ parameter list on top-level commas (ignores commas inside <...>). */
const splitCppParams = (raw) => {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const c of raw) {
    if (c === '<') depth++;
    if (c === '>') depth--;
    if (c === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};

const NOT_METHODS = new Set(['if', 'for', 'while', 'switch', 'return', 'sizeof']);

/**
 * Extracts { className, methodName, returnType, params[{type,name}] } from C++ source.
 */
const parseCppSignature = (code) => {
  const classMatch = code.match(/(?:class|struct)\s+(\w+)/);
  const re = /([\w:<>,\s*&]+?)\s+(\w+)\s*\(([^)]*)\)\s*(?:const)?\s*\{/g;
  let m;
  while ((m = re.exec(code))) {
    const name = m[2];
    if (NOT_METHODS.has(name)) continue;
    const returnType = m[1]
      .replace(/\b(public|private|protected|static|inline|virtual)\b\s*:?/g, '')
      .replace(/^[\s:;{}]+/, '')
      .split(/[;{}]/)
      .pop()
      .replace(/[&\s]+$/, '')
      .trim();
    if (!returnType) continue;
    const params = splitCppParams(m[3]).map((p) => {
      const cleaned = p.replace(/\bconst\b/g, '').replace(/&/g, ' ').replace(/\s+/g, ' ').trim();
      const idx = cleaned.search(/\w+\s*$/);
      return { type: cleaned.slice(0, idx).trim(), name: cleaned.slice(idx).trim() };
    });
    return { className: classMatch ? classMatch[1] : null, methodName: name, returnType, params };
  }
  return { className: classMatch ? classMatch[1] : null, methodName: 'solution', returnType: 'int', params: [] };
};

/**
 * @param {string} userCode
 * @param {string} starterCode - defines the expected signature (param types / count)
 */
const wrapCpp = (userCode, starterCode) => {
  const sig = parseCppSignature(starterCode);
  const usr = parseCppSignature(userCode);
  const className = /(?:class|struct)\s+\w+/.test(userCode) ? usr.className : null;
  const methodName = usr.methodName !== 'solution' ? usr.methodName : sig.methodName;

  const decls = sig.params
    .map((p, i) => `  ${p.type} ${p.name}; { size_t __i = 0; __read(__lines[${i}], __i, ${p.name}); }`)
    .join('\n');
  const args = sig.params.map((p) => p.name).join(', ');
  const owner = className ? `${className} __sol; ` : '';
  const call = className ? `__sol.${methodName}(${args})` : `${methodName}(${args})`;

  let invoke;
  if (sig.returnType === 'void') {
    const firstVec = sig.params.find((p) => p.type.startsWith('vector'));
    invoke = `${owner}${call};${firstVec ? `\n  __printTop(${firstVec.name});` : ''}`;
  } else {
    invoke = `${owner}auto __result = ${call};\n  __printTop(__result);`;
  }

  return `#include <bits/stdc++.h>
using namespace std;

// ─── User's solution ───
${userCode}

${getHelpers()}
int main() {
  ios::sync_with_stdio(false);
  vector<string> __lines; string __line;
  while (getline(cin, __line)) { if (!__line.empty() && __line.back() == '\\r') __line.pop_back(); __lines.push_back(__line); }
  while (__lines.size() < ${Math.max(sig.params.length, 1)}) __lines.push_back("");
${decls}
  ${invoke}
  return 0;
}
`;
};

module.exports = { wrapCpp, parseCppSignature, splitCppParams };
