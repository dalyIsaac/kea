export class WrappedError extends Error {
  inner: unknown;

  constructor(message: string, inner: unknown) {
    super(message);
    this.name = "KeaError";
    this.inner = inner;
  }
}
