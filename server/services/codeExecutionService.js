/**
 * Code Execution Service
 *
 * Integrates with the Piston API for sandboxed code execution.
 * Supports JavaScript, Python, Java, and C++.
 *
 * Includes a LeetCode-style "wrapper" system that dynamically wraps
 * the user's raw solution code with a hidden harness that:
 *   1. Parses the function signature from the problem's starter code
 *   2. Parses the test case input string into typed arguments
 *   3. Calls the user's function/method with those arguments
 *   4. Prints the result to stdout so Piston captures it
 *
 * @module codeExecutionService
 */

const axios = require('axios');
const logger = require('../utils/logger');

const PISTON_URL = process.env.CODE_EXECUTION_API_URL;

const SUPPORTED_LANGUAGES = {
  javascript: { pistonName: 'javascript', version: '18.15.0', monacoLang: 'javascript', extension: 'solution.js' },
  python:     { pistonName: 'python',     version: '3.10.0',  monacoLang: 'python',     extension: 'solution.py' },
  java:       { pistonName: 'java',       version: '15.0.2',  monacoLang: 'java',       extension: 'Main.java' },
  cpp:        { pistonName: 'c++',        version: '10.2.0',  monacoLang: 'cpp',        extension: 'solution.cpp' }
};

// ─────────────────────────────────────────────────────────────
// Signature Parsing — extracts function/method name and params
// ─────────────────────────────────────────────────────────────

/**
 * Extracts the function name and parameter names from a JavaScript starter code template.
 *
 * @param {string} starterCode - The JS starter code, e.g. "function twoSum(nums, target) {\n}"
 * @returns {{ functionName: string, params: string[] }}
 */
const parseJSSignature = (starterCode) => {
  const match = starterCode.match(/function\s+(\w+)\s*\(([^)]*)\)/);
  if (!match) return { functionName: 'solution', params: [] };
  const functionName = match[1];
  const params = match[2].split(',').map(p => p.trim()).filter(Boolean);
  return { functionName, params };
};

/**
 * Extracts the method name, return type, and parameter types/names from a Java starter code template.
 * Expects the pattern: public <returnType> <methodName>(<type> <name>, ...)
 *
 * @param {string} starterCode - The Java starter code
 * @returns {{ methodName: string, returnType: string, params: Array<{type: string, name: string}> }}
 */
const parseJavaSignature = (starterCode) => {
  const match = starterCode.match(/public\s+([\w<>\[\],\s]+?)\s+(\w+)\s*\(([^)]*)\)/);
  if (!match) return { methodName: 'solution', returnType: 'void', params: [] };
  const returnType = match[1].trim();
  const methodName = match[2];
  const paramStr = match[3].trim();
  const params = paramStr
    ? paramStr.split(',').map(p => {
        const parts = p.trim().split(/\s+/);
        return { type: parts.slice(0, -1).join(' '), name: parts[parts.length - 1] };
      })
    : [];
  return { methodName, returnType, params };
};

/**
 * Extracts the function name and parameter names from a Python starter code template.
 *
 * @param {string} starterCode - The Python starter code, e.g. "def two_sum(nums, target):"
 * @returns {{ functionName: string, params: string[] }}
 */
const parsePythonSignature = (starterCode) => {
  const match = starterCode.match(/def\s+(\w+)\s*\(([^)]*)\)/);
  if (!match) return { functionName: 'solution', params: [] };
  const functionName = match[1];
  const params = match[2].split(',').map(p => p.trim()).filter(Boolean);
  return { functionName, params };
};

// ─────────────────────────────────────────────────────────────
// Wrapper Generators — build the full executable code
// ─────────────────────────────────────────────────────────────

/**
 * Wraps JavaScript user code with a harness that reads stdin, parses arguments,
 * calls the user's function, and prints the result as JSON.
 *
 * @param {string} userCode - The user's solution code
 * @param {string} starterCode - The problem's JS starter code template
 * @returns {string} The wrapped executable code
 */
