import type { APIRequestContext, APIResponse } from '@playwright/test';

export class RestClientError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly url: string,
    readonly responseBody: string,
  ) {
    super(`${method} ${url} responded ${status}: ${responseBody}`);
    this.name = 'RestClientError';
  }
}

export class RestClientTransportError extends Error {
  constructor(
    readonly method: string,
    readonly url: string,
    reason: string,
  ) {
    super(`${method} ${url} got no response: ${reason}`);
    this.name = 'RestClientTransportError';
  }
}

// Playwright's call log lists every request header, x-api-key included.
const withoutCallLog = (error: unknown): string => {
  if (error instanceof Error) return error.message.split('\n')[0];
  return typeof error === 'string' ? error : 'unknown error';
};

export class RestClient {
  constructor(
    private readonly baseUrl: string,
    private readonly request: APIRequestContext,
    private readonly apiKey?: string,
  ) {}

  async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.send<T>('GET', path, undefined, headers);
  }

  async post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.send<T>('POST', path, body, headers);
  }

  async put<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<T> {
    return this.send<T>('PUT', path, body, headers);
  }

  async delete<T = void>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.send<T>('DELETE', path, undefined, headers);
  }

  private async send<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const { response, responseBody } = await this.exchange(method, url, body, headers);

    if (!response.ok()) {
      throw new RestClientError(response.status(), method, url, responseBody);
    }

    return (responseBody ? JSON.parse(responseBody) : undefined) as T;
  }

  private async exchange(
    method: string,
    url: string,
    body: unknown,
    headers: Record<string, string> | undefined,
  ): Promise<{ response: APIResponse; responseBody: string }> {
    try {
      const response = await this.request.fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
          ...headers,
        },
        data: body,
      });
      return { response, responseBody: await response.text() };
    } catch (error) {
      throw new RestClientTransportError(method, url, withoutCallLog(error));
    }
  }
}
