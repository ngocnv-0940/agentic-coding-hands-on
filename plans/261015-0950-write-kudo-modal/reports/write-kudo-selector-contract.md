# Selector contract — Viết Kudo modal (write-kudo)

Owner: tester (phase 1). Read-only for `momorph-ui-implementer` (phase 2) and the wiring phase (phase 6).
Source of truth in code: `e2e/support/write-kudo-locators.ts`. Any change here needs a spec change first.
MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2

## Modal and rows
| Selector | Element and attributes | Notes |
|----------|------------------------|-------|
| `write-kudo-modal` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → heading | Container; opened by `kudos-compose-pill` on /sun-kudos |
| `write-kudo-backdrop` | backdrop layer | Click does nothing (FR-224) |
| `write-kudo-heading` | heading "Gửi lời cám ơn và ghi nhận đến đồng đội" (Figma title; EN dictionary `writeKudo.title`) | First in DOM order. "Viết Kudo" is the screen name only, not the modal heading |
| `write-kudo-field` | row; attr `data-field` = `recipient`, `title`, `content`, `hashtags`, `images`, `anonymous` | Exactly these six, in this DOM order |
| `write-kudo-field-error` | inside its row | Text "Không được để trống" (or the invalid-format / size messages for images); row has `data-invalid="true"` while in error |

## Recipient (Người nhận)
| Selector | Element | Notes |
|----------|---------|-------|
| `write-kudo-recipient-input` | `<input role="combobox" aria-expanded placeholder="Tìm kiếm">` | Debounced ~250 ms search |
| `write-kudo-recipient-selected` | name + avatar of the chosen sunner | Shown after a pick |
| `write-kudo-recipient-clear` | button | Clears the selection and returns focus to the input |

## Shared suggestion list (recipient and "@" mention)
| Selector | Element | Notes |
|----------|---------|-------|
| `sunner-option-list` | listbox container | Hidden when closed |
| `sunner-option` | `role="option"`, `data-sunner-id`, `aria-selected` | Max 10 rows; viewer never listed |
| `sunner-option-empty` | text "Không tìm thấy kết quả" | No match, including literal "@ # $" |

## Title (Danh hiệu)
| Selector | Element | Notes |
|----------|---------|-------|
| `write-kudo-title-input` | `<input maxlength="100" placeholder="Dành tặng một danh hiệu cho đồng đội">` | Required, 1–100 after trim |
| `write-kudo-title-hint` | helper text | "Ví dụ: Người truyền động lực cho tôi." and "Danh hiệu sẽ hiển thị làm tiêu đề Kudos của bạn." |

## Editor (Nội dung)
| Selector | Element | Notes |
|----------|---------|-------|
| `write-kudo-editor` | Tiptap root | Content area is `.ProseMirror` inside it |
| `write-kudo-tool-bold`, `-italic`, `-strike`, `-ordered-list`, `-link`, `-quote` | toolbar buttons | `aria-pressed` reflects the active state |
| `write-kudo-standards-link` | link "Tiêu chuẩn cộng đồng" | `href` ends `/standards`, `target="_blank"` |
| `write-kudo-mention-hint` | hint text | Visibility only |
| DOM in the editor | `strong`, `em`, `s`, `ol > li`, `blockquote`, `a[href][target=_blank][rel~=noopener]`, `span[data-type=mention][data-id]` | Placeholder: `p[data-placeholder]` attribute, text = "Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!" |

## Link dialog (Addlink Box)
| Selector | Element | Notes |
|----------|---------|-------|
| `write-kudo-link-dialog` | dialog | Esc closes this dialog only |
| `write-kudo-link-text` | input, 1–100 chars | Required |
| `write-kudo-link-url` | input, http/https, 5–2048 chars | Required |
| `write-kudo-link-error` | `data-for="text"` or `data-for="url"` | Error shown, nothing inserted |
| `write-kudo-link-cancel`, `write-kudo-link-save` | buttons | Lưu validates, inserts the link mark and closes |

