import { test, expect } from '@fixtures';
import { skipIfNonStubStackEnvironment, skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';
import { branchAddressFixture } from '@flows/shared/address-book-seed';
import { AnimalsContactAddressPage } from '@page-objects/animals/contact-address-page';

const SELECT_A_CONTACT_ADDRESS = 'Select a contact address';

test.describe('Contact address page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toContactAddress();
  });

  test('heads the page with its own title, the intro directly under it, and the choice under its own sub-heading', async ({
    animalsPages,
  }) => {
    await expect(animalsPages.contactAddress.mainHeadings).toHaveText(AnimalsContactAddressPage.headings);
    await expect(animalsPages.contactAddress.intro).toHaveText(
      'This is the contact address of the person responsible for the consignment from when it enters Great Britain until authorities complete their checks.',
    );
    await expect(animalsPages.contactAddress.resultsHeading).toBeVisible();
  });

  test('renders the page controls, hinted with the address ending at the postcode', async ({ animalsPages }) => {
    const contactAddressEndingAtPostcode = [
      branchAddressFixture.addressLine1,
      branchAddressFixture.townOrCity,
      branchAddressFixture.postcode,
    ].join(', ');

    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.address(branchAddressFixture.name)).toBeVisible();
    await expect(animalsPages.contactAddress.resultsGroup).toContainText(contactAddressEndingAtPostcode);
    await expect(animalsPages.contactAddress.saveAndContinue).toBeVisible();
  });

  test('leaves the contact address unchecked on load', async ({ animalsPages }) => {
    await expect(animalsPages.contactAddress.address(branchAddressFixture.name)).not.toBeChecked();
  });

  test('accepts a valid contact address and goes on to check your answers', async ({ animalsPages }) => {
    await animalsPages.contactAddress.address(branchAddressFixture.name).check();
    await animalsPages.contactAddress.saveAndContinue.click();

    await expect(animalsPages.notificationView.heading).toBeVisible();
  });

  test('a contact address saved by the secondary control is still chosen on return, with the page headings still exactly the two', async ({
    animalsPages,
  }) => {
    test.slow();

    await animalsPages.contactAddress.address(branchAddressFixture.name).check();
    await animalsPages.contactAddress.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Contact address for this consignment').click();
    await expect(animalsPages.contactAddress.address(branchAddressFixture.name)).toBeChecked();
    await expect(animalsPages.contactAddress.mainHeadings).toHaveText(AnimalsContactAddressPage.headings);

    await animalsPages.contactAddress.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('Contact address for this consignment').click();
    await expect(animalsPages.contactAddress.address(branchAddressFixture.name)).toBeChecked();
  });

  test('Save and continue with nothing chosen keeps the trader on the page, naming the choice in the error summary and against the options', async ({
    animalsPages,
  }) => {
    await animalsPages.contactAddress.saveAndContinue.click();

    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.errorSummaryLink(SELECT_A_CONTACT_ADDRESS)).toBeVisible();
    await expect(animalsPages.contactAddress.radiosError('Select an address')).toContainText(SELECT_A_CONTACT_ADDRESS);

    await animalsPages.overview.open(animalsPages.contactAddress.referenceNumberFromUrl());
    await expect(animalsPages.overview.taskStatus('Contact address for this consignment')).toHaveText('To do');
  });

  test('Save and return to overview with nothing chosen does the same', async ({ animalsPages }) => {
    await animalsPages.contactAddress.saveAndReturnToOverview.click();

    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.errorSummaryLink(SELECT_A_CONTACT_ADDRESS)).toBeVisible();
  });

  test('offers no way to add an address in stub mode', async ({ pages }) => {
    skipIfNonStubStackEnvironment('the INS add link is shown when animals-frontend runs outside stub mode (compose or CDP)');
    await expect(pages.page.getByRole('link', { name: /add.*address/i })).toHaveCount(0);
  });

  test('links to INS to add an address when the full stack is running', async ({ pages }) => {
    skipUnlessNonStubStackEnvironment('the handshake link is only rendered outside stub mode (compose or CDP)');
    await expect(pages.page.getByRole('link', { name: /add.*address/i })).toHaveAttribute(
      'href',
      /\/address-book\/add\?journey-type=gbn-ag/,
    );
  });
});
