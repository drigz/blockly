/**
 * @license
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Lua for unit test blocks.
 * @author rodrigoq@google.com (Rodrigo Queiro)
 */
'use strict';

Blockly.Lua['unittest_main'] = function(block) {
  // Container for unit tests.
  var resultsVar = Blockly.Lua.variableDB_.getName('unittestResults',
      Blockly.Variables.NAME_TYPE);
  var functionName = Blockly.Lua.provideFunction_(
      'unittest_report',
      [ 'function ' + Blockly.Lua.FUNCTION_NAME_PLACEHOLDER_ + '() {',
        '  // Create test report.',
        '  var report = [];',
        '  var summary = [];',
        '  var fails = 0;',
        '  for (var x = 0; x < ' + resultsVar + '.length; x++) {',
        '    if (' + resultsVar + '[x][0]) {',
        '      summary.push(".");',
        '    } else {',
        '      summary.push("F");',
        '      fails++;',
        '      report.push("");',
        '      report.push("FAIL: " + ' + resultsVar + '[x][2]);',
        '      report.push(' + resultsVar + '[x][1]);',
        '    }',
        '  }',
        '  report.unshift(summary.join(""));',
        '  report.push("");',
        '  report.push("Number of tests run: " + ' + resultsVar +
              '.length);',
        '  report.push("");',
        '  if (fails) {',
        '    report.push("FAILED (failures=" + fails + ")");',
        '  } else {',
        '    report.push("OK");',
        '  }',
        '  return report.join("\\n");',
        '}']);
  // Setup global to hold test results.
  var code = resultsVar + ' = [];\n';
  // Run tests (unindented).
  code += Blockly.Lua.statementToCode(block, 'DO')
      .replace(/^  /, '').replace(/\n  /g, '\n');
  var reportVar = Blockly.Lua.variableDB_.getDistinctName(
      'report', Blockly.Variables.NAME_TYPE);
  code += 'var ' + reportVar + ' = ' + functionName + '();\n';
  // Destroy results.
  code += resultsVar + ' = null;\n';
  // Send the report to the console (that's where errors will go anyway).
  code += 'console.log(' + reportVar + ');\n';
  return code;
};

Blockly.Lua['unittest_main'].defineAssert_ = function(block) {
  var resultsVar = Blockly.Lua.variableDB_.getName('unittestResults',
      Blockly.Variables.NAME_TYPE);
  var functionName = Blockly.Lua.provideFunction_(
      'assertEquals',
      [ 'function ' + Blockly.Lua.FUNCTION_NAME_PLACEHOLDER_ +
          '(actual, expected, message) {',
        '  // Asserts that a value equals another value.',
        '  if (!' + resultsVar + ') {',
        '    throw "Orphaned assert: " + message;',
        '  }',
        '  function equals(a, b) {',
        '    if (a === b) {',
        '      return true;',
        '    } else if ((typeof a == "number") && (typeof b == "number") &&',
        '        (a.toPrecision(15) == b.toPrecision(15))) {',
        '      return true;',
        '    } else if (a instanceof Array && b instanceof Array) {',
        '      if (a.length != b.length) {',
        '        return false;',
        '      }',
        '      for (var i = 0; i < a.length; i++) {',
        '        if (!equals(a[i], b[i])) {',
        '          return false;',
        '        }',
        '      }',
        '      return true;',
        '    }',
        '    return false;',
        '  }',
        '  if (equals(actual, expected)) {',
        '    ' + resultsVar + '.push([true, "OK", message]);',
        '  } else {',
        '    ' + resultsVar + '.push([false, ' +
          '"Expected: " + expected + "\\nActual: " + actual, message]);',
        '  }',
        '}']);
  return functionName;
};

Blockly.Lua['unittest_assertequals'] = function(block) {
  // Asserts that a value equals another value.
  var message = Blockly.Lua.quote_(block.getFieldValue('MESSAGE'));
  var actual = Blockly.Lua.valueToCode(block, 'ACTUAL',
      Blockly.Lua.ORDER_COMMA) || 'null';
  var expected = Blockly.Lua.valueToCode(block, 'EXPECTED',
      Blockly.Lua.ORDER_COMMA) || 'null';
  return Blockly.Lua['unittest_main'].defineAssert_() +
      '(' + actual + ', ' + expected + ', ' + message + ');\n';
};

Blockly.Lua['unittest_assertvalue'] = function(block) {
  // Asserts that a value is true, false, or null.
  var message = Blockly.Lua.quote_(block.getFieldValue('MESSAGE'));
  var actual = Blockly.Lua.valueToCode(block, 'ACTUAL',
      Blockly.Lua.ORDER_COMMA) || 'null';
  var expected = block.getFieldValue('EXPECTED');
  if (expected == 'TRUE') {
    expected = 'true';
  } else if (expected == 'FALSE') {
    expected = 'false';
  } else if (expected == 'NULL') {
    expected = 'null';
  }
  return Blockly.Lua['unittest_main'].defineAssert_() +
      '(' + actual + ', ' + expected + ', ' + message + ');\n';
};

Blockly.Lua['unittest_fail'] = function(block) {
  // Always assert an error.
  var resultsVar = Blockly.Lua.variableDB_.getName('unittestResults',
      Blockly.Variables.NAME_TYPE);
  var message = Blockly.Lua.quote_(block.getFieldValue('MESSAGE'));
  var functionName = Blockly.Lua.provideFunction_(
      'unittest_fail',
      [ 'function ' + Blockly.Lua.FUNCTION_NAME_PLACEHOLDER_ +
          '(message) {',
        '  // Always assert an error.',
        '  if (!' + resultsVar + ') {',
        '    throw "Orphaned assert fail: " + message;',
        '  }',
        '  ' + resultsVar + '.push([false, "Fail.", message]);',
        '}']);
  return functionName + '(' + message + ');\n';
};
