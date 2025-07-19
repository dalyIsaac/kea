import * as vscode from "vscode";
import { KEA_COMMANDS, KeaCommand, VSCODE_COMMANDS } from "./command-manager-types";

export const createKeaCommand = <TCommand extends keyof typeof KEA_COMMANDS>({
  title,
  command,
  tooltip,
  args,
}: KeaCommand<TCommand>): vscode.Command => ({
  title,
  command,
  arguments: args,
  ...(tooltip ? { tooltip } : {}),
});

export const createVscodeCommand = (
  ...args: VSCODE_COMMANDS[keyof VSCODE_COMMANDS]
): Parameters<typeof vscode.commands.executeCommand<unknown>> => args;
