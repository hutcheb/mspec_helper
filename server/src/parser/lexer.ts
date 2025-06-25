/**
 * Lexer for MSpec language
 * Tokenizes MSpec source code into a stream of tokens
 */

import { Position, Range } from 'vscode-languageserver-types';

export enum TokenType {
  // Literals
  IDENTIFIER = 'IDENTIFIER',
  INTEGER_LITERAL = 'INTEGER_LITERAL',
  FLOAT_LITERAL = 'FLOAT_LITERAL',
  HEX_LITERAL = 'HEX_LITERAL',
  STRING_LITERAL = 'STRING_LITERAL',
  BOOLEAN_LITERAL = 'BOOLEAN_LITERAL',

  // Keywords
  TYPE = 'TYPE',
  DISCRIMINATED_TYPE = 'DISCRIMINATED_TYPE',
  ENUM = 'ENUM',
  DATA_IO = 'DATA_IO',

  // Field types
  SIMPLE = 'SIMPLE',
  ARRAY = 'ARRAY',
  CONST = 'CONST',
  RESERVED = 'RESERVED',
  OPTIONAL = 'OPTIONAL',
  DISCRIMINATOR = 'DISCRIMINATOR',
  IMPLICIT = 'IMPLICIT',
  VIRTUAL = 'VIRTUAL',
  MANUAL = 'MANUAL',
  MANUAL_ARRAY = 'MANUAL_ARRAY',
  CHECKSUM = 'CHECKSUM',
  PADDING = 'PADDING',
  ASSERT = 'ASSERT',
  VALIDATION = 'VALIDATION',
  PEEK = 'PEEK',
  UNKNOWN = 'UNKNOWN',
  ABSTRACT = 'ABSTRACT',
  TYPE_SWITCH = 'TYPE_SWITCH',

  // Array loop types
  COUNT = 'COUNT',
  LENGTH = 'LENGTH',
  TERMINATED = 'TERMINATED',

  // Data types
  BIT = 'BIT',
  BYTE = 'BYTE',
  INT = 'INT',
  UINT = 'UINT',
  VINT = 'VINT',
  VUINT = 'VUINT',
  FLOAT = 'FLOAT',
  UFLOAT = 'UFLOAT',
  STRING = 'STRING',
  VSTRING = 'VSTRING',
  TIME = 'TIME',
  DATE = 'DATE',
  DATE_TIME = 'DATE_TIME',

  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MODULO = 'MODULO',
  POWER = 'POWER',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS_EQUAL = 'LESS_EQUAL',
  LOGICAL_AND = 'LOGICAL_AND',
  LOGICAL_OR = 'LOGICAL_OR',
  LOGICAL_NOT = 'LOGICAL_NOT',
  BITWISE_AND = 'BITWISE_AND',
  BITWISE_OR = 'BITWISE_OR',
  SHIFT_LEFT = 'SHIFT_LEFT',
  SHIFT_RIGHT = 'SHIFT_RIGHT',
  ASSIGN = 'ASSIGN',
  QUESTION = 'QUESTION',
  COLON = 'COLON',

  // Delimiters
  LEFT_BRACKET = 'LEFT_BRACKET',
  RIGHT_BRACKET = 'RIGHT_BRACKET',
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  COMMA = 'COMMA',
  DOT = 'DOT',
  TICK = 'TICK',
  ASTERISK = 'ASTERISK',

  // Special
  WHITESPACE = 'WHITESPACE',
  NEWLINE = 'NEWLINE',
  COMMENT = 'COMMENT',
  EOF = 'EOF',
  ERROR = 'ERROR',
}

export interface Token {
  type: TokenType;
  value: string;
  range: Range;
}

const KEYWORDS: Record<string, TokenType> = {
  type: TokenType.TYPE,
  discriminatedType: TokenType.DISCRIMINATED_TYPE,
  enum: TokenType.ENUM,
  dataIo: TokenType.DATA_IO,
  simple: TokenType.SIMPLE,
  array: TokenType.ARRAY,
  const: TokenType.CONST,
  reserved: TokenType.RESERVED,
  optional: TokenType.OPTIONAL,
  discriminator: TokenType.DISCRIMINATOR,
  implicit: TokenType.IMPLICIT,
  virtual: TokenType.VIRTUAL,
  manual: TokenType.MANUAL,
  manualArray: TokenType.MANUAL_ARRAY,
  checksum: TokenType.CHECKSUM,
  padding: TokenType.PADDING,
  assert: TokenType.ASSERT,
  validation: TokenType.VALIDATION,
  peek: TokenType.PEEK,
  unknown: TokenType.UNKNOWN,
  abstract: TokenType.ABSTRACT,
  typeSwitch: TokenType.TYPE_SWITCH,
  count: TokenType.COUNT,
  length: TokenType.LENGTH,
  terminated: TokenType.TERMINATED,
  bit: TokenType.BIT,
  byte: TokenType.BYTE,
  int: TokenType.INT,
  uint: TokenType.UINT,
  vint: TokenType.VINT,
  vuint: TokenType.VUINT,
  float: TokenType.FLOAT,
  ufloat: TokenType.UFLOAT,
  string: TokenType.STRING,
  vstring: TokenType.VSTRING,
  time: TokenType.TIME,
  date: TokenType.DATE,
  dateTime: TokenType.DATE_TIME,
  true: TokenType.BOOLEAN_LITERAL,
  false: TokenType.BOOLEAN_LITERAL,
};

export class Lexer {
  private text: string;
  private position: number = 0;
  private line: number = 0;
  private column: number = 0;