## Hashtag (Hashtag)
| Selector | Element | Notes |
|----------|---------|-------|
| `write-kudo-hashtag-add` | button "+ Hashtag" | Stays visible; the limit is shown in the panel |
| `write-kudo-hashtag-panel` | multi-select panel | Stays open across picks |
| `write-kudo-hashtag-option` | `role="option"`, `data-slug`, `aria-selected`, `aria-disabled` | At 5 selected, unselected rows get `aria-disabled="true"` |
| `write-kudo-hashtag-limit` | text "Tối đa 5 hashtag" | Visible when 5 are selected |
| `write-kudo-hashtag-chip` | chip, `data-slug` | One per selected tag |
| `write-kudo-hashtag-chip-remove` | "x" inside the chip | Removes that tag only |

## Images (Hình ảnh)
| Selector | Element | Notes |
|----------|---------|-------|
| `write-kudo-image-add` | button "+ Image" | Hidden at 5 images, shown again after a removal |
| `write-kudo-image-input` | `<input type="file" multiple accept="image/jpeg,image/png,image/webp">` | Stays in the DOM; extra picks beyond 5 are ignored |
| `write-kudo-image-thumb` | thumbnail `<img>` (local preview) | One per kept file |
| `write-kudo-image-remove` | "x" inside a thumb | |
| `write-kudo-image-error` | text "Định dạng file không hợp lệ" or "Ảnh vượt quá 5 MB" | The rejected file is not added |

Limits: 5 files, each ≤ 5 MB, jpeg/png/webp (magic bytes checked). Uploads to Storage happen only on Gửi, never on pick.

## Anonymous (Ẩn danh)
| Selector | Element | Notes |
|----------|---------|-------|
| `write-kudo-anonymous-checkbox` | checkbox, unchecked by default | |
| `write-kudo-anonymous-name` | text input, `maxlength="50"` | Shown only when checked; cleared when unchecked |

## Footer and feedback
| Selector | Element | Notes |
|----------|---------|-------|
| `write-kudo-cancel` | button "Hủy" | Closes and discards; returns focus to the pill; disabled while sending |
| `write-kudo-submit` | button "Gửi" | `aria-disabled="true"` while a required field is incomplete, still clickable (then all errors show, nothing is sent); `aria-busy="true"` while sending |
| `write-kudo-submit-spinner` | spinner | Visible while sending |
| `kudos-toast` (existing F006 id) | toast | Success text "Đã gửi Kudos thành công!"; error toast on failure |

## Board ids reused from F006 (contract additions for write-kudo)
| Selector | Contract |
|----------|----------|
| `kudos-compose-pill` | Opens `write-kudo-modal`; `disabled` for an identity without a sunner row |
| `kudo-person[data-role="sender"][data-anonymous="true"]` | Alias text only; no `img`, no `a`; "Người gửi ẩn danh" when the alias is empty |
| `kudo-image` | the link (`<a target=_blank>`) around each board thumbnail; `href` contains `kudo-images/` for uploaded images (resolved in TS). The `<img>` inside carries the `src` |

## Stable behaviour the selectors rely on
- Required set for Gửi: recipient, title, content (plain text after trim), at least one hashtag.
- Esc closes the topmost layer only (suggestion list, hashtag panel, link dialog, then the modal); ignored while sending.
- Focus is trapped in the modal; on close, focus returns to `kudos-compose-pill`.
- Backdrop click does nothing.

## Specs that consume this contract
- `e2e/write-kudo-modal-access-and-layout.spec.ts`
- `e2e/write-kudo-recipient-and-mention.spec.ts`
- `e2e/write-kudo-editor-and-link.spec.ts`
- `e2e/write-kudo-hashtags-images-anonymous.spec.ts`
- `e2e/write-kudo-submit-and-anonymous.spec.ts`
- `e2e/kudos-sidebar-and-modal.spec.ts` (TC FUNCTION 19 only)