const wrapJavaScript = (userCode, starterCode) => {
  const { functionName, params } = parseJSSignature(starterCode);

  return `
// ─── User's solution ───
${userCode}

// ─── Hidden execution harness ───
const __input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
const __lines = __input.split('\\n');

function __parseArg(raw) {
  raw = raw.trim();
  if (raw === '') return raw;
  try { return JSON.parse(raw); } catch(e) { return raw; }
}

const __args = __lines.map(__parseArg);
const __result = ${functionName}(...__args);

// Format output to match expected test case format
if (__result === undefined || __result === null) {
  // void return — don't print anything for undefined
  if (__result === null) console.log('null');
} else if (typeof __result === 'boolean') {
  console.log(__result.toString());
} else if (typeof __result === 'number') {
  console.log(__result.toString());
} else if (typeof __result === 'string') {
  console.log(__result);
} else {
  console.log(JSON.stringify(__result));
}
`;
};

/**
 * Wraps Java user code with a main() method harness that reads stdin,
 * parses arguments into the correct Java types, calls the user's method,
 * and prints the result.
 *
 * @param {string} userCode - The user's solution code (class Main { ... })
 * @param {string} starterCode - The problem's Java starter code template
 * @returns {string} The wrapped executable Java code
 */
const wrapJava = (userCode, starterCode) => {
  const { methodName, returnType, params } = parseJavaSignature(starterCode);

  // Collect imports from user code
  const importLines = [];
  const classBody = [];
  for (const line of userCode.split('\n')) {
    if (line.trim().startsWith('import ')) {
      importLines.push(line);
    } else {
      classBody.push(line);
    }
  }

  // Strip the outer class wrapper from user code to get just the method body
  // Supports any class name: class Main, class Solution, etc.
  const classContent = classBody.join('\n');
  const innerMatch = classContent.match(/class\s+\w+\s*\{([\s\S]*)\}\s*$/);
  const methodBlock = innerMatch ? innerMatch[1] : classContent;

  // Build argument parsing lines
  const argParsers = params.map((param, idx) => {
    return buildJavaArgParser(param.type, param.name, idx);
  });

  // Build result printer
  const resultPrinter = buildJavaResultPrinter(returnType, methodName, params);

  return `
import java.util.*;
import java.util.stream.*;
${importLines.join('\n')}

class Main {
    // ─── User's solution method(s) ───
    ${methodBlock}

    // ─── Hidden execution harness ───
    public static void main(String[] args) {
        java.util.Scanner __scanner = new java.util.Scanner(System.in);
        java.util.List<String> __lines = new java.util.ArrayList<>();
        while (__scanner.hasNextLine()) {
            __lines.add(__scanner.nextLine().trim());
        }

        Main __sol = new Main();

${argParsers.join('\n')}

${resultPrinter}
    }

    // ─── Helper: parse a JSON-like int array string into int[] ───
    private static int[] __parseIntArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new int[0];
        s = s.substring(1, s.length() - 1); // strip [ ]
        String[] parts = s.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            arr[i] = Integer.parseInt(parts[i].trim());
        }
        return arr;
    }

    // ─── Helper: parse a JSON-like 2D int array string into int[][] ───
    private static int[][] __parse2DIntArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new int[0][];
        // Remove outer brackets
        s = s.substring(1, s.length() - 1).trim();
        java.util.List<int[]> result = new java.util.ArrayList<>();
        int depth = 0;
        int start = -1;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '[') {
                if (depth == 0) start = i;
                depth++;
            } else if (s.charAt(i) == ']') {
                depth--;
                if (depth == 0) {
                    result.add(__parseIntArray(s.substring(start, i + 1)));
                }
            }
        }
        return result.toArray(new int[0][]);
    }

    // ─── Helper: parse a JSON-like string array into String[] ───
    private static String[] __parseStringArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new String[0];
        s = s.substring(1, s.length() - 1); // strip [ ]
        java.util.List<String> result = new java.util.ArrayList<>();
        boolean inQuote = false;
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"') {
                inQuote = !inQuote;
            } else if (c == ',' && !inQuote) {
                result.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        if (current.length() > 0) {
            result.add(current.toString().trim());
        }
        return result.toArray(new String[0]);
    }

    // ─── Helper: parse a JSON-like 2D char array for grids ───
    private static char[][] __parse2DCharArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new char[0][];
        s = s.substring(1, s.length() - 1).trim();
        java.util.List<char[]> rows = new java.util.ArrayList<>();
        int depth = 0;
        int start = -1;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '[') {
                if (depth == 0) start = i;
                depth++;
            } else if (s.charAt(i) == ']') {
                depth--;
                if (depth == 0) {
                    String inner = s.substring(start + 1, i);
                    String[] parts = inner.split(",");
                    char[] row = new char[parts.length];
                    for (int j = 0; j < parts.length; j++) {
                        String p = parts[j].trim().replace("\\\"", "");
                        row[j] = p.charAt(0);
                    }
                    rows.add(row);
                }
            }
        }
        return rows.toArray(new char[0][]);
    }

    // ─── Helper: format int array as JSON ───
    private static String __formatIntArray(int[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(arr[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    // ─── Helper: format 2D int array as JSON ───
    private static String __format2DIntArray(int[][] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(__formatIntArray(arr[i]));
        }
        sb.append("]");
        return sb.toString();
    }

    // ─── Helper: format String list as JSON ───
    private static String __formatStringList(java.util.List<String> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\\"").append(list.get(i)).append("\\"");
        }
        sb.append("]");
        return sb.toString();
    }

    // ─── Helper: format nested String list as JSON ───
    private static String __formatNestedStringList(java.util.List<java.util.List<String>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(__formatStringList(list.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }
}
`;
};

