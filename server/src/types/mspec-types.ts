/**
 * Type definitions for MSpec language constructs
 */

import { Position, Range } from 'vscode-languageserver-textdocument';

// Base interface for all AST nodes
export interface ASTNode {
  type: string;
  range: Range;
  parent?: ASTNode;
}

// Position information for AST nodes
export interface SourceLocation {
  start: Position;
  end: Position;
}

// MSpec file root
export interface MSpecFile extends ASTNode {
  type: 'MSpecFile';
  definitions: ComplexTypeDefinition[];
}

// Complex type definitions
export type ComplexTypeDefinition =
  | TypeDefinition
  | DiscriminatedTypeDefinition
  | EnumDefinition
  | DataIoDefinition;

export interface TypeDefinition extends ASTNode {
  type: 'TypeDefinition';
  name: string;
  parameters?: Parameter[];
  attributes: Attribute[];
  fields: FieldDefinition[];
}

export interface DiscriminatedTypeDefinition extends ASTNode {
  type: 'DiscriminatedTypeDefinition';
  name: string;
  parameters?: Parameter[];
  attributes: Attribute[];
  fields: FieldDefinition[];
}

export interface EnumDefinition extends ASTNode {
  type: 'EnumDefinition';
  dataType?: DataType;
  name: string;
  parameters?: Parameter[];
  attributes: Attribute[];
  values: EnumValue[];
}

export interface DataIoDefinition extends ASTNode {
  type: 'DataIoDefinition';
  name: string;
  parameters?: Parameter[];
  attributes: Attribute[];
  typeSwitch: TypeSwitchField;
}

// Field definitions
export type FieldDefinition =
  | SimpleField
  | ArrayField
  | ConstField
  | ReservedField
  | OptionalField
  | DiscriminatorField
  | ImplicitField
  | VirtualField
  | ManualField
  | ManualArrayField
  | ChecksumField
  | PaddingField
  | AssertField
  | ValidationField
  | PeekField
  | UnknownField
  | EnumField
  | AbstractField
  | TypeSwitchField;

export interface BaseField extends ASTNode {
  attributes: Attribute[];
}

export interface SimpleField extends BaseField {
  type: 'SimpleField';
  dataType: TypeReference;
  name: string;
}

export interface ArrayField extends BaseField {
  type: 'ArrayField';
  dataType: TypeReference;
  name: string;
  loopType: ArrayLoopType;
  loopExpression: Expression;
}

export interface ConstField extends BaseField {
  type: 'ConstField';
  dataType: TypeReference;
  name: string;
  expectedValue: Expression;
}

export interface ReservedField extends BaseField {
  type: 'ReservedField';
  dataType: DataType;
  expectedValue: Expression;
}

export interface OptionalField extends BaseField {
  type: 'OptionalField';
  dataType: TypeReference;
  name: string;
  condition?: Expression;
}

export interface DiscriminatorField extends BaseField {
  type: 'DiscriminatorField';
  dataType: TypeReference;
  name: string;
}

export interface ImplicitField extends BaseField {
  type: 'ImplicitField';
  dataType: DataType;
  name: string;
  serializeExpression: Expression;
}

export interface VirtualField extends BaseField {
  type: 'VirtualField';
  dataType: TypeReference;
  name: string;
  valueExpression: Expression;
}

export interface ManualField extends BaseField {
  type: 'ManualField';
  dataType: TypeReference;
  name: string;
  parseExpression: Expression;
  serializeExpression: Expression;
  lengthExpression: Expression;
}

export interface ManualArrayField extends BaseField {
  type: 'ManualArrayField';
  dataType: TypeReference;
  name: string;
  loopType: ArrayLoopType;
  loopExpression: Expression;
  parseExpression: Expression;
  serializeExpression: Expression;
  lengthExpression: Expression;
}

export interface ChecksumField extends BaseField {
  type: 'ChecksumField';
  dataType: DataType;
  name: string;
  checksumExpression: Expression;
}

export interface PaddingField extends BaseField {
  type: 'PaddingField';
  dataType: DataType;
  name: string;
  paddingValue: Expression;
  timesPadding: Expression;
}

export interface AssertField extends BaseField {
  type: 'AssertField';
  dataType: TypeReference;
  name: string;
  condition: Expression;
}

