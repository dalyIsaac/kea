import * as vscode from "vscode";
import { KEA_COMMANDS, KeaCommand, VSCODE_COMMANDS, VscodeCommand } from "./command-manager-types";

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

export const createVscodeCommand = <TCommand extends keyof VSCODE_COMMANDS>({
  title,
  command,
  tooltip,
  args,
}: VscodeCommand<TCommand>): vscode.Command => ({
  title,
  command,
  arguments: args,
  ...(tooltip ? { tooltip } : {}),
});
