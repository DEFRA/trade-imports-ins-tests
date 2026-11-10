import { expect } from '@fixtures';
import { expectRefusalWith } from '@adapters/http/expect-api-refusal';

type ValidationProblem = {
  type: string;
  errors: Record<string, string[]>;
};

export const expectedValidationRefusalOf = async (pending: Promise<unknown>): Promise<ValidationProblem> => {
  const error = await expectRefusalWith(pending, 400);
  const body = JSON.parse(error.responseBody) as ValidationProblem;
  expect(body.type).toBe('https://api.cdp.defra.cloud/problems/validation-error');
  return body;
};
