/**
 * AST Analyser Service
 *
 * Parses JavaScript code using Acorn and analyses the AST for:
 * - Loop types and nesting depth
 * - Recursion detection
 * - Auxiliary data structure usage
 * - Algorithm complexity classification
 * - Anti-pattern detection
 *
 * @module astAnalyser
 */

const acorn = require('acorn');

/**
 * Creates a default result object with all fields initialized.
 *
 * @param {boolean} parseError - Whether the code failed to parse
 * @returns {object} Default AST analysis result
 */
const createDefaultResult = (parseError = false) => ({
  parseError,
  loopTypes: [],
  hasRecursion: false,
  nestingDepth: 0,
  auxiliaryStructures: [],
  algorithmClass: '',
  antiPatternDetected: false,
  antiPatternDescription: ''
});

/**
 * Checks if an AST node is a loop statement.
 *
 * @param {string} nodeType - The AST node type
 * @returns {string|null} The loop type string, or null if not a loop
 */
const getLoopType = (nodeType) => {
  const loopMap = {
    ForStatement: 'for',
    WhileStatement: 'while',
    DoWhileStatement: 'doWhile',
    ForOfStatement: 'forOf',
    ForInStatement: 'forIn'
  };
  return loopMap[nodeType] || null;
};

/**
 * Recursively traverses an AST node and all its children,
 * invoking a visitor callback on each node.
 *
 * @param {object} node - The AST node to traverse
 * @param {Function} visitor - Callback invoked with (node, parent)
 * @param {object|null} parent - The parent node
 */
const walkAST = (node, visitor, parent = null) => {
  if (!node || typeof node !== 'object') return;

  visitor(node, parent);

  for (const key of Object.keys(node)) {
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach((item) => {
        if (item && typeof item === 'object' && item.type) {
          walkAST(item, visitor, node);
        }
      });
    } else if (child && typeof child === 'object' && child.type) {
      walkAST(child, visitor, node);
    }
  }
};

/**
 * Detects auxiliary data structures used inside loop bodies.
 * Looks for: new Map(), new Set(), [] or Array(), {} literals.
 *
 * @param {object} node - The AST node to check
 * @param {Set<string>} structures - Set to add detected structure names to
 */
const detectAuxiliaryStructures = (node, structures) => {
  // new Map() or new Set()
  if (node.type === 'NewExpression' && node.callee && node.callee.type === 'Identifier') {
    if (node.callee.name === 'Map') structures.add('map');
    if (node.callee.name === 'Set') structures.add('set');
  }
  // Array literal [] or Array()
  if (node.type === 'ArrayExpression') {
    structures.add('array');
  }
  if (
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'Array'
  ) {
    structures.add('array');
  }
  // Object literal {}
  if (node.type === 'ObjectExpression') {
    structures.add('object');
  }
};

/**
 * Classifies the algorithm based on detected patterns.
 *
 * @param {boolean} hasRecursion - Whether recursion was detected
 * @param {string[]} loopTypes - Array of loop type strings found
 * @param {number} nestingDepth - Maximum loop nesting depth
 * @param {string[]} auxiliaryStructures - Auxiliary structures detected
 * @returns {string} The algorithm classification string
 */
const classifyAlgorithm = (hasRecursion, loopTypes, nestingDepth, auxiliaryStructures) => {
  if (hasRecursion && loopTypes.length === 0) return 'recursive';
  if (nestingDepth >= 3) return 'brute-force-cubic';
  if (nestingDepth === 2) return 'brute-force-quadratic';
  if (nestingDepth === 1 && (auxiliaryStructures.includes('map') || auxiliaryStructures.includes('set'))) {
    return 'optimized-linear';
  }
  if (nestingDepth === 1) return 'linear';
  if (nestingDepth === 0 && !hasRecursion) return 'constant-or-unknown';
  return 'unknown';
};

