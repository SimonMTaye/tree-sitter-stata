/**
 * @file A tree-sitter for parsing stata do files
 * @author Simon Taye
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "stata_do_parser",

  word: ($) => $.identifier,

  // Define comment tokens properly within the grammar
  extras: ($) => [/\s+/],

  rules: {
    // Root node
    source_file: ($) => repeat(seq($._statement, $._terminator)),

    _terminator: ($) => `\n`,

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Basic statement
    _statement: ($) => choice($.command_statement, $._comment),

    // Simple command statement
    command_statement: ($) => seq($.identifier, optional($.varlist)),

    // Variable list
    varlist: ($) => repeat1($.identifier),

    // Comments
    _comment: ($) =>
      seq(
        choice(
          $._line_comment,
          $._block_comment,
          $._double_slash_comment,
          $._triple_slash_comment
        )
      ),

    // Line comment starts with * at the beginning of a line
    // They are a special case of comments that can't just show up anywhere
    _line_comment: ($) => token(seq(repeat(/\s/), "*", /[^\n]*/)),

    // Comments that start with //
    _double_slash_comment: ($) => token(seq("//", /[^\n]*/)),

    // Comments that start with ///
    // also matches newlines unlike other comments to allow multiline
    // commands that are separated by ///
    _triple_slash_comment: ($) => token(seq("///", /[^\n]*/, optional(`\n`))),

    // Block comment can appear anywhere and spans from /* to */
    _block_comment: ($) =>
      token(
        seq(
          "/*",
          /([^*]|(\*[^\/]))*/, // Match anything except */ sequence
          "*/"
        )
      ),
  },
});
