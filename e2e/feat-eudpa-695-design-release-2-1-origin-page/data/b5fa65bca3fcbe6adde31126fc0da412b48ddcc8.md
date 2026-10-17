# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: animals/e2e/features/reference-lists/port-of-exit-list.spec.ts >> Port of exit answer >> a port of exit chosen under transit saves its code and is shown selected when the page is reopened
- Location: tests/animals/e2e/features/reference-lists/port-of-exit-list.spec.ts:34:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Additional details', level: 1 })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Additional details', level: 1 }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Additional details', level: 1 })

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- banner:
  - link "GOV.UK":
    - /url: https://www.gov.uk/
    - img "GOV.UK"
  - region "Service information":
    - link "Import notification service":
      - /url: /live-animals
    - navigation "Menu":
      - list:
        - listitem:
          - link "Dashboard":
            - /url: /live-animals
            - strong: Dashboard
        - listitem:
          - link "Address book":
            - /url: http://localhost:3002/address-book
        - listitem:
          - link "Manage account":
            - /url: "#"
        - listitem:
          - link "Log out":
            - /url: /auth/sign-out
- paragraph:
  - strong: Alpha
  - text: This is a new service. Help us improve it and
  - link "give your feedback by email":
    - /url: mailto:APHAServiceDesk@apha.gov.uk
  - text: .
- main:
  - strong: Draft
  - text: GBN-AG-26-3QRBN1
  - heading "Overview" [level=1]
  - heading "Your commodities" [level=2]
  - paragraph: "1"
  - heading "Animals" [level=3]
  - paragraph: Total number of animals in this consignment
  - paragraph: "5"
  - heading "Packages/boxes" [level=3]
  - paragraph: Total number of packages in this consignment
  - heading "Notification tasklist" [level=2]
  - heading "1. About the consignment" [level=3]
  - list:
    - listitem:
      - link "Where is this consignment coming from?":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/origin
      - strong: Complete
    - listitem:
      - link "What are you importing?":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/commodities
      - strong: Complete
    - listitem:
      - link "Main reason for import":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/import-reason
      - strong: Complete
  - heading "2. Description of the goods" [level=3]
  - list:
    - listitem:
      - link "Commodity details":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/consignment-details
      - strong: Complete
    - listitem:
      - link "Identification details":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/commodities/identification
      - strong: Complete
    - listitem:
      - link "Additional details":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/additional-details
      - strong: To do
  - heading "3. Transport and arrival" [level=3]
  - list:
    - listitem:
      - link "Arrival details":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/port-of-entry
      - strong: To do
    - listitem:
      - link "Transport details":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/transporters
      - strong: To do
  - heading "4. Documents" [level=3]
  - list:
    - listitem:
      - link "Upload documents":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/accompanying-documents
      - strong: To do
  - heading "5. Consignment parties" [level=3]
  - list:
    - listitem:
      - link "Roles and addresses":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/addresses
      - text: Consignor or Exporter, Consignee, Importer and Place of Destination
      - strong: To do
  - heading "6. Contact address" [level=3]
  - list:
    - listitem:
      - link "Contact address for this consignment":
        - /url: /live-animals/notifications/GBN-AG-26-3QRBN1/consignment/contact/select
      - strong: To do
  - button "Review and submit"
  - button "Return to dashboard"
- contentinfo:
  - heading "Support links" [level=2]
  - list:
    - listitem:
      - link "Privacy":
        - /url: https://www.gov.uk/help/privacy-notice
    - listitem:
      - link "Cookies":
        - /url: https://www.gov.uk/help/cookies
    - listitem:
      - link "Accessibility statement":
        - /url: https://www.gov.uk/help/accessibility-statement
  - text: All content is available under the
  - link "Open Government Licence v3.0":
    - /url: https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
  - text: ", except where otherwise stated"
  - link "© Crown copyright":
    - /url: https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/
```

# Test source

```ts
  1  | import { test, expect } from '@fixtures';
  2  | import { portOfExitLabel, portsInListOrder } from '@domain/shared/fixtures/reference-data';
  3  | import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
  4  | 
  5  | test.describe('Port of exit list', { tag: ['@integration'] }, () => {
  6  |   test.beforeEach(() => {
  7  |     skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  8  |   });
  9  | 
  10 |   test('the transit port of exit list offers every port as its name and code, airports first, then seaports, then rail ports, each A to Z by name ignoring letter case', async ({
  11 |     animalsJourney,
  12 |     animalsPages,
  13 |   }) => {
  14 |     await animalsJourney.toImportReason();
  15 |     await animalsPages.importReason.reason('Transit').check();
  16 | 
  17 |     await expect(animalsPages.importReason.transitPortOfExit.locator('option').first()).toHaveText('Select port of exit');
  18 |     await expect(animalsPages.importReason.transitPortOfExitOptions).toHaveText(portsInListOrder().map(portOfExitLabel));
  19 |   });
  20 | 
  21 |   test('the temporary admission port of exit list offers the same ports, labelled and ordered the same way', async ({
  22 |     animalsJourney,
  23 |     animalsPages,
  24 |   }) => {
  25 |     await animalsJourney.toImportReason();
  26 |     await animalsPages.importReason.reason('Temporary admission horses').check();
  27 | 
  28 |     await expect(animalsPages.importReason.temporaryAdmissionPortOfExit.locator('option').first()).toHaveText('Select port of exit');
  29 |     await expect(animalsPages.importReason.temporaryAdmissionPortOfExitOptions).toHaveText(portsInListOrder().map(portOfExitLabel));
  30 |   });
  31 | });
  32 | 
  33 | test.describe('Port of exit answer', { tag: ['@integration'] }, () => {
  34 |   test('a port of exit chosen under transit saves its code and is shown selected when the page is reopened', async ({
  35 |     animalsJourney,
  36 |     animalsPages,
  37 |   }) => {
  38 |     await animalsJourney.toImportReason();
  39 |     await animalsPages.importReason.reason('Transit').check();
  40 |     const port = await animalsPages.importReason.transitPortOfExitOptions.first().getAttribute('value');
  41 |     await animalsPages.importReason.transitPortOfExit.selectOption(port);
  42 |     await animalsPages.importReason.transitDestinationCountry.selectOption('FR');
  43 |     await animalsPages.importReason.saveAndContinue.click();
  44 | 
> 45 |     await expect(animalsPages.additionalDetails.heading).toBeVisible();
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  46 |     await animalsPages.additionalDetails.saveAndContinue.click();
  47 |     await expect(animalsPages.overview.heading).toBeVisible();
  48 |     await animalsPages.overview.task('Main reason for import').click();
  49 | 
  50 |     await expect(animalsPages.importReason.transitPortOfExit).toHaveValue(port);
  51 |   });
  52 | });
  53 | 
```