import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "lf.open",
    (fileOrFolder?: string) => lfOpen(true, fileOrFolder),
  );
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand("lf.focus", () => lfOpen(false));
  context.subscriptions.push(disposable);
}

async function lfOpen(openFile: boolean, fileOrFolder?: string) {
  if (!fileOrFolder) {
    const editor = vscode.window.activeTextEditor;
    fileOrFolder = editor?.document.uri.fsPath;
  }
  if (!fileOrFolder) {
    return;
  }

  if (!(await focusActiveLfInstance(openFile ? fileOrFolder : null))) {
    await newLfInstance(fileOrFolder);
  }
}

/**
 * Tries to find an instance and focus on the tab.
 * @returns If an instance was found and focused
 */
async function focusActiveLfInstance(fileOrFolder: string): Promise<boolean> {
  for (let terminal of vscode.window.terminals) {
    if (terminal.name !== "lf") {
      continue;
    }

    let template;
    const stats = await vscode.workspace.fs.stat(vscode.Uri.file(fileOrFolder));
    if (stats.type === vscode.FileType.Directory) {
      template = vscode.workspace
        .getConfiguration()
        .get<string>(
          "lf.focusFolderCommand",
          '$lf -remote "send $id cd ${fileOrFolder}"',
        );
    } else if (stats.type === vscode.FileType.File) {
      template = vscode.workspace
        .getConfiguration()
        .get<string>(
          "lf.focusCommand",
          '$lf -remote "send $id select ${fileOrFolder}"',
        );
    } else {
      return false;
    }

    const command = template.replace("${fileOrFolder}", fileOrFolder);
    if (fileOrFolder) {
      terminal.sendText(command);
    }
    terminal.show();
    return true;
  }

  return false;
}

async function newLfInstance(fileOrFolder: string) {
  // Always create a new terminal
  await vscode.commands.executeCommand(
    "workbench.action.terminal.newInActiveWorkspace",
  );

  let terminal = vscode.window.activeTerminal!;

  // Read the command from the configuration
  const commandTemplate = vscode.workspace
    .getConfiguration()
    .get<string>("lf.command", "lf ${file}");
  const command = commandTemplate.replace("${file}", fileOrFolder);
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
    "workbench.action.terminal.moveToEditor",
  );

  // Move focus back to the editor view
  await vscode.commands.executeCommand(
    "workbench.action.focusActiveEditorGroup",
  );

  if (vscode.window.terminals.length > 1) {
    // Close the terminal if it's not the only one
    await vscode.commands.executeCommand("workbench.action.togglePanel");
  }
}

export function deactivate() {}