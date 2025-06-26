/**
 * Parser for MSpec language
 * Implements a recursive descent parser based on the MSpec grammar
 */

import { Range } from 'vscode-languageserver-types';
import {
  AbstractField,
  ArrayField,
  ArrayLoopType,
  AssertField,
  Attribute,
  BinaryOperator,
  CaseStatement,
  ChecksumField,
  ComplexTypeDefinition,
  ConstField,
  DataIoDefinition,
  DataType,
  DiscriminatedTypeDefinition,
  DiscriminatorField,
  EnumDefinition,
  EnumField,
  EnumValue,
  Expression,
  FieldDefinition,
  ImplicitField,
  ManualArrayField,
  ManualField,
  MSpecFile,
  OptionalField,
  PaddingField,
  Parameter,
  PeekField,
  ReservedField,
  SimpleField,
  TypeDefinition,
  TypeReference,
  TypeSwitchField,
  UnaryOperator,
  UnknownField,
  ValidationField,
  VirtualField,
} from '../types/mspec-types';
import { Token, TokenType } from './lexer';

export class ParseError extends Error {
  constructor(
    message: string,
    public token: Token,
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export class MSpecParser {
  private tokens: Token[] = [];
  private current = 0;

  public parse(tokens: Token[]): MSpecFile {
    this.tokens = tokens;
    this.current = 0;

    const definitions: ComplexTypeDefinition[] = [];

    while (!this.isAtEnd()) {
      // Skip comments and whitespace
      this.skipWhitespaceAndComments();

      if (this.isAtEnd()) {
        break;
      }

      if (this.check(TokenType.LEFT_BRACKET)) {
        const definition = this.parseComplexTypeDefinition();
        if (definition) {
          definitions.push(definition);
        }
      } else {
        this.advance(); // Skip unexpected tokens
      }
    }

    return {
      type: 'MSpecFile',
      range: this.createRange(0, this.tokens.length - 1),
      definitions,
    };
  }

  private parseComplexTypeDefinition(): ComplexTypeDefinition | null {
    if (!this.match(TokenType.LEFT_BRACKET)) {
      return null;
    }

    const startToken = this.previous();

    if (this.match(TokenType.TYPE)) {
      return this.parseTypeDefinition(startToken);
    } else if (this.match(TokenType.DISCRIMINATED_TYPE)) {
      return this.parseDiscriminatedTypeDefinition(startToken);
    } else if (this.match(TokenType.ENUM)) {
      return this.parseEnumDefinition(startToken);
    } else if (this.match(TokenType.DATA_IO)) {
      return this.parseDataIoDefinition(startToken);
    } else {
      throw new ParseError('Expected type definition keyword', this.peek());
    }
  }

  private parseTypeDefinition(startToken: Token): TypeDefinition {
    const name = this.consumeIdentifier('Expected type name');

    let parameters: Parameter[] | undefined;
    if (this.match(TokenType.LEFT_PAREN)) {
      parameters = this.parseParameterList();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after parameters');
    }

    const attributes = this.parseAttributeList();
    const fields = this.parseFieldList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after type definition');

    return {
      type: 'TypeDefinition',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      name,
      parameters,
      attributes,
      fields,
    };
  }

  private parseDiscriminatedTypeDefinition(startToken: Token): DiscriminatedTypeDefinition {
    const name = this.consumeIdentifier('Expected discriminated type name');

    let parameters: Parameter[] | undefined;
    if (this.match(TokenType.LEFT_PAREN)) {
      parameters = this.parseParameterList();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after parameters');
    }

    const attributes = this.parseAttributeList();
    const fields = this.parseFieldList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after discriminated type definition');

    return {
      type: 'DiscriminatedTypeDefinition',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      name,
      parameters,
      attributes,
      fields,
    };
  }

  private parseEnumDefinition(startToken: Token): EnumDefinition {
    let dataType: DataType | undefined;

    // Check if there's a data type before the name
    if (this.checkDataType()) {
      dataType = this.parseDataType();
    }

    const name = this.consumeIdentifier('Expected enum name');

    let parameters: Parameter[] | undefined;
    if (this.match(TokenType.LEFT_PAREN)) {
      parameters = this.parseParameterList();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after parameters');
    }

    const attributes = this.parseAttributeList();
    const values = this.parseEnumValueList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after enum definition');

    return {
      type: 'EnumDefinition',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      parameters,
      attributes,
      values,
    };
  }

  private parseDataIoDefinition(startToken: Token): DataIoDefinition {
    const name = this.consumeIdentifier('Expected dataIo name');

    let parameters: Parameter[] | undefined;
    if (this.match(TokenType.LEFT_PAREN)) {
      parameters = this.parseParameterList();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after parameters');
    }

    const attributes = this.parseAttributeList();

    // Parse type switch
    this.consume(TokenType.LEFT_BRACKET, 'Expected "[" for type switch');
    const typeSwitch = this.parseTypeSwitchField();
    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after type switch');

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after dataIo definition');

    return {
      type: 'DataIoDefinition',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      name,
      parameters,
      attributes,
      typeSwitch,
    };
  }

  private parseParameterList(): Parameter[] {
    const parameters: Parameter[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        // Skip whitespace and comments
        this.skipWhitespaceAndComments();

        // For parameters, we expect a data type followed by a name
        // e.g., "uint 16 length" should be parsed as dataType="uint 16", name="length"
        // or "DriverType driverType" for custom types
        const dataType: TypeReference = this.parseTypeReference();

        const name = this.consumeIdentifier('Expected parameter name');

        parameters.push({
          type: 'Parameter',
          range: this.createRange(this.current - 2, this.current - 1),
          dataType,
          name,
        });

        // Skip whitespace and comments
        this.skipWhitespaceAndComments();
      } while (this.match(TokenType.COMMA));
    }

    return parameters;
  }

  private parseAttributeList(): Attribute[] {
    const attributes: Attribute[] = [];

    while (this.check(TokenType.IDENTIFIER) && this.peekNext()?.type === TokenType.ASSIGN) {
      const name = this.advance().value;
      this.consume(TokenType.ASSIGN, 'Expected "=" after attribute name');

      // Handle quoted expressions
      if (this.match(TokenType.TICK)) {
        const value = this.parseExpression();
        this.consume(TokenType.TICK, 'Expected closing quote');

        attributes.push({
          type: 'Attribute',
          range: this.createRange(this.current - 4, this.current - 1),
          name,
          value,
        });
      } else {
        const value = this.parseExpression();

        attributes.push({
          type: 'Attribute',
          range: this.createRange(this.current - 3, this.current - 1),
          name,
          value,
        });
      }
    }

    return attributes;
  }

  private parseFieldList(): FieldDefinition[] {
    const fields: FieldDefinition[] = [];

    while (!this.isAtEnd()) {
      // Skip comments and whitespace
      this.skipWhitespaceAndComments();

      if (this.isAtEnd() || !this.check(TokenType.LEFT_BRACKET)) {
        break;
      }

      const field = this.parseFieldDefinition();
      if (field) {
        fields.push(field);
      }
    }

    return fields;
  }

  private parseFieldDefinition(): FieldDefinition | null {
    if (!this.match(TokenType.LEFT_BRACKET)) {
      return null;
    }

    const startToken = this.previous();

    // Determine field type based on the next token
    if (this.match(TokenType.SIMPLE)) {
      return this.parseSimpleField(startToken);
    } else if (this.match(TokenType.ARRAY)) {
      return this.parseArrayField(startToken);
    } else if (this.match(TokenType.CONST)) {
      return this.parseConstField(startToken);
    } else if (this.match(TokenType.RESERVED)) {
      return this.parseReservedField(startToken);
    } else if (this.match(TokenType.OPTIONAL)) {
      return this.parseOptionalField(startToken);
    } else if (this.match(TokenType.DISCRIMINATOR)) {
      return this.parseDiscriminatorField(startToken);
    } else if (this.match(TokenType.IMPLICIT)) {
      return this.parseImplicitField(startToken);
    } else if (this.match(TokenType.VIRTUAL)) {
      return this.parseVirtualField(startToken);
    } else if (this.match(TokenType.MANUAL)) {
      return this.parseManualField(startToken);
    } else if (this.match(TokenType.MANUAL_ARRAY)) {
      return this.parseManualArrayField(startToken);
    } else if (this.match(TokenType.CHECKSUM)) {
      return this.parseChecksumField(startToken);
    } else if (this.match(TokenType.PADDING)) {
      return this.parsePaddingField(startToken);
    } else if (this.match(TokenType.ASSERT)) {
      return this.parseAssertField(startToken);
    } else if (this.match(TokenType.VALIDATION)) {
      return this.parseValidationField(startToken);
    } else if (this.match(TokenType.PEEK)) {
      return this.parsePeekField(startToken);
    } else if (this.match(TokenType.UNKNOWN)) {
      return this.parseUnknownField(startToken);
    } else if (this.match(TokenType.ENUM)) {
      return this.parseEnumField(startToken);
    } else if (this.match(TokenType.ABSTRACT)) {
      return this.parseAbstractField(startToken);
    } else if (this.match(TokenType.TYPE_SWITCH)) {
      return this.parseTypeSwitchField(startToken);
    } else {
      throw new ParseError('Expected field type keyword', this.peek());
    }
  }

  private parseSimpleField(startToken: Token): SimpleField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after simple field');

    return {
      type: 'SimpleField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      attributes,
    };
  }

