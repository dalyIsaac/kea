import * as assert from "assert";
import { KeaDisposable } from "./kea-disposable";

class KeaDisposableImplementation extends KeaDisposable {
  isDisposed = () => this._isDisposed();
}

suite("KeaDisposable", () => {
  test("should not be disposed initially", () => {
    const disposable = new KeaDisposableImplementation();
    assert.strictEqual(disposable.isDisposed(), false);
  });

  test("should be disposed after calling dispose()", () => {
    const disposable = new KeaDisposableImplementation();
    disposable.dispose();
    assert.strictEqual(disposable.isDisposed(), true);
  });

  test("should not dispose already disposed instance", () => {
    const disposable = new KeaDisposableImplementation();
    disposable.dispose();
    assert.strictEqual(disposable.isDisposed(), true);
    disposable.dispose(); // Call again
    assert.strictEqual(disposable.isDisposed(), true);
  });
});
