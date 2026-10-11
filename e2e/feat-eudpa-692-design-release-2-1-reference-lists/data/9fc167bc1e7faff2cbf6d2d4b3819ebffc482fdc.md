# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plants/e2e/features/review.spec.ts >> High-risk plants check and submit section >> declaration is required and submission produces a read-only notification and Submitted dashboard card
- Location: tests/plants/e2e/features/review.spec.ts:159:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('main')
Timeout: 5000ms
Expected pattern: /Date of notification[^0-9]{0,20}(10 October 2026|11 October 2026)/
Received string:  "····························
  Submitted··
          GBN-HRP-26-SHJ6QD··················
    Notification submitted······
    Your notification referenceGBN-HRP-26-SHJ6QD·····
  Your notification has been submitted. Keep the reference for your records.
  Date of notification: 9 October 2026
  View your notification
  Return to dashboard········
        "

Call log:
  - Expect "toContainText" getByRole('main') with timeout 5000ms
  - waiting for getByRole('main')
    14 × locator resolved to <main id="main-content" class="govuk-main-wrapper">…</main>
       - unexpected value "
  
    
        
          
  Submitted


          GBN-HRP-26-SHJ6QD
        
  
  
  
    Notification submitted
  
  
    Your notification referenceGBN-HRP-26-SHJ6QD
  


  Your notification has been submitted. Keep the reference for your records.
  Date of notification: 9 October 2026
  View your notification
  Return to dashboard
    
  
        "

```

```yaml
- main:
  - strong: Submitted
  - text: GBN-HRP-26-SHJ6QD
  - heading "Notification submitted" [level=1]
  - text: Your notification reference
  - strong: GBN-HRP-26-SHJ6QD
  - paragraph: Your notification has been submitted. Keep the reference for your records.
  - paragraph: "Date of notification: 9 October 2026"
  - paragraph:
    - link "View your notification":
      - /url: /high-risk-plants/notifications/GBN-HRP-26-SHJ6QD/notification-view
  - paragraph:
    - link "Return to dashboard":
      - /url: /high-risk-plants
