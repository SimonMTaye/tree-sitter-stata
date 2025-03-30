# Tree-Sitter Stata Grammar

A tree-sitter grammar for Stata. The goal is support better tooling for Stata code, such as linting and hopefully a language server.

## Roadmap

As per the recommendations in the [tree-sitter documentation](https://tree-sitter.github.io/tree-sitter/creating-parsers/3-writing-the-grammar.html#the-first-few-rules), the grammar is being developed with a breadth-first approach.

Once the following broad sections (and tests!) are implemented, the grammar will be refined to include more specific rules.

- [x] Comments
- [x] Commands
- [x] Expressions
- [x] 'foreach' blocks
- [x] 'if' blocks
- [x] 'while' blocks
- [x] Modifier blocks
  - Things like `quietly`, `noisily`, `capture`, etc.
- [x] 'forvalues' blocks

## Flesh Out

Once basic breadth of the grammar is complete, we will implement more specific rules for each of the above sections.

This section will be fleshed out as each broad structure is complete

### Comments

- [ ] Comments that interrupt a line

### Commands

- [ ] Prefixes
- [ ] `if exp`
- [ ] `=exp`
- [ ] `in range`
- [ ] `weight`
- [ ] `options`

### For Loops

- [ ] flesh the list that can be matched in `foreach`
  - [ ] `numlist`
  - [ ] `varlist` / `newlist`

## Issues

- [ ] Grammar throws an error if ends without an empty blank line
