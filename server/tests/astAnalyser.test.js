/**
 * AST Analyser Unit Tests
 *
 * Jest tests for the Acorn-based AST analysis service.
 */

const { analyseCode } = require('../services/astAnalyser');

describe('AST Analyser', () => {
  test('detects single for loop — loopTypes includes "for", nestingDepth = 1', () => {
    const code = `
      function sum(arr) {
        let total = 0;
        for (let i = 0; i < arr.length; i++) {
          total += arr[i];
        }
        return total;
      }
    `;
    const result = analyseCode(code);
    expect(result.parseError).toBe(false);
    expect(result.loopTypes).toContain('for');
    expect(result.nestingDepth).toBe(1);
    expect(result.antiPatternDetected).toBe(false);
  });

  test('detects nested loops — nestingDepth = 2, antiPatternDetected = true', () => {
    const code = `
      function bruteForce(arr) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] + arr[j] === 10) return [i, j];
          }
        }
      }
    `;
    const result = analyseCode(code);
    expect(result.nestingDepth).toBe(2);
    expect(result.antiPatternDetected).toBe(true);
    expect(result.antiPatternDescription).toContain('O(n²)');
    expect(result.algorithmClass).toBe('brute-force-quadratic');
  });

  test('detects recursion — hasRecursion = true for a function calling itself', () => {
    const code = `
      function factorial(n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
      }
    `;
    const result = analyseCode(code);
    expect(result.hasRecursion).toBe(true);
    expect(result.algorithmClass).toBe('recursive');
  });

  test('classifies "optimized-linear" when loop + Map usage detected', () => {
    const code = `
      function twoSum(nums, target) {
        for (let i = 0; i < nums.length; i++) {
          const seen = new Map();
          seen.set(nums[i], i);
        }
      }
    `;
    const result = analyseCode(code);
    expect(result.nestingDepth).toBe(1);
    expect(result.auxiliaryStructures).toContain('map');
    expect(result.algorithmClass).toBe('optimized-linear');
  });

  test('returns parseError: true for invalid JavaScript input', () => {
    const code = 'function broken( { return }}}}}';
    const result = analyseCode(code);
    expect(result.parseError).toBe(true);
    expect(result.loopTypes).toEqual([]);
    expect(result.hasRecursion).toBe(false);
    expect(result.nestingDepth).toBe(0);
  });

  test('empty function body — all defaults, no loops detected', () => {
    const code = `
      function empty() {
        return;
      }
    `;
    const result = analyseCode(code);
    expect(result.parseError).toBe(false);
    expect(result.loopTypes).toEqual([]);
    expect(result.hasRecursion).toBe(false);
    expect(result.nestingDepth).toBe(0);
    expect(result.auxiliaryStructures).toEqual([]);
    expect(result.antiPatternDetected).toBe(false);
    expect(result.algorithmClass).toBe('constant-or-unknown');
  });

  test('detects while loop type', () => {
    const code = `
      function search(arr, target) {
        let i = 0;
        while (i < arr.length) {
          if (arr[i] === target) return i;
          i++;
        }
        return -1;
      }
    `;
    const result = analyseCode(code);
    expect(result.loopTypes).toContain('while');
    expect(result.nestingDepth).toBe(1);
    expect(result.algorithmClass).toBe('linear');
  });

  test('detects triple-nested loops as brute-force-cubic', () => {
    const code = `
      function cubic(arr) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < arr.length; j++) {
            for (let k = 0; k < arr.length; k++) {
              arr[i] + arr[j] + arr[k];
            }
          }
        }
      }
    `;
    const result = analyseCode(code);
    expect(result.nestingDepth).toBe(3);
    expect(result.algorithmClass).toBe('brute-force-cubic');
    expect(result.antiPatternDetected).toBe(true);
    expect(result.antiPatternDescription).toContain('O(n³)');
  });
});
