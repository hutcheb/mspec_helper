/**
 * Tests for MSpec parser
 */

import { Lexer } from '../src/parser/lexer';
import { MSpecParser } from '../src/parser/parser';
import { SimpleField, TypeDefinition } from '../src/types/mspec-types';

describe('MSpec Parser', () => {
  let parser: MSpecParser;

  beforeEach(() => {
    parser = new MSpecParser();
  });

  describe('Type Definitions', () => {
    test('should parse simple type definition', () => {
      const input = `
        [type SimpleMessage
            [simple uint 8 messageType]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      expect(ast.type).toBe('MSpecFile');
      expect(ast.definitions).toHaveLength(1);

      const typeDef = ast.definitions[0] as TypeDefinition;
      expect(typeDef.type).toBe('TypeDefinition');
      expect(typeDef.name).toBe('SimpleMessage');
      expect(typeDef.fields).toHaveLength(1);

      const field = typeDef.fields[0] as SimpleField;
      expect(field.type).toBe('SimpleField');
      expect(field.name).toBe('messageType');
    });

    test('should parse type definition with parameters', () => {
      const input = `
        [type ParameterizedMessage(uint 16 length)
            [simple uint 8 messageType]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      const typeDef = ast.definitions[0] as TypeDefinition;
      expect(typeDef.parameters).toHaveLength(1);
      expect(typeDef.parameters?.[0]?.name).toBe('length');
    });

    test('should parse type definition with attributes', () => {
      const input = `
        [type AttributedMessage byteOrder='BIG_ENDIAN'
            [simple uint 8 messageType]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      const typeDef = ast.definitions[0] as TypeDefinition;
      expect(typeDef.attributes).toHaveLength(1);
      expect(typeDef.attributes[0].name).toBe('byteOrder');
    });
  });

  describe('Field Definitions', () => {
    test('should parse simple field', () => {
      const input = `
        [type TestMessage
            [simple uint 16 fieldName]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      const typeDef = ast.definitions[0] as TypeDefinition;
      const field = typeDef.fields[0] as SimpleField;

      expect(field.type).toBe('SimpleField');
      expect(field.name).toBe('fieldName');
      expect(field.dataType.type).toBe('SimpleTypeReference');
    });

    test('should parse array field', () => {
      const input = `
        [type TestMessage
            [array byte data count 'length']
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      const typeDef = ast.definitions[0] as TypeDefinition;
      const field = typeDef.fields[0] as any;

      expect(field.type).toBe('ArrayField');
      expect(field.name).toBe('data');
    });

    test('should parse const field', () => {
      const input = `
        [type TestMessage
            [const uint 8 messageType 0x01]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      const typeDef = ast.definitions[0] as TypeDefinition;
      const field = typeDef.fields[0] as any;

      expect(field.type).toBe('ConstField');
      expect(field.name).toBe('messageType');
    });

    test('should parse optional field', () => {
      const input = `
        [type TestMessage
            [optional string 32 data 'hasData == true']
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      const typeDef = ast.definitions[0] as TypeDefinition;
      const field = typeDef.fields[0] as any;

      expect(field.type).toBe('OptionalField');
      expect(field.name).toBe('data');
    });
  });

  describe('Enum Definitions', () => {
    test('should parse enum definition', () => {
      const input = `
        [enum uint 8 MessageType
            ['0x01' REQUEST]
            ['0x02' RESPONSE]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      const enumDef = ast.definitions[0] as any;
      expect(enumDef.type).toBe('EnumDefinition');
      expect(enumDef.name).toBe('MessageType');
      expect(enumDef.values).toHaveLength(2);
      expect(enumDef.values[0].name).toBe('REQUEST');
      expect(enumDef.values[1].name).toBe('RESPONSE');
    });
  });

  describe('Discriminated Type Definitions', () => {
    test('should parse discriminated type with type switch', () => {
      const input = `
        [discriminatedType ProtocolMessage
            [discriminator uint 8 messageType]
            [typeSwitch messageType
                ['0x01' RequestMessage
                    [simple string 32 command]
                ]
                ['0x02' ResponseMessage
                    [simple uint 8 status]
                ]
            ]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      const discrimDef = ast.definitions[0] as any;
      expect(discrimDef.type).toBe('DiscriminatedTypeDefinition');
      expect(discrimDef.name).toBe('ProtocolMessage');
      expect(discrimDef.fields).toHaveLength(2);

      const discriminatorField = discrimDef.fields[0] as any;
      expect(discriminatorField.type).toBe('DiscriminatorField');

      const typeSwitchField = discrimDef.fields[1] as any;
      expect(typeSwitchField.type).toBe('TypeSwitchField');
    });
  });

  describe('Complex Examples', () => {
    test('should parse complete protocol definition', () => {
      const input = `
        [type Header byteOrder='BIG_ENDIAN'
            [const uint 32 magic 0x12345678]
            [simple uint 8 version]
            [simple uint 16 flags]
        ]

        [enum uint 8 MessageType
            ['0x01' REQUEST]
            ['0x02' RESPONSE]
        ]

        [discriminatedType Message
            [simple Header header]
            [discriminator uint 8 messageType]
            [typeSwitch messageType
                ['0x01' RequestMessage
                    [simple string 64 command]
                ]
                ['0x02' ResponseMessage
                    [simple uint 8 status]
                    [optional string 128 data 'status == 0']
                ]
            ]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      expect(ast.definitions).toHaveLength(3);
      expect(ast.definitions[0].type).toBe('TypeDefinition');
      expect(ast.definitions[1].type).toBe('EnumDefinition');
      expect(ast.definitions[2].type).toBe('DiscriminatedTypeDefinition');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing closing bracket', () => {
      const input = `
        [type TestMessage
            [simple uint 8 field]
        // Missing closing bracket
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();

      expect(() => parser.parse(tokens)).toThrow();
    });

    test('should handle invalid field type', () => {
      const input = `
        [type TestMessage
            [invalidFieldType uint 8 field]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();

      expect(() => parser.parse(tokens)).toThrow();
    });

    test('should handle missing field name', () => {
      const input = `
        [type TestMessage
            [simple uint 8]
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();

      expect(() => parser.parse(tokens)).toThrow();
    });
  });

  describe('Comments', () => {
    test('should ignore comments in parsing', () => {
      const input = `
        // This is a comment
        [type TestMessage // Another comment
            /* Block comment */
            [simple uint 8 field] // End comment
        ]
      `;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const ast = parser.parse(tokens);

      expect(ast.definitions).toHaveLength(1);
      const typeDef = ast.definitions[0] as TypeDefinition;
      expect(typeDef.name).toBe('TestMessage');
      expect(typeDef.fields).toHaveLength(1);
    });
  });
});
