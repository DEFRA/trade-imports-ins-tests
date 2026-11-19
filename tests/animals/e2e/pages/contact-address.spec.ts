import { test, expect } from '@fixtures';
import { skipIfNonStubStackEnvironment, skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';
import { branchAddressFixture } from '@flows/shared/address-book-seed';
import { heldAsBranchAddress, heldAsConsignor } from '@domain/shared/constants/address-types';
import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { AnimalsContactAddressPage } from '@page-objects/animals/contact-address-page';
import { expectSaveControlsLayout } from '@page-objects/shared/journey-checks';

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

  test('ends with Save and continue and Save and return to hub side by side and Cancel and return to hub on its own line below them', async ({
    animalsPages,
  }) => {
    await expectSaveControlsLayout(animalsPages.contactAddress, {
      saveAndReturnLabel: 'Save and return to hub',
      cancelAndReturnLink: animalsPages.contactAddress.cancelAndReturnToHub,
    });
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

    await animalsPages.notificationView.viewHeader.expectDraftReview();
  });

  test('a contact address saved by the secondary control is still chosen on return, with the page headings still exactly the two', async ({
    animalsPages,
  }) => {
    test.slow();

    await animalsPages.contactAddress.address(branchAddressFixture.name).check();
    await animalsPages.contactAddress.saveAndReturnToHub.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Contact address for this consignment').click();
    await expect(animalsPages.contactAddress.address(branchAddressFixture.name)).toBeChecked();
    await expect(animalsPages.contactAddress.mainHeadings).toHaveText(AnimalsContactAddressPage.headings);

    await animalsPages.contactAddress.saveAndReturnToHub.click();
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

  test('Save and return to hub with nothing chosen does the same', async ({ animalsPages }) => {
    await animalsPages.contactAddress.saveAndReturnToHub.click();

    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.errorSummaryLink(SELECT_A_CONTACT_ADDRESS)).toBeVisible();
  });

  test('offers no way to add an address in stub mode', async ({ pages }) => {
    skipIfNonStubStackEnvironment('the INS add link is shown when animals-frontend runs outside stub mode (compose or CDP)');
    await expect(pages.page.getByRole('link', { name: /add.*address/i })).toHaveCount(0);
  });

  test('links to INS to add a branch address when the full stack is running, under a sentence naming it as the only way to add one', async ({
    pages,
    animalsPages,
  }) => {
    skipUnlessNonStubStackEnvironment('the handshake link is only rendered outside stub mode (compose or CDP)');

    await expect(animalsPages.contactAddress.addNewBranchAddressSentence).toHaveText(
      'If the correct address is not shown, add a new branch address, then return to this page.',
    );
    await expect(animalsPages.contactAddress.addNewBranchAddressLink).toHaveAttribute('href', /\/address-book\/add\?journey-type=gbn-ag/);
    await expect(pages.page.getByRole('link', { name: /add.*address/i })).toHaveCount(1);
  });
});

test.describe('Contact address page — branch addresses', { tag: '@address-book' }, () => {
  test("offers the organisation's branch addresses newest added first, and does not offer one held for a consignment role", async ({
    animalsJourney,
    animalsPages,
    addressBookApi,
  }) => {
    skipUnlessNonStubStackEnvironment('branch filtering and ordering need the real address book');
    const stamp = Date.now();
    const earlierBranchName = `Earlier Branch Office ${stamp}`;
    const laterBranchName = `Later Branch Office ${stamp}`;
    const consignorOnlyName = `Consignor Only Farm ${stamp}`;

    const earlierBranch = await addressBookApi.createAddress({
      ...heldAsBranchAddress,
      name: earlierBranchName,
      addressLine1: '1 Earlier Way',
      townOrCity: 'Leeds',
      postcode: 'LS1 1AA',
      countryCode: 'GB',
      phone: '0113 555 0100',
      email: 'earlier-branch@example.co.uk',
    });
    const laterBranch = await addressBookApi.createAddress({
      ...heldAsBranchAddress,
      name: laterBranchName,
      addressLine1: '2 Later Way',
      townOrCity: 'Leeds',
      postcode: 'LS1 1BB',
      countryCode: 'GB',
      phone: '0113 555 0101',
      email: 'later-branch@example.co.uk',
    });
    await addressBookApi.createAddress({
      ...heldAsConsignor,
      name: consignorOnlyName,
      addressLine1: '3 Consignor Way',
      townOrCity: 'Leeds',
      postcode: 'LS1 1CC',
      countryCode: 'GB',
      phone: '0113 555 0102',
      email: 'consignor-only@example.co.uk',
    });

    await animalsJourney.toContactAddress();
    const listedIds = await animalsPages.contactAddress.listedAddressIds();
    expect(listedIds).toContain(laterBranch.id);
    expect(listedIds).toContain(earlierBranch.id);
    expect(listedIds.indexOf(laterBranch.id)).toBeLessThan(listedIds.indexOf(earlierBranch.id));
    await expect(animalsPages.contactAddress.address(consignorOnlyName)).toHaveCount(0);

    await animalsJourney.toPartyPicker('Consignor');
    await expect(animalsPages.consignorSelection.party(consignorOnlyName)).toBeVisible();
  });

  test('a branch address deleted after being chosen is no longer offered, each save control refuses a blank save, and the notification keeps the address', async ({
    animalsSeededJourney,
    animalsPages,
    addressBookApi,
  }) => {
    skipUnlessNonStubStackEnvironment('deleting a branch address needs the real address book');
    const stamp = Date.now();
    const branchName = `Deleted Branch Office ${stamp}`;
    const branch = await addressBookApi.createAddress({
      ...heldAsBranchAddress,
      name: branchName,
      addressLine1: '4 Deleted Way',
      townOrCity: 'Leeds',
      postcode: 'LS1 1DD',
      countryCode: 'GB',
      phone: '0113 555 0103',
      email: 'deleted-branch@example.co.uk',
    });

    const referenceNumber = await animalsSeededJourney.createAmendNotification({ ...MANDATORY_ANSWERS, contactAddress: branchName });
    await addressBookApi.deleteAddress(branch.id);

    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.contactAddress);
    await expect(animalsPages.contactAddress.chosenAddress).toHaveCount(0);
    await expect(animalsPages.contactAddress.address(branchName)).toHaveCount(0);

    await animalsPages.contactAddress.saveAndContinue.click();
    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.errorSummaryLink(SELECT_A_CONTACT_ADDRESS)).toBeVisible();
    await expect(animalsPages.contactAddress.radiosError('Select an address')).toContainText(SELECT_A_CONTACT_ADDRESS);

    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.contactAddress);
    await animalsPages.contactAddress.saveAndReturnToHub.click();
    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.errorSummaryLink(SELECT_A_CONTACT_ADDRESS)).toBeVisible();
    await expect(animalsPages.contactAddress.radiosError('Select an address')).toContainText(SELECT_A_CONTACT_ADDRESS);

    await animalsPages.overview.open(referenceNumber);
    await expect(animalsPages.overview.taskStatus('Contact address for this consignment')).toHaveText('Complete');
    await animalsPages.notificationView.open(referenceNumber);
    await expect(animalsPages.notificationView.partyRow('Contact address', 'Contact address')).toContainText(branchName);
  });
});
