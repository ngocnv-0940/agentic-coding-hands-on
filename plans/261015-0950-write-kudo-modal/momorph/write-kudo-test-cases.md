# MoMorph test cases — "Viết Kudo" (screen ihQ26W78P2), 57 cases

Faithful condensation of `download_test_cases(ihQ26W78P2)` (all rows; Steps shortened, Expected verbatim in meaning). Priority H/M.

| TC | Section · area | Data / action | Expected |
|----|----------------|---------------|----------|
| ID-0 | ACCESS · logged in | click "Viết Kudo" entry | Modal "Viết Kudo" opens (H) |
| ID-1 | ACCESS · logged out | try to reach "Viết Kudo" | Redirect to login / login required (H) |
| ID-2 | ACCESS · navigation | from source screen click "Viết Kudo" | Modal shows title and every field (M) |
| ID-3 | GUI · layout | open modal | Title at top; fields in order Người nhận, Textarea, Hashtag, Image, anonymous checkbox; Hủy + Gửi in footer (H) |
| ID-4 | GUI · recipient | placeholder | "Tìm kiếm" (M) |
| ID-5 | GUI · textarea | placeholder | "Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!" (M) |
| ID-6 | GUI · anonymous checkbox | default | unchecked (M) |
| ID-7 | FUNC · recipient required | recipient empty, others valid, click Gửi | red border + error on Người nhận; not submitted (H) |
| ID-8 | FUNC · recipient autocomplete | type "Nguyễn" | suggestions containing "Nguyễn", selectable (H) |
| ID-9 | FUNC · recipient | type "@ # $" | filtered correctly or "no result" (M) |
| ID-10 | FUNC · recipient | type "  Nguyễn  " | input trimmed, correct suggestions (M) |
| ID-11 | FUNC · content required | content empty, others valid, click Gửi | error "Không được để trống"; not submitted (H) |
| ID-12 | FUNC · mention | type "Cảm ơn @" then a name | colleague suggestion list, selectable (H) |
| ID-13 | FUNC · mention | "Cảm ơn @" pick "NguyenVanA" | name mentioned correctly in the text (H) |
| ID-14 | FUNC · hashtag required | 0 tags, click Gửi | error "Không được để trống"; not submitted (H) |
| ID-15 | FUNC · hashtag min 1 | add 1 tag, click Gửi | tag added; submit succeeds (H) |
| ID-16 | FUNC · hashtag max 5 | add 5 tags | 5 added; "+ Hashtag" still shown or disabled (per spec) (H) |
| ID-17 | FUNC · hashtag 6th | try 6th | message "Tối đa 5 hashtag"; 6th not added (H) |
| ID-18 | FUNC · image | pick 3 valid .jpg | 3 thumbnails; "+ Image" still shown (H) |
| ID-19 | FUNC · image | pick 5 valid .jpg | 5 thumbnails; "+ Image" hidden (H) |
| ID-20 | FUNC · image 6th | already 5 | "+ Image" hidden; cannot add 6th (H) |
| ID-21 | FUNC · image type | .jpg | uploaded, thumbnail (H) |
| ID-22 | FUNC · image type | .png | uploaded, thumbnail (H) |
| ID-23 | FUNC · image type | .pdf | invalid-format error; not uploaded (H) |
| ID-24 | FUNC · image type | .mp4 | invalid-format error; not uploaded (H) |
| ID-25 | FUNC · recipient search | type "An" | suggestions appear while typing, filtered (H) |
| ID-26 | FUNC · recipient select | search "An", pick "Nguyễn Văn An" | name fills the field; dropdown closes (H) |
| ID-27 | FUNC · Bold | select "Cảm ơn bạn", click B | text bold (M) |
| ID-28 | FUNC · Italic | select, click I | text italic (M) |
| ID-29 | FUNC · Strike | select, click S | text struck through (M) |
| ID-30 | FUNC · Number list | multi-line, select, click list | numbered list (M) |
| ID-31 | FUNC · Link | click Link, enter "https://example.com", confirm | URL dialog shows; link inserted (M) |
| ID-32 | FUNC · Quote | select "Đây là quote", click Quote | text formatted as quote (M) |
| ID-33 | FUNC · mention | type "@Nguyen" | name suggestions, selectable (H) |
| ID-34 | FUNC · + Hashtag | click, choose or type "TeamWork", confirm | hashtag dropdown shows; chip "TeamWork" added (H) |
| ID-35 | FUNC · + Hashtag | add Tag1, Tag2, Tag3 | 3 separate chips (H) |
| ID-36 | FUNC · chip remove | 2 chips, click x on Tag1 | Tag1 gone, Tag2 stays (H) |
| ID-37 | FUNC · + Image | pick 1 .jpg | file picker opens; thumbnail shown (H) |
| ID-38 | FUNC · + Image | upload 5 | "+ Image" hidden after the 5th (H) |
| ID-39 | FUNC · thumbnail remove | 3 images, x on 2nd | 2nd removed, 2 left (H) |
| ID-40 | FUNC · thumbnail remove | 5 images (button hidden), x on one | removed; "+ Image" shows again (M) |
| ID-41 | FUNC · anonymous | click checkbox | checked (M) |
| ID-42 | FUNC · anonymous | click again | unchecked (M) |
| ID-43 | FUNC · anonymous | check | anonymous-name text field shows (M) |
| ID-44 | FUNC · anonymous | uncheck | anonymous-name text field hidden (M) |
| ID-45 | FUNC · Hủy | data entered, click Hủy | modal closes; nothing saved (H) |
| ID-46 | FUNC · Gửi | all required + 2 tags + 2 images | validated; loading shown; modal closes on success (H) |
| ID-47 | FUNC · Gửi | required + 1 tag, 0 images | submitted; modal closes (H) |
| ID-48 | FUNC · Gửi state | all required empty | Gửi disabled (H) |
| ID-49 | FUNC · Gửi state | recipient + content + 1 tag | Gửi enabled (H) |
| ID-50 | ERROR · recipient | empty, click Gửi | red border + error on Người nhận (H) |
| ID-51 | ERROR · content | empty, click Gửi | "Không được để trống" at textarea (H) |
| ID-52 | ERROR · hashtag | 0 tags, click Gửi | "Không được để trống" at Hashtag (H) |
| ID-53 | ERROR · hashtag | add 6th | "Tối đa 5 hashtag"; blocked (H) |
| ID-54 | ERROR · image | 5 images | "+ Image" hidden; no 6th (H) |
| ID-55 | ERROR · image type | .txt | invalid-format error (H) |
| ID-56 | ERROR · submit | all required empty, click Gửi | errors on Người nhận, Nội dung, Hashtag; not submitted (H) |
