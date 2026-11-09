# Animals test flows and page objects

Why the animals flows and page objects are written the way they are. The code carries no comments, so the reasons live here. Sections without a file name are steps of `flows/animals/journey.ts`.

## Starting a notification

- `startNotification` answers origin and then opens the overview.
- `startNotificationAtOrigin` leaves origin unanswered. The entry guard is satisfied by the opening-run marker set when the notification is created, not by answering origin.
- `toOriginOfImport` shows origin unanswered, as a brand-new notification first shows it.
- `startNotification` waits for the origin page to leave before it opens the overview. Opening the overview regardless hides a failed save: the run then fails several steps later on a task stuck at "Not yet started", pointing at the wrong page.

## Reaching a page unfilled

- The `to*` steps land on a page without filling it, so a per-page spec can drive it.

## Dates

- `ARRIVAL_DATE` (in `domain/animals/constants/journey-options.ts`) falls inside the arrival-date window (one week back to six months ahead) wherever the wall clock is, written in the unpadded d/m/yyyy the application renders. A check-your-answers assertion then compares against the application's shape, not the typed string it echoes back.
- `TEMPORARY_ADMISSION_EXIT_DATE` falls after the arrival date, in the same format.

## Documents

- `uploadDocumentAndWaitForScan` waits for the virus scan to finish so the submission carries the document.
- `answerAccompanyingDocument` adds the answers' accompanying document using that wait, and does nothing when the answers carry none.

## Answer sets

- `submitNotification` gives only the answers the frontend requires (`MANDATORY_ANSWERS`), unless the caller passes a fuller set such as `ALL_ANSWERS`.
- The import reason's purpose is a conditional reveal under the reason, so both answers go in on one submit.

## Transport

- `reachTransporterFromHub` goes back to the transporter list from the hub within a journey that is already unlocked. The page saves through unfilled. Arrival details are filled on the way because the default means, Road, keeps transited countries in scope, and transit countries are answered next.
- `chooseTransporterType` adds a transporter of the given type from the transporter list.
- `toCommercialTransporter` follows the add route's commercial arm: the list first, then the transporter type question, then the form for a commercial transporter that is not on the list.
- `fillAndSavePrivateTransporterAddForm` fills the open private transporter form with the details given and saves it, waiting for the transporter list the save lands back on with the new transporter first and chosen.
- `fillAndSaveCommercialTransporterAddFormToOverview` fills and saves the open commercial transporter form, then saves the transporter list it lands on, reaching the overview — the one path specs that only need the overview, not the list's own state, take through the save.

## The overview task list

- `OPENING_RUN_TASKS` is the overview's task rows for a consignment that identifies an animal and travels by air or sea, in the order the overview lists them.
- `OPENING_RUN_TASKS_OVERLAND_WITHOUT_IDENTIFICATION` is the overview's task rows for an overland consignment whose commodity carries no identifiers, in the order the overview lists them. It is stated outright rather than derived from `OPENING_RUN_TASKS`, because the order is what the assertion that reads it exists to prove.

## Opening-run walks

- `walkOpeningRunToImportReason` carries a fresh notification from creation to the main import reason page, leaving the caller on that page with a chosen species and no reason answered. Every `walkOpeningRun*` walk starts this way before it diverges on its own reason and species, and a spec that only needs to be mid-run at the main import reason page — rather than the fuller walk one of the named consignments gives it — calls this one directly instead of taking on a whole consignment's worth of unrelated answers.
- `walkOpeningRunPoultryByRail` runs the whole opening sequence for a rail consignment in transit. It waits for the additional-details heading straight after saving commodity details, not an identification heading, because the chosen commodity carries no identifiers and the run skips that step. It ends on the review rather than submitting, because the MDM stub serves no species page for this commodity and Continue from the review is refused.

## Addresses

- `addCphAndLeaveAddresses` runs from the addresses page: it answers the CPH number and then leaves the page.

## Notification view

### Cancelling an amendment (`flows/animals/notification-actions.ts`)

- `cancelAmend` waits on `?cancelled=1` rather than the view's heading, because the error page has the same heading.

### Party rows (`page-objects/animals/notification-view-page.ts`)

- `partyRow` selects the summary-list row whose accessible term is the role directly, rather than climbing to it, so no XPath parent-axis hop is needed.
- `editPartyDetails` is the row's own link to edit the address copied onto the notification. The card keeps the one Change link that re-picks from the address book.
- `partyError` reads the first definition of the row. A summary list has no error state of its own, so an outstanding role carries its message in the row's value cell, ahead of the actions cell.

## Choosing species (`page-objects/animals/commodity-selection-page.ts`)

- `searchAndCheckSpecies` searches for each species before ticking it, because a species has no tick box until its own search lists it, and ticks it inside the group for the species' own commodity code.

## The transit port of exit (`page-objects/animals/import-reason-page.ts`)

- `selectTransitPortOfExit` chooses the transit port of exit by its code, beside the by-position `selectTransitPortOfExitByIndex` that remains for a spec that only needs any port, so an assertion naming a particular port does not depend on the port list's order.
