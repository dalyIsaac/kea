export class WrappedError extends Error {
  inner: unknown;

  constructor(message: string, inner?: unknown) {
    super(message);
    this.name = "KeaError";
    this.inner = inner;
  }

  override toString = (): string => {
    const innerMessage = this.inner instanceof Error ? this.inner.message : String(this.inner);
    return `${this.name}: ${this.message} (Inner: ${innerMessage})`;
  };
}
