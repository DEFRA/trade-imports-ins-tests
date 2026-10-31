# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ins/e2e/features/address-book/address-book-list.spec.ts >> Address book list >> an address added through the form is found by a search on its name, part of its address and part of its country name
- Location: tests/ins/e2e/features/address-book/address-book-list.spec.ts:207:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText('Filter addresses', { exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - link "Skip to main content" [ref=f2e2] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=f2e3]:
    - link [ref=f2e7] [cursor=pointer]:
      - /url: https://www.gov.uk/
      - img "GOV.UK" [ref=f2e8]
    - region "Service information" [ref=f2e21]:
      - generic [ref=f2e23]:
        - link "Import notification service" [ref=f2e25] [cursor=pointer]:
          - /url: /
        - navigation "Menu" [ref=f2e26]:
          - list [ref=f2e27]:
            - listitem [ref=f2e28]:
              - link "Dashboard" [ref=f2e29] [cursor=pointer]:
                - /url: /
            - listitem [ref=f2e30]:
              - link [ref=f2e31] [cursor=pointer]:
                - /url: /address-book
                - strong [ref=f2e32]: Address book
            - listitem [ref=f2e33]:
              - link "Manage account" [ref=f2e34] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=f2e35]:
              - link "Log out" [ref=f2e36] [cursor=pointer]:
                - /url: /auth/sign-out
  - generic [ref=f2e37]:
    - paragraph [ref=f2e39]:
      - strong [ref=f2e40]: Alpha
      - generic [ref=f2e41]:
        - text: This is a new service. Help us improve it and
        - link "give your feedback by email" [ref=f2e42] [cursor=pointer]:
          - /url: mailto:APHAServiceDesk@apha.gov.uk
        - text: .
    - paragraph [ref=f2e44]:
      - strong [ref=f2e45]:
        - generic [ref=f2e46]: "This page’s status:"
        - text: Exploring
        - generic [ref=f2e47]: .
      - generic [ref=f2e48]: This page is an early idea. It may change a lot or be removed.
    - main [ref=f2e49]:
      - generic [ref=f2e51]:
        - heading "Address book" [level=1] [ref=f2e52]
        - paragraph [ref=f2e53]: Manage addresses used across import and export services.
        - generic [ref=f2e54]:
          - generic [ref=f2e55]:
            - generic [ref=f2e56]: Search addresses
            - searchbox "Search addresses" [ref=f2e57]
          - button "Search" [ref=f2e58] [cursor=pointer]
        - button "Add a new address" [ref=f2e60] [cursor=pointer]
        - paragraph [ref=f2e61]: Showing 1-25 of 73
        - table [ref=f2e62]:
          - rowgroup [ref=f2e63]:
            - row [ref=f2e64]:
              - columnheader "Name" [ref=f2e65]
              - columnheader "Address" [ref=f2e66]
              - columnheader "Country" [ref=f2e67]
              - columnheader "Action" [ref=f2e68]
          - rowgroup [ref=f2e70]:
            - row [ref=f2e71]:
              - cell "Findable Farm 1793208023173" [ref=f2e72]
              - cell "1793208023173 Drover Lane, Carlisle, CA1 3CC" [ref=f2e73]
              - cell "France" [ref=f2e74]
              - cell [ref=f2e75]:
                - link "View Findable Farm 1793208023173" [ref=f2e76] [cursor=pointer]:
                  - /url: /address-book/6ae22ed7bc4425931a394a07
                  - text: View
                  - generic [ref=f2e77]: Findable Farm 1793208023173
            - row [ref=f2e78]:
              - cell "Lines 1793208017421 threeline" [ref=f2e79]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e80]
              - cell "United Kingdom" [ref=f2e81]
              - cell [ref=f2e82]:
                - link "View Lines 1793208017421 threeline" [ref=f2e83] [cursor=pointer]:
                  - /url: /address-book/6ae22ed1bc4425931a394a06
                  - text: View
                  - generic [ref=f2e84]: Lines 1793208017421 threeline
            - row [ref=f2e85]:
              - cell "Lines 1793208017421 fiveline" [ref=f2e86]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e87]
              - cell "United Kingdom" [ref=f2e88]
              - cell [ref=f2e89]:
                - link "View Lines 1793208017421 fiveline" [ref=f2e90] [cursor=pointer]:
                  - /url: /address-book/6ae22ed1bc4425931a394a05
                  - text: View
                  - generic [ref=f2e91]: Lines 1793208017421 fiveline
            - row [ref=f2e92]:
              - cell "Newest first 1793208016717 newer" [ref=f2e93]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e94]
              - cell "France" [ref=f2e95]
              - cell [ref=f2e96]:
                - link "View Newest first 1793208016717 newer" [ref=f2e97] [cursor=pointer]:
                  - /url: /address-book/6ae22ed1bc4425931a394a04
                  - text: View
                  - generic [ref=f2e98]: Newest first 1793208016717 newer
            - row [ref=f2e99]:
              - cell "Newest first 1793208016717 older" [ref=f2e100]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e101]
              - cell "United Kingdom" [ref=f2e102]
              - cell [ref=f2e103]:
                - link "View Newest first 1793208016717 older" [ref=f2e104] [cursor=pointer]:
                  - /url: /address-book/6ae22ed0bc4425931a394a03
                  - text: View
                  - generic [ref=f2e105]: Newest first 1793208016717 older
            - row [ref=f2e106]:
              - cell "Newest first 1793208010354 newer" [ref=f2e107]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e108]
              - cell "France" [ref=f2e109]
              - cell [ref=f2e110]:
                - link "View Newest first 1793208010354 newer" [ref=f2e111] [cursor=pointer]:
                  - /url: /address-book/6ae22ecabc4425931a394a02
                  - text: View
                  - generic [ref=f2e112]: Newest first 1793208010354 newer
            - row [ref=f2e113]:
              - cell "Newest first 1793208010354 older" [ref=f2e114]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e115]
              - cell "United Kingdom" [ref=f2e116]
              - cell [ref=f2e117]:
                - link "View Newest first 1793208010354 older" [ref=f2e118] [cursor=pointer]:
                  - /url: /address-book/6ae22ecabc4425931a394a01
                  - text: View
                  - generic [ref=f2e119]: Newest first 1793208010354 older
            - row [ref=f2e120]:
              - cell "Added Farm 1793208004004" [ref=f2e121]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e122]
              - cell "France" [ref=f2e123]
              - cell [ref=f2e124]:
                - link "View Added Farm 1793208004004" [ref=f2e125] [cursor=pointer]:
                  - /url: /address-book/6ae22ec4bc4425931a394a00
                  - text: View
                  - generic [ref=f2e126]: Added Farm 1793208004004
            - row [ref=f2e127]:
              - cell "Added Farm 1793207997828" [ref=f2e128]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e129]
              - cell "France" [ref=f2e130]
              - cell [ref=f2e131]:
                - link "View Added Farm 1793207997828" [ref=f2e132] [cursor=pointer]:
                  - /url: /address-book/6ae22ebebc4425931a3949ff
                  - text: View
                  - generic [ref=f2e133]: Added Farm 1793207997828
            - row [ref=f2e134]:
              - cell "Lines 1793207986131 threeline" [ref=f2e135]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e136]
              - cell "United Kingdom" [ref=f2e137]
              - cell [ref=f2e138]:
                - link "View Lines 1793207986131 threeline" [ref=f2e139] [cursor=pointer]:
                  - /url: /address-book/6ae22eb2bc4425931a3949fe
                  - text: View
                  - generic [ref=f2e140]: Lines 1793207986131 threeline
            - row [ref=f2e141]:
              - cell "Lines 1793207986131 fiveline" [ref=f2e142]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e143]
              - cell "United Kingdom" [ref=f2e144]
              - cell [ref=f2e145]:
                - link "View Lines 1793207986131 fiveline" [ref=f2e146] [cursor=pointer]:
                  - /url: /address-book/6ae22eb2bc4425931a3949fd
                  - text: View
                  - generic [ref=f2e147]: Lines 1793207986131 fiveline
            - row [ref=f2e148]:
              - cell "Hollin1793207966919" [ref=f2e149]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e150]
              - cell "United Kingdom" [ref=f2e151]
              - cell [ref=f2e152]:
                - link "View Hollin1793207966919" [ref=f2e153] [cursor=pointer]:
                  - /url: /address-book/6ae22e9ebc4425931a3949fc
                  - text: View
                  - generic [ref=f2e154]: Hollin1793207966919
            - row [ref=f2e155]:
              - cell "Green valley farm 1793207966919" [ref=f2e156]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e157]
              - cell "United Kingdom" [ref=f2e158]
              - cell [ref=f2e159]:
                - link "View Green valley farm 1793207966919" [ref=f2e160] [cursor=pointer]:
                  - /url: /address-book/6ae22e9ebc4425931a3949fb
                  - text: View
                  - generic [ref=f2e161]: Green valley farm 1793207966919
            - row [ref=f2e162]:
              - cell "county Farm 1793207955222" [ref=f2e163]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e164]
              - cell "United Kingdom" [ref=f2e165]
              - cell [ref=f2e166]:
                - link "View county Farm 1793207955222" [ref=f2e167] [cursor=pointer]:
                  - /url: /address-book/6ae22e93bc4425931a3949fa
                  - text: View
                  - generic [ref=f2e168]: county Farm 1793207955222
            - row [ref=f2e169]:
              - cell "Hollin1793207936064" [ref=f2e170]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e171]
              - cell "United Kingdom" [ref=f2e172]
              - cell [ref=f2e173]:
                - link "View Hollin1793207936064" [ref=f2e174] [cursor=pointer]:
                  - /url: /address-book/6ae22e80bc4425931a3949f9
                  - text: View
                  - generic [ref=f2e175]: Hollin1793207936064
            - row [ref=f2e176]:
              - cell "Green valley farm 1793207936064" [ref=f2e177]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e178]
              - cell "United Kingdom" [ref=f2e179]
              - cell [ref=f2e180]:
                - link "View Green valley farm 1793207936064" [ref=f2e181] [cursor=pointer]:
                  - /url: /address-book/6ae22e80bc4425931a3949f8
                  - text: View
                  - generic [ref=f2e182]: Green valley farm 1793207936064
            - row [ref=f2e183]:
              - cell "county Farm 1793207924330" [ref=f2e184]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e185]
              - cell "United Kingdom" [ref=f2e186]
              - cell [ref=f2e187]:
                - link "View county Farm 1793207924330" [ref=f2e188] [cursor=pointer]:
                  - /url: /address-book/6ae22e74bc4425931a3949f7
                  - text: View
                  - generic [ref=f2e189]: county Farm 1793207924330
            - row [ref=f2e190]:
              - cell "address line 2 Farm 1793207905179" [ref=f2e191]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e192]
              - cell "United Kingdom" [ref=f2e193]
              - cell [ref=f2e194]:
                - link "View address line 2 Farm 1793207905179" [ref=f2e195] [cursor=pointer]:
                  - /url: /address-book/6ae22e61bc4425931a3949f6
                  - text: View
                  - generic [ref=f2e196]: address line 2 Farm 1793207905179
            - row [ref=f2e197]:
              - cell "Paged Farm 1793207893369 number 4" [ref=f2e198]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e199]
              - cell "United Kingdom" [ref=f2e200]
              - cell [ref=f2e201]:
                - link "View Paged Farm 1793207893369 number 4" [ref=f2e202] [cursor=pointer]:
                  - /url: /address-book/6ae22e55bc4425931a3949f5
                  - text: View
                  - generic [ref=f2e203]: Paged Farm 1793207893369 number 4
            - row [ref=f2e204]:
              - cell "Paged Farm 1793207893369 number 3" [ref=f2e205]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e206]
              - cell "United Kingdom" [ref=f2e207]
              - cell [ref=f2e208]:
                - link "View Paged Farm 1793207893369 number 3" [ref=f2e209] [cursor=pointer]:
                  - /url: /address-book/6ae22e55bc4425931a3949f4
                  - text: View
                  - generic [ref=f2e210]: Paged Farm 1793207893369 number 3
            - row [ref=f2e211]:
              - cell "Paged Farm 1793207893369 number 7" [ref=f2e212]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e213]
              - cell "United Kingdom" [ref=f2e214]
              - cell [ref=f2e215]:
                - link "View Paged Farm 1793207893369 number 7" [ref=f2e216] [cursor=pointer]:
                  - /url: /address-book/6ae22e55bc4425931a3949f3
                  - text: View
                  - generic [ref=f2e217]: Paged Farm 1793207893369 number 7
            - row [ref=f2e218]:
              - cell "Paged Farm 1793207893369 number 6" [ref=f2e219]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e220]
              - cell "United Kingdom" [ref=f2e221]
              - cell [ref=f2e222]:
                - link "View Paged Farm 1793207893369 number 6" [ref=f2e223] [cursor=pointer]:
                  - /url: /address-book/6ae22e55bc4425931a3949f2
                  - text: View
                  - generic [ref=f2e224]: Paged Farm 1793207893369 number 6
            - row [ref=f2e225]:
              - cell "Paged Farm 1793207893369 number 8" [ref=f2e226]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e227]
              - cell "United Kingdom" [ref=f2e228]
              - cell [ref=f2e229]:
                - link "View Paged Farm 1793207893369 number 8" [ref=f2e230] [cursor=pointer]:
                  - /url: /address-book/6ae22e55bc4425931a3949f1
                  - text: View
                  - generic [ref=f2e231]: Paged Farm 1793207893369 number 8
            - row [ref=f2e232]:
              - cell "Paged Farm 1793207893369 number 5" [ref=f2e233]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e234]
              - cell "United Kingdom" [ref=f2e235]
              - cell [ref=f2e236]:
                - link "View Paged Farm 1793207893369 number 5" [ref=f2e237] [cursor=pointer]:
                  - /url: /address-book/6ae22e55bc4425931a3949f0
                  - text: View
                  - generic [ref=f2e238]: Paged Farm 1793207893369 number 5
            - row [ref=f2e239]:
              - cell "Paged Farm 1793207893369 number 0" [ref=f2e240]
              - cell "1 Trader Lane, Carlisle, CA1 3CC" [ref=f2e241]
              - cell "United Kingdom" [ref=f2e242]
              - cell [ref=f2e243]:
                - link "View Paged Farm 1793207893369 number 0" [ref=f2e244] [cursor=pointer]:
                  - /url: /address-book/6ae22e55bc4425931a3949ef
                  - text: View
                  - generic [ref=f2e245]: Paged Farm 1793207893369 number 0
        - navigation "Pagination" [ref=f2e246]:
          - list [ref=f2e247]:
            - listitem [ref=f2e248]:
              - link "Page 1" [ref=f2e249] [cursor=pointer]:
                - /url: /address-book
                - text: "1"
            - listitem [ref=f2e250]:
              - link "Page 2" [ref=f2e251] [cursor=pointer]:
                - /url: /address-book?page=2
                - text: "2"
            - listitem [ref=f2e252]:
              - link "Page 3" [ref=f2e253] [cursor=pointer]:
                - /url: /address-book?page=3
                - text: "3"
          - link "Next page" [ref=f2e255] [cursor=pointer]:
            - /url: /address-book?page=2
            - generic [ref=f2e256]:
              - text: Next
              - generic [ref=f2e257]: page
  - contentinfo [ref=f2e260]:
    - generic [ref=f2e273]:
      - generic [ref=f2e274]:
        - heading "Support links" [level=2] [ref=f2e275]
        - list [ref=f2e276]:
          - listitem [ref=f2e277]:
            - link "Privacy" [ref=f2e278] [cursor=pointer]:
              - /url: https://www.gov.uk/help/privacy-notice
          - listitem [ref=f2e279]:
            - link "Cookies" [ref=f2e280] [cursor=pointer]:
              - /url: https://www.gov.uk/help/cookies
          - listitem [ref=f2e281]:
            - link "Accessibility statement" [ref=f2e282] [cursor=pointer]:
              - /url: https://www.gov.uk/help/accessibility-statement
        - generic [ref=f2e285]:
          - text: All content is available under the
          - link "Open Government Licence v3.0" [ref=f2e286] [cursor=pointer]:
            - /url: https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
          - text: ", except where otherwise stated"
      - link "© Crown copyright" [ref=f2e288] [cursor=pointer]:
        - /url: https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/
