/**
 * Formatting provider for MSpec language
 */

import {
  TextEdit,
  TextDocument,
  FormattingOptions,
  Range,
  Position,
} from 'vscode-languageserver/node';

import { MSpecFile } from '../types/mspec-types';

interface MSpecSettings {
  formatting: {
    enabled: boolean;
    indentSize: number;
  };
}

export class FormattingProvider {
  public formatDocument(
    document: TextDocument,
    ast: MSpecFile,
    options: FormattingOptions,
    settings: MSpecSettings,
  ): TextEdit[] {
    const text = document.getText();
    const lines = text.split('\n');
    const edits: TextEdit[] = [];
    
    let indentLevel = 0;
    const indentSize = settings.formatting.indentSize || options.tabSize || 4;
    const useSpaces = options.insertSpaces !== false;
    const indentString = useSpaces ? ' '.repeat(indentSize) : '\t';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        // Keep empty lines as is
        continue;
      }

      // Determine the correct indent level for this line
      const newIndentLevel = this.calculateIndentLevel(trimmedLine, indentLevel);
      
      // Calculate the expected indentation
      const expectedIndent = indentString.repeat(newIndentLevel);
      const currentIndent = this.getLeadingWhitespace(line);
      
      // If the indentation is different, create an edit
      if (currentIndent !== expectedIndent) {
        const range = Range.create(
          Position.create(i, 0),
          Position.create(i, currentIndent.length),
        );
        
        edits.push(TextEdit.replace(range, expectedIndent));
      }

      // Update indent level for next line
      indentLevel = this.updateIndentLevel(trimmedLine, newIndentLevel);
    }

    return edits;
  }

  private calculateIndentLevel(line: string, currentLevel: number): number {
    // Decrease indent for closing brackets
    if (line.startsWith(']')) {
      return Math.max(0, currentLevel - 1);
    }

    return currentLevel;
  }

  private updateIndentLevel(line: string, currentLevel: number): number {
    // Increase indent after opening brackets
    if (line.includes('[') && !line.includes(']')) {
      return currentLevel + 1;
    }

    // Handle lines with both opening and closing brackets
    const openBrackets = (line.match(/\[/g) || []).length;
    const closeBrackets = (line.match(/\]/g) || []).length;
    
    return currentLevel + openBrackets - closeBrackets;
  }

  private getLeadingWhitespace(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }
}
