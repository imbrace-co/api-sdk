export class TokenManager {
  private token: string | undefined;

  constructor(initialToken?: string) {
    this.token = initialToken;
  }

  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | undefined {
    return this.token;
  }

  clear(): void {
    this.token = undefined;
  }
}