```

# Test source

```ts
  79  |   return { reference, address };
  80  | }
  81  | 
  82  | async function openReview(plantsPages: PlantsPages) {
  83  |   await plantsPages.overview.taskRowLink('Check and submit').click();
  84  |   await expect(plantsPages.notificationView.heading).toBeVisible();
  85  | }
  86  | 
  87  | async function submit(plantsPages: PlantsPages) {
  88  |   await plantsPages.notificationView.btnContinue.click();
  89  |   await plantsPages.declaration.checkbox.check();
  90  |   await plantsPages.declaration.btnContinue.click();
  91  |   await expect(plantsPages.confirmation.heading).toBeVisible();
  92  | }
  93  | 
  94  | async function assertReadOnly(plantsPages: PlantsPages) {
  95  |   await expect(plantsPages.notificationView.heading).toBeVisible();
  96  |   await expect(plantsPages.overview.statusTag).toHaveText('Submitted');
  97  |   await expect(plantsPages.notificationView.changeLinks).toHaveCount(0);
  98  |   await expect(plantsPages.notificationView.btnContinue).toHaveCount(0);
  99  | }
  100 | 
  101 | async function amend(pages: SharedPages, plantsPages: PlantsPages, reference: string) {
  102 |   await plantsPages.dashboard.open();
  103 |   await plantsPages.dashboard.searchForReference(reference);
  104 |   await plantsPages.dashboard
  105 |     .notificationCard(reference)
  106 |     .getByRole('button', { name: `Amend notification ${reference}`, exact: true })
  107 |     .click();
  108 |   await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
  109 |   await expect(plantsPages.overview.statusTag).toHaveText('Amending');
  110 | }
  111 | 
  112 | test.describe('High-risk plants check and submit section', { tag: '@integration' }, () => {
  113 |   test('review stays blocked until the final required row is complete', async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
  114 |     const { reference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi, { contact: false });
  115 |     const review = plantsPages.overview.taskRowByTitle('Check and submit');
  116 |     await expect(review).toContainText('Cannot start yet');
  117 |     await expect(review.getByRole('link')).toHaveCount(0);
  118 |     await plantsPages.consignmentContactSelect.open(reference);
  119 |     await plantsPages.consignmentContactSelect.searchFor(address.name);
  120 |     await plantsPages.consignmentContactSelect.address(address.name).check();
  121 |     await plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
  122 |     await openReview(plantsPages);
  123 |   });
  124 | 
  125 |   test('CYA renders numbered sections, scoped cards and contact details, and Change returns to saved answers', async ({
  126 |     pages,
  127 |     plantsPages,
  128 |     plantsJourney,
  129 |     addressBookApi,
  130 |   }) => {
  131 |     const { address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
  132 |     await openReview(plantsPages);
  133 |     await expect(pages.page.getByRole('heading', { level: 2, name: /^[1-3]\. / })).toHaveText([
  134 |       '1. About the consignment',
  135 |       '2. Arrival and destination',
  136 |       '3. Consignment parties',
  137 |     ]);
  138 |     await expect(plantsPages.notificationView.card('Consignor or exporter')).toHaveCount(0);
  139 |     const contact = plantsPages.notificationView.card('Contact');
  140 |     await expect(contact).toContainText(address.name);
  141 |     await expect(contact).toContainText('4 Nursery Lane, Perth, PH1 5EX');
  142 |     await expect(contact).toContainText('01738 555 0143');
  143 |     await expect(contact).toContainText('review@example.co.uk');
  144 |     await plantsPages.notificationView.change('Change country of origin (Import details)').click();
  145 |     await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
  146 |     await plantsPages.origin.selectCountry('Germany');
  147 |     await plantsPages.origin.btnSaveAndContinue.click();
  148 |     await expect(plantsPages.notificationView.heading).toBeVisible();
  149 |     await expect(plantsPages.notificationView.card('Import details')).toContainText('Germany');
  150 |     await plantsPages.notificationView.change('Change Commodity 1 (Commodity 1)').click();
  151 |     await plantsPages.commodityDetails.field('Quantity').fill('300');
  152 |     await plantsPages.commodityDetails.btnSaveAndContinue.click();
  153 |     await plantsPages.commodities.btnSaveAndContinue.click();
  154 |     await expect(plantsPages.notificationView.heading).toBeVisible();
  155 |     await pages.page.reload();
  156 |     await expect(plantsPages.notificationView.card('Commodity 1')).toContainText('300');
  157 |   });
  158 | 
  159 |   test('declaration is required and submission produces a read-only notification and Submitted dashboard card', async ({
  160 |     pages,
  161 |     plantsPages,
  162 |     plantsJourney,
  163 |     addressBookApi,
  164 |   }) => {
  165 |     const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
  166 |     await openReview(plantsPages);
  167 |     await plantsPages.notificationView.btnContinue.click();
  168 |     await expect(pages.page).toHaveURL(plantsPages.declaration.expectedUrl(reference));
  169 |     await plantsPages.declaration.btnContinue.click();
  170 |     await expect(plantsPages.declaration.errorSummary).toContainText('Confirm that the information is true and correct before submitting');
  171 |     await expect(pages.page).toHaveURL(plantsPages.declaration.expectedUrl(reference));
  172 |     await plantsPages.declaration.linkBack.click();
  173 |     await expect(plantsPages.notificationView.heading).toBeVisible();
  174 |     await submit(plantsPages);
  175 |     await expect(pages.page).toHaveURL(plantsPages.confirmation.expectedUrl(reference));
  176 |     await expect(plantsPages.confirmation.panel).toContainText(reference);
  177 |     await expect(plantsPages.overview.statusTag).toHaveText('Submitted');
  178 |     await expect(plantsPages.confirmation.notificationDate).toBeVisible();
> 179 |     await expect(plantsPages.confirmation.content).toContainText(
      |                                                    ^ Error: expect(locator).toContainText(expected) failed
  180 |       new RegExp(`Date of notification[^0-9]{0,20}(${getRelativeServiceDisplayDate()}|${getRelativeServiceDisplayDate(1)})`),
  181 |     );
  182 |     await expect(plantsPages.confirmation.lateBanner).toHaveCount(0);
  183 |     await plantsPages.confirmation.viewNotification.click();
  184 |     await assertReadOnly(plantsPages);
  185 |     await expect(plantsPages.notificationView.lateBanner).toHaveCount(0);
  186 |     await plantsPages.dashboard.open();
  187 |     await plantsPages.dashboard.searchForReference(reference);
  188 |     await expect(plantsPages.dashboard.notificationCard(reference).getByText('Submitted', { exact: true })).toBeVisible();
  189 |   });
  190 | 
  191 |   for (const { type, days, rule } of [
  192 |     { type: POTATOES, days: 0, rule: 'Notifications for potatoes must be made at least 2 days before the expected date of arrival.' },
  193 |     {
  194 |       type: PLANTS,
  195 |       days: -7,
  196 |       rule: 'Notifications for plants for planting and wood must be made no later than 4 days after the date of arrival.',
  197 |     },
  198 |   ]) {
  199 |     test(`${type}: late notifications are accepted and highlighted`, async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
  200 |       const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi, { type, days });
  201 |       await openReview(plantsPages);
  202 |       // govukWarningText always prepends a visually-hidden "Warning" fallback inside
  203 |       // the same <strong>, so an exact match can never pass here — pin the message
  204 |       // as a substring instead (unpassable-assertion exception: the accessible-tree
  205 |       // snapshot shows `strong: Warning If you submit...`, the app renders the
  206 |       // correct message, and no other spec in this repo asserts govukWarningText by exact text).
  207 |       await expect(
  208 |         pages.page.getByText(`If you submit this notification today it will be late. ${rule} You can still submit it.`, { exact: false }),
  209 |       ).toBeVisible();
  210 |       await submit(plantsPages);
  211 |       await expect(plantsPages.confirmation.panel).toContainText(reference);
  212 |       await expect(plantsPages.confirmation.lateBanner).toBeVisible();
  213 |       await expect(pages.page.getByText(rule, { exact: false })).toBeVisible();
  214 |       await plantsPages.confirmation.viewNotification.click();
  215 |       await assertReadOnly(plantsPages);
  216 |       await expect(plantsPages.notificationView.lateBanner).toBeVisible();
  217 |       await plantsPages.dashboard.open();
  218 |       await plantsPages.dashboard.searchForReference(reference);
  219 |       await expect(plantsPages.dashboard.notificationCard(reference).getByText('Submitted', { exact: true })).toBeVisible();
  220 |       // No dashboard Late tag assertion: ruled c-030/c-035 parks projecting
  221 |       // lateNotificationIndicator onto the backend NotificationDto ("the mapper
  222 |       // has no typed home for it ... explicit omission assertion on the
  223 |       // NotificationDto" — plants-frontend rulings.json panel/rulings.json). The
  224 |       // stub persistence layer already carries the row field correctly (proven
  225 |       // directly against the stub), but this stack runs the real
  226 |       // trade-imports-plants-backend, which has no such field yet (confirmed:
  227 |       // no lateNotificationIndicator anywhere under plants-backend/src/main) — so
  228 |       // the tag cannot render here until that residual-parked mapping is built.
  229 |     });
  230 |   }
  231 | 
  232 |   test('a saved French origin becomes invalid when a ware-potato line is added and prevents submission', async ({
  233 |     pages,
  234 |     plantsPages,
  235 |     plantsJourney,
  236 |     addressBookApi,
  237 |   }) => {
  238 |     const { reference } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
  239 |     await plantsPages.commodities.open(reference);
  240 |     await plantsJourney.addAnotherCommodityLine('Ware potatoes', { ...potatoLine, 'Intended use': 'Consumption' });
  241 |     await plantsPages.notificationView.open(reference);
  242 |     await expect(plantsPages.notificationView.card('Import details')).toContainText('France');
  243 |     await plantsPages.notificationView.btnContinue.click();
  244 |     await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
  245 |     const correction = plantsPages.notificationView.errorSummary.getByRole('link', { name: /Poland/ });
  246 |     await expect(correction).toHaveAttribute('href', `${SET_BASES.highRiskPlants}/notifications/${reference}/origin?change=1`);
  247 |     await expect(plantsPages.overview.statusTag).toHaveText('Draft');
  248 |     await correction.click();
  249 |     await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
  250 |   });
  251 | 
  252 |   test('a deleted destination renders Not provided on CYA and blocks submission', async ({
  253 |     pages,
  254 |     plantsPages,
  255 |     plantsJourney,
  256 |     addressBookApi,
  257 |   }) => {
  258 |     const { reference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
  259 |     await openReview(plantsPages);
  260 |     await addressBookApi.deleteAddress(address.id);
  261 |     await pages.page.reload();
  262 |     const destination = plantsPages.notificationView.card('Place of destination');
  263 |     await expect(destination.getByText('Not provided', { exact: true })).toHaveCount(4);
  264 |     await expect(destination).not.toContainText(address.name);
  265 |     await plantsPages.notificationView.btnContinue.click();
  266 |     await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
  267 |     await expect(plantsPages.notificationView.errorSummary).toContainText('Select an address for the place of destination');
  268 |   });
  269 | 
  270 |   test('editing a linked address in the address book changes what the notification shows', async ({
  271 |     pages,
  272 |     plantsPages,
  273 |     plantsJourney,
  274 |     addressBookApi,
  275 |   }) => {
  276 |     const { reference, address } = await completeNotification(pages, plantsPages, plantsJourney, addressBookApi);
  277 |     const originalName = address.name;
  278 |     const renamed = `Renamed Holding ${randomUUID()}`;
  279 | 
```