/**
 * VSCode extension for MSpec language support
 */

import * as path from 'path';
import { workspace, ExtensionContext, window, commands, OutputChannel } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
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
  const serverModule = context.asAbsolutePath(
    path.join('..', 'server', 'out', 'server.js')
  );

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
      args: serverArgs
    },
    debug: {
      module: customServerPath || serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
      args: serverArgs
    }
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for mspec documents
    documentSelector: [{ scheme: 'file', language: 'mspec' }],
    synchronize: {
      // Notify the server about file changes to '.mspec' files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/*.mspec')
    },
    outputChannel: outputChannel,
    traceOutputChannel: outputChannel
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'mspecLanguageServer',
    'MSpec Language Server',
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start().then(() => {
    outputChannel.appendLine('MSpec Language Server started successfully');
  }).catch((error) => {
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

  context.subscriptions.push(restartServerCommand, showOutputCommand);
}

// Handle configuration changes
workspace.onDidChangeConfiguration((event) => {
  if (event.affectsConfiguration('mspec')) {
    // Restart the server when configuration changes
    commands.executeCommand('mspec.restartServer');
  }
});
