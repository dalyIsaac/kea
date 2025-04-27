import * as vscode from "vscode";
import { disposeAll, IKeaDisposable, KeaDisposable } from "../core/kea-disposable";
import { IKeaRepository, IssueCommentsPayload } from "../repository/kea-repository";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";
import { createCommentsRootDecorationUri } from "./decoration-schemes";

export interface ITreeDecorationManager extends IKeaDisposable {
  registerProviders: (...providers: BaseTreeDecorationProvider[]) => void;
  updateListeners: (...repositories: IKeaRepository[]) => void;
}

export class TreeDecorationManager extends KeaDisposable implements ITreeDecorationManager {
  #fileDecorationProviders: BaseTreeDecorationProvider[] = [];

  #repositoryListeners: vscode.Disposable[] = [];

  registerProviders = (...fileDecorationProviders: BaseTreeDecorationProvider[]): void => {
    this.#fileDecorationProviders.push(...fileDecorationProviders);

    for (const provider of fileDecorationProviders) {
      this._registerDisposable(vscode.window.registerFileDecorationProvider(provider));
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

    for (const provider of this.#fileDecorationProviders) {
      const uri = createCommentsRootDecorationUri({
        pullId: payload.issueId,
        accountKey: repository.account.accountKey,
      });

      provider.refresh(uri);
    }
  };

  protected override _dispose = async (): Promise<void> => {
    disposeAll(this.#repositoryListeners);
    this.#repositoryListeners = [];
    return Promise.resolve();
  };
}
