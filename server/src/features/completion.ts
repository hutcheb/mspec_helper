/**
 * Completion provider for MSpec language
 */

import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  Position,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { AnalysisResult } from '../analyzer/semantic-analyzer';
import { BUILTIN_DATA_TYPES, KEYWORDS, MSpecFile } from '../types/mspec-types';

interface MSpecSettings {
  completion: {
    enabled: boolean;
    snippets: boolean;
  };
}

export class CompletionProvider {
  public provideCompletions(
    document: TextDocument,
    position: Position,
    _ast: MSpecFile,
    analysisResult: AnalysisResult,
    settings: MSpecSettings
  ): CompletionItem[] {
    const lineText = document.getText({
      start: { line: position.line, character: 0 },
      end: { line: position.line, character: position.character },
    });

    const completions: CompletionItem[] = [];

    // Determine context
    const context = this.getCompletionContext(lineText, position.character);

    switch (context.type) {
      case 'topLevel':
        completions.push(...this.getTopLevelCompletions(settings));
        break;

      case 'fieldType':
        completions.push(...this.getFieldTypeCompletions(settings));
        break;

      case 'dataType':
        completions.push(...this.getDataTypeCompletions());
        break;

      case 'typeReference':
        completions.push(...this.getTypeReferenceCompletions(analysisResult));
        break;

      case 'attribute':
        completions.push(...this.getAttributeCompletions());
        break;

      case 'expression':
        completions.push(...this.getExpressionCompletions(analysisResult));
        break;

      default:
        // Provide general completions
        completions.push(...this.getGeneralCompletions(analysisResult, settings));
        break;
    }

    return completions;
  }

  public resolveCompletion(item: CompletionItem): CompletionItem {
    // Add detailed documentation if needed
    if (item.data) {
      switch (item.data.type) {
        case 'keyword':
          item.documentation = this.getKeywordDocumentation(item.label);
          break;
        case 'dataType':
          item.documentation = this.getDataTypeDocumentation(item.label);
          break;
        case 'fieldType':
          item.documentation = this.getFieldTypeDocumentation(item.label);
          break;
      }
    }
    return item;
  }

  private getCompletionContext(lineText: string, character: number): { type: string; data?: any } {
    const beforeCursor = lineText.substring(0, character).trim();

    // Check if we're at the top level (expecting type definitions)
    if (beforeCursor === '' || beforeCursor === '[') {
      return { type: 'topLevel' };
    }

    // Check if we're inside a field definition
    if (beforeCursor.includes('[') && !beforeCursor.includes(']')) {
      const afterBracket = beforeCursor.substring(beforeCursor.lastIndexOf('[') + 1).trim();

      if (afterBracket === '') {
        return { type: 'fieldType' };
      }

      // Check if we're expecting a data type
      const fieldTypeKeywords = [
        'simple',
        'array',
        'const',
        'reserved',
        'optional',
        'discriminator',
        'implicit',
        'virtual',
        'manual',
        'manualArray',
        'checksum',
        'padding',
        'assert',
        'peek',
        'enum',
        'abstract',
      ];
      const words = afterBracket.split(/\s+/);

      if (words.length === 1 && fieldTypeKeywords.includes(words[0])) {
        return { type: 'dataType' };
      }

      if (words.length >= 2) {
        // Check if we're in an attribute context
        if (afterBracket.includes('=')) {
          return { type: 'expression' };
        }

        // Check if we're expecting an attribute name
        const lastWord = words[words.length - 1];
        if (lastWord.includes('=')) {
          return { type: 'expression' };
        }

        return { type: 'attribute' };
      }
    }

    // Check if we're in an expression context (inside quotes)
    if (beforeCursor.includes("'") && beforeCursor.lastIndexOf("'") % 2 === 1) {
      return { type: 'expression' };
    }

    return { type: 'general' };
  }

