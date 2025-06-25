/**
 * Main LSP Server for MSpec language
 */

import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  HoverParams,
  Hover,
  DefinitionParams,
  Definition,
  Location,
  DocumentFormattingParams,
  TextEdit,
  CodeActionParams,
  CodeAction,
  CodeActionKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';

import { Lexer, TokenType } from './parser/lexer';
import { MSpecParser } from './parser/parser';
import { SemanticAnalyzer } from './analyzer/semantic-analyzer';
import { CompletionProvider } from './features/completion';
import { HoverProvider } from './features/hover';
import { DefinitionProvider } from './features/definition';
import { ValidationProvider } from './features/validation';
import { FormattingProvider } from './features/formatting';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

// Initialize providers
const parser = new MSpecParser();
const semanticAnalyzer = new SemanticAnalyzer();
const completionProvider = new CompletionProvider();
const hoverProvider = new HoverProvider();
const definitionProvider = new DefinitionProvider();
const validationProvider = new ValidationProvider();
const formattingProvider = new FormattingProvider();

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['[', ' ', '.', '\'']
      },
      hoverProvider: true,
      definitionProvider: true,
      documentFormattingProvider: true,
      codeActionProvider: {
        codeActionKinds: [CodeActionKind.QuickFix, CodeActionKind.Refactor]
      }
    }
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }

  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// Configuration interface
interface MSpecSettings {
  validation: {
    enabled: boolean;
    strictMode: boolean;
  };
  completion: {
    enabled: boolean;
    snippets: boolean;
  };
  formatting: {
    enabled: boolean;
    indentSize: number;
  };
}

// Default settings
const defaultSettings: MSpecSettings = {
  validation: {
    enabled: true,
    strictMode: false
  },
  completion: {
    enabled: true,
    snippets: true
  },
  formatting: {
    enabled: true,
    indentSize: 4
  }
};

let globalSettings: MSpecSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<MSpecSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <MSpecSettings>(
      (change.settings.mspec || defaultSettings)
    );
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<MSpecSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'mspec'
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

// The content of a text document has changed
documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const settings = await getDocumentSettings(textDocument.uri);
  
  if (!settings.validation.enabled) {
    return;
  }

  const text = textDocument.getText();
  const lexer = new Lexer(text);
  const tokens = lexer.tokenize();
  
  try {
    const ast = parser.parse(tokens);
    const analysisResult = semanticAnalyzer.analyze(ast);
    const diagnostics = validationProvider.validate(textDocument, ast, analysisResult, settings);
    
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  } catch (error) {
    // Handle parsing errors
    const diagnostics: Diagnostic[] = [{
      severity: DiagnosticSeverity.Error,
      range: {
        start: textDocument.positionAt(0),
        end: textDocument.positionAt(text.length)
      },
      message: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'mspec'
    }];
    
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  }
}

// Completion handler
connection.onCompletion(
  async (params: TextDocumentPositionParams): Promise<CompletionItem[]> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }

    const settings = await getDocumentSettings(params.textDocument.uri);
    if (!settings.completion.enabled) {
      return [];
    }

    const text = document.getText();
    const lexer = new Lexer(text);
    const tokens = lexer.tokenize();

    try {
      const ast = parser.parse(tokens);
      const analysisResult = semanticAnalyzer.analyze(ast);

      return completionProvider.provideCompletions(
        document,
        params.position,
        ast,
        analysisResult,
        settings
      );
    } catch (error) {
      connection.console.error(`Completion error: ${error}`);
      return [];
    }
  }
);

// Completion resolve handler
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    return completionProvider.resolveCompletion(item);
  }
);

// Hover handler
connection.onHover(
  async (params: HoverParams): Promise<Hover | null> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }

    const text = document.getText();
    const lexer = new Lexer(text);
    const tokens = lexer.tokenize();

    try {
      const ast = parser.parse(tokens);
      const analysisResult = semanticAnalyzer.analyze(ast);

      return hoverProvider.provideHover(
        document,
        params.position,
        ast,
        analysisResult
      );
    } catch (error) {
      connection.console.error(`Hover error: ${error}`);
      return null;
    }
  }
);

// Definition handler
connection.onDefinition(
  async (params: DefinitionParams): Promise<Definition | null> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }

    const text = document.getText();
    const lexer = new Lexer(text);
    const tokens = lexer.tokenize();

    try {
      const ast = parser.parse(tokens);
      const analysisResult = semanticAnalyzer.analyze(ast);

      return definitionProvider.provideDefinition(
        document,
        params.position,
        ast,
        analysisResult
      );
    } catch (error) {
      connection.console.error(`Definition error: ${error}`);
      return null;
    }
  }
);

// Document formatting handler
connection.onDocumentFormatting(
  async (params: DocumentFormattingParams): Promise<TextEdit[]> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }

    const settings = await getDocumentSettings(params.textDocument.uri);
    if (!settings.formatting.enabled) {
      return [];
    }

    const text = document.getText();
    const lexer = new Lexer(text);
    const tokens = lexer.tokenize();

    try {
      const ast = parser.parse(tokens);

      return formattingProvider.formatDocument(
        document,
        ast,
        params.options,
        settings
      );
    } catch (error) {
      connection.console.error(`Formatting error: ${error}`);
      return [];
    }
  }
);

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

connection.console.log('MSpec Language Server started');
