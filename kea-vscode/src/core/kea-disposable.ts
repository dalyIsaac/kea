import * as vscode from "vscode";

const disposeAll = (disposables: vscode.Disposable[]) => {
  while (disposables.length) {
    disposables.pop()?.dispose();
  }
};

export interface IKeaDisposable {
  dispose(): void;
}

export abstract class KeaDisposable implements IKeaDisposable {
  #isDisposed = false;
  #disposables: vscode.Disposable[] = [];

  protected _dispose: (() => void) | undefined = undefined;

  dispose = () => {
    if (this.#isDisposed) {
      return;
    }

    disposeAll(this.#disposables);
    this._dispose?.();
    this.#isDisposed = true;
  };

  protected _register = <T extends vscode.Disposable>(disposable: T): T => {
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
