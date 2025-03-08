import XCTest
import SwiftTreeSitter
import TreeSitterStataDoParser

final class TreeSitterStataDoParserTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_stata_do_parser())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Stata Do Parser grammar")
    }
}