```

# Test source

```ts
  1  | import { Locator } from '@playwright/test';
  2  | import { BasePage, type OpenOptions } from '@page-objects/shared/base-page';
  3  | 
  4  | export class InsAddressBookListPage extends BasePage {
  5  |   readonly expectedUrl = '/address-book';
  6  | 
  7  |   get heading(): Locator {
  8  |     return this.page.getByRole('heading', { level: 1, name: 'Address book' });
  9  |   }
  10 | 
  11 |   get errorSummary(): Locator {
  12 |     return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  13 |   }
  14 | 
  15 |   get intro(): Locator {
  16 |     return this.page.getByText('Manage your addresses for use across all your import notifications', { exact: true });
  17 |   }
  18 | 
  19 |   get btnAddNewAddress(): Locator {
  20 |     return this.page.getByRole('button', { name: 'Add a new address' });
  21 |   }
  22 | 
  23 |   get filterSummary(): Locator {
  24 |     return this.page.getByText('Filter addresses', { exact: true });
  25 |   }
  26 | 
  27 |   get inputSearch(): Locator {
  28 |     return this.page.getByRole('searchbox', { name: 'Search', exact: true });
  29 |   }
  30 | 
  31 |   get btnSearch(): Locator {
  32 |     return this.page.getByRole('button', { name: 'Search', exact: true });
  33 |   }
  34 | 
  35 |   get resultsLine(): Locator {
  36 |     return this.page.getByTestId('address-book-results-label');
  37 |   }
  38 | 
  39 |   get columnHeaders(): Locator {
  40 |     return this.page.getByRole('columnheader');
  41 |   }
  42 | 
  43 |   get bodyRows(): Locator {
  44 |     return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  45 |   }
  46 | 
  47 |   get mainLinks(): Locator {
  48 |     return this.page.getByRole('main').getByRole('link');
  49 |   }
  50 | 
  51 |   get successBanner(): Locator {
  52 |     return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Success' }) });
  53 |   }
  54 | 
  55 |   row(name: string): Locator {
  56 |     return this.page.getByRole('row', { name });
  57 |   }
  58 | 
  59 |   nameCell(name: string): Locator {
  60 |     return this.row(name).getByRole('cell').nth(0);
  61 |   }
  62 | 
  63 |   addressCell(name: string): Locator {
  64 |     return this.row(name).getByRole('cell').nth(1);
  65 |   }
  66 | 
  67 |   countryCell(name: string): Locator {
  68 |     return this.row(name).getByRole('cell').nth(2);
  69 |   }
  70 | 
  71 |   get viewLinks(): Locator {
  72 |     return this.mainLinks.filter({ hasText: /^View / });
  73 |   }
  74 | 
  75 |   pageLink(pageNumber: number): Locator {
  76 |     return this.page.getByRole('link', { name: `Page ${pageNumber}`, exact: true });
  77 |   }
  78 | 
  79 |   viewLink(name: string): Locator {
  80 |     return this.page.getByRole('link', { name: `View ${name}`, exact: true });
  81 |   }
  82 | 
  83 |   async search(term: string, { submitWith }: { submitWith: 'button' | 'enter' }): Promise<void> {
> 84 |     await this.filterSummary.click();
     |                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
  85 |     await this.inputSearch.fill(term);
  86 |     if (submitWith === 'enter') {
  87 |       await this.inputSearch.press('Enter');
  88 |     } else {
  89 |       await this.btnSearch.click();
  90 |     }
  91 |   }
  92 | 
  93 |   async open({ attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
  94 |     await this.page.goto(this.expectedUrl);
  95 |     await this.signInWhenRequested(attemptSignIn, identity);
  96 |   }
  97 | }
  98 | 
```