  private getTopLevelCompletions(settings: MSpecSettings): CompletionItem[] {
    const completions: CompletionItem[] = [];

    if (settings.completion.snippets) {
      // Type definition snippet
      completions.push({
        label: 'type',
        kind: CompletionItemKind.Snippet,
        insertText:
          'type ${1:TypeName}${2:(${3:parameters})} ${4:attributes}\n    [simple ${5:dataType} ${6:fieldName}]\n]',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Create a new type definition',
        data: { type: 'snippet' },
      });

      // Discriminated type snippet
      completions.push({
        label: 'discriminatedType',
        kind: CompletionItemKind.Snippet,
        insertText:
          "discriminatedType ${1:TypeName}${2:(${3:parameters})} ${4:attributes}\n    [discriminator ${5:dataType} ${6:discriminatorField}]\n    [typeSwitch ${7:discriminatorField}\n        ['${8:value}' ${9:CaseType}\n            [simple ${10:dataType} ${11:fieldName}]\n        ]\n    ]\n]",
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Create a new discriminated type definition',
        data: { type: 'snippet' },
      });

      // Enum definition snippet
      completions.push({
        label: 'enum',
        kind: CompletionItemKind.Snippet,
        insertText:
          "enum ${1:dataType} ${2:EnumName}${3:(${4:parameters})} ${5:attributes}\n    ['${6:value}' ${7:ENUM_VALUE}]\n]",
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Create a new enum definition',
        data: { type: 'snippet' },
      });

      // DataIo definition snippet
      completions.push({
        label: 'dataIo',
        kind: CompletionItemKind.Snippet,
        insertText:
          "dataIo ${1:DataIoName}${2:(${3:parameters})} ${4:attributes}\n    [typeSwitch ${5:discriminator}\n        ['${6:value}' ${7:CaseType}\n            [simple ${8:dataType} ${9:fieldName}]\n        ]\n    ]\n]",
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Create a new dataIo definition',
        data: { type: 'snippet' },
      });
    } else {
      // Simple keyword completions
      completions.push(
        { label: 'type', kind: CompletionItemKind.Keyword, data: { type: 'keyword' } },
        { label: 'discriminatedType', kind: CompletionItemKind.Keyword, data: { type: 'keyword' } },
        { label: 'enum', kind: CompletionItemKind.Keyword, data: { type: 'keyword' } },
        { label: 'dataIo', kind: CompletionItemKind.Keyword, data: { type: 'keyword' } }
      );
    }

    return completions;
  }

  private getFieldTypeCompletions(settings: MSpecSettings): CompletionItem[] {
    const fieldTypes = [
      'simple',
      'array',
      'const',
      'reserved',
      'optional',
      'discriminator',
      'implicit',
      'virtual',
      'manual',
      'manualArray',
      'checksum',
      'padding',
      'assert',
      'validation',
      'peek',
      'unknown',
      'enum',
      'abstract',
      'typeSwitch',
    ];

    const completions: CompletionItem[] = [];

    if (settings.completion.snippets) {
      // Add snippets for common field types
      completions.push(
        {
          label: 'simple',
          kind: CompletionItemKind.Snippet,
          insertText: 'simple ${1:dataType} ${2:fieldName}',
          insertTextFormat: InsertTextFormat.Snippet,
          documentation: 'Simple field definition',
          data: { type: 'fieldType' },
        },
        {
          label: 'array',
          kind: CompletionItemKind.Snippet,
          insertText:
            'array ${1:dataType} ${2:fieldName} ${3|count,length,terminated|} ${4:expression}',
          insertTextFormat: InsertTextFormat.Snippet,
          documentation: 'Array field definition',
          data: { type: 'fieldType' },
        },
        {
          label: 'const',
          kind: CompletionItemKind.Snippet,
          insertText: 'const ${1:dataType} ${2:fieldName} ${3:expectedValue}',
          insertTextFormat: InsertTextFormat.Snippet,
          documentation: 'Constant field definition',
          data: { type: 'fieldType' },
        },
        {
          label: 'optional',
          kind: CompletionItemKind.Snippet,
          insertText: "optional ${1:dataType} ${2:fieldName}${3: '${4:condition}'}",
          insertTextFormat: InsertTextFormat.Snippet,
          documentation: 'Optional field definition',
          data: { type: 'fieldType' },
        }
      );
    }

    // Add all field types as keywords
    for (const fieldType of fieldTypes) {
      completions.push({
        label: fieldType,
        kind: CompletionItemKind.Keyword,
        data: { type: 'fieldType' },
      });
    }

    return completions;
  }

