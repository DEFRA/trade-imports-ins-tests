import { expect } from '@fixtures';
import { RestClientError } from '@adapters/http/rest-client';

type ValidationProblem = {
  type: string;
  errors: Record<string, string[]>;
};

export const expectedValidationRefusalOf = async (pending: Promise<unknown>): Promise<ValidationProblem> => {
  const caught: unknown = await pending.then(
    () => undefined,
    (error: unknown) => error,
  );
  expect(caught).toBeInstanceOf(RestClientError);
  const error = caught as RestClientError;
  expect(error.status).toBe(400);
  const body = JSON.parse(error.responseBody) as ValidationProblem;
  expect(body.type).toBe('https://api.cdp.defra.cloud/problems/validation-error');
  return body;
};
