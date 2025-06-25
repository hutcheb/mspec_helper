/**
 * Validation provider for MSpec language
 */

import {
  Diagnostic,
  DiagnosticSeverity,
  TextDocument
} from 'vscode-languageserver/node';

import { MSpecFile } from '../types/mspec-types';
import { AnalysisResult, SemanticError } from '../analyzer/semantic-analyzer';

interface MSpecSettings {
  validation: {
    enabled: boolean;
    strictMode: boolean;
  };
}

export class ValidationProvider {
  public validate(
    document: TextDocument,
    ast: MSpecFile,
    analysisResult: AnalysisResult,
    settings: MSpecSettings
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Convert semantic errors to diagnostics
    for (const error of analysisResult.errors) {
      diagnostics.push(this.createDiagnosticFromError(error));
    }

    // Additional validation rules
    if (settings.validation.strictMode) {
      diagnostics.push(...this.performStrictValidation(ast, analysisResult));
    }

    return diagnostics;
  }

  private createDiagnosticFromError(error: SemanticError): Diagnostic {
    let severity: DiagnosticSeverity;
    
    switch (error.severity) {
      case 'error':
        severity = DiagnosticSeverity.Error;
        break;
      case 'warning':
        severity = DiagnosticSeverity.Warning;
        break;
      case 'info':
        severity = DiagnosticSeverity.Information;
        break;
      default:
        severity = DiagnosticSeverity.Error;
    }

    return {
      severity,
      range: error.node.range,
      message: error.message,
      source: 'mspec'
    };
  }

  private performStrictValidation(ast: MSpecFile, analysisResult: AnalysisResult): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Check for unused types
    for (const [typeName, typeDefinition] of analysisResult.typeDefinitions) {
      if (!this.isTypeUsed(typeName, analysisResult)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: typeDefinition.range,
          message: `Type '${typeName}' is defined but never used`,
          source: 'mspec'
        });
      }
    }

    // Check for naming conventions
    for (const definition of ast.definitions) {
      const name = this.getDefinitionName(definition);
      if (name && !this.followsNamingConvention(name, definition.type)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Information,
          range: definition.range,
          message: `${definition.type} '${name}' should follow naming convention`,
          source: 'mspec'
        });
      }
    }

    return diagnostics;
  }

  private isTypeUsed(typeName: string, analysisResult: AnalysisResult): boolean {
    // Check if the type is referenced anywhere
    for (const [node, symbol] of analysisResult.fieldReferences) {
      if (symbol.name === typeName && symbol.type === 'type') {
        return true;
      }
    }
    return false;
  }

  private getDefinitionName(definition: any): string | null {
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

  private followsNamingConvention(name: string, type: string): boolean {
    switch (type) {
      case 'TypeDefinition':
      case 'DiscriminatedTypeDefinition':
      case 'DataIoDefinition':
        // Types should start with uppercase
        return /^[A-Z][a-zA-Z0-9]*$/.test(name);
      
      case 'EnumDefinition':
        // Enums should start with uppercase
        return /^[A-Z][a-zA-Z0-9]*$/.test(name);
      
      default:
        return true;
    }
  }
}
