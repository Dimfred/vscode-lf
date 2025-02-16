import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "lf.open",
    () => lfOpenFile(true)
  );
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    "lf.focus",
    () => lfOpenFile(false)
  );
  context.subscriptions.push(disposable);
}

async function lfOpenFile(openFile: boolean) {
  const editor = vscode.window.activeTextEditor;
  const currentFile = editor?.document.uri.fsPath;
  if (!currentFile) {
    return;
  }

  if (!(await focusActiveLfInstance(openFile ? currentFile : null))) {
    await newLfInstance(currentFile);
  }
}

/**
 * Tries to find an instance and focus on the tab.
 * @returns If an instance was found and focused
 */
async function focusActiveLfInstance(file?: string): Promise<boolean> {
  for (let terminal of vscode.window.terminals) {
    if (terminal.name === "lf") {
      const commandTemplate = vscode.workspace
        .getConfiguration()
        .get<string>("lf.focusCommand", '$lf -remote "send $id select ${file}"');
      const command = commandTemplate.replace("${file}", file);
      if (file) {
        terminal.sendText(command);
      }
      terminal.show();
      return true;
    }
  }
  return false;
}

async function newLfInstance(file: string) {
  // Always create a new terminal
  await vscode.commands.executeCommand(
    "workbench.action.terminal.newInActiveWorkspace"
  );

  let terminal = vscode.window.activeTerminal!;

  // Read the command from the configuration
  const commandTemplate = vscode.workspace
    .getConfiguration()
    .get<string>("lf.command", "lf ${file}");
  const command = commandTemplate.replace("${file}", file);
  terminal.sendText(command);
  terminal.show();

  const openInEditor = vscode.workspace
    .getConfiguration()
    .get<boolean>("lf.openInEditor", false);

  if (!openInEditor) {
    return;
  }

  // Move the terminal to the editor area
  await vscode.commands.executeCommand(
    "workbench.action.terminal.moveToEditor"
  );

  // Move focus back to the editor view
  await vscode.commands.executeCommand(
    "workbench.action.focusActiveEditorGroup"
  );

  if (vscode.window.terminals.length > 1) {
    // Close the terminal if it's not the only one
    await vscode.commands.executeCommand("workbench.action.togglePanel");
  }
}

export function deactivate() { }
