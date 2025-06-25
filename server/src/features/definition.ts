/**
 * Definition provider for MSpec language
 */

import {
  Definition,
  Location,
  Position,
  TextDocument,
  Range
} from 'vscode-languageserver/node';

import { MSpecFile } from '../types/mspec-types';
import { AnalysisResult, Symbol } from '../analyzer/semantic-analyzer';

export class DefinitionProvider {
  public provideDefinition(
    document: TextDocument,
    position: Position,
    ast: MSpecFile,
    analysisResult: AnalysisResult
  ): Definition | null {
    // Find the word at the cursor position
    const wordRange = this.getWordRangeAtPosition(document, position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    
    // Find the symbol definition
    const symbol = this.findSymbolAtPosition(analysisResult, word);
    if (!symbol) {
      return null;
    }

    // Create location for the symbol definition
    const definitionLocation = this.createLocationFromSymbol(document, symbol);
    if (!definitionLocation) {
      return null;
    }

    return definitionLocation;
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
    
    return Range.create(
      document.positionAt(start),
      document.positionAt(end)
    );
  }

  private isWordCharacter(char: string): boolean {
    return /[a-zA-Z0-9_-]/.test(char);
  }

  private findSymbolAtPosition(analysisResult: AnalysisResult, word: string): Symbol | null {
    // Look for the symbol in the symbol table
    return this.findSymbolInScope(analysisResult.symbolTable, word);
  }

  private findSymbolInScope(scope: any, name: string): Symbol | null {
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

  private createLocationFromSymbol(document: TextDocument, symbol: Symbol): Location | null {
    const definition = symbol.definition;
    
    if (!definition.range) {
      return null;
    }

    // For now, we assume all definitions are in the same document
    // In a multi-file scenario, we would need to track the source file
    return Location.create(document.uri, definition.range);
  }
}
