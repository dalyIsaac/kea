import * as vscode from "vscode";

export const Logger = vscode.window.createOutputChannel("kea", { log: true });