  private parseArrayField(startToken: Token): ArrayField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const loopType = this.parseArrayLoopType();

    // Handle quoted expressions
    let loopExpression: Expression;
    if (this.match(TokenType.TICK)) {
      // Parse the full expression inside quotes
      loopExpression = this.parseExpression();
      this.consume(TokenType.TICK, 'Expected closing quote');
    } else {
      loopExpression = this.parseExpression();
    }

    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after array field');

    return {
      type: 'ArrayField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      loopType,
      loopExpression,
      attributes,
    };
  }

  // Helper methods
  private parseTypeReference(): TypeReference {
    // Skip whitespace and comments
    this.skipWhitespaceAndComments();

    if (this.checkDataType()) {
      return {
        type: 'SimpleTypeReference',
        range: this.createRange(this.current, this.current),
        dataType: this.parseDataType(),
      };
    } else {
      const name = this.consumeIdentifier('Expected type name');
      let parameters: Expression[] | undefined;

      if (this.match(TokenType.LEFT_PAREN)) {
        parameters = this.parseExpressionList();
        this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after type parameters');
      }

      return {
        type: 'ComplexTypeReference',
        range: this.createRange(this.current - 1, this.current - 1),
        name,
        parameters,
      };
    }
  }

  private parseDataType(): DataType {
    const startPos = this.current;

    if (this.match(TokenType.BIT)) {
      return {
        type: 'DataType',
        range: this.createRange(startPos, this.current - 1),
        base: 'bit',
      };
    } else if (this.match(TokenType.BYTE)) {
      return {
        type: 'DataType',
        range: this.createRange(startPos, this.current - 1),
        base: 'byte',
      };
    } else if (this.match(TokenType.INT)) {
      const size = this.consumeInteger('Expected integer size after "int"');
      return {
        type: 'DataType',
        range: this.createRange(startPos, this.current - 1),
        base: 'int',
        size,
      };
    } else if (this.match(TokenType.UINT)) {
      const size = this.consumeInteger('Expected integer size after "uint"');
      return {
        type: 'DataType',
        range: this.createRange(startPos, this.current - 1),
        base: 'uint',
        size,
      };
    } else if (this.match(TokenType.FLOAT)) {
      const size = this.consumeInteger('Expected integer size after "float"');
      return {
        type: 'DataType',
        range: this.createRange(startPos, this.current - 1),
        base: 'float',
        size,
      };
    } else if (this.match(TokenType.STRING)) {
      const size = this.consumeInteger('Expected integer size after "string"');
      return {
        type: 'DataType',
        range: this.createRange(startPos, this.current - 1),
        base: 'string',
        size,
      };
    } else if (this.match(TokenType.VSTRING)) {
      let length: Expression | undefined;
      if (this.check(TokenType.TICK)) {
        length = this.parseExpression();
      }
      return {
        type: 'DataType',
        range: this.createRange(startPos, this.current - 1),
        base: 'vstring',
        length,
      };
    } else {
      throw new ParseError('Expected data type', this.peek());
    }
  }

  private parseExpression(): Expression {
    return this.parseTernary();
  }

  private parseTernary(): Expression {
    const expr = this.parseLogicalOr();

    if (this.match(TokenType.QUESTION)) {
      const trueExpr = this.parseExpression();
      this.consume(TokenType.COLON, 'Expected ":" in ternary expression');
      const falseExpr = this.parseExpression();

      return {
        type: 'TernaryExpression',
        range: this.createRange(this.current - 5, this.current - 1),
        condition: expr,
        trueExpression: trueExpr,
        falseExpression: falseExpr,
      };
    }

    return expr;
  }

  private parseLogicalOr(): Expression {
    let expr = this.parseLogicalAnd();

    while (this.match(TokenType.LOGICAL_OR)) {
      const operator = this.previous().value as BinaryOperator;
      const right = this.parseLogicalAnd();
      expr = {
        type: 'BinaryExpression',
        range: this.createRange(this.current - 3, this.current - 1),
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private parseLogicalAnd(): Expression {
    let expr = this.parseEquality();

    while (this.match(TokenType.LOGICAL_AND)) {
      const operator = this.previous().value as BinaryOperator;
      const right = this.parseEquality();
      expr = {
        type: 'BinaryExpression',
        range: this.createRange(this.current - 3, this.current - 1),
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private parseEquality(): Expression {
    let expr = this.parseComparison();

    while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const operator = this.previous().value as BinaryOperator;
      const right = this.parseComparison();
      expr = {
        type: 'BinaryExpression',
        range: this.createRange(this.current - 3, this.current - 1),
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private parseComparison(): Expression {
    let expr = this.parseAddition();

    while (
      this.match(
        TokenType.GREATER_THAN,
        TokenType.LESS_THAN,
        TokenType.GREATER_EQUAL,
        TokenType.LESS_EQUAL,
      )
    ) {
      const operator = this.previous().value as BinaryOperator;
      const right = this.parseAddition();
      expr = {
        type: 'BinaryExpression',
        range: this.createRange(this.current - 3, this.current - 1),
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private parseAddition(): Expression {
    let expr = this.parseMultiplication();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().value as BinaryOperator;
      const right = this.parseMultiplication();
      expr = {
        type: 'BinaryExpression',
        range: this.createRange(this.current - 3, this.current - 1),
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private parseMultiplication(): Expression {
    let expr = this.parseUnary();

    while (this.match(TokenType.ASTERISK, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.previous().value as BinaryOperator;
      const right = this.parseUnary();
      expr = {
        type: 'BinaryExpression',
        range: this.createRange(this.current - 3, this.current - 1),
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private parseUnary(): Expression {
    if (this.match(TokenType.LOGICAL_NOT, TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().value as UnaryOperator;
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        range: this.createRange(this.current - 2, this.current - 1),
        operator,
        operand,
      };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): Expression {
    let expr = this.parsePrimary();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.match(TokenType.DOT)) {
        const field = this.consumeIdentifier('Expected field name after "."');
        expr = {
          type: 'FieldAccess',
          range: this.createRange(this.current - 2, this.current - 1),
          object: expr,
          field,
        };
      } else if (this.match(TokenType.LEFT_BRACKET)) {
        const index = this.parseExpression();
        this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after array index');
        expr = {
          type: 'ArrayAccess',
          range: this.createRange(this.current - 3, this.current - 1),
          array: expr,
          index,
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private parseDiscriminatorExpression(): Expression {
    // Parse discriminator expressions - similar to parsePostfix but without array access
    // to avoid conflicts with typeSwitch case syntax
    let expr = this.parsePrimary();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.match(TokenType.DOT)) {
        const field = this.consumeIdentifier('Expected field name after "."');
        expr = {
          type: 'FieldAccess',
          range: this.createRange(this.current - 2, this.current - 1),
          object: expr,
          field,
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): Expression {
    if (this.match(TokenType.BOOLEAN_LITERAL)) {
      const value = this.previous().value === 'true';
      return {
        type: 'ValueLiteral',
        range: this.createRange(this.current - 1, this.current - 1),
        value,
        literalType: 'boolean',
      };
    }

    if (this.match(TokenType.INTEGER_LITERAL)) {
      const value = parseInt(this.previous().value, 10);
      return {
        type: 'ValueLiteral',
        range: this.createRange(this.current - 1, this.current - 1),
        value,
        literalType: 'integer',
      };
    }

    if (this.match(TokenType.FLOAT_LITERAL)) {
      const value = parseFloat(this.previous().value);
      return {
        type: 'ValueLiteral',
        range: this.createRange(this.current - 1, this.current - 1),
        value,
        literalType: 'float',
      };
    }

    if (this.match(TokenType.HEX_LITERAL)) {
      const value = parseInt(this.previous().value, 16);
      return {
        type: 'ValueLiteral',
        range: this.createRange(this.current - 1, this.current - 1),
        value,
        literalType: 'hex',
      };
    }

    if (this.match(TokenType.STRING_LITERAL)) {
      const value = this.previous().value;
      return {
        type: 'ValueLiteral',
        range: this.createRange(this.current - 1, this.current - 1),
        value,
        literalType: 'string',
      };
    }

    if (this.match(TokenType.TICK)) {
      // Handle quoted expressions - parse the content inside quotes
      const expr = this.parseExpression();
      this.consume(TokenType.TICK, 'Expected closing quote');
      return expr;
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.previous().value;

      // Check for function call
      if (this.match(TokenType.LEFT_PAREN)) {
        const args = this.parseExpressionList();
        this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after function arguments');
        return {
          type: 'FunctionCall',
          range: this.createRange(this.current - args.length - 3, this.current - 1),
          name,
          arguments: args,
        };
      }

      // Variable literal
      return {
        type: 'VariableLiteral',
        range: this.createRange(this.current - 1, this.current - 1),
        name,
      };
    }

    // Handle keywords that can be used as variable names in expressions
    if (this.match(TokenType.LENGTH, TokenType.COUNT, TokenType.TERMINATED)) {
      const name = this.previous().value;
      return {
        type: 'VariableLiteral',
        range: this.createRange(this.current - 1, this.current - 1),
        name,
      };
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after expression');
      return {
        type: 'ParenthesizedExpression',
        range: this.createRange(this.current - 3, this.current - 1),
        expression: expr,
      };
    }

    throw new ParseError('Expected expression', this.peek());
  }

  private parseConstField(startToken: Token): ConstField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const expectedValue = this.parseExpression();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after const field');

    return {
      type: 'ConstField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      expectedValue,
      attributes,
    };
  }

  private parseReservedField(startToken: Token): ReservedField {
    const dataType = this.parseDataType();
    const expectedValue = this.parseExpression();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after reserved field');

    return {
      type: 'ReservedField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      expectedValue,
      attributes,
    };
  }

  private parseOptionalField(startToken: Token): OptionalField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    let condition: Expression | undefined;

    if (this.match(TokenType.TICK)) {
      condition = this.parseExpression();
      this.consume(TokenType.TICK, 'Expected closing quote');
    }

    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after optional field');

    return {
      type: 'OptionalField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      condition,
      attributes,
    };
  }

  private parseDiscriminatorField(startToken: Token): DiscriminatorField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after discriminator field');

    return {
      type: 'DiscriminatorField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      attributes,
    };
  }

  private parseImplicitField(startToken: Token): ImplicitField {
    const dataType = this.parseDataType();
    const name = this.consumeIdentifier('Expected field name');
    const serializeExpression = this.parseExpression();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after implicit field');

    return {
      type: 'ImplicitField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      serializeExpression,
      attributes,
    };
  }

  private parseVirtualField(startToken: Token): VirtualField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const valueExpression = this.parseExpression();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after virtual field');

    return {
      type: 'VirtualField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      valueExpression,
      attributes,
    };
  }

  private parseManualField(startToken: Token): ManualField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const parseExpression = this.parseExpression();
    const serializeExpression = this.parseExpression();
    const lengthExpression = this.parseExpression();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after manual field');

    return {
      type: 'ManualField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      parseExpression,
      serializeExpression,
      lengthExpression,
      attributes,
    };
  }

  private parseManualArrayField(startToken: Token): ManualArrayField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const loopType = this.parseArrayLoopType();
    const loopExpression = this.parseExpression();
    const parseExpression = this.parseExpression();
    const serializeExpression = this.parseExpression();
    const lengthExpression = this.parseExpression();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after manual array field');

    return {
      type: 'ManualArrayField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      loopType,
      loopExpression,
      parseExpression,
      serializeExpression,
      lengthExpression,
      attributes,
    };
  }

  private parseChecksumField(startToken: Token): ChecksumField {
    const dataType = this.parseDataType();
    const name = this.consumeIdentifier('Expected field name');
    const checksumExpression = this.parseExpression();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after checksum field');

    return {
      type: 'ChecksumField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      checksumExpression,
      attributes,
    };
  }

  private parsePaddingField(startToken: Token): PaddingField {
    const dataType = this.parseDataType();
    const name = this.consumeIdentifier('Expected field name');
    const paddingValue = this.parseExpression();
    const timesPadding = this.parseExpression();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after padding field');

    return {
      type: 'PaddingField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      paddingValue,
      timesPadding,
      attributes,
    };
  }

  private parseAssertField(startToken: Token): AssertField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const condition = this.parseExpression();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after assert field');

    return {
      type: 'AssertField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      condition,
      attributes,
    };
  }

  private parseValidationField(startToken: Token): ValidationField {
    const validationExpression = this.parseExpression();
    let description: string | undefined;
    let shouldFail: boolean | undefined;

    // Parse optional description and shouldFail
    if (this.check(TokenType.STRING_LITERAL)) {
      description = this.advance().value;
    }

    if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'shouldFail') {
      this.advance();
      this.consume(TokenType.ASSIGN, 'Expected "=" after shouldFail');
      shouldFail = this.advance().value === 'true';
    }

    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after validation field');

    return {
      type: 'ValidationField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      validationExpression,
      description,
      shouldFail,
      attributes,
    };
  }

  private parsePeekField(startToken: Token): PeekField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    let offset: Expression | undefined;

    if (!this.check(TokenType.RIGHT_BRACKET) && !this.check(TokenType.IDENTIFIER)) {
      offset = this.parseExpression();
    }

    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after peek field');

    return {
      type: 'PeekField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      offset,
      attributes,
    };
  }

  private parseUnknownField(startToken: Token): UnknownField {
    const dataType = this.parseDataType();
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after unknown field');

    return {
      type: 'UnknownField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      attributes,
    };
  }

  private parseEnumField(startToken: Token): EnumField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const fieldName = this.consumeIdentifier('Expected enum field name');
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after enum field');

    return {
      type: 'EnumField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      fieldName,
      attributes,
    };
  }

  private parseAbstractField(startToken: Token): AbstractField {
    const dataType = this.parseTypeReference();
    const name = this.consumeIdentifier('Expected field name');
    const attributes = this.parseAttributeList();

    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after abstract field');

    return {
      type: 'AbstractField',
      range: this.createRange(this.getTokenIndex(startToken), this.current - 1),
      dataType,
      name,
      attributes,
    };
  }

  private parseTypeSwitchField(startToken?: Token): TypeSwitchField {
    const discriminators: Expression[] = [];

    // Parse discriminator list - can be simple identifiers or member access expressions
    do {
      const discriminator = this.parseDiscriminatorExpression();
      discriminators.push(discriminator);
    } while (this.match(TokenType.COMMA));

    const cases: CaseStatement[] = [];

    // Parse case statements
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Skip comments and whitespace
      this.skipWhitespaceAndComments();

      // Check if we have a case statement
      // Cases can be: ['value' Name] or [Name] (default case)
      if (!this.check(TokenType.LEFT_BRACKET)) {
        break;
      }

      const nextToken = this.peekNext();
      if (
        !nextToken ||
        (nextToken.type !== TokenType.TICK && nextToken.type !== TokenType.IDENTIFIER)
      ) {
        break;
      }
      this.advance(); // consume '['

      const discriminatorValues: Expression[] = [];

      // Parse discriminator values - each value is in its own quotes
      if (this.match(TokenType.TICK)) {
        const value = this.parseExpression();
        discriminatorValues.push(value);
        this.consume(TokenType.TICK, 'Expected closing quote');

        // Parse additional discriminator values separated by commas
        while (this.match(TokenType.COMMA)) {
          this.consume(TokenType.TICK, 'Expected opening quote for discriminator value');
          const additionalValue = this.parseExpression();
          discriminatorValues.push(additionalValue);
          this.consume(TokenType.TICK, 'Expected closing quote for discriminator value');
        }
      }

      const name = this.consumeIdentifier('Expected case type name');

      // Parse optional parameters
      let parameters: Parameter[] | undefined;
      if (this.match(TokenType.LEFT_PAREN)) {
        parameters = this.parseParameterList();
        this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after parameters');
      }

      // Parse case fields
      const fields: FieldDefinition[] = [];
      while (!this.isAtEnd()) {
        // Skip comments and whitespace
        this.skipWhitespaceAndComments();

        // Stop if we've reached the end of the case (closing bracket)
        if (this.check(TokenType.RIGHT_BRACKET)) {
          break;
        }

        // Stop if we've reached the start of the next case
        if (this.check(TokenType.LEFT_BRACKET) && this.checkNext(TokenType.TICK)) {
          break;
        }

        // If we don't see a field start, break
        if (!this.check(TokenType.LEFT_BRACKET)) {
          break;
        }

        const field = this.parseFieldDefinition();
        if (field) {
          fields.push(field);
        }
      }

      // Skip comments and whitespace before closing bracket
      this.skipWhitespaceAndComments();
      this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after case statement');

      cases.push({
        type: 'CaseStatement',
        range: this.createRange(this.current - fields.length - 5, this.current - 1),
        discriminatorValues,
        name,
        parameters,
        fields,
      });
    }

    // Skip comments and whitespace before closing bracket
    this.skipWhitespaceAndComments();

    // Consume the closing bracket of the typeSwitch field
    this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after typeSwitch field');

    const endPos = startToken ? this.getTokenIndex(startToken) : this.current - cases.length - 5;

    return {
      type: 'TypeSwitchField',
      range: this.createRange(endPos, this.current - 1),
      discriminators,
      cases,
      attributes: [],
    };
  }

  private parseEnumValueList(): EnumValue[] {
    const values: EnumValue[] = [];

    while (this.check(TokenType.LEFT_BRACKET)) {
      this.advance(); // consume '['

      let valueExpression: Expression | undefined;
      if (this.match(TokenType.TICK)) {
        valueExpression = this.parseExpression();
        this.consume(TokenType.TICK, 'Expected closing quote');
      }

      const name = this.consumeIdentifier('Expected enum value name');

      // Parse optional constant values
      let constantValues: Expression[] | undefined;
      if (this.match(TokenType.LEFT_BRACKET)) {
        constantValues = this.parseExpressionList();
        this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after constant values');
      }

      this.consume(TokenType.RIGHT_BRACKET, 'Expected "]" after enum value');

      values.push({
        type: 'EnumValue',
        range: this.createRange(this.current - 3, this.current - 1),
        valueExpression,
        name,
        constantValues,
      });
    }

    return values;
  }

  private checkNext(type: TokenType): boolean {
    const next = this.peekNext();
    return next ? next.type === type : false;
  }

  // Utility methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token | undefined {
    if (this.current + 1 >= this.tokens.length) {
      return undefined;
    }
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw new ParseError(message, this.peek());
  }

  private consumeIdentifier(message: string): string {
    if (this.check(TokenType.IDENTIFIER)) {
      return this.advance().value;
    }

    // Allow certain keywords to be used as identifiers in specific contexts
    if (
      this.check(TokenType.LENGTH) ||
      this.check(TokenType.COUNT) ||
      this.check(TokenType.TERMINATED)
    ) {
      return this.advance().value;
    }

    throw new ParseError(message, this.peek());
  }

  private consumeInteger(message: string): number {
    if (this.check(TokenType.INTEGER_LITERAL)) {
      return parseInt(this.advance().value, 10);
    }
    throw new ParseError(message, this.peek());
  }

  private checkDataType(): boolean {
    return (
      this.check(TokenType.BIT) ||
      this.check(TokenType.BYTE) ||
      this.check(TokenType.INT) ||
      this.check(TokenType.UINT) ||
      this.check(TokenType.FLOAT) ||
      this.check(TokenType.STRING) ||
      this.check(TokenType.VSTRING) ||
      this.check(TokenType.TIME) ||
      this.check(TokenType.DATE) ||
      this.check(TokenType.DATE_TIME)
    );
  }

  private parseArrayLoopType(): ArrayLoopType {
    if (this.match(TokenType.COUNT)) {
      return 'count';
    }
    if (this.match(TokenType.LENGTH)) {
      return 'length';
    }
    if (this.match(TokenType.TERMINATED)) {
      return 'terminated';
    }

    // Also handle as identifiers in case they weren't tokenized as keywords
    if (this.check(TokenType.IDENTIFIER)) {
      const value = this.peek().value;
      if (value === 'count' || value === 'length' || value === 'terminated') {
        this.advance();
        return value as ArrayLoopType;
      }
    }

    throw new ParseError('Expected array loop type (count, length, or terminated)', this.peek());
  }

  private parseExpressionList(): Expression[] {
    const expressions: Expression[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        expressions.push(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }

    return expressions;
  }

  private createRange(startIndex: number, endIndex: number): Range {
    const startToken = this.tokens[Math.max(0, startIndex)];
    const endToken = this.tokens[Math.min(this.tokens.length - 1, endIndex)];

    return Range.create(startToken.range.start, endToken.range.end);
  }

  private getTokenIndex(token: Token): number {
    return this.tokens.indexOf(token);
  }

  private skipWhitespaceAndComments(): void {
    while (
      this.check(TokenType.WHITESPACE) ||
      this.check(TokenType.COMMENT) ||
      this.check(TokenType.NEWLINE)
    ) {
      this.advance();
    }
  }
}
