package tree_sitter_stata_do_parser_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_stata_do_parser "github.com/simonmtaye/tree-sitter-stata/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_stata_do_parser.Language())
	if language == nil {
		t.Errorf("Error loading Stata Do Parser grammar")
	}
}
