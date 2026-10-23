import { Page, Locator } from '@playwright/test';
import { defaultUser } from '@config/users';
import { pageLoadWait } from '@config/timeouts';
import { SignInPage } from '@page-objects/shared/auth/sign-in-page';
import { OrganisationPickerPage } from '@page-objects/shared/auth/organisation-picker-page';
import { SET_BASES, SetBase } from '@page-objects/shared/sets';

const SIGN_IN_ERROR_HEADING = 'Sorry, we are unable to sign you in.';

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

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back', exact: true });
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
        throw new Error(`Sign-in failed twice: "${SIGN_IN_ERROR_HEADING}" was shown again after trying again.`);
      }
    }
    await this.selectOrganisationIfPrompted(options?.organisationSbi);
  }

  private isAlreadySignedIn(signInPage: SignInPage): boolean {
    return !signInPage.expectedUrl.test(this.page.url());
  }

  private async landedOnSignInError(signInPage: SignInPage): Promise<boolean> {
    const signInError = this.page.getByRole('heading', { level: 1, name: SIGN_IN_ERROR_HEADING });
    const landingHeading = this.page.getByRole('heading', { level: 1 }).filter({ hasNotText: signInPage.headingName });
    await signInError.or(landingHeading).first().waitFor(pageLoadWait);
    return signInError.isVisible();
  }

  private async landedOnSignInForm(signInPage: SignInPage): Promise<boolean> {
    const signInError = this.page.getByRole('heading', { level: 1, name: SIGN_IN_ERROR_HEADING });
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

  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  get statusTag(): Locator {
    return this.journeyStrip.locator('.govuk-tag');
  }

  get cancelAmend(): Locator {
    return this.journeyStrip.getByRole('link', { name: 'Cancel amend', exact: true });
  }

  get errorSummaryLinks(): Locator {
    return this.page.getByRole('alert').getByRole('link');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get buttonGroup(): Locator {
    return this.page.locator('.govuk-button-group');
  }

  get saveAndReturn(): Locator {
    return this.page.getByRole('button', { name: 'Save and return', exact: true });
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
}
