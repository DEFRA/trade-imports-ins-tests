import { BasePage, type OpenOptions } from '@page-objects/shared/base-page';

export type OpensAtExpectedUrlOptions = OpenOptions & { query?: Record<string, string> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function opensAtExpectedUrl<TBase extends abstract new (...args: any[]) => BasePage>(Base: TBase) {
  abstract class OpensAtExpectedUrl extends Base {
    abstract readonly expectedUrl: string;

    async open({ attemptSignIn = true, query, ...identity }: OpensAtExpectedUrlOptions = {}): Promise<void> {
      const queryString = query ? `?${new URLSearchParams(query)}` : '';
      await this.page.goto(`${this.expectedUrl}${queryString}`);
      await this.signInWhenRequested(attemptSignIn, identity);
    }
  }
  return OpensAtExpectedUrl;
}