/**
 * Builds a Java code snippet that parses a single argument from the input lines.
 *
 * @param {string} javaType - The Java type (e.g., "int[]", "String", "int")
 * @param {string} paramName - The parameter name
 * @param {number} lineIndex - Which input line to read from
 * @returns {string} Java code snippet for parsing this argument
 */
const buildJavaArgParser = (javaType, paramName, lineIndex) => {
  const lineRef = `__lines.get(${lineIndex})`;

  if (javaType === 'int[]') {
    return `        int[] ${paramName} = __parseIntArray(${lineRef});`;
  }
  if (javaType === 'int[][]') {
    return `        int[][] ${paramName} = __parse2DIntArray(${lineRef});`;
  }
  if (javaType === 'char[][]') {
    return `        char[][] ${paramName} = __parse2DCharArray(${lineRef});`;
  }
  if (javaType === 'String[]') {
    return `        String[] ${paramName} = __parseStringArray(${lineRef});`;
  }
  if (javaType === 'String') {
    return `        String ${paramName} = ${lineRef};`;
  }
  if (javaType === 'int') {
    return `        int ${paramName} = Integer.parseInt(${lineRef});`;
  }
  if (javaType === 'double') {
    return `        double ${paramName} = Double.parseDouble(${lineRef});`;
  }
  if (javaType.startsWith('List<String>')) {
    return `        List<String> ${paramName} = new ArrayList<>(Arrays.asList(__parseStringArray(${lineRef})));`;
  }
  // Fallback — treat as string
  return `        String ${paramName} = ${lineRef};`;
};

/**
 * Builds the Java code that calls the user's method and prints the result.
 *
 * @param {string} returnType - Java return type
 * @param {string} methodName - Method name to call
 * @param {Array<{type: string, name: string}>} params - Parsed parameters
 * @returns {string} Java code snippet
 */
const buildJavaResultPrinter = (returnType, methodName, params) => {
  const argList = params.map(p => p.name).join(', ');
  const call = `__sol.${methodName}(${argList})`;

  if (returnType === 'void') {
    // For void methods (like sortColors), we need to print the mutated input
    // The first array parameter is assumed to be the mutated one
    const arrayParam = params.find(p => p.type === 'int[]');
    if (arrayParam) {
      return `        ${call};
        System.out.println(__formatIntArray(${arrayParam.name}));`;
    }
    return `        ${call};`;
  }
  if (returnType === 'int[]') {
    return `        int[] __result = ${call};
        System.out.println(__formatIntArray(__result));`;
  }
  if (returnType === 'int[][]') {
    return `        int[][] __result = ${call};
        System.out.println(__format2DIntArray(__result));`;
  }
  if (returnType === 'boolean') {
    return `        boolean __result = ${call};
        System.out.println(__result);`;
  }
  if (returnType === 'int') {
    return `        int __result = ${call};
        System.out.println(__result);`;
  }
  if (returnType === 'double') {
    return `        double __result = ${call};
        System.out.println(__result);`;
  }
  if (returnType === 'String') {
    return `        String __result = ${call};
        System.out.println(__result);`;
  }
  if (returnType.includes('List<List<String>>')) {
    return `        java.util.List<java.util.List<String>> __result = ${call};
        System.out.println(__formatNestedStringList(__result));`;
  }
  if (returnType.includes('List<String>')) {
    return `        java.util.List<String> __result = ${call};
        System.out.println(__formatStringList(__result));`;
  }
  // Fallback — use toString
  return `        Object __result = ${call};
        System.out.println(__result);`;
};