  constructor(text: string) {
    this.text = text;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      range: this.createRange(this.position, this.position),
    });

    return tokens;
  }

  private nextToken(): Token | null {
    this.skipWhitespace();

    if (this.isAtEnd()) {
      return null;
    }

    const start = this.position;
    const startPos = this.getCurrentPosition();
    const char = this.advance();

    // Single character tokens
    switch (char) {
      case '[':
        return this.createToken(TokenType.LEFT_BRACKET, '[', start);
      case ']':
        return this.createToken(TokenType.RIGHT_BRACKET, ']', start);
      case '(':
        return this.createToken(TokenType.LEFT_PAREN, '(', start);
      case ')':
        return this.createToken(TokenType.RIGHT_PAREN, ')', start);
      case '{':
        return this.createToken(TokenType.LEFT_BRACE, '{', start);
      case '}':
        return this.createToken(TokenType.RIGHT_BRACE, '}', start);
      case ',':
        return this.createToken(TokenType.COMMA, ',', start);
      case '.':
        return this.createToken(TokenType.DOT, '.', start);
      case "'":
        return this.createToken(TokenType.TICK, "'", start);
      case '*':
        return this.createToken(TokenType.ASTERISK, '*', start);
      case '+':
        return this.createToken(TokenType.PLUS, '+', start);
      case '-':
        return this.createToken(TokenType.MINUS, '-', start);
      case '/':
        if (this.peek() === '/') {
          return this.lineComment(start);
        } else if (this.peek() === '*') {
          return this.blockComment(start);
        }
        return this.createToken(TokenType.DIVIDE, '/', start);
      case '%':
        return this.createToken(TokenType.MODULO, '%', start);
      case '^':
        return this.createToken(TokenType.POWER, '^', start);
      case '?':
        return this.createToken(TokenType.QUESTION, '?', start);
      case ':':
        return this.createToken(TokenType.COLON, ':', start);
      case '=':
        if (this.peek() === '=') {
          this.advance();
          return this.createToken(TokenType.EQUALS, '==', start);
        }
        return this.createToken(TokenType.ASSIGN, '=', start);
      case '!':
        if (this.peek() === '=') {
          this.advance();
          return this.createToken(TokenType.NOT_EQUALS, '!=', start);
        }
        return this.createToken(TokenType.LOGICAL_NOT, '!', start);
      case '>':
        if (this.peek() === '=') {
          this.advance();
          return this.createToken(TokenType.GREATER_EQUAL, '>=', start);
        } else if (this.peek() === '>') {
          this.advance();
          return this.createToken(TokenType.SHIFT_RIGHT, '>>', start);
        }
        return this.createToken(TokenType.GREATER_THAN, '>', start);
      case '<':
        if (this.peek() === '=') {
          this.advance();
          return this.createToken(TokenType.LESS_EQUAL, '<=', start);
        } else if (this.peek() === '<') {
          this.advance();
          return this.createToken(TokenType.SHIFT_LEFT, '<<', start);
        }
        return this.createToken(TokenType.LESS_THAN, '<', start);
      case '&':
        if (this.peek() === '&') {
          this.advance();
          return this.createToken(TokenType.LOGICAL_AND, '&&', start);
        }
        return this.createToken(TokenType.BITWISE_AND, '&', start);
      case '|':
        if (this.peek() === '|') {
          this.advance();
          return this.createToken(TokenType.LOGICAL_OR, '||', start);
        }
        return this.createToken(TokenType.BITWISE_OR, '|', start);
      case '"':
        return this.stringLiteral(start);
      case '0':
        if (this.peek() === 'x' || this.peek() === 'X') {
          return this.hexLiteral(start);
        }
      // Fall through to number
      default:
        if (this.isDigit(char)) {
          return this.numberLiteral(start);
        }
        if (this.isAlpha(char) || char === '_') {
          return this.identifier(start);
        }
        return this.createToken(TokenType.ERROR, char, start);
    }
  }

  private stringLiteral(start: number): Token {
    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === '\\') {
        this.advance(); // Skip escape character
        if (!this.isAtEnd()) {
          this.advance(); // Skip escaped character
        }
      } else {
        this.advance();
      }
    }

    if (this.isAtEnd()) {
      return this.createToken(TokenType.ERROR, 'Unterminated string', start);
    }

    this.advance(); // Closing quote
    const value = this.text.substring(start, this.position);
    return this.createToken(TokenType.STRING_LITERAL, value, start);
  }

  private hexLiteral(start: number): Token {
    this.advance(); // Skip 'x' or 'X'

    while (!this.isAtEnd() && this.isHexDigit(this.peek())) {
      this.advance();
    }

    const value = this.text.substring(start, this.position);
    return this.createToken(TokenType.HEX_LITERAL, value, start);
  }

  private numberLiteral(start: number): Token {
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      this.advance();
    }

    // Check for float
    if (!this.isAtEnd() && this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // Consume '.'
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance();
      }
      const value = this.text.substring(start, this.position);
      return this.createToken(TokenType.FLOAT_LITERAL, value, start);
    }

    const value = this.text.substring(start, this.position);
    return this.createToken(TokenType.INTEGER_LITERAL, value, start);
  }

  private identifier(start: number): Token {
    while (
      !this.isAtEnd() &&
      (this.isAlphaNumeric(this.peek()) || this.peek() === '_' || this.peek() === '-')
    ) {
      this.advance();
    }

    const value = this.text.substring(start, this.position);
    const tokenType = KEYWORDS[value] || TokenType.IDENTIFIER;
    return this.createToken(tokenType, value, start);
  }

  private lineComment(start: number): Token {
    this.advance(); // Skip second '/'
    while (!this.isAtEnd() && this.peek() !== '\n') {
      this.advance();
    }
    const value = this.text.substring(start, this.position);
    return this.createToken(TokenType.COMMENT, value, start);
  }

  private blockComment(start: number): Token {
    this.advance(); // Skip '*'
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance(); // Skip '*'
        this.advance(); // Skip '/'
        break;
      }
      this.advance();
    }
    const value = this.text.substring(start, this.position);
    return this.createToken(TokenType.COMMENT, value, start);
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.line++;
        this.column = 0;
        this.advance();
      } else {
        break;
      }
    }
  }

  private advance(): string {
    if (this.isAtEnd()) return '\0';
    const char = this.text[this.position++];
    this.column++;
    return char;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.text[this.position];
  }

  private peekNext(): string {
    if (this.position + 1 >= this.text.length) return '\0';
    return this.text[this.position + 1];
  }

  private isAtEnd(): boolean {
    return this.position >= this.text.length;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isHexDigit(char: string): boolean {
    return this.isDigit(char) || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F');
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private getCurrentPosition(): Position {
    return Position.create(this.line, this.column);
  }

  private createRange(start: number, end: number): Range {
    // Calculate positions for start and end
    let line = 0;
    let column = 0;

    for (let i = 0; i < start; i++) {
      if (this.text[i] === '\n') {
        line++;
        column = 0;
      } else {
        column++;
      }
    }

    const startPos = Position.create(line, column);

    for (let i = start; i < end; i++) {
      if (this.text[i] === '\n') {
        line++;
        column = 0;
      } else {
        column++;
      }
    }

    const endPos = Position.create(line, column);
    return Range.create(startPos, endPos);
  }

  private createToken(type: TokenType, value: string, start: number): Token {
    return {
      type,
      value,
      range: this.createRange(start, this.position),
    };
  }
}
