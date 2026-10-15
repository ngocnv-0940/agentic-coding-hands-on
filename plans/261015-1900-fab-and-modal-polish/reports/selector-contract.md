# Selector contract: FAB quick actions + Write Kudo polish

Read-only for the UI implementer. Locators: `e2e/support/fab-locators.ts`.

| testid | Element | Required behaviour |
|---|---|---|
| `widget-button` (exists) | the FAB | click toggles `fab-menu`; `getByTestId` must resolve to ONE element; receives focus when the menu or the modal closes |
| `fab-menu` | quick-action group root | rendered/visible only while open; absent or hidden when closed (tests use toBeHidden) |
| `fab-menu-rules` | "Thể lệ" | text contains `Thể lệ`; click opens existing `coming-soon-modal` |
| `fab-menu-write-kudo` | "Viết KUDOS" | text contains `Viết KUDOS`; on /sun-kudos opens `write-kudo-modal`, elsewhere `router.push('/sun-kudos?compose=1')`; board opens the modal once, then `router.replace` drops `compose`; no modal for a viewer without a sunner |
| `fab-menu-close` | red round "×" | closes the group, focus to `widget-button` |
| `write-kudo-scroll-area` | the ONLY scrolling region inside `write-kudo-modal` | `overflow-y: auto`, `overscroll-behavior-y: contain`; `write-kudo-heading`, `write-kudo-cancel`, `write-kudo-submit` stay outside it (always in viewport and inside the card) |
| `write-kudo-backdrop` (exists) | the mask | pointerdown+click on the mask itself closes + discards the draft; a press starting in the card does not close; ignored while submitting |

Also: while the modal is open `html` or `body` computed `overflow` is `hidden` (scroll lock, no chaining to the page). Esc and outside click close the FAB group. The compose pill gating is unchanged.
