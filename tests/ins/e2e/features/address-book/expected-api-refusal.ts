import { expect } from '@fixtures';
import { RestClientError } from '@adapters/http/rest-client';

type ValidationProblem = {
  type: string;
  errors: Record<string, string[]>;
};

const expectedApiRefusalOf = async (pending: Promise<unknown>): Promise<{ status: number; body: ValidationProblem }> => {
  const caught: unknown = await pending.then(
    () => undefined,
    (error: unknown) => error,
  );
  expect(caught).toBeInstanceOf(RestClientError);
  const error = caught as RestClientError;
  return { status: error.status, body: JSON.parse(error.responseBody) as ValidationProblem };
};

export const expectedValidationRefusalOf = async (pending: Promise<unknown>): Promise<ValidationProblem> => {
  const { status, body } = await expectedApiRefusalOf(pending);
  expect(status).toBe(400);
  expect(body.type).toBe('https://api.cdp.defra.cloud/problems/validation-error');
  return body;
};
