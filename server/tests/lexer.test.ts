/**
 * Tests for MSpec lexer
 */

import { Lexer, TokenType } from '../src/parser/lexer';

describe('MSpec Lexer', () => {
  let lexer: Lexer;

  beforeEach(() => {
    lexer = new Lexer('');
  });

  describe('Keywords', () => {
    test('should tokenize type definition keywords', () => {
      lexer = new Lexer('type discriminatedType enum dataIo');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(5); // 4 keywords + EOF
      expect(tokens[0].type).toBe(TokenType.TYPE);
      expect(tokens[1].type).toBe(TokenType.DISCRIMINATED_TYPE);
      expect(tokens[2].type).toBe(TokenType.ENUM);
      expect(tokens[3].type).toBe(TokenType.DATA_IO);
      expect(tokens[4].type).toBe(TokenType.EOF);
    });

    test('should tokenize field type keywords', () => {
      lexer = new Lexer('simple array const reserved optional');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(6); // 5 keywords + EOF
      expect(tokens[0].type).toBe(TokenType.SIMPLE);
      expect(tokens[1].type).toBe(TokenType.ARRAY);
      expect(tokens[2].type).toBe(TokenType.CONST);
      expect(tokens[3].type).toBe(TokenType.RESERVED);
      expect(tokens[4].type).toBe(TokenType.OPTIONAL);
    });

    test('should tokenize data type keywords', () => {
      lexer = new Lexer('bit byte int uint float string');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(7); // 6 keywords + EOF
      expect(tokens[0].type).toBe(TokenType.BIT);
      expect(tokens[1].type).toBe(TokenType.BYTE);
      expect(tokens[2].type).toBe(TokenType.INT);
      expect(tokens[3].type).toBe(TokenType.UINT);
      expect(tokens[4].type).toBe(TokenType.FLOAT);
      expect(tokens[5].type).toBe(TokenType.STRING);
    });
  });

  describe('Literals', () => {
    test('should tokenize integer literals', () => {
      lexer = new Lexer('123 0 999');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 integers + EOF
      expect(tokens[0].type).toBe(TokenType.INTEGER_LITERAL);
      expect(tokens[0].value).toBe('123');
      expect(tokens[1].type).toBe(TokenType.INTEGER_LITERAL);
      expect(tokens[1].value).toBe('0');
      expect(tokens[2].type).toBe(TokenType.INTEGER_LITERAL);
      expect(tokens[2].value).toBe('999');
    });

    test('should tokenize float literals', () => {
      lexer = new Lexer('3.14 0.5 123.456');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 floats + EOF
      expect(tokens[0].type).toBe(TokenType.FLOAT_LITERAL);
      expect(tokens[0].value).toBe('3.14');
      expect(tokens[1].type).toBe(TokenType.FLOAT_LITERAL);
      expect(tokens[1].value).toBe('0.5');
      expect(tokens[2].type).toBe(TokenType.FLOAT_LITERAL);
      expect(tokens[2].value).toBe('123.456');
    });

    test('should tokenize hex literals', () => {
      lexer = new Lexer('0x01 0xFF 0xABCD');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 hex + EOF
      expect(tokens[0].type).toBe(TokenType.HEX_LITERAL);
      expect(tokens[0].value).toBe('0x01');
      expect(tokens[1].type).toBe(TokenType.HEX_LITERAL);
      expect(tokens[1].value).toBe('0xFF');
      expect(tokens[2].type).toBe(TokenType.HEX_LITERAL);
      expect(tokens[2].value).toBe('0xABCD');
    });

    test('should tokenize string literals', () => {
      lexer = new Lexer('"hello" "world with spaces" "escaped\\"quote"');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 strings + EOF
      expect(tokens[0].type).toBe(TokenType.STRING_LITERAL);
      expect(tokens[0].value).toBe('"hello"');
      expect(tokens[1].type).toBe(TokenType.STRING_LITERAL);
      expect(tokens[1].value).toBe('"world with spaces"');
      expect(tokens[2].type).toBe(TokenType.STRING_LITERAL);
      expect(tokens[2].value).toBe('"escaped\\"quote"');
    });

    test('should tokenize boolean literals', () => {
      lexer = new Lexer('true false');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // 2 booleans + EOF
      expect(tokens[0].type).toBe(TokenType.BOOLEAN_LITERAL);
      expect(tokens[0].value).toBe('true');
      expect(tokens[1].type).toBe(TokenType.BOOLEAN_LITERAL);
      expect(tokens[1].value).toBe('false');
    });
  });

  describe('Operators', () => {
    test('should tokenize arithmetic operators', () => {
      lexer = new Lexer('+ - * / % ^');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(7); // 6 operators + EOF
      expect(tokens[0].type).toBe(TokenType.PLUS);
      expect(tokens[1].type).toBe(TokenType.MINUS);
      expect(tokens[2].type).toBe(TokenType.ASTERISK);
      expect(tokens[3].type).toBe(TokenType.DIVIDE);
      expect(tokens[4].type).toBe(TokenType.MODULO);
      expect(tokens[5].type).toBe(TokenType.POWER);
    });

    test('should tokenize comparison operators', () => {
      lexer = new Lexer('== != > < >= <=');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(7); // 6 operators + EOF
      expect(tokens[0].type).toBe(TokenType.EQUALS);
      expect(tokens[1].type).toBe(TokenType.NOT_EQUALS);
      expect(tokens[2].type).toBe(TokenType.GREATER_THAN);
      expect(tokens[3].type).toBe(TokenType.LESS_THAN);
      expect(tokens[4].type).toBe(TokenType.GREATER_EQUAL);
      expect(tokens[5].type).toBe(TokenType.LESS_EQUAL);
    });

    test('should tokenize logical operators', () => {
      lexer = new Lexer('&& || !');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 operators + EOF
      expect(tokens[0].type).toBe(TokenType.LOGICAL_AND);
      expect(tokens[1].type).toBe(TokenType.LOGICAL_OR);
      expect(tokens[2].type).toBe(TokenType.LOGICAL_NOT);
    });
  });

  describe('Delimiters', () => {
    test('should tokenize brackets', () => {
      lexer = new Lexer('[ ] ( ) { }');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(7); // 6 brackets + EOF
      expect(tokens[0].type).toBe(TokenType.LEFT_BRACKET);
      expect(tokens[1].type).toBe(TokenType.RIGHT_BRACKET);
      expect(tokens[2].type).toBe(TokenType.LEFT_PAREN);
      expect(tokens[3].type).toBe(TokenType.RIGHT_PAREN);
      expect(tokens[4].type).toBe(TokenType.LEFT_BRACE);
      expect(tokens[5].type).toBe(TokenType.RIGHT_BRACE);
    });

    test('should tokenize punctuation', () => {
      lexer = new Lexer(', . \'');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 punctuation + EOF
      expect(tokens[0].type).toBe(TokenType.COMMA);
      expect(tokens[1].type).toBe(TokenType.DOT);
      expect(tokens[2].type).toBe(TokenType.TICK);
    });
  });

  describe('Comments', () => {
    test('should tokenize line comments', () => {
      lexer = new Lexer('// This is a comment\ntype');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // comment + type + EOF
      expect(tokens[0].type).toBe(TokenType.COMMENT);
      expect(tokens[0].value).toBe('// This is a comment');
      expect(tokens[1].type).toBe(TokenType.TYPE);
    });

    test('should tokenize block comments', () => {
      lexer = new Lexer('/* Block comment */ type');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // comment + type + EOF
      expect(tokens[0].type).toBe(TokenType.COMMENT);
      expect(tokens[0].value).toBe('/* Block comment */');
      expect(tokens[1].type).toBe(TokenType.TYPE);
    });
  });

  describe('Identifiers', () => {
    test('should tokenize identifiers', () => {
      lexer = new Lexer('MyType fieldName variable_name');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 identifiers + EOF
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].value).toBe('MyType');
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].value).toBe('fieldName');
      expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2].value).toBe('variable_name');
    });

    test('should distinguish keywords from identifiers', () => {
      lexer = new Lexer('type MyType typeField');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // keyword + identifier + identifier + EOF
      expect(tokens[0].type).toBe(TokenType.TYPE);
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].value).toBe('MyType');
      expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2].value).toBe('typeField');
    });
  });

  describe('Complex Examples', () => {
    test('should tokenize simple type definition', () => {
      const input = '[type SimpleMessage\n    [simple uint 8 messageType]\n]';
      lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.LEFT_BRACKET,
        TokenType.TYPE,
        TokenType.IDENTIFIER, // SimpleMessage
        TokenType.LEFT_BRACKET,
        TokenType.SIMPLE,
        TokenType.UINT,
        TokenType.INTEGER_LITERAL, // 8
        TokenType.IDENTIFIER, // messageType
        TokenType.RIGHT_BRACKET,
        TokenType.RIGHT_BRACKET,
        TokenType.EOF
      ];
      
      expect(tokens.map(t => t.type)).toEqual(expectedTypes);
    });

    test('should handle whitespace correctly', () => {
      lexer = new Lexer('  type   MyType  ');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // type + identifier + EOF
      expect(tokens[0].type).toBe(TokenType.TYPE);
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2].type).toBe(TokenType.EOF);
    });
  });

  describe('Error Handling', () => {
    test('should handle unterminated strings', () => {
      lexer = new Lexer('"unterminated string');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(2); // error + EOF
      expect(tokens[0].type).toBe(TokenType.ERROR);
    });

    test('should handle invalid characters', () => {
      lexer = new Lexer('@#$');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(4); // 3 errors + EOF
      expect(tokens[0].type).toBe(TokenType.ERROR);
      expect(tokens[1].type).toBe(TokenType.ERROR);
      expect(tokens[2].type).toBe(TokenType.ERROR);
    });
  });
});
