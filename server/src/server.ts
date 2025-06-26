/**
 * Main LSP Server for MSpec language
 */

import {
  CodeAction,
  CodeActionKind,
  CodeActionParams,
  CompletionItem,
  createConnection,
  Definition,
  DefinitionParams,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  DocumentFormattingParams,
  Hover,
  HoverParams,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocumentPositionParams,
  TextDocuments,
  TextDocumentSyncKind,
  TextEdit,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { SemanticAnalyzer } from './analyzer/semantic-analyzer';
import { CompletionProvider } from './features/completion';
import { DefinitionProvider } from './features/definition';
import { FormattingProvider } from './features/formatting';
import { HoverProvider } from './features/hover';
import { ValidationProvider } from './features/validation';
import { Lexer } from './parser/lexer';
import { MSpecParser } from './parser/parser';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
// let hasDiagnosticRelatedInformationCapability = false; // Unused variable

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
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
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
        triggerCharacters: ['[', ' ', '.', "'"],
      },
      hoverProvider: true,
      definitionProvider: true,
      documentFormattingProvider: true,
      codeActionProvider: {
        codeActionKinds: [CodeActionKind.QuickFix, CodeActionKind.Refactor],
      },
    },
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
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
    strictMode: false,
  },
  completion: {
    enabled: true,
    snippets: true,
  },
  formatting: {
    enabled: true,
    indentSize: 4,
  },
};

let globalSettings: MSpecSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<MSpecSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <MSpecSettings>(change.settings.mspec || defaultSettings);
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
      section: 'mspec',
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
    const diagnostics: Diagnostic[] = [
      {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(0),
          end: textDocument.positionAt(text.length),
        },
        message: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: 'mspec',
      },
    ];

    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  }
}

// Completion handler
connection.onCompletion(async (params: TextDocumentPositionParams): Promise<CompletionItem[]> => {
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
      settings,
    );
  } catch (error) {
    connection.console.error(`Completion error: ${error}`);
    return [];
  }
});

// Completion resolve handler
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return completionProvider.resolveCompletion(item);
});

// Hover handler
connection.onHover(async (params: HoverParams): Promise<Hover | null> => {
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

    return hoverProvider.provideHover(document, params.position, ast, analysisResult);
  } catch (error) {
    connection.console.error(`Hover error: ${error}`);
    return null;
  }
});

// Definition handler
connection.onDefinition(async (params: DefinitionParams): Promise<Definition | null> => {
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

    return definitionProvider.provideDefinition(document, params.position, ast, analysisResult);
  } catch (error) {
    connection.console.error(`Definition error: ${error}`);
    return null;
  }
});

// Document formatting handler
connection.onDocumentFormatting(async (params: DocumentFormattingParams): Promise<TextEdit[]> => {
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

    return formattingProvider.formatDocument(document, ast, params.options, settings);
  } catch (error) {
    connection.console.error(`Formatting error: ${error}`);
    return [];
  }
});

// Code action handler
connection.onCodeAction(async (params: CodeActionParams): Promise<CodeAction[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  // const text = document.getText();
  // const lexer = new Lexer(text);
  // const tokens = lexer.tokenize();

  try {
    // const ast = parser.parse(tokens); // Unused variable
    // const analysisResult = semanticAnalyzer.analyze(ast); // Unused variable

    // For now, return empty array - can be extended with actual code actions
    const codeActions: CodeAction[] = [];

    // Example: Add quick fix for common syntax errors
    for (const diagnostic of params.context.diagnostics) {
      if (diagnostic.source === 'mspec' && diagnostic.severity === DiagnosticSeverity.Error) {
        // Could add quick fixes here based on the error message
        // For example: auto-correct common typos, add missing brackets, etc.
      }
    }

    return codeActions;
  } catch (error) {
    connection.console.error(`Code action error: ${error}`);
    return [];
  }
});

// Add handlers for common optional LSP methods to prevent "unhandled method" warnings

// Document symbols (outline view)
connection.onDocumentSymbol(() => {
  // Return empty for now - can be implemented later
  return [];
});

// Workspace symbols (global symbol search)
connection.onWorkspaceSymbol(() => {
  // Return empty for now - can be implemented later
  return [];
});

// Find references
connection.onReferences(() => {
  // Return empty for now - can be implemented later
  return [];
});

// Rename symbol
connection.onRenameRequest(() => {
  // Return null for now - can be implemented later
  return null;
});

// Add error handling for unhandled methods
connection.onRequest((method, _params) => {
  connection.console.warn(`Unhandled request: ${method}`);
  return null;
});

connection.onNotification((method, _params) => {
  // Ignore common notifications that we don't need to handle
  const ignoredNotifications = [
    'textDocument/didOpen',
    'textDocument/didChange',
    'textDocument/didClose',
    'textDocument/didSave',
    'workspace/didChangeConfiguration',
    'workspace/didChangeWorkspaceFolders',
    'initialized',
    'exit',
    '$/cancelRequest', // VSCode cancellation requests
    '$/progress', // Progress notifications
    'window/logMessage', // Log messages
    'telemetry/event', // Telemetry events
  ];

  if (!ignoredNotifications.includes(method)) {
    connection.console.warn(`Unhandled notification: ${method}`);
  }
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

connection.console.log('MSpec Language Server started');
