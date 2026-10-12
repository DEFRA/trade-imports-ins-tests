import type { Page } from '@playwright/test';

import { requireBaseUrl } from '@page-objects/shared/base-page';
import type { AnimalsPages, InsPages } from '@page-objects';

import { test, expect } from '@fixtures';

const LIVE_ANIMALS = 'Live animals';
const ROLES_AND_ADDRESSES = 'Roles and addresses';
const CONTACT_TASK = 'Contact address for this consignment';
const ADDRESSES_CARD = 'Addresses';
const CONTACT_CARD = 'Contact address';
const CARD_KEYS = ['Commodity', 'Origin', 'Consignee', 'Consignor'];
const NOT_APPLICABLE = 'Not applicable';

test.describe('Template card answers and parties', { tag: '@integration' }, () => {
  /** Presses Create new template on Manage templates and signs in again on the INS type question when asked. */
  const createNewTemplate = async (page: Page, insPages: InsPages, animalsPages: AnimalsPages): Promise<void> => {
    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    await Promise.all([page.waitForURL((url) => url.origin !== animalsOrigin), animalsPages.manageTemplates.btnCreateNewTemplate.click()]);
    await insPages.notificationType.completeSignInIfRequested();
  };

  /** Starts a live animals template named `name`, answers Origin and the species, and lands on its task list. */
  const startTemplate = async (insPages: InsPages, animalsPages: AnimalsPages, name: string): Promise<void> => {
    const { templateName, originOfImport, commoditySelection, overview } = animalsPages;
    await insPages.notificationType.option(LIVE_ANIMALS).check();
    await insPages.notificationType.continueToService();
    await templateName.inputName.fill(name);
    await templateName.btnSaveAndContinue.click();
    await expect(originOfImport.heading).toBeVisible();
    await originOfImport.selectCountry('France');
    await originOfImport.radioRequiresOriginCode('No').check();
    await originOfImport.saveAndContinue.click();
    await expect(commoditySelection.heading).toBeVisible();
    await commoditySelection.selectSpecies(['Bos taurus']);
    await commoditySelection.saveAndContinue.click();
    await expect(overview.heading).toBeVisible();
  };

  /** Saves the template from its task list: Review template, Save template, Manage templates. */
  const saveFromTaskList = async (animalsPages: AnimalsPages): Promise<void> => {
    const { overview, notificationView, manageTemplates } = animalsPages;
    await overview.btnReviewTemplate.click();
    await expect(notificationView.templateHeading).toBeVisible();
    await notificationView.btnSaveTemplate.click();
    await expect(manageTemplates.heading).toBeVisible();
  };

  test.beforeEach(async ({ animalsPages, pages, insPages }) => {
    test.slow();
    await animalsPages.manageTemplates.open();
    await createNewTemplate(pages.page, insPages, animalsPages);
  });

  test("a template's card, page and the notification started from it carry each party and the contact address", async ({
    insPages,
    animalsPages,
    addressBookApi,
  }) => {
    const { addresses, overview, contactAddress, manageTemplates, templatePage, notificationView } = animalsPages;
    const stamp = crypto.randomUUID();
    const address = (role: string, countryCode: string) => ({
      name: `${role} ${stamp}`,
      addressLine1: `${role} Lane`,
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
      countryCode,
      phone: '01228 555 0100',
      email: 'party@example.co.uk',
    });
    const origin = address('Origin', 'FR');
    const consignor = address('Consignor', 'FR');
    const consignee = address('Consignee', 'GB');
    const importer = address('Importer', 'GB');
    const destination = address('Destination', 'GB');
    const contact = address('Contact', 'GB');
    for (const record of [origin, consignor, consignee, importer, destination, contact]) {
      await addressBookApi.createAddress(record);
    }
    const name = `Parties ${crypto.randomUUID()}`;
    await startTemplate(insPages, animalsPages, name);

    await overview.task(ROLES_AND_ADDRESSES).click();
    const picks = [
      ['Place of origin', animalsPages.placeOfOriginSelection, origin.name],
      ['Consignor or exporter', animalsPages.consignorSelection, consignor.name],
      ['Consignee', animalsPages.consigneeSelection, consignee.name],
      ['Importer', animalsPages.importerSelection, importer.name],
      ['Place of destination', animalsPages.destinationSelection, destination.name],
    ] as const;
    for (const [role, picker, partyName] of picks) {
      await addresses.addParty(role).click();
      await picker.select(partyName);
      await picker.saveAndContinue.click();
      await expect(addresses.heading).toBeVisible();
    }
    await addresses.btnSaveAndReturn.click();
    await expect(overview.heading).toBeVisible();
    await overview.task(CONTACT_TASK).click();
    await contactAddress.address(contact.name).check();
    await contactAddress.btnSaveAndReturn.click();
    await expect(overview.heading).toBeVisible();
    await saveFromTaskList(animalsPages);

    await expect(manageTemplates.cardCategory(name)).toHaveText(LIVE_ANIMALS);
    await expect(manageTemplates.cardAnswerKeys(name)).toHaveText(CARD_KEYS);
    await expect(manageTemplates.cardAnswer(name, 'Commodity')).toHaveText('Cow');
    await expect(manageTemplates.cardAnswer(name, 'Origin')).toHaveText('France');
    await expect(manageTemplates.cardAnswer(name, 'Consignee')).toHaveText(consignee.name);
    await expect(manageTemplates.cardAnswer(name, 'Consignor')).toHaveText(consignor.name);

    await manageTemplates.linkViewTemplate(name).click();
    await expect(templatePage.heading(name)).toBeVisible();
    await expect(templatePage.rowValue(ADDRESSES_CARD, 'Place of origin')).toContainText(origin.name);
    await expect(templatePage.rowValue(ADDRESSES_CARD, 'Place of origin')).toContainText(origin.addressLine1);
    await expect(templatePage.rowValue(ADDRESSES_CARD, 'Consignor')).toContainText(consignor.name);
    await expect(templatePage.rowValue(ADDRESSES_CARD, 'Consignee')).toContainText(consignee.name);
    await expect(templatePage.rowValue(ADDRESSES_CARD, 'Importer')).toContainText(importer.name);
    await expect(templatePage.rowValue(ADDRESSES_CARD, 'Place of destination')).toContainText(destination.name);
    await expect(templatePage.rowValue(CONTACT_CARD, 'Contact address')).toContainText(contact.name);

    await manageTemplates.open();
    await manageTemplates.btnUseTemplate(name).click();
    await expect(overview.heading).toBeVisible();
    await overview.reviewAndSubmitButton.click();
    await expect(notificationView.heading).toBeVisible();
    await expect(notificationView.partyRow(ADDRESSES_CARD, 'Place of origin')).toContainText(origin.name);
    await expect(notificationView.partyRow(ADDRESSES_CARD, 'Consignor')).toContainText(consignor.name);
    await expect(notificationView.partyRow(ADDRESSES_CARD, 'Consignee')).toContainText(consignee.name);
    await expect(notificationView.partyRow(ADDRESSES_CARD, 'Importer')).toContainText(importer.name);
    await expect(notificationView.partyRow(ADDRESSES_CARD, 'Place of destination')).toContainText(destination.name);
    await expect(notificationView.partyRow(CONTACT_CARD, 'Contact address')).toContainText(contact.name);
  });

  test("with no contact address chosen, the template's page and the notification started from it use the place of origin", async ({
    insPages,
    animalsPages,
    addressBookApi,
  }) => {
    const { addresses, overview, manageTemplates, templatePage, notificationView } = animalsPages;
    const origin = {
      name: `Origin only ${crypto.randomUUID()}`,
      addressLine1: 'Origin Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
      countryCode: 'FR',
      phone: '01228 555 0100',
      email: 'origin@example.co.uk',
    };
    await addressBookApi.createAddress(origin);
    const name = `Parties ${crypto.randomUUID()}`;
    await startTemplate(insPages, animalsPages, name);

    await overview.task(ROLES_AND_ADDRESSES).click();
    await addresses.addParty('Place of origin').click();
    await animalsPages.placeOfOriginSelection.select(origin.name);
    await animalsPages.placeOfOriginSelection.saveAndContinue.click();
    await expect(addresses.heading).toBeVisible();
    await addresses.btnSaveAndReturn.click();
    await expect(overview.heading).toBeVisible();
    await saveFromTaskList(animalsPages);

    await expect(manageTemplates.cardAnswerKeys(name)).toHaveText(CARD_KEYS);
    await expect(manageTemplates.cardAnswer(name, 'Commodity')).toHaveText('Cow');
    await expect(manageTemplates.cardAnswer(name, 'Origin')).toHaveText('France');
    await expect(manageTemplates.cardAnswer(name, 'Consignee')).toHaveText(NOT_APPLICABLE);
    await expect(manageTemplates.cardAnswer(name, 'Consignor')).toHaveText(NOT_APPLICABLE);

    await manageTemplates.linkViewTemplate(name).click();
    await expect(templatePage.heading(name)).toBeVisible();
    await expect(templatePage.rowValue(CONTACT_CARD, 'Contact address')).toContainText(origin.name);
    await expect(templatePage.rowValue(ADDRESSES_CARD, 'Consignor')).toContainText(NOT_APPLICABLE);

    await manageTemplates.open();
    await manageTemplates.btnUseTemplate(name).click();
    await expect(overview.heading).toBeVisible();
    await overview.reviewAndSubmitButton.click();
    await expect(notificationView.heading).toBeVisible();
    await expect(notificationView.partyRow(CONTACT_CARD, 'Contact address')).toContainText(origin.name);
  });
});
