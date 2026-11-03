import { BasePage, type OpenOptions } from '@page-objects/shared/base-page';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function opensAtExpectedUrl<TBase extends abstract new (...args: any[]) => BasePage>(Base: TBase) {
  abstract class OpensAtExpectedUrl extends Base {
    abstract readonly expectedUrl: string;

    async open({ attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
      await this.page.goto(this.expectedUrl);
      await this.signInWhenRequested(attemptSignIn, identity);
    }
  }
  return OpensAtExpectedUrl;
}
