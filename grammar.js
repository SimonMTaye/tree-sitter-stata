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
        $.forvalues_statement,
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
        choice(
          seq("in", field("list", repeat1($._expression))),
          seq(
            "of",
            choice(
              seq("numlist", $.number_list),
              seq("varlist", $.variable_list),
              seq("newlist", $.variable_list),
              seq("local", $.identifier),
              seq("global", $.identifier)
            )
          )
        ),
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

    forvalues_statement: ($) =>
      seq(
        "forvalues",
        field("iterator", $.identifier),
        "=",
        field("numlist", $.number_list),
        field("body", $.block),
        "\n"
      ),

    // === EXPRESSION RULES START ===
    // Expressions can be used in many Stata contexts
    _expression: ($) =>
      prec.right(
        choice(
          $.identifier,
          $.number,
          $.string,
          $.function_call,
          $.unary_expression,
          $.binary_expression,
          $.parenthesized_expression,
          $.indexed_expression,
          $.timeseries_expression,
          $.local_macro,
          $.global_macro
        )
      ),

    // Local Macro
    local_macro: ($) => seq("`", field("name", $.identifier), "'"),

    // Global Macro
    global_macro: ($) => seq("$", field("name", $.identifier)),

    // Function calls
    function_call: ($) =>
      seq(field("name", $.identifier), "(", optional($.argument_list), ")"),

    // Function arguments
    argument_list: ($) => seq($._expression, repeat(seq(",", $._expression))),

    // Unary expressions
    unary_expression: ($) =>
      prec(2, seq(field("operator", choice("!", "~")), $._expression)),

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

    // Negative numbers
    number: ($) =>
      seq(
        optional("-"),
        choice(
          /\.[0-9]+/, // Decimal numbers without leading digits
          /[0-9]+(\.[0-9]+)?/
        )
      ),

    // Number ranges in various formats
    range: ($) =>
      choice(
        // Simple ranges: 1/5, 1:5, 1 to 5
        seq($.number, choice("/", "to", ":"), $.number),
        // Step notation with parentheses: 1(2)9
        seq($.number, "(", $.number, ")", $.number),
        // Step notation with brackets: 1[2]9
        seq($.number, "[", $.number, "]", $.number)
      ),

    // Number lists
    number_list: ($) => repeat1(seq(choice($.number, $.range), optional(","))),

    // Varible list
    variable_list: ($) =>
      repeat1(choice(seq($.identifier, optional("*")), $.var_range)),

    var_range: ($) => seq($.identifier, "-", $.identifier),

    // Strings with both quote types
    string: ($) =>
      choice(
        seq('"', field("value", repeat(choice(/[^"\n]/, '\\"'))), '"'),
        seq("'", field("value", repeat(choice(/[^'\n]/, "\\'"))), "'")
      ),
  },
});
