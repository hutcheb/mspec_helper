/**
 * Semantic analyzer for MSpec language
 * Performs type checking and builds symbol tables
 */

import {
  ASTNode,
  CaseStatement,
  ComplexTypeDefinition,
  DataIoDefinition,
  DiscriminatedTypeDefinition,
  EnumDefinition,
  Expression,
  FieldDefinition,
  MSpecFile,
  TypeDefinition,
  TypeReference,
  VariableLiteral,
} from '../types/mspec-types';

export interface MSpecSymbol {
  name: string;
  type: string;
  definition: ASTNode;
  scope: SymbolScope;
}

export interface SymbolScope {
  name: string;
  parent?: SymbolScope;
  symbols: Map<string, MSpecSymbol>;
  children: SymbolScope[];
}

export interface SemanticError {
  message: string;
  node: ASTNode;
  severity: 'error' | 'warning' | 'info';
}

export interface AnalysisResult {
  symbolTable: SymbolScope;
  errors: SemanticError[];
  typeDefinitions: Map<string, ComplexTypeDefinition>;
  fieldReferences: Map<ASTNode, MSpecSymbol>;
}

export class SemanticAnalyzer {
  private globalScope: SymbolScope;
  private currentScope: SymbolScope;
  private errors: SemanticError[] = [];
  private typeDefinitions: Map<string, ComplexTypeDefinition> = new Map();
  private fieldReferences: Map<ASTNode, MSpecSymbol> = new Map();

  constructor() {
    this.globalScope = {
      name: 'global',
      symbols: new Map(),
      children: [],
    };
    this.currentScope = this.globalScope;
  }

  public analyze(ast: MSpecFile): AnalysisResult {
    this.reset();

    // First pass: collect all type definitions
    this.collectTypeDefinitions(ast);

    // Second pass: analyze each type definition
    for (const definition of ast.definitions) {
      this.analyzeTypeDefinition(definition);
    }

    return {
      symbolTable: this.globalScope,
      errors: this.errors,
      typeDefinitions: this.typeDefinitions,
      fieldReferences: this.fieldReferences,
    };
  }

  private reset(): void {
    this.globalScope = {
      name: 'global',
      symbols: new Map(),
      children: [],
    };
    this.currentScope = this.globalScope;
    this.errors = [];
    this.typeDefinitions.clear();
    this.fieldReferences.clear();
  }

  private collectTypeDefinitions(ast: MSpecFile): void {
    for (const definition of ast.definitions) {
      const name = this.getDefinitionName(definition);
      if (name) {
        if (this.typeDefinitions.has(name)) {
          this.addError(`Duplicate type definition: ${name}`, definition, 'error');
        } else {
          this.typeDefinitions.set(name, definition);
          this.addSymbol(name, 'type', definition);
        }
      }
    }
  }

  private getDefinitionName(definition: ComplexTypeDefinition): string | null {
    switch (definition.type) {
      case 'TypeDefinition':
      case 'DiscriminatedTypeDefinition':
      case 'EnumDefinition':
      case 'DataIoDefinition':
        return definition.name;
      default:
        return null;
    }
  }

  private analyzeTypeDefinition(definition: ComplexTypeDefinition): void {
    const name = this.getDefinitionName(definition);
    if (!name) {
      return;
    }

    // Create a new scope for this type
    const typeScope = this.createChildScope(name);
    this.enterScope(typeScope);

    try {
      switch (definition.type) {
        case 'TypeDefinition':
        case 'DiscriminatedTypeDefinition':
          this.analyzeStructuredType(definition);
          break;
        case 'EnumDefinition':
          this.analyzeEnumDefinition(definition);
          break;
        case 'DataIoDefinition':
          this.analyzeDataIoDefinition(definition);
          break;
      }
    } finally {
      this.exitScope();
    }
  }

  private analyzeStructuredType(definition: TypeDefinition | DiscriminatedTypeDefinition): void {
    // Add parameters to scope
    if (definition.parameters) {
      for (const param of definition.parameters) {
        this.addSymbol(param.name, 'parameter', param);
        this.analyzeTypeReference(param.dataType);
      }
    }

    // Analyze fields
    for (const field of definition.fields) {
      this.analyzeField(field);
    }
  }

  private analyzeEnumDefinition(definition: EnumDefinition): void {
    // Add parameters to scope
    if (definition.parameters) {
      for (const param of definition.parameters) {
        this.addSymbol(param.name, 'parameter', param);
        this.analyzeTypeReference(param.dataType);
      }
    }

    // Analyze enum values
    for (const enumValue of definition.values) {
      this.addSymbol(enumValue.name, 'enumValue', enumValue);

      if (enumValue.valueExpression) {
        this.analyzeExpression(enumValue.valueExpression);
      }

      if (enumValue.constantValues) {
        for (const constValue of enumValue.constantValues) {
          this.analyzeExpression(constValue);
        }
      }
    }
  }

  private analyzeDataIoDefinition(definition: DataIoDefinition): void {
    // Add parameters to scope
    if (definition.parameters) {
      for (const param of definition.parameters) {
        this.addSymbol(param.name, 'parameter', param);
        this.analyzeTypeReference(param.dataType);
      }
    }

    // Analyze type switch
    this.analyzeField(definition.typeSwitch);
  }

