/**
 * Code Execution Service
 *
 * Integrates with the Piston API for sandboxed JavaScript code execution.
 * Handles running individual code snippets and batch test case evaluation.
 *
 * @module codeExecutionService
 */

const axios = require('axios');
const logger = require('../utils/logger');

const PISTON_URL = process.env.CODE_EXECUTION_API_URL;

/**
 * Executes a JavaScript code snippet using the Piston API.
 *
 * @param {string} code - The JavaScript source code to execute
 * @param {string} [stdin=''] - Standard input to provide to the program
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, time: number}>}
 *   Execution result with stdout, stderr, exit code, and time in ms
 */
const executeCode = async (code, stdin = '') => {
  try {
    const response = await axios.post(`${PISTON_URL}/execute`, {
      language: 'javascript',
      version: '18.15.0',
      files: [{ name: 'solution.js', content: code }],
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
    logger.error('Code execution failed', { error: error.message });
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
 * Compares trimmed stdout with trimmed expected output for each test case.
 *
 * @param {string} code - The JavaScript source code to test
 * @param {Array<{input: string, expectedOutput: string}>} testCases - Array of test cases
 * @returns {Promise<{passed: number, total: number, results: Array<{input: string, expectedOutput: string, actualOutput: string, passed: boolean, executionTime: number}>, allPassed: boolean}>}
 *   Test run results with per-case details and summary
 */
const runTestCases = async (code, testCases) => {
  const results = [];
  let passedCount = 0;

  for (const testCase of testCases) {
    try {
      const startTime = Date.now();
      const executionResult = await executeCode(code, testCase.input || '');
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

module.exports = { executeCode, runTestCases };
