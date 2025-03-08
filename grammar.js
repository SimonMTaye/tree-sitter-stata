/**
 * @file A tree-sitter for parsing stata do files
 * @author Simon Taye
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "stata_do_parser",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
