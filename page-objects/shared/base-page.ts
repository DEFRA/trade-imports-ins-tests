import { Browser, expect, Page, Locator } from '@playwright/test';
import { defaultUser } from '@config/users';
import { pageLoadWait } from '@config/timeouts';
import { SignInPage } from '@page-objects/shared/auth/sign-in-page';
import { SignInErrorPage } from '@page-objects/shared/auth/sign-in-error-page';
import { OrganisationPickerPage } from '@page-objects/shared/auth/organisation-picker-page';
import { SET_BASES, SetBase } from '@page-objects/shared/sets';
import { errorSummaryOn, notificationBannerTitled } from '@page-objects/shared/govuk-banners';
import { escapeRegex } from '@page-objects/shared/escape-regex';

export function requireBaseUrl(
  envVar:
    | 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL'
    | 'TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL'
    | 'TRADE_IMPORTS_INS_FRONTEND_BASE_URL'
    | 'TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL',
): string {
  const baseUrl = process.env[envVar];
  if (!baseUrl) {
    throw new Error(`${envVar} is not set. Ensure Playwright config applies project base URLs before running tests.`);
  }
  return baseUrl;
}

export const TRAIL_PARAMETER = 'from';
export const OPTIONAL_TRAIL_PATTERN = `(?:[?&]${TRAIL_PARAMETER}=[^#]*)?`;
const REVIEW_SLUG = 'notification-view';

/** Matches `url` and the optional `query` that follows it, with or without a trail after them. */
export function urlPatternWithTrail(url: string, query = ''): RegExp {
  return new RegExp(`${escapeRegex([url, query].join(''))}${OPTIONAL_TRAIL_PATTERN}$`);
}

export function originOf(envVar: Parameters<typeof requireBaseUrl>[0]): string {
  return new URL(requireBaseUrl(envVar)).origin;
}

export type SignInIdentity = { userId?: string; organisationSbi?: string };
export type OpenOptions = SignInIdentity & { attemptSignIn?: boolean };

export class BasePage {
  constructor(protected readonly page: Page) {}

  get linkHome(): Locator {
    return this.page.getByRole('link', { name: 'Home' });
  }

  get linkAbout(): Locator {
    return this.page.getByRole('link', { name: 'About' });
  }

  user(email: string = defaultUser.email): Locator {
    return this.page.getByText(email);
  }

  get linkSignOut(): Locator {
    return this.page.getByRole('link', { name: 'Log out', exact: true });
  }

  get linkAddressBook(): Locator {
    return this.page.getByRole('link', { name: 'Address book', exact: true });
  }

  get linkDashboard(): Locator {
    return this.page.getByRole('link', { name: 'Dashboard', exact: true });
  }

  get successBanner(): Locator {
    return notificationBannerTitled(this.page, 'Success');
  }

  get importantBanner(): Locator {
    return notificationBannerTitled(this.page, 'Important');
  }

  get errorSummary(): Locator {
    return errorSummaryOn(this.page);
  }

  radiosError(legend: string | RegExp): Locator {
    return this.page.getByRole('group', { name: legend }).locator('.govuk-error-message');
  }

  get errorSummaryLinks(): Locator {
    return this.errorSummary.getByRole('link');
  }

  get pagination(): Locator {
    return this.page.getByRole('navigation', { name: 'Pagination', exact: true });
  }

  get nextPageLink(): Locator {
    return this.pagination.getByRole('link', { name: 'Next page', exact: true });
  }

  get previousPageLink(): Locator {
    return this.pagination.getByRole('link', { name: 'Previous page', exact: true });
  }

  paginationPageLink(pageNumber: number): Locator {
    return this.pagination.getByRole('link', { name: `Page ${pageNumber}`, exact: true });
  }

  get paginationItems(): Locator {
    return this.pagination.getByRole('listitem');
  }

  get currentPaginationPageLink(): Locator {
    return this.pagination.locator('[aria-current="page"]');
  }

  /** From page 1, follows Next until the target shows, waiting for each page to load; false once the last page passes without it. */
  async followNextPageUntilShown(target: Locator): Promise<boolean> {
    for (let pageNumber = 2; (await target.count()) === 0; pageNumber += 1) {
      if ((await this.nextPageLink.count()) === 0) {
        return false;
      }
      await this.nextPageLink.click();
      await this.paginationPageLink(pageNumber).and(this.currentPaginationPageLink).waitFor();
    }
    return true;
  }

