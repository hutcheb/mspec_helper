/**
 * VSCode extension for MSpec language support
 */

import * as fs from 'fs';
import * as path from 'path';
import { commands, ExtensionContext, OutputChannel, window, workspace } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;
let outputChannel: OutputChannel;

export function activate(context: ExtensionContext) {
  // Create output channel
  outputChannel = window.createOutputChannel('MSpec Language Server');
  context.subscriptions.push(outputChannel);

  // Start the language server
  startLanguageServer(context);

  // Register commands
  registerCommands(context);

  outputChannel.appendLine('MSpec Language Support extension activated');
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

function startLanguageServer(context: ExtensionContext) {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(path.join('server', 'server-bundled.js'));

  // Check if server file exists
  if (!fs.existsSync(serverModule)) {
    const errorMsg = `Language server not found at: ${serverModule}`;
    outputChannel.appendLine(errorMsg);
    window.showErrorMessage(errorMsg);
    return;
  }

  outputChannel.appendLine(`Using language server: ${serverModule}`);

  // Check if user has specified a custom server path
  const config = workspace.getConfiguration('mspec');
  const customServerPath = config.get<string>('server.path');
  const serverArgs = config.get<string[]>('server.args', []);

  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      module: customServerPath || serverModule,
      transport: TransportKind.ipc,
      args: serverArgs,
    },
    debug: {
      module: customServerPath || serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
      args: serverArgs,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for mspec documents
    documentSelector: [{ scheme: 'file', language: 'mspec' }],
    synchronize: {
      // Notify the server about file changes to '.mspec' files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/*.mspec'),
    },
    outputChannel: outputChannel,
    traceOutputChannel: outputChannel,
    // Enable all LSP features
    initializationOptions: {},
    middleware: {
      // Add middleware to log requests for debugging
      provideDefinition: (document, position, token, next) => {
        outputChannel.appendLine(
          `Go to definition requested at ${position.line}:${position.character}`
        );
        return next(document, position, token);
      },
      provideDocumentFormattingEdits: (document, options, token, next) => {
        outputChannel.appendLine('Document formatting requested');
        return next(document, options, token);
      },
      provideHover: (document, position, token, next) => {
        outputChannel.appendLine(`Hover requested at ${position.line}:${position.character}`);
        const result = next(document, position, token);
        if (result) {
          outputChannel.appendLine('Hover response received');
        } else {
          outputChannel.appendLine('No hover response');
        }
        return result;
      },
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'mspecLanguageServer',
    'MSpec Language Server',
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client
    .start()
    .then(() => {
      outputChannel.appendLine('MSpec Language Server started successfully');

      // Log server capabilities for debugging
      setTimeout(() => {
        const capabilities = client.initializeResult?.capabilities;
        if (capabilities) {
          outputChannel.appendLine('Server capabilities:');
          outputChannel.appendLine(`- Definition Provider: ${!!capabilities.definitionProvider}`);
          outputChannel.appendLine(
            `- Formatting Provider: ${!!capabilities.documentFormattingProvider}`
          );
          outputChannel.appendLine(`- Completion Provider: ${!!capabilities.completionProvider}`);
          outputChannel.appendLine(`- Hover Provider: ${!!capabilities.hoverProvider}`);
        }
      }, 1000);
    })
    .catch(error => {
      outputChannel.appendLine(`Failed to start MSpec Language Server: ${error}`);
      window.showErrorMessage(`Failed to start MSpec Language Server: ${error}`);
    });
}

function registerCommands(context: ExtensionContext) {
  // Command to restart the language server
  const restartServerCommand = commands.registerCommand('mspec.restartServer', async () => {
    if (client) {
      outputChannel.appendLine('Restarting MSpec Language Server...');
      await client.stop();
      startLanguageServer(context);
      window.showInformationMessage('MSpec Language Server restarted');
    }
  });

  // Command to show output channel
  const showOutputCommand = commands.registerCommand('mspec.showOutputChannel', () => {
    outputChannel.show();
  });

  // Command for go to definition
  const goToDefinitionCommand = commands.registerCommand('mspec.goToDefinition', async () => {
    if (client && client.isRunning()) {
      await commands.executeCommand('editor.action.revealDefinition');
    } else {
      window.showWarningMessage('MSpec Language Server is not running');
    }
  });

  // Command for format document
  const formatDocumentCommand = commands.registerCommand('mspec.formatDocument', async () => {
    if (client && client.isRunning()) {
      await commands.executeCommand('editor.action.formatDocument');
    } else {
      window.showWarningMessage('MSpec Language Server is not running');
    }
  });

  context.subscriptions.push(
    restartServerCommand,
    showOutputCommand,
    goToDefinitionCommand,
    formatDocumentCommand
  );
}

// Handle configuration changes
workspace.onDidChangeConfiguration(event => {
  if (event.affectsConfiguration('mspec')) {
    // Restart the server when configuration changes
    commands.executeCommand('mspec.restartServer');
  }
});
