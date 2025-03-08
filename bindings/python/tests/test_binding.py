from unittest import TestCase

import tree_sitter
import tree_sitter_stata_do_parser


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_stata_do_parser.language())
        except Exception:
            self.fail("Error loading Stata Do Parser grammar")
