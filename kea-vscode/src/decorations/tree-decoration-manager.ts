import * as vscode from "vscode";
import { disposeAll } from "../core/kea-disposable";
import { IKeaRepository, IssueCommentsPayload } from "../repository/kea-repository";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";
import { createCommentsRootDecorationUri } from "./decoration-schemes";

export interface ITreeDecorationManager {
  registerProviders: (...providers: BaseTreeDecorationProvider[]) => void;
  updateListeners: (...repositories: IKeaRepository[]) => void;
}

export class TreeDecorationManager implements ITreeDecorationManager {
  #repositoryListeners: vscode.Disposable[] = [];
  #providers: BaseTreeDecorationProvider[] = [];

  registerProviders = (...providers: BaseTreeDecorationProvider[]): void => {
    this.#providers.push(...providers);
    for (const provider of providers) {
      this.#repositoryListeners.push(vscode.window.registerFileDecorationProvider(provider));
    }
  };

  updateListeners = (...repositories: IKeaRepository[]): void => {
    disposeAll(this.#repositoryListeners);

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
        accountKey: repository.account.accountKey,
      });

      provider.refresh(uri);
    }
  };
}
