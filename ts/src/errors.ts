export class ImbraceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImbraceError";
  }
}

export class AuthError extends ImbraceError {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends ImbraceError {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(`[${statusCode}] ${message}`);
    this.name = "ApiError";
  }
}

export class NetworkError extends ImbraceError {
  constructor(message = "Network error or server unreachable") {
    super(message);
    this.name = "NetworkError";
  }
}
