import type { APIRequestContext, APIResponse } from '@playwright/test';
import { SET_BASES } from '@page-objects/base/sets';

/** A page's form fields. An array posts the key repeatedly, the way a checkbox group does. */
export type FormFields = Record<string, string | string[]>;

/**
 * The page the crumb cookie is minted from. No set is served at the root any
 * more — `/` is a server-wide 302 to the default set — so land on the set's own
 * dashboard. The seed context is always the animals frontend
 * (`createFrontendSeedContext`), so this set base is the right one.
 */
const CRUMB_MINT_PATH = SET_BASES.liveAnimals;

export class FrontendFormError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly responseBody: string,
  ) {
    super(`POST ${path} responded ${status} instead of a redirect. Body:\n${responseBody}`);
    this.name = 'FrontendFormError';
  }
}

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_MULTIPLE_CHOICES = 300;
const HTTP_STATUS_BAD_REQUEST = 400;

const BODY_EXCERPT_LENGTH = 2000;

const isRedirect = (response: APIResponse): boolean =>
  response.status() >= HTTP_STATUS_MULTIPLE_CHOICES && response.status() < HTTP_STATUS_BAD_REQUEST;

const toValueList = (values: string | string[]): string[] => (Array.isArray(values) ? values : [values]);

const encodeFormBody = (fields: FormFields): string => {
  const pairs = Object.entries(fields).flatMap(([name, values]) => toValueList(values).map((value) => [name, value]));
  return new URLSearchParams(pairs).toString();
};

export class FrontendFormClient {
  private crumb: string | undefined;

  constructor(private readonly request: APIRequestContext) {}

  // @hapi/crumb (non-restful mode) matches the posted "crumb" field against the "crumb" cookie — the two names below must stay identical.
  private async crumbToken(): Promise<string> {
    if (this.crumb) {
      return this.crumb;
    }

    const landing = await this.request.get(CRUMB_MINT_PATH, { maxRedirects: 0 });
    if (landing.status() !== HTTP_STATUS_OK) {
      throw new Error(
        `GET ${CRUMB_MINT_PATH} answered ${landing.status()} (${landing.headers().location ?? 'no Location'}) instead of the dashboard. ` +
          'The seed context is not signed in to the frontend, so no post would reach a page.',
      );
    }

    const { cookies } = await this.request.storageState();
    const minted = cookies.find((cookie) => cookie.name === 'crumb')?.value;
    if (!minted) {
      throw new Error(`GET ${CRUMB_MINT_PATH} minted no "crumb" cookie, so no form post can pass CSRF validation.`);
    }

    this.crumb = minted;
    return minted;
  }

  // Pass redirectsTo for any transition (amend, cancel, delete): a refusal redirects too, just elsewhere, so 3xx alone reads it as success.
  async postForm(path: string, fields: FormFields = {}, { redirectsTo }: { redirectsTo?: RegExp } = {}): Promise<string> {
    const response = await this.request.post(path, {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: encodeFormBody({ ...fields, crumb: await this.crumbToken() }),
      maxRedirects: 0,
    });

    // A page that rejects its payload can re-render 200 with an error summary, so a non-redirect is a failed post.
    if (!isRedirect(response)) {
      throw new FrontendFormError(response.status(), path, (await response.text()).slice(0, BODY_EXCERPT_LENGTH));
    }

    const location = response.headers().location;
    if (!location) {
      throw new Error(`POST ${path} redirected with no Location header, so there is no next page to follow.`);
    }
    if (redirectsTo && !redirectsTo.test(location)) {
      throw new Error(`POST ${path} redirected to "${location}", not to ${redirectsTo}. The frontend refused what was asked of it.`);
    }
    return location;
  }
}
