import * as vscode from "vscode";
import { IKeaContext } from "../core/context";
import { KeaDisposable } from "../core/kea-disposable";
import { Logger } from "../core/logger";
import { ICommandManager, KEA_COMMANDS, KeaCommandMap } from "./command-manager-types";

export class CommandManager extends KeaDisposable implements ICommandManager {
  #commands: KeaCommandMap;

  constructor(ctx: IKeaContext) {
    super();

    this.#commands = {} as KeaCommandMap;
    for (const [commandName, createCommandFn] of Object.entries(KEA_COMMANDS)) {
      const command = createCommandFn(ctx);
      this.#commands[commandName as keyof KeaCommandMap] = command;

      const disposable = vscode.commands.registerCommand(commandName, command);
      this._registerDisposable(disposable);
    }
  }

  executeCommand: ICommandManager["executeCommand"] = (commandName, ...args) => {
    Logger.debug(`Executing command: ${commandName}`, ...args);
    return vscode.commands.executeCommand(commandName, ...args);
  };
}