  /** The error summary's link with this message: a string matches the whole message, a pattern any part of it. */
  errorSummaryLink(message: string | RegExp): Locator {
    return this.errorSummary.getByRole('link', { name: message, exact: true });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back', exact: true });
  }

  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  get statusTag(): Locator {
    return this.journeyStrip.locator('.govuk-tag');
  }

  get notificationReference(): Locator {
    return this.journeyStrip.locator('.govuk-body');
  }

  async navigateToFrontend(path: string = '/'): Promise<void> {
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    await this.page.goto(`${baseUrl}${path}`);
  }

  async navigateToAdminPortal(path: string = '/'): Promise<void> {
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL');
    await this.page.goto(`${baseUrl}${path}`);
  }

  async navigateToInsFrontend(path: string = '/'): Promise<void> {
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL');
    await this.page.goto(`${baseUrl}${path}`);
  }

  async navigateToPlantsFrontend(path: string = '/'): Promise<void> {
    const baseUrl = requireBaseUrl('TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL');
    await this.page.goto(`${baseUrl}${path}`);
  }

  protected async leaveOriginThenSignIn(origin: string, activate: () => Promise<void>): Promise<void> {
    await Promise.all([this.page.waitForURL((url) => url.origin !== origin), activate()]);
    await this.completeSignInIfRequested();
  }

  async completeSignInIfRequested(options?: SignInIdentity): Promise<void> {
    await this.signInWhenRequested(true, options);
  }

  protected async signInWhenRequested(attemptSignIn: boolean, options?: SignInIdentity): Promise<void> {
    if (!attemptSignIn) return;
    const signInPage = new SignInPage(this.page);
    if (this.isAlreadySignedIn(signInPage)) {
      this.requireDefaultIdentity(options);
      return;
    }
    await signInPage.signIn({ userId: options?.userId });
    if (await this.landedOnSignInError(signInPage)) {
      await Promise.all([
        this.page.waitForEvent('framenavigated', { predicate: (frame) => frame === this.page.mainFrame(), ...pageLoadWait }),
        this.page.getByRole('link', { name: 'try again' }).click(),
      ]);
      if (await this.landedOnSignInForm(signInPage)) {
        await signInPage.signIn({ userId: options?.userId });
      }
      if (await this.landedOnSignInError(signInPage)) {
        throw new Error(`Sign-in failed twice: "${new SignInErrorPage(this.page).headingName}" was shown again after trying again.`);
      }
    }
    await this.selectOrganisationIfPrompted(options?.organisationSbi);
  }

  private isAlreadySignedIn(signInPage: SignInPage): boolean {
    return !signInPage.expectedUrl.test(this.page.url());
  }

  private async landedOnSignInError(signInPage: SignInPage): Promise<boolean> {
    const signInError = new SignInErrorPage(this.page).heading;
    const landingHeading = this.page.getByRole('heading', { level: 1 }).filter({ hasNotText: signInPage.headingName });
    await signInError.or(landingHeading).first().waitFor(pageLoadWait);
    return signInError.isVisible();
  }

  private async landedOnSignInForm(signInPage: SignInPage): Promise<boolean> {
    const signInError = new SignInErrorPage(this.page).heading;
    const landingHeading = this.page.getByRole('heading', { level: 1 }).filter({ hasNotText: signInPage.headingName });
    await signInPage.heading.or(signInError).or(landingHeading).first().waitFor(pageLoadWait);
    return signInPage.heading.isVisible();
  }

  private requireDefaultIdentity(options?: SignInIdentity): void {
    if (options?.userId && options.userId !== defaultUser.crn) {
      throw new Error(
        `Already signed in as the default user, so cannot sign in as ${options.userId}. ` +
          'Start cold instead: browser.newContext({ storageState: COLD_START }) for one context, or test.use({ storageState: COLD_START }) for the spec.',
      );
    }
    if (options?.organisationSbi) {
      throw new Error(
        `Already signed in with the default organisation, so cannot select SBI ${options.organisationSbi}. ` +
          'Start cold instead: browser.newContext({ storageState: COLD_START }) for one context, or test.use({ storageState: COLD_START }) for the spec.',
      );
    }
  }

