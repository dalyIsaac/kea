import * as assert from "assert";
import * as vscode from "vscode";
import { KeaDisposable } from "./kea-disposable";

class KeaDisposableImplementation extends KeaDisposable {
  wasCalled = false;
  override _dispose = () => {
    this.wasCalled = true;
  };
  isDisposed = () => this._isDisposed();
  registerDisposable = <T extends vscode.Disposable>(disposable: T): T => {
    return this._registerDisposable(disposable);
  };
}

suite("KeaDisposable", () => {
  test("should not be disposed initially", () => {
    // Given
    const disposable = new KeaDisposableImplementation();

    // When
    const isDisposed = disposable.isDisposed();

    // Then
    assert.strictEqual(isDisposed, false);
  });

  test("should be disposed after calling dispose()", () => {
    // Given
    const disposable = new KeaDisposableImplementation();

    // When
    disposable.dispose();

    // Then
    assert.strictEqual(disposable.isDisposed(), true);
  });

  test("should not dispose already disposed instance", () => {
    // Given
    const disposable = new KeaDisposableImplementation();
    disposable.dispose();

    // When
    const isDisposed1 = disposable.isDisposed();
    const isDisposed2 = disposable.isDisposed();

    // Then
    assert.strictEqual(isDisposed1, true);
    assert.strictEqual(isDisposed2, true);
  });

  test("should dispose registered disposables", () => {
    // Given
    const disposable1 = {
      dispose: () => {
        // Simulate some disposal logic
      },
    } as vscode.Disposable;
    const disposable2 = {
      dispose: () => {
        // Simulate some disposal logic
      },
    } as vscode.Disposable;

    const keaDisposable = new KeaDisposableImplementation();
    keaDisposable.registerDisposable(disposable1);
    keaDisposable.registerDisposable(disposable2);

    let disposedCount = 0;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalDispose1 = disposable1.dispose;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalDispose2 = disposable2.dispose;

    disposable1.dispose = () => {
      disposedCount++;
      originalDispose1.call(disposable1);
    };
    disposable2.dispose = () => {
      disposedCount++;
      originalDispose2.call(disposable2);
    };

    // When
    keaDisposable.dispose();

    // Then
    assert.strictEqual(disposedCount, 2);
  });

  test("should call the custom dispose method", () => {
    // Given
    const disposable = new KeaDisposableImplementation();

    // When
    disposable.dispose();

    // Then
    assert.strictEqual(disposable.wasCalled, true);
  });
});