/**
 * Analyses a JavaScript code string and returns a structured AST analysis result.
 *
 * Detects loop types, recursion, nesting depth, auxiliary data structures,
 * algorithm classification, and anti-patterns.
 *
 * @param {string} codeString - The JavaScript source code to analyse
 * @returns {object} Analysis result with fields: parseError, loopTypes, hasRecursion,
 *   nestingDepth, auxiliaryStructures, algorithmClass, antiPatternDetected, antiPatternDescription
 */
const analyseCode = (codeString) => {
  let ast;

  try {
    ast = acorn.parse(codeString, { ecmaVersion: 2020 });
  } catch (parseErr) {
    return createDefaultResult(true);
  }

  const result = createDefaultResult(false);
  const loopTypeSet = new Set();
  const auxStructSet = new Set();
  let currentLoopDepth = 0;
  let maxLoopDepth = 0;

  // Collect all function declarations/expressions and their names
  const functionNames = new Map(); // node -> name

  walkAST(ast, (node) => {
    if (node.type === 'FunctionDeclaration' && node.id) {
      functionNames.set(node, node.id.name);
    }
    if (
      (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') &&
      node.id
    ) {
      functionNames.set(node, node.id.name);
    }
  });

  // Also detect named function expressions assigned to variables:
  // const foo = function() {} or const foo = () => {}
  walkAST(ast, (node) => {
    if (
      node.type === 'VariableDeclarator' &&
      node.id &&
      node.id.type === 'Identifier' &&
      node.init &&
      (node.init.type === 'FunctionExpression' || node.init.type === 'ArrowFunctionExpression')
    ) {
      functionNames.set(node.init, node.id.name);
    }
  });

  /**
   * Recursively walks a subtree tracking loop depth and detecting patterns.
   *
   * @param {object} node - Current AST node
   * @param {boolean} insideLoop - Whether we're inside a loop body
   * @param {string|null} enclosingFunctionName - Name of the enclosing function (for recursion detection)
   */
  const analyse = (node, insideLoop, enclosingFunctionName) => {
    if (!node || typeof node !== 'object') return;

    // Check if this node starts a new function scope
    let currentFnName = enclosingFunctionName;
    if (functionNames.has(node)) {
      currentFnName = functionNames.get(node);
    }

    // Loop detection
    const loopType = getLoopType(node.type);
    if (loopType) {
      loopTypeSet.add(loopType);
      currentLoopDepth++;
      maxLoopDepth = Math.max(maxLoopDepth, currentLoopDepth);
    }

    // Auxiliary structure detection (only inside loops)
    if (insideLoop || loopType) {
      detectAuxiliaryStructures(node, auxStructSet);
    }

    // Recursion detection
    if (
      node.type === 'CallExpression' &&
      node.callee &&
      node.callee.type === 'Identifier' &&
      currentFnName &&
      node.callee.name === currentFnName
    ) {
      result.hasRecursion = true;
    }

    // Recurse into children
    for (const key of Object.keys(node)) {
      if (key === 'type') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach((item) => {
          if (item && typeof item === 'object' && item.type) {
            analyse(item, insideLoop || !!loopType, currentFnName);
          }
        });
      } else if (child && typeof child === 'object' && child.type) {
        analyse(child, insideLoop || !!loopType, currentFnName);
      }
    }

    // Decrement loop depth when exiting a loop node
    if (loopType) {
      currentLoopDepth--;
    }
  };

  analyse(ast, false, null);

  result.loopTypes = [...loopTypeSet];
  result.nestingDepth = maxLoopDepth;
  result.auxiliaryStructures = [...auxStructSet];
  result.algorithmClass = classifyAlgorithm(
    result.hasRecursion,
    result.loopTypes,
    result.nestingDepth,
    result.auxiliaryStructures
  );

  // Anti-pattern detection
  if (result.nestingDepth >= 3) {
    result.antiPatternDetected = true;
    result.antiPatternDescription =
      'O(n³) nesting detected. This will TLE on large inputs.';
  } else if (result.nestingDepth >= 2) {
    result.antiPatternDetected = true;
    result.antiPatternDescription =
      'O(n²) or worse nesting detected. Consider using a hash map to reduce to O(n).';
  }

  return result;
};

module.exports = { analyseCode };