  private async selectOrganisationIfPrompted(organisationSbi?: string): Promise<void> {
    const organisationPicker = new OrganisationPickerPage(this.page);
    if (!organisationSbi) {
      if (await organisationPicker.heading.isVisible()) {
        throw new Error('Signed-in identity has more than one organisation but no organisationSbi was provided to select one.');
      }
      return;
    }
    await organisationPicker.heading.waitFor({ ...pageLoadWait, state: 'visible' });
    await organisationPicker.select(organisationSbi);
  }
}

export class NotificationPage extends BasePage {
  constructor(
    page: Page,
    readonly slug: string,
  ) {
    super(page);
  }

  /** The set this notification's pages belong to. */
  protected get setBase(): SetBase {
    return SET_BASES.liveAnimals;
  }

  fieldHint(fieldId: string): Locator {
    return this.page.locator(`#${fieldId}-hint`);
  }

  get cancelAmend(): Locator {
    return this.journeyStrip.getByRole('link', { name: 'Cancel amend', exact: true });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get buttonGroup(): Locator {
    return this.page.locator('.govuk-button-group');
  }

  get formButtons(): Locator {
    return this.page.locator('form').getByRole('button');
  }

  get formLinks(): Locator {
    return this.page.locator('form').getByRole('link');
  }

  get cancelAndReturnToOverview(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to overview', exact: true });
  }

  get saveAndReturnToOverview(): Locator {
    return this.page.getByRole('button', { name: 'Save and return to overview', exact: true });
  }

  expectedUrl(referenceNumber: string): string {
    const suffix = this.slug ? `/${this.slug}` : '';
    return `${this.setBase}/notifications/${referenceNumber}${suffix}`;
  }

  /** Matches the open page's address with or without a trail after it. */
  expectedUrlPattern(referenceNumber: string): RegExp {
    return urlPatternWithTrail(this.expectedUrl(referenceNumber));
  }

  /** The Back link href of this page opened at `search` in a browser context holding only the signed-in session. */
  async backHrefInFreshContext(browser: Browser, referenceNumber: string, search: string): Promise<string | null> {
    const context = await browser.newContext({ storageState: await this.page.context().storageState() });
    try {
      const freshPage = await context.newPage();
      await freshPage.goto(`${this.expectedUrl(referenceNumber)}${search}`);
      return await freshPage.getByRole('link', { name: 'Back', exact: true }).getAttribute('href');
    } finally {
      await context.close();
    }
  }

  /** Waits until the review page is the newest place on the open page's trail. */
  async expectReviewIsLastOnTrail(): Promise<void> {
    await expect.poll(() => this.placesOnTrail().at(-1)).toBe(REVIEW_SLUG);
  }

  /** The places the address of the open page says the trader came from, newest last; empty when it carries none. */
  placesOnTrail(): string[] {
    const trail = new URL(this.page.url()).searchParams.get(TRAIL_PARAMETER);
    return trail ? trail.split(',') : [];
  }

  referenceNumberFromUrl(): string {
    const match = new URL(this.page.url()).pathname.match(new RegExp(`^${this.setBase}/notifications/([^/]+)`));
    if (!match) {
      throw new Error(`No reference number in notification URL: ${this.page.url()}`);
    }
    return match[1];
  }

  currentJourneyUrl(slug: string = this.slug): string {
    const suffix = slug ? `/${slug}` : '';
    return `${this.setBase}/notifications/${this.referenceNumberFromUrl()}${suffix}`;
  }

  /** Opens a path on the service this notification's pages live on. */
  protected async navigateToService(path: string): Promise<void> {
    await this.navigateToFrontend(path);
  }

  async open(referenceNumber: string, { attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await this.navigateToService(this.expectedUrl(referenceNumber));
    await this.signInWhenRequested(attemptSignIn, identity);
  }

  /** Opens this page at its address with `places` as the trail the trader came by. */
  async openOnTrail(referenceNumber: string, places: string[]): Promise<void> {
    await this.navigateToService(`${this.expectedUrl(referenceNumber)}?${TRAIL_PARAMETER}=${places.join(',')}`);
    await this.signInWhenRequested(true, {});
  }
}