/**
 * Wraps Python user code with a harness that reads stdin, parses arguments,
 * calls the user's function, and prints the result.
 *
 * @param {string} userCode - The user's solution code
 * @param {string} starterCode - The problem's Python starter code template
 * @returns {string} The wrapped executable Python code
 */
const wrapPython = (userCode, starterCode) => {
  const { functionName, params } = parsePythonSignature(starterCode);

  return `import sys, json

# ─── User's solution ───
${userCode}

# ─── Hidden execution harness ───
__input = sys.stdin.read().strip()
__lines = __input.split('\\n')

def __parse_arg(raw):
    raw = raw.strip()
    if raw == '':
        return raw
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return raw

__args = [__parse_arg(line) for line in __lines]
__result = ${functionName}(*__args)

if __result is None:
    pass
elif isinstance(__result, bool):
    print(str(__result).lower())
elif isinstance(__result, (int, float)):
    print(__result)
elif isinstance(__result, str):
    print(__result)
else:
    print(json.dumps(__result, separators=(',', ':')))
`;
};

// ─────────────────────────────────────────────────────────────
// Core Execution
// ─────────────────────────────────────────────────────────────

/**
 * Wraps the user's code with the appropriate language harness.
 *
 * @param {string} userCode - The user's raw solution code
 * @param {string} language - Language key
 * @param {string} starterCode - The problem's starter code for this language
 * @returns {string} The wrapped code ready for execution
 */
const wrapCode = (userCode, language, starterCode) => {
  if (!starterCode) {
    logger.warn(`No starter code provided for ${language} — executing raw code`);
    return userCode;
  }

  switch (language) {
    case 'javascript':
      return wrapJavaScript(userCode, starterCode);
    case 'java':
      return wrapJava(userCode, starterCode);
    case 'python':
      return wrapPython(userCode, starterCode);
    default:
      // C++ and others — fallback to raw execution for now
      return userCode;
  }
};

/**
 * Executes a code snippet using the Piston API.
 *
 * @param {string} code - The source code to execute
 * @param {string} [stdin=''] - Standard input to provide to the program
 * @param {string} [language='javascript'] - Language key from SUPPORTED_LANGUAGES
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, time: number}>}
 */
const executeCode = async (code, stdin = '', language = 'javascript') => {
  const langConfig = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.javascript;

  try {
    let response;
    const payload = {
      language: langConfig.pistonName,
      version: '*',
      files: [{ name: langConfig.extension, content: code }],
      stdin
    };

    try {
      response = await axios.post(`${PISTON_URL}/execute`, payload);
    } catch (apiError) {
      if (apiError.code === 'ECONNREFUSED' || (apiError.message && apiError.message.includes('ECONNREFUSED'))) {
        logger.warn('Piston connection refused. Waiting 500ms and retrying...', { language });
        await new Promise(r => setTimeout(r, 500));
        response = await axios.post(`${PISTON_URL}/execute`, payload);
      } else {
        throw apiError;
      }
    }

    const { run, compile } = response.data;
    console.log(`RAW PISTON RESPONSE FOR TEST: ${JSON.stringify(run)}`);

    // Capture compilation errors (Java, C++) — Piston puts them in compile.stderr
    const compileStderr = (compile && compile.stderr) ? compile.stderr : '';
    const runStderr = (run && run.stderr) ? run.stderr : '';
    const combinedStderr = (compileStderr + runStderr).trim();

    // If compilation failed, run may be empty or null
    const runStdout = (run && run.stdout) ? run.stdout : '';
    const runExitCode = (run && run.code !== null && run.code !== undefined) ? run.code : -1;
    const runTime = (run && run.wall_time) ? Math.round(run.wall_time * 1000) : 0;

    // Log compilation errors for debugging
    if (compileStderr) {
      logger.warn('Compilation error detected', {
        language,
        compileStderr: compileStderr.substring(0, 500)
      });
    }

    return {
      stdout: runStdout,
      stderr: combinedStderr,
      exitCode: runExitCode,
      time: runTime
    };
  } catch (error) {
    logger.error('Code execution failed', { error: error.message, language });
    
    let stderrMsg = error.message || 'Code execution service unavailable';
    if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('ECONNREFUSED'))) {
      stderrMsg = 'Execution Engine (Piston) is offline. Please ensure the local Docker container is running.';
    }

    return {
      stdout: '',
      stderr: stderrMsg,
      exitCode: -1,
      time: 0
    };
  }
};