  private getDataTypeCompletions(): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // Built-in data types
    for (const dataType of BUILTIN_DATA_TYPES) {
      let insertText: string = dataType;
      let snippet = false;

      // Add size parameter for sized types
      if (['int', 'uint', 'float', 'ufloat', 'string'].includes(dataType)) {
        insertText = `${dataType} \${1:size}`;
        snippet = true;
      } else if (dataType === 'vstring') {
        insertText = `${dataType}\${1: \'\${2:length}\'}`;
        snippet = true;
      }

      completions.push({
        label: dataType,
        kind: CompletionItemKind.TypeParameter,
        insertText,
        insertTextFormat: snippet ? InsertTextFormat.Snippet : InsertTextFormat.PlainText,
        data: { type: 'dataType' },
      });
    }

    return completions;
  }

  private getTypeReferenceCompletions(analysisResult: AnalysisResult): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // Add user-defined types
    for (const [typeName, typeDefinition] of analysisResult.typeDefinitions) {
      completions.push({
        label: typeName,
        kind: CompletionItemKind.Class,
        documentation: `User-defined type: ${typeDefinition.type}`,
        data: { type: 'userType' },
      });
    }

    return completions;
  }

  private getAttributeCompletions(): CompletionItem[] {
    const commonAttributes = [
      { name: 'byteOrder', values: ['BIG_ENDIAN', 'LITTLE_ENDIAN'] },
      { name: 'encoding', values: ['UTF-8', 'UTF-16', 'ASCII'] },
      { name: 'lengthInBytes', values: [] },
      { name: 'lengthInBits', values: [] },
    ];

    const completions: CompletionItem[] = [];

    for (const attr of commonAttributes) {
      if (attr.values.length > 0) {
        completions.push({
          label: attr.name,
          kind: CompletionItemKind.Property,
          insertText: `${attr.name}='\${1|${attr.values.join(',')}|}'`,
          insertTextFormat: InsertTextFormat.Snippet,
          documentation: `Attribute: ${attr.name}`,
          data: { type: 'attribute' },
        });
      } else {
        completions.push({
          label: attr.name,
          kind: CompletionItemKind.Property,
          insertText: `${attr.name}='\${1:value}'`,
          insertTextFormat: InsertTextFormat.Snippet,
          documentation: `Attribute: ${attr.name}`,
          data: { type: 'attribute' },
        });
      }
    }

    return completions;
  }

  private getExpressionCompletions(analysisResult: AnalysisResult): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // Add field references from current scope
    // This would need to be enhanced to properly track scope
    for (const [name, symbol] of analysisResult.symbolTable.symbols) {
      if (symbol.type === 'field' || symbol.type === 'parameter') {
        completions.push({
          label: name,
          kind: symbol.type === 'field' ? CompletionItemKind.Field : CompletionItemKind.Variable,
          documentation: `${symbol.type}: ${name}`,
          data: { type: 'symbol' },
        });
      }
    }

    // Add common functions
    const commonFunctions = ['COUNT', 'STATIC_CALL', 'CEIL', 'FLOOR', 'ABS', 'MIN', 'MAX'];

    for (const func of commonFunctions) {
      completions.push({
        label: func,
        kind: CompletionItemKind.Function,
        insertText: `${func}(\${1:args})`,
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: `Function: ${func}`,
        data: { type: 'function' },
      });
    }

    return completions;
  }

  private getGeneralCompletions(
    analysisResult: AnalysisResult,
    _settings: MSpecSettings
  ): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // Add keywords
    for (const keyword of KEYWORDS) {
      completions.push({
        label: keyword,
        kind: CompletionItemKind.Keyword,
        data: { type: 'keyword' },
      });
    }

    // Add data types
    completions.push(...this.getDataTypeCompletions());

    // Add user-defined types
    completions.push(...this.getTypeReferenceCompletions(analysisResult));

    return completions;
  }

  private getKeywordDocumentation(keyword: string): string {
    const docs: Record<string, string> = {
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
    };

    return docs[keyword] || `Keyword: ${keyword}`;
  }

  private getDataTypeDocumentation(dataType: string): string {
    const docs: Record<string, string> = {
      bit: 'Single bit value',
      byte: '8-bit byte value',
      int: 'Signed integer with specified bit size',
      uint: 'Unsigned integer with specified bit size',
      float: 'Floating point number with specified bit size',
      string: 'Fixed-length string with specified character count',
      vstring: 'Variable-length string',
      time: 'Time value',
      date: 'Date value',
      dateTime: 'Date and time value',
    };

    return docs[dataType] || `Data type: ${dataType}`;
  }

  private getFieldTypeDocumentation(fieldType: string): string {
    return this.getKeywordDocumentation(fieldType);
  }
}
