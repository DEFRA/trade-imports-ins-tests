import { expect } from '@playwright/test';
import { RestClientError } from '@adapters/http/rest-client';

export async function expectRefusalWith(pending: Promise<unknown> | (() => Promise<unknown>), status: number): Promise<RestClientError> {
  const promise = typeof pending === 'function' ? pending() : pending;
  const caught: unknown = await promise.then(
    () => undefined,
    (error: unknown) => error,
  );
  expect(caught).toBeInstanceOf(RestClientError);
  const error = caught as RestClientError;
  expect(error.status).toBe(status);
  return error;
}
