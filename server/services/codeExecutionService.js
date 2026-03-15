/**
 * Code Execution Service
 *
 * Integrates with the Piston API for sandboxed code execution.
 * Supports JavaScript, Python, Java, and C++.
 *
 * @module codeExecutionService
 */

const axios = require('axios');
const logger = require('../utils/logger');

const PISTON_URL = process.env.CODE_EXECUTION_API_URL;

const SUPPORTED_LANGUAGES = {
  javascript: { pistonName: 'javascript', version: '18.15.0', monacoLang: 'javascript', extension: 'solution.js' },
  python:     { pistonName: 'python',     version: '3.10.0',  monacoLang: 'python',     extension: 'solution.py' },
  java:       { pistonName: 'java',       version: '15.0.2',  monacoLang: 'java',       extension: 'Solution.java' },
  cpp:        { pistonName: 'c++',        version: '10.2.0',  monacoLang: 'cpp',        extension: 'solution.cpp' }
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
    const response = await axios.post(`${PISTON_URL}/execute`, {
      language: langConfig.pistonName,
      version: langConfig.version,
      files: [{ name: langConfig.extension, content: code }],
      stdin,
      run_timeout: 5000,
      compile_timeout: 10000,
      run_memory_limit: 262144
    });

    const { run } = response.data;

    return {
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      exitCode: run.code !== null ? run.code : -1,
      time: run.wall_time ? Math.round(run.wall_time * 1000) : 0
    };
  } catch (error) {
    logger.error('Code execution failed', { error: error.message, language });
    return {
      stdout: '',
      stderr: error.message || 'Code execution service unavailable',
      exitCode: -1,
      time: 0
    };
  }
};

/**
 * Runs a set of test cases against a code snippet sequentially.
 *
 * @param {string} code - The source code to test
 * @param {Array<{input: string, expectedOutput: string}>} testCases - Array of test cases
 * @param {string} [language='javascript'] - Language key
 * @returns {Promise<{passed: number, total: number, results: Array, allPassed: boolean}>}
 */
const runTestCases = async (code, testCases, language = 'javascript') => {
  const results = [];
  let passedCount = 0;

  for (const testCase of testCases) {
    try {
      const startTime = Date.now();
      const executionResult = await executeCode(code, testCase.input || '', language);
      const executionTime = Date.now() - startTime;

      const actualOutput = executionResult.stdout.trim();
      const expectedOutput = (testCase.expectedOutput || '').trim();
      const passed = actualOutput === expectedOutput;

      if (passed) passedCount++;

      results.push({
        input: testCase.input || '',
        expectedOutput,
        actualOutput,
        passed,
        executionTime
      });
    } catch (error) {
      logger.error('Test case execution error', { error: error.message });
      results.push({
        input: testCase.input || '',
        expectedOutput: (testCase.expectedOutput || '').trim(),
        actualOutput: '',
        passed: false,
        executionTime: 0
      });
    }
  }

  return {
    passed: passedCount,
    total: testCases.length,
    results,
    allPassed: passedCount === testCases.length
  };
};

module.exports = { executeCode, runTestCases, SUPPORTED_LANGUAGES };
