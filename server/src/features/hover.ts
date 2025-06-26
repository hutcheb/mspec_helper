/**
 * Hover provider for MSpec language
 */

import { Hover, MarkupKind, Position, Range, TextDocument } from 'vscode-languageserver/node';

import { AnalysisResult, MSpecSymbol, SymbolScope } from '../analyzer/semantic-analyzer';
import { MSpecFile } from '../types/mspec-types';

export class HoverProvider {
  public provideHover(
    document: TextDocument,
    position: Position,
    ast: MSpecFile,
    analysisResult: AnalysisResult,
  ): Hover | null {
    // Note: offset and text variables removed as they were unused
    // const offset = document.offsetAt(position);
    // const text = document.getText();

    // Find the word at the cursor position
    const wordRange = this.getWordRangeAtPosition(document, position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);

    // Check if it's a symbol reference
    const symbol = this.findSymbolAtPosition(analysisResult, wordRange, word);
    if (symbol) {
      return this.createSymbolHover(symbol, wordRange);
    }

    // Check if it's a keyword
    const keywordHover = this.createKeywordHover(word, wordRange);
    if (keywordHover) {
      return keywordHover;
    }

    // Check if it's a data type
    const dataTypeHover = this.createDataTypeHover(word, wordRange);
    if (dataTypeHover) {
      return dataTypeHover;
    }

    return null;
  }

  private getWordRangeAtPosition(document: TextDocument, position: Position): Range | null {
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Find word boundaries
    let start = offset;
    let end = offset;

    // Move start backwards to find word start
    while (start > 0 && this.isWordCharacter(text[start - 1])) {
      start--;
    }

    // Move end forwards to find word end
    while (end < text.length && this.isWordCharacter(text[end])) {
      end++;
    }

    if (start === end) {
      return null;
    }

    return Range.create(document.positionAt(start), document.positionAt(end));
  }

  private isWordCharacter(char: string): boolean {
    return /[a-zA-Z0-9_-]/.test(char);
  }

  private findSymbolAtPosition(
    analysisResult: AnalysisResult,
    range: Range,
    word: string,
  ): MSpecSymbol | null {
    // Look for the symbol in the symbol table
    return this.findSymbolInScope(analysisResult.symbolTable, word);
  }

  private findSymbolInScope(scope: SymbolScope, name: string): MSpecSymbol | null {
    // Check current scope
    const symbol = scope.symbols.get(name);
    if (symbol) {
      return symbol;
    }

    // Check child scopes
    for (const childScope of scope.children) {
      const childSymbol = this.findSymbolInScope(childScope, name);
      if (childSymbol) {
        return childSymbol;
      }
    }

    return null;
  }

