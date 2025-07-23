export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    type: ErrorType = "unknown",
    originalError?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.originalError = originalError;

    // Ensure correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static isNetworkError(err: unknown): err is AppError {
    return err instanceof AppError && err.type === "network";
  }
}
