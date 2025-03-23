import * as vscode from "vscode";
import { IKeaRepository } from "../repository/kea-repository";
import { IRepositoryManager } from "../repository/repository-manager";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";
import { createCommentsRootDecorationUri } from "./decoration-schemes";

export class TreeDecorationManager {
  #repositoryManager: IRepositoryManager;
  #repositoryListeners: vscode.Disposable[] = [];
  #providers: BaseTreeDecorationProvider[] = [];

  constructor(repositoryManager: IRepositoryManager) {
    this.#repositoryManager = repositoryManager;
  }

  registerProviders = (...providers: BaseTreeDecorationProvider[]): void => {
    this.#providers.push(...providers);
    for (const provider of providers) {
      // TODO: Make disposable
      vscode.window.registerFileDecorationProvider(provider);
    }
  };

  updateListeners = (...repositories: IKeaRepository[]): void => {
    // TODO: Make disposable
    // this.#repositoryListeners.forEach((listener) => listener.dispose());
    this.#repositoryListeners = [];

    for (const repository of repositories) {
      const listener = repository.onDidChangeIssueComments((payload) => {
        if (payload.comments instanceof Error) {
          return;
        }

        for (const provider of this.#providers) {
          provider.refresh(
            createCommentsRootDecorationUri({
              pullId: payload.issueId,
              sessionId: repository.authSessionAccountId,
            }),
          );
        }
      });
      this.#repositoryListeners.push(listener);
    }
  };
}