/**
 * Runs a set of test cases against a code snippet sequentially.
 * Wraps the user's code with the appropriate language harness so that
 * Piston can capture the output via stdout.
 *
 * @param {string} code - The user's raw solution code
 * @param {Array<{input: string, expectedOutput: string}>} testCases - Array of test cases
 * @param {string} [language='javascript'] - Language key
 * @param {object} [problem=null] - The Problem document (needed for starter code lookup)
 * @returns {Promise<{passed: number, total: number, results: Array, allPassed: boolean}>}
 */
const runTestCases = async (code, testCases, language = 'javascript', problem = null) => {
  const results = [];
  let passedCount = 0;

  let starterCode = null;
  if (problem) {
    starterCode = (problem.starterCodeMap && problem.starterCodeMap[language])
      || (language === 'javascript' ? problem.starterCode : null);
  }

  const wrappedCode = wrapCode(code, language, starterCode);

  logger.debug('Wrapped code generated', {
    language,
    hasStarterCode: !!starterCode,
    wrappedLength: wrappedCode.length
  });

  // We process tests in chunks of 2 to balance memory scaling versus execution time.
  const CHUNK_SIZE = 2;
  for (let i = 0; i < testCases.length; i += CHUNK_SIZE) {
    const chunk = testCases.slice(i, i + CHUNK_SIZE);

    const chunkResults = await Promise.all(chunk.map(async (testCase, chunkIdx) => {
      const idx = i + chunkIdx;
      try {
        const startTime = Date.now();
        const executionResult = await executeCode(wrappedCode, testCase.input || '', language);
        const executionTime = Date.now() - startTime;

        const stdoutTrimmed = executionResult.stdout.trim();
        const stderrTrimmed = executionResult.stderr.trim();
        const actualOutput = stdoutTrimmed || (stderrTrimmed ? `[ERROR] ${stderrTrimmed}` : '');
        const expectedOutput = testCase.expectedOutput !== null ? (testCase.expectedOutput || '').trim() : null;
        const passed = expectedOutput !== null ? stdoutTrimmed === expectedOutput : true; // custom cases organically 'pass'

        logger.debug(`Test case ${idx + 1}/${testCases.length}: ${passed ? 'PASS' : 'FAIL'}`, {
          language,
          input: (testCase.input || '').substring(0, 100),
          expected: expectedOutput ? expectedOutput.substring(0, 100) : '',
          actual: actualOutput.substring(0, 100),
          stderr: stderrTrimmed ? stderrTrimmed.substring(0, 200) : '',
          executionTime
        });

        return {
          input: testCase.input || '',
          expectedOutput,
          actualOutput,
          passed,
          executionTime
        };
      } catch (error) {
        logger.error(`Test case ${idx + 1}/${testCases.length} execution error`, { error: error.message });
        return {
          input: testCase.input || '',
          expectedOutput: testCase.expectedOutput !== null ? (testCase.expectedOutput || '').trim() : null,
          actualOutput: '',
          passed: false,
          executionTime: 0
        };
      }
    }));

    results.push(...chunkResults);
    passedCount += chunkResults.filter(r => r.passed).length;
  }

  logger.info(`Test run complete: ${passedCount}/${testCases.length} passed (${language})`);

  return {
    passed: passedCount,
    total: testCases.length,
    results,
    allPassed: passedCount === testCases.length
  };
};

module.exports = { executeCode, runTestCases, wrapCode, SUPPORTED_LANGUAGES };
