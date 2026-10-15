# TC mapping: kudos-live-board (41 cases)

Numbering = row order in `momorph/kudos-live-board-test-cases.csv` (TC 1 = first row). Automated unless marked.

| TC | Section | Case (short) | Spec / test title prefix |
|----|---------|--------------|--------------------------|
| 1 | ACCESSING | Open profile from avatar/name | kudos-board-access-and-layout: TC ACCESSING 1 |
| 2 | ACCESSING | Open kudo detail from View Details | access: TC ACCESSING 2 |
| 3 | ACCESSING | Unauthenticated redirect to login | access: TC ACCESSING 3 (guard, already green) |
| 4 | GUI | Banner visible, not interactive | access: TC GUI 4 |
| 5 | GUI | Compose pill visible, pill shape, pencil | access: TC GUI 5 and GUI 17 (pencil asserted as visibility of the pill only) |
| 6 | GUI | Highlight header and subtitle | access: TC GUI 6 to 9 |
| 7 | GUI | Filter buttons alignment and active state | access: TC GUI 6 to 9 (visibility; active-state visuals left to visual-contract) |
| 8 | GUI | Hashtag filter button visible | access: TC GUI 6 to 9 |
| 9 | GUI | Department filter button visible | access: TC GUI 6 to 9 |
| 10 | GUI | Carousel 5 slides, arrow states, active centre | access: TC GUI 10 |
| 11 | GUI | Highlight card fields and actions | access: TC GUI 11 |
| 12 | GUI | Spotlight search bar with icon | access: TC GUI 12 and GUI 18 |
| 13 | GUI | Spotlight total, pan/zoom, nodes | access: TC GUI 13 |
| 14 | GUI | Feed cards aligned, sidebar visible, page 1 | access: TC GUI 14 |
| 15 | GUI | Feed post card gallery and hashtags | access: TC GUI 15 |
| 16 | GUI | Sidebar statistics present | access: TC GUI 16; sidebar: TC GUI 16 / FR-310 |
| 17 | GUI | Compose placeholder text (VI) | access: TC GUI 5 and GUI 17 |
| 18 | GUI | Search placeholder text (VI) | access: TC GUI 12 and GUI 18 |
| 19 | FUNCTION | Compose input required check | sidebar-and-modal: TC FUNCTION 19 (asserts the modal instead; the A.1 input is not a form, see Note 1) |
| 20 | FUNCTION | Spotlight search 100/101/empty | spotlight: FR-311 / BR-011 (asserts no required message, see Note 2) |
| 21 | FUNCTION | Kudo submission saved | Not automated: compose submission is out of scope (A.1 opens the Coming soon modal) |
| 22 | FUNCTION | Empty feed message | feed: TC FUNCTION 22 |
| 23 | FUNCTION | Empty sidebar leaderboard | sidebar-and-modal: TC FUNCTION 23 |
| 24 | FUNCTION | Sender cannot like own kudo | like-and-hearts: TC FUNCTION 24 / BR-003 |
| 25 | FUNCTION | One like per user per kudo | like-and-hearts: TC FUNCTION 33 / BR-002 (toggle; a second click unlikes, no double like) |
| 26 | FUNCTION | Like on special day gives 2 hearts | like-and-hearts: FR-405 / BR-004 |
| 27 | FUNCTION | Open Secret Box dialog | sidebar-and-modal: TC FUNCTION 27 / FR-313 and FR-103 (Escape) |
| 28 | FUNCTION | Spotlight loading, empty, interactive | spotlight: TC FUNCTION 28 (empty and count asserted). Loading NOT asserted: no spotlight loading UI exists in the app (no loading label, no Suspense under sun-kudos); not faked with a delay. See sc-mapping SC-008 |
| 29 | FUNCTION | Hashtag dropdown lists and filters | highlight: TC FUNCTION 29 / FR-205, FR-202 |
| 30 | FUNCTION | Department dropdown lists and filters | highlight: TC FUNCTION 30 / FR-205 |
| 31 | FUNCTION | Hashtag tag on card filters the list | highlight: TC FUNCTION 31 / FR-206 |
| 32 | FUNCTION | Carousel arrows disabled at ends | highlight: TC FUNCTION 32 / FR-201 |
| 33 | FUNCTION | Heart toggles red/gray and count | like-and-hearts: TC FUNCTION 33 / BR-002 |
| 34 | FUNCTION | Copy Link writes URL and toast | feed: TC FUNCTION 34 (toast hides after ~3 s) |
| 35 | FUNCTION | View Details navigates to detail | access: TC ACCESSING 2 (same behaviour; kept once, one owner) |
| 36 | FUNCTION | Sender profile navigation | access: TC ACCESSING 1 (one owner) |
| 37 | FUNCTION | Receiver profile navigation | Not separately automated: same `kudo-person` link contract as TC 36; add with phase 6 if the receiver link diverges |
| 38 | FUNCTION | Pan/Zoom toggles drag and wheel | spotlight: TC FUNCTION 38 (`kudos-spotlight.spec.ts:33`: drag, and wheel zoom checked on canvas scale; plus node-click-after-drag) |
| 39 | FUNCTION | Node hover tooltip and click detail | spotlight: TC FUNCTION 39 / FR-305 |
| 40 | FUNCTION | Image gallery opens full size | feed: TC FUNCTION 40 / FR-305 (opens in a new tab per clarifications) |
| 41 | FUNCTION | Sidebar member profile click | sidebar-and-modal: TC FUNCTION 41 / FR-312 (hover preview out of scope per clarifications) |

Notes
1. TC 19 expects a required-field block on the compose input. The compose dialog is a separate MoMorph screen (clarifications: Send-kudo dialog out of scope), so the test asserts the Coming soon modal instead.
2. TC 20 expects a "required" message for an empty search. BR-011 and the spec say the search is optional and empty clears the highlight with no error, so the test asserts no such message. Recorded as a contradiction in the source CSV, spec wins.
3. TC 37 and TC 36 share one link contract. TC 37 is not a separate test to avoid a near-duplicate; revisit in phase 6 if the receiver link diverges.
4. Not automated, recorded: TC 21 (compose submission, out of scope) and TC 7 active-state visuals (visual-contract, not behaviour).
5. Acceptance round: TC 28 loading state has no app UI to assert (see row 28). TC 38 wheel zoom is asserted on the canvas scale (earlier note said wheel was missing; that was wrong).
