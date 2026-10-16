# SC mapping — Viết Kudo (F007), phase 6 final

Source: `docs/features/F007_WriteKudo/technical-spec.md` § 5.1 (SC-001..SC-007). Each row names the layer that proves it and the final run.
Runs: W = `bun run test:e2e e2e/write-kudo-`, K = `bun run test:e2e e2e/kudos-`, D = `bun run test:e2e`, pgTAP = `supabase test db`, smoke = `evidence/real-stack-smoke.md`, visual = `evidence/visual-mismatch-list.md`.

| SC | Behaviour (short) | Proof | Final result |
|----|-------------------|-------|--------------|
| SC-001 | Pill opens the modal with six fields in order; Hủy and Esc close, backdrop click does nothing, focus returns to the pill; the other two pills still open Coming soon | E2E: `write-kudo-modal-access-and-layout.spec.ts` (ID-0..6, ID-45, FR-103..105, FR-224, FR-225, FR-226, FR-227); `kudos-sidebar-and-modal.spec.ts` TC FUNCTION 19 | PASS (W dev + prod, D) |
| SC-002 | Recipient search: "Nguyễn" lists at most 10, "@ # $" literal, trimmed input, viewer never listed, selection fills the field and closes the list | E2E: `write-kudo-recipient-and-mention.spec.ts` (ID-8..10, ID-25, ID-26, FR-306..309); search rules in pgTAP (`search_sunners`) | PASS (W dev + prod); pgTAP PASS |
| SC-003 | Editor: B, I, S, ordered list and quote apply; link dialog accepts https and rejects `javascript:`; empty content shows the required error | E2E: `write-kudo-editor-and-link.spec.ts` (ID-27..32, FR-401..505, FR-605); ID-11/51 for empty content | PASS (W dev + prod) |
| SC-004 | Up to 5 hashtags, the rest disabled with "Tối đa 5 hashtag"; jpg/png accepted, pdf/mp4/txt refused; five images hide "+ Image", delete brings it back | E2E: `write-kudo-hashtags-images-anonymous.spec.ts` (ID-14..24, ID-34..44, ID-53..55, FR-704, FR-706) | PASS (W dev + prod) |
| SC-005 | Gửi aria-disabled while incomplete; a click shows every required error and sends nothing; a valid submit shows the spinner, closes the modal, toasts, and puts the new kudo first | E2E: `write-kudo-submit-and-anonymous.spec.ts` (ID-7, ID-11, ID-46..52, ID-56, FR-903 path); smoke: real submit shows the new kudo first (511 ms poll) | PASS (W dev + prod); smoke PASS |
| SC-006 | Anonymous kudo hides the sender in feed, highlight, direct `select`, `sunners.user_id` and image paths; `sent` and `hearts` still count the real sender; validation rules reject with P0001 and write nothing | pgTAP: `supabase/tests/database/*` (263 tests in 6 files); real stack: PostgREST `kudos?select=sender_id` and `sunners?select=user_id` answer 403/42501 for the authenticated user and 401 for anon; anonymous card shows the alias on reload | PASS (pgTAP 263/263; smoke PASS) |
| SC-007 | Storage insert only into the caller's folder, MIME and size checked; a failed submit keeps the form and removes uploaded images; Hủy before send leaves no file | pgTAP storage probe (`supabase/tests/database/*`); E2E: ID-45 storage side (no upload on Hủy), FR-903 (failed submit keeps the modal, removes the upload) | PASS (pgTAP; W dev + prod). Smoke: two uploads 200 into `kudo-images`, removed in cleanup |

## Notes
- SC-005 "không gọi mạng" is asserted by ID-7 and ID-11 (modal stays open, no success toast); the request-count check on the mock is the no-send proof.
- SC-006 "sent, hearts still count the real sender" is covered in pgTAP only; the E2E like spec uses the seeded fixture and does not vary the sender's identity.
- Real-stack smoke covered one anonymous kudo with two images; it did not cover the non-anonymous card or every masking path, which pgTAP owns.