  private analyzeField(field: FieldDefinition): void {
    switch (field.type) {
      case 'SimpleField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        break;

      case 'ArrayField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        this.analyzeExpression(field.loopExpression);
        break;

      case 'ConstField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        this.analyzeExpression(field.expectedValue);
        break;

      case 'OptionalField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        if (field.condition) {
          this.analyzeExpression(field.condition);
        }
        break;

      case 'DiscriminatorField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        break;

      case 'ImplicitField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeExpression(field.serializeExpression);
        break;

      case 'VirtualField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        this.analyzeExpression(field.valueExpression);
        break;

      case 'ManualField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        this.analyzeExpression(field.parseExpression);
        this.analyzeExpression(field.serializeExpression);
        this.analyzeExpression(field.lengthExpression);
        break;

      case 'ManualArrayField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        this.analyzeExpression(field.loopExpression);
        this.analyzeExpression(field.parseExpression);
        this.analyzeExpression(field.serializeExpression);
        this.analyzeExpression(field.lengthExpression);
        break;

      case 'ChecksumField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeExpression(field.checksumExpression);
        break;

      case 'PaddingField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeExpression(field.paddingValue);
        this.analyzeExpression(field.timesPadding);
        break;

      case 'AssertField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        this.analyzeExpression(field.condition);
        break;

      case 'ValidationField':
        this.analyzeExpression(field.validationExpression);
        break;

      case 'PeekField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        if (field.offset) {
          this.analyzeExpression(field.offset);
        }
        break;

      case 'EnumField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        break;

      case 'AbstractField':
        this.addSymbol(field.name, 'field', field);
        this.analyzeTypeReference(field.dataType);
        break;

      case 'TypeSwitchField':
        for (const discriminator of field.discriminators) {
          this.analyzeExpression(discriminator);
        }
        for (const caseStmt of field.cases) {
          this.analyzeCaseStatement(caseStmt);
        }
        break;

      case 'ReservedField':
        this.analyzeExpression(field.expectedValue);
        break;

      case 'UnknownField':
        // No additional analysis needed
        break;
    }
  }

  private analyzeCaseStatement(caseStmt: CaseStatement): void {
    // Create scope for case statement
    const caseScope = this.createChildScope(`case_${caseStmt.name}`);
    this.enterScope(caseScope);

    try {
      // Add parameters to scope
      if (caseStmt.parameters) {
        for (const param of caseStmt.parameters) {
          this.addSymbol(param.name, 'parameter', param);
          this.analyzeTypeReference(param.dataType);
        }
      }

      // Analyze discriminator values
      if (caseStmt.discriminatorValues) {
        for (const value of caseStmt.discriminatorValues) {
          this.analyzeExpression(value);
        }
      }

      // Analyze fields
      for (const field of caseStmt.fields) {
        this.analyzeField(field);
      }
    } finally {
      this.exitScope();
    }
  }

  private analyzeTypeReference(typeRef: TypeReference): void {
    if (typeRef.type === 'ComplexTypeReference') {
      const typeName = typeRef.name;
      const symbol = this.resolveSymbol(typeName);

      if (!symbol) {
        this.addError(`Undefined type: ${typeName}`, typeRef, 'error');
      } else if (symbol.type !== 'type') {
        this.addError(`${typeName} is not a type`, typeRef, 'error');
      } else {
        this.fieldReferences.set(typeRef, symbol);
      }

      // Analyze type parameters
      if (typeRef.parameters) {
        for (const param of typeRef.parameters) {
          this.analyzeExpression(param);
        }
      }
    }
    // SimpleTypeReference doesn't need additional analysis
  }

  private analyzeExpression(expr: Expression): void {
    switch (expr.type) {
      case 'VariableLiteral':
        this.analyzeVariableLiteral(expr);
        break;

      case 'BinaryExpression':
        this.analyzeExpression(expr.left);
        this.analyzeExpression(expr.right);
        break;

      case 'TernaryExpression':
        this.analyzeExpression(expr.condition);
        this.analyzeExpression(expr.trueExpression);
        this.analyzeExpression(expr.falseExpression);
        break;

      case 'UnaryExpression':
        this.analyzeExpression(expr.operand);
        break;

      case 'FunctionCall':
        for (const arg of expr.arguments) {
          this.analyzeExpression(arg);
        }
        break;

      case 'ArrayAccess':
        this.analyzeExpression(expr.array);
        this.analyzeExpression(expr.index);
        break;

      case 'FieldAccess':
        this.analyzeExpression(expr.object);
        break;

      case 'ParenthesizedExpression':
        this.analyzeExpression(expr.expression);
        break;

      case 'ValueLiteral':
        // No additional analysis needed for literals
        break;
    }
  }

  private analyzeVariableLiteral(expr: VariableLiteral): void {
    const symbol = this.resolveSymbol(expr.name);

    if (!symbol) {
      this.addError(`Undefined variable: ${expr.name}`, expr, 'error');
    } else {
      this.fieldReferences.set(expr, symbol);
    }
  }

  private addSymbol(name: string, type: string, definition: ASTNode): void {
    if (this.currentScope.symbols.has(name)) {
      this.addError(`Duplicate symbol: ${name}`, definition, 'error');
      return;
    }

    const symbol: MSpecSymbol = {
      name,
      type,
      definition,
      scope: this.currentScope,
    };

    this.currentScope.symbols.set(name, symbol);
  }

  private resolveSymbol(name: string): MSpecSymbol | null {
    let scope: SymbolScope | undefined = this.currentScope;

    while (scope) {
      const symbol = scope.symbols.get(name);
      if (symbol) {
        return symbol;
      }
      scope = scope.parent;
    }

    return null;
  }

  private createChildScope(name: string): SymbolScope {
    const childScope: SymbolScope = {
      name,
      parent: this.currentScope,
      symbols: new Map(),
      children: [],
    };

    this.currentScope.children.push(childScope);
    return childScope;
  }

  private enterScope(scope: SymbolScope): void {
    this.currentScope = scope;
  }

  private exitScope(): void {
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    }
  }

  private addError(message: string, node: ASTNode, severity: 'error' | 'warning' | 'info'): void {
    this.errors.push({
      message,
      node,
      severity,
    });
  }
}
