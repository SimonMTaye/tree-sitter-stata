/**
 * @file A tree-sitter for parsing stata do files
 * @author Simon Taye
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "stata",

  word: ($) => $.identifier,

  // Define comment tokens properly within the grammar
  // Modify extras to exclude newlines
  extras: ($) => [/[ \t\f\v\r]/],

  rules: {
    // Root node
    source_file: ($) => repeat($._statement),

    _terminator: ($) => `\n`,

    // Add this rule to handle EOF
    // end_of_file: ($) => token.immediate(prec(1, /$/)),

    //  Statement
    _statement: ($) =>
      choice(
        $.if_statement,
        $.command_statement,
        $.foreach_statement,
        $.while_statement,
        $.block_statement,
        "\n"
      ),

    // Simple command statement - updated to handle EOF better
    command_statement: ($) =>
      seq($.identifier, optional(repeat($.identifier)), "\n"),

    // TODO: Check if stata allows blocks that don't have a new line
    // Blocks
    block: ($) =>
      prec.left(1, seq("{", "\n", repeat1($._statement), optional("\n"), "}")),

    // Block statements with modifiers
    modifier_keywords: ($) => choice("quietly", "capture", "noisily"),
    block_statement: ($) =>
      seq(
        field("modifier", optional($.modifier_keywords)),
        field("block", $.block),
        "\n"
      ),
    // If Statements
    if_statement: ($) =>
      choice($._if_block_statement, $._if_single_line_expression),

    _if_block_statement: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $._expression),
          field("consequence", $.block),
          "\n",
          field(
            "alternative",
            optional(seq("else", choice($.block, $._if_block_statement)))
          )
        )
      ),

    _if_single_line_expression: ($) =>
      seq(
        "if",
        "(",
        field("condition", $._expression),
        ")",
        $.command_statement
      ),

    foreach_statement: ($) =>
      seq(
        "foreach",
        field("iterator", $.identifier),
        field(
          "loop_type",
          choice(
            "in",
            seq(
              "of",
              field(
                "listtype",
                choice("varlist", "newlist", "numlist", "local", "global")
              )
            )
          )
        ),
        field("list", $._foreach_list),
        field("body", $.block),
        "\n"
      ),

    _foreach_list: ($) =>
      choice(repeat1($.identifier), repeat1($.number), repeat1($.string)),

    while_statement: ($) =>
      seq(
        "while",
        field("condition", $._expression),
        field("body", $.block),
        "\n"
      ),

    // === EXPRESSION RULES START ===
    // Expressions can be used in many Stata contexts
    _expression: ($) =>
      choice(
        $.identifier,
        $.number,
        $.string,
        $.function_call,
        $.unary_expression,
        $.binary_expression,
        $.parenthesized_expression,
        $.indexed_expression,
        $.timeseries_expression
      ),

    // Function calls
    function_call: ($) =>
      seq(field("name", $.identifier), "(", optional($.argument_list), ")"),

    // Function arguments
    argument_list: ($) => seq($._expression, repeat(seq(",", $._expression))),

    // Unary expressions
    unary_expression: ($) =>
      prec(2, seq(field("operator", choice("-", "!", "~")), $._expression)),

    // Binary expressions with precedence based on Stata's rules
    binary_expression: ($) => {
      // Helper function to define binary expressions with precedence
      const bin_exp = (op, precedence) =>
        prec.left(
          precedence,
          seq(
            field("left", $._expression),
            field("operator", op),
            field("right", $._expression)
          )
        );
      return choice(
        // Go down operations in ascending order of precedence
        // Logical operators
        bin_exp("|", 3),
        bin_exp("&", 4),
        // Relational operators
        ...["==", "!=", "~=", ">", "<", ">=", "<="].map((op) => bin_exp(op, 5)),
        // Arithmetic operators
        bin_exp("+", 6),
        bin_exp("-", 6),
        bin_exp("*", 7),
        bin_exp("/", 7),
        bin_exp("^", 8)
      );
    },

    // Parenthesized expressions
    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    // Array/matrix subscript notation: var[n]
    indexed_expression: ($) => seq($._expression, "[", $._expression, "]"),

    // Time series expression
    timeseries_expression: ($) =>
      seq(
        field("operator", choice("L", "F", "D")),
        optional($.number),
        ".",
        $.identifier
      ),

    identifier: ($) => /[a-zA-Z_]\w*/,

    // Numbers
    number: ($) => /[0-9]+(\.[0-9]+)?/,

    // Strings with both quote types
    string: ($) =>
      choice(
        seq('"', field("value", repeat(choice(/[^"\n]/, '\\"'))), '"'),
        seq("'", field("value", repeat(choice(/[^'\n]/, "\\'"))), "'")
      ),
  },
});
