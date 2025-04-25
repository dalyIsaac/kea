import * as vscode from "vscode";

export const disposeAll = (disposables: vscode.Disposable[]) => {
  while (disposables.length) {
    disposables.pop()?.dispose();
  }
};

export interface IKeaDisposable {
  dispose: () => Promise<void>;
}

export abstract class KeaDisposable implements IKeaDisposable {
  #isDisposed = false;
  #disposables: vscode.Disposable[] = [];

  protected _dispose: (() => Promise<void>) | undefined = undefined;

  dispose = async (): Promise<void> => {
    if (this.#isDisposed) {
      return;
    }

    disposeAll(this.#disposables);
    await this._dispose?.();
    this.#isDisposed = true;
  };

  protected _registerDisposable = <T extends vscode.Disposable>(disposable: T): T => {
    if (this.#isDisposed) {
      disposable.dispose();
      return disposable;
    }

    this.#disposables.push(disposable);
    return disposable;
  };

  protected _isDisposed = (): boolean => {
    return this.#isDisposed;
  };
}