export interface ValidationField extends BaseField {
  type: 'ValidationField';
  validationExpression: Expression;
  description?: string;
  shouldFail?: boolean;
}

export interface PeekField extends BaseField {
  type: 'PeekField';
  dataType: TypeReference;
  name: string;
  offset?: Expression;
}

export interface UnknownField extends BaseField {
  type: 'UnknownField';
  dataType: DataType;
}

export interface EnumField extends BaseField {
  type: 'EnumField';
  dataType: TypeReference;
  name: string;
  fieldName: string;
}

export interface AbstractField extends BaseField {
  type: 'AbstractField';
  dataType: TypeReference;
  name: string;
}

export interface TypeSwitchField extends BaseField {
  type: 'TypeSwitchField';
  discriminators: Expression[];
  cases: CaseStatement[];
}

// Supporting types
export interface Parameter extends ASTNode {
  type: 'Parameter';
  dataType: TypeReference;
  name: string;
}

export interface Attribute extends ASTNode {
  type: 'Attribute';
  name: string;
  value: Expression;
}

export interface EnumValue extends ASTNode {
  type: 'EnumValue';
  valueExpression?: Expression;
  name: string;
  constantValues?: Expression[];
}

export interface CaseStatement extends ASTNode {
  type: 'CaseStatement';
  discriminatorValues?: Expression[];
  nameWildcard?: boolean;
  name: string;
  parameters?: Parameter[];
  fields: FieldDefinition[];
}

// Type references
export type TypeReference = ComplexTypeReference | SimpleTypeReference;

export interface ComplexTypeReference extends ASTNode {
  type: 'ComplexTypeReference';
  name: string;
  parameters?: Expression[];
}

export interface SimpleTypeReference extends ASTNode {
  type: 'SimpleTypeReference';
  dataType: DataType;
}

// Data types
export interface DataType extends ASTNode {
  type: 'DataType';
  base: string;
  size?: number;
  length?: Expression;
}

// Expressions
export type Expression =
  | ValueLiteral
  | VariableLiteral
  | BinaryExpression
  | TernaryExpression
  | UnaryExpression
  | FunctionCall
  | ArrayAccess
  | FieldAccess
  | ParenthesizedExpression;

export interface ValueLiteral extends ASTNode {
  type: 'ValueLiteral';
  value: boolean | number | string;
  literalType: 'boolean' | 'integer' | 'float' | 'hex' | 'string';
}

export interface VariableLiteral extends ASTNode {
  type: 'VariableLiteral';
  name: string;
  path?: string[];
}

export interface BinaryExpression extends ASTNode {
  type: 'BinaryExpression';
  left: Expression;
  operator: BinaryOperator;
  right: Expression;
}

export interface TernaryExpression extends ASTNode {
  type: 'TernaryExpression';
  condition: Expression;
  trueExpression: Expression;
  falseExpression: Expression;
}

export interface UnaryExpression extends ASTNode {
  type: 'UnaryExpression';
  operator: UnaryOperator;
  operand: Expression;
}

export interface FunctionCall extends ASTNode {
  type: 'FunctionCall';
  name: string;
  arguments: Expression[];
}

export interface ArrayAccess extends ASTNode {
  type: 'ArrayAccess';
  array: Expression;
  index: Expression;
}

export interface FieldAccess extends ASTNode {
  type: 'FieldAccess';
  object: Expression;
  field: string;
}

export interface ParenthesizedExpression extends ASTNode {
  type: 'ParenthesizedExpression';
  expression: Expression;
}

// Enums and constants
export type ArrayLoopType = 'count' | 'length' | 'terminated';

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '^'
  | '=='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | '&&'
  | '||'
  | '&'
  | '|'
  | '>>'
  | '<<';

export type UnaryOperator = '!' | '-' | '+';

// Built-in data types
export const BUILTIN_DATA_TYPES = [
  'bit',
  'byte',
  'int',
  'uint',
  'vint',
  'vuint',
  'float',
  'ufloat',
  'string',
  'vstring',
  'time',
  'date',
  'dateTime',
] as const;

// Keywords
export const KEYWORDS = [
  'type',
  'discriminatedType',
  'enum',
  'dataIo',
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
  'abstract',
  'typeSwitch',
  'count',
  'length',
  'terminated',
  'true',
  'false',
] as const;
