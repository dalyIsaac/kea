import * as vscode from "vscode";
import { IKeaContext } from "../core/context";
import { KeaDisposable } from "../core/kea-disposable";
import { Logger } from "../core/logger";
import { CommandMap, COMMANDS, ICommandManager } from "./command-manager-types";

export class CommandManager extends KeaDisposable implements ICommandManager {
  #commands: CommandMap;

  constructor(ctx: IKeaContext) {
    super();

    this.#commands = {} as CommandMap;
    for (const [commandName, createCommandFn] of Object.entries(COMMANDS)) {
      const command = createCommandFn(ctx);
      this.#commands[commandName as keyof CommandMap] = command;

      const disposable = vscode.commands.registerCommand(commandName, command);
      this._registerDisposable(disposable);
    }
  }

  executeCommand: ICommandManager["executeCommand"] = (commandName, ...args) => {
    Logger.debug(`Executing command: ${commandName}`, ...args);
    return vscode.commands.executeCommand(commandName, ...args);
  };

  createCommand: ICommandManager["createCommand"] = (commandName, title, ...args) => {
    return {
      command: commandName,
      title,
      arguments: args,
    };
  };
}