  private createSymbolHover(symbol: MSpecSymbol, range: Range): Hover {
    const content = this.createSymbolMarkdown(symbol);

    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: content,
      },
      range,
    };
  }

  private createSymbolMarkdown(symbol: MSpecSymbol): string {
    let content = `**${symbol.name}** *(${symbol.type})*\n\n`;

    switch (symbol.type) {
      case 'type':
        content += this.createTypeDocumentation(symbol);
        break;
      case 'field':
        content += this.createFieldDocumentation(symbol);
        break;
      case 'parameter':
        content += this.createParameterDocumentation(symbol);
        break;
      case 'enumValue':
        content += this.createEnumValueDocumentation(symbol);
        break;
      default:
        content += `Symbol of type: ${symbol.type}`;
    }

    return content;
  }

  private createTypeDocumentation(symbol: MSpecSymbol): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const definition = symbol.definition as any;
    let content = '';

    switch (definition.type) {
      case 'TypeDefinition':
        content += 'A structured data type with the following fields:\n\n';
        content += this.formatFieldList(definition.fields);
        break;

      case 'DiscriminatedTypeDefinition':
        content +=
          'A discriminated type that can have different structures based on a discriminator field.\n\n';
        content += this.formatFieldList(definition.fields);
        break;

      case 'EnumDefinition':
        content += 'An enumeration with the following values:\n\n';
        content += this.formatEnumValues(definition.values);
        break;

      case 'DataIoDefinition':
        content += 'A data I/O type with type switching capabilities.\n\n';
        break;
    }

    if (definition.parameters && definition.parameters.length > 0) {
      content += '\n**Parameters:**\n';
      for (const param of definition.parameters) {
        content += `- \`${param.name}\`: ${this.formatTypeReference(param.dataType)}\n`;
      }
    }

    return content;
  }

  private createFieldDocumentation(symbol: MSpecSymbol): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const field = symbol.definition as any;
    let content = '';

    switch (field.type) {
      case 'SimpleField':
        content += `Simple field of type \`${this.formatTypeReference(field.dataType)}\``;
        break;

      case 'ArrayField':
        content += `Array field of type \`${this.formatTypeReference(field.dataType)}\`\n`;
        content += `Loop type: \`${field.loopType}\``;
        break;

      case 'ConstField':
        content += `Constant field of type \`${this.formatTypeReference(field.dataType)}\`\n`;
        content += `Expected value: \`${this.formatExpression(field.expectedValue)}\``;
        break;

      case 'OptionalField':
        content += `Optional field of type \`${this.formatTypeReference(field.dataType)}\``;
        if (field.condition) {
          content += `\nCondition: \`${this.formatExpression(field.condition)}\``;
        }
        break;

      case 'DiscriminatorField':
        content += `Discriminator field of type \`${this.formatTypeReference(field.dataType)}\`\n`;
        content += 'Used for type discrimination in discriminated types.';
        break;

      case 'ImplicitField':
        content += 'Implicit field calculated during serialization\n';
        content += `Expression: \`${this.formatExpression(field.serializeExpression)}\``;
        break;

      case 'VirtualField':
        content += `Virtual field of type \`${this.formatTypeReference(field.dataType)}\`\n`;
        content += `Value: \`${this.formatExpression(field.valueExpression)}\`\n`;
        content += 'Does not consume bytes from the stream.';
        break;

      default:
        content += `Field of type: ${field.type}`;
    }

    if (field.attributes && field.attributes.length > 0) {
      content += '\n\n**Attributes:**\n';
      for (const attr of field.attributes) {
        content += `- \`${attr.name}\`: \`${this.formatExpression(attr.value)}\`\n`;
      }
    }

    return content;
  }

  private createParameterDocumentation(symbol: MSpecSymbol): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const param = symbol.definition as any;
    return `Parameter of type \`${this.formatTypeReference(param.dataType)}\``;
  }

  private createEnumValueDocumentation(symbol: MSpecSymbol): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enumValue = symbol.definition as any;
    let content = 'Enumeration value';

    if (enumValue.valueExpression) {
      content += `\nValue: \`${this.formatExpression(enumValue.valueExpression)}\``;
    }

    if (enumValue.constantValues && enumValue.constantValues.length > 0) {
      content += '\nConstant values:\n';
      for (const constValue of enumValue.constantValues) {
        content += `- \`${this.formatExpression(constValue)}\`\n`;
      }
    }

    return content;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatFieldList(fields: any[]): string {
    if (!fields || fields.length === 0) {
      return 'No fields defined.';
    }

    let content = '';
    for (const field of fields) {
      if (field.name) {
        content += `- \`${field.name}\`: ${field.type}`;
        if (field.dataType) {
          content += ` (${this.formatTypeReference(field.dataType)})`;
        }
        content += '\n';
      }
    }

    return content;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatEnumValues(values: any[]): string {
    if (!values || values.length === 0) {
      return 'No values defined.';
    }

    let content = '';
    for (const value of values) {
      content += `- \`${value.name}\``;
      if (value.valueExpression) {
        content += ` = \`${this.formatExpression(value.valueExpression)}\``;
      }
      content += '\n';
    }

    return content;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatTypeReference(typeRef: any): string {
    if (!typeRef) {
      return 'unknown';
    }

    if (typeRef.type === 'SimpleTypeReference') {
      return this.formatDataType(typeRef.dataType);
    } else if (typeRef.type === 'ComplexTypeReference') {
      let result = typeRef.name;
      if (typeRef.parameters && typeRef.parameters.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result += `(${typeRef.parameters.map((p: any) => this.formatExpression(p)).join(', ')})`;
      }
      return result;
    }

    return 'unknown';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatDataType(dataType: any): string {
    if (!dataType) {
      return 'unknown';
    }

    let result = dataType.base;
    if (dataType.size !== undefined) {
      result += ` ${dataType.size}`;
    }
    if (dataType.length) {
      result += ` (${this.formatExpression(dataType.length)})`;
    }

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatExpression(expr: any): string {
    if (!expr) {
      return '';
    }

    switch (expr.type) {
      case 'ValueLiteral':
        return String(expr.value);

      case 'VariableLiteral':
        return expr.name;

      case 'BinaryExpression':
        return `${this.formatExpression(expr.left)} ${expr.operator} ${this.formatExpression(expr.right)}`;

      case 'FunctionCall': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const args = expr.arguments.map((arg: any) => this.formatExpression(arg)).join(', ');
        return `${expr.name}(${args})`;
      }

      case 'FieldAccess':
        return `${this.formatExpression(expr.object)}.${expr.field}`;

      case 'ArrayAccess':
        return `${this.formatExpression(expr.array)}[${this.formatExpression(expr.index)}]`;

      default:
        return expr.type || 'expression';
    }
  }

  private createKeywordHover(word: string, range: Range): Hover | null {
    const keywordDocs: Record<string, string> = {
      type: 'Defines a structured data type with fields',
      discriminatedType:
        'Defines a type that can have different structures based on a discriminator field',
      enum: 'Defines an enumeration of named values',
      dataIo: 'Defines a data input/output type with type switching',
      simple: 'Defines a simple field with a data type',
      array: 'Defines an array field with a loop condition',
      const: 'Defines a field with a constant value',
      reserved: 'Defines a reserved field that is not exposed',
      optional: 'Defines a field that may or may not be present',
      discriminator: 'Defines a field used for type discrimination',
      implicit: 'Defines a field whose value is calculated during serialization',
      virtual: "Defines a computed field that doesn't consume bytes",
      manual: 'Defines a field with custom parsing and serialization logic',
      typeSwitch: 'Defines conditional field definitions based on discriminator values',
      count: 'Array loop type: iterate a specific number of times',
      length: 'Array loop type: iterate based on a length value',
      terminated: 'Array loop type: iterate until a termination condition is met',
    };

    const doc = keywordDocs[word];
    if (doc) {
      return {
        contents: {
          kind: MarkupKind.Markdown,
          value: `**${word}** *(keyword)*\n\n${doc}`,
        },
        range,
      };
    }

    return null;
  }

  private createDataTypeHover(word: string, range: Range): Hover | null {
    const dataTypeDocs: Record<string, string> = {
      bit: 'Single bit value (0 or 1)',
      byte: '8-bit byte value (0-255)',
      int: 'Signed integer with specified bit size',
      uint: 'Unsigned integer with specified bit size',
      vint: 'Variable-length signed integer',
      vuint: 'Variable-length unsigned integer',
      float: 'Floating point number with specified bit size',
      ufloat: 'Unsigned floating point number with specified bit size',
      string: 'Fixed-length string with specified character count',
      vstring: 'Variable-length string',
      time: 'Time value',
      date: 'Date value',
      dateTime: 'Date and time value',
    };

    const doc = dataTypeDocs[word];
    if (doc) {
      return {
        contents: {
          kind: MarkupKind.Markdown,
          value: `**${word}** *(data type)*\n\n${doc}`,
        },
        range,
      };
    }

    return null;
  }
}
