import * as vscode from "vscode";
import { IKeaRepository, IssueCommentsPayload } from "../repository/kea-repository";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";
import { createCommentsRootDecorationUri } from "./decoration-schemes";

export class TreeDecorationManager {
  #repositoryListeners: vscode.Disposable[] = [];
  #providers: BaseTreeDecorationProvider[] = [];

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
        this.#onDidChangeIssueComments(repository, payload);
      });

      this.#repositoryListeners.push(listener);
    }
  };

  #onDidChangeIssueComments = (repository: IKeaRepository, payload: IssueCommentsPayload): void => {
    if (payload.comments instanceof Error) {
      return;
    }

    for (const provider of this.#providers) {
      const uri = createCommentsRootDecorationUri({
        pullId: payload.issueId,
        authSessionAccountId: repository.authSessionAccountId,
      });

      provider.refresh(uri);
    }
  };
}
