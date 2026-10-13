"""SVN Proposal template — role-based descriptors for 17 configured slides.

Each slide is described by ROLES (semantic groups of shapes) instead of
per-shape hardcoded targets. Roles bind to source paths in ProjectProfile,
so changing content (e.g. 6 before_steps instead of 8) just means fewer
shapes get filled — the renderer clears the excess.
"""
from __future__ import annotations

from lib.templates.base import (
    BaseSlideTemplate,
    ContentKind,
    ShapeFindStrategy,
    ShapeRole,
    SlideRoleConfig,
)


# ---------------------------------------------------------------------------
# Helper builders to keep slide configs compact
# ---------------------------------------------------------------------------

def _text_by_index(name: str, idx: int, source: str, desc: str = '') -> ShapeRole:
    return ShapeRole(
        name=name, cardinality=1, kind=ContentKind.TEXT, source_path=source,
        find_strategy=ShapeFindStrategy.BY_INDEX, find_params={'index': idx},
        description=desc,
    )


def _table_by_index(name: str, idx: int, source: str, fill_cols=None, desc: str = '',
                    label_shape_name: str = None) -> ShapeRole:
    return ShapeRole(
        name=name, cardinality=1, kind=ContentKind.TABLE, source_path=source,
        find_strategy=ShapeFindStrategy.BY_INDEX, find_params={'index': idx},
        fill_cols=fill_cols, label_shape_name=label_shape_name, description=desc,
    )


def _image_fit_slide(name: str, idx: int, source: str, desc: str = '') -> ShapeRole:
    return ShapeRole(
        name=name, cardinality=1, kind=ContentKind.IMAGE, source_path=source,
        find_strategy=ShapeFindStrategy.BY_INDEX, find_params={'index': idx},
        fit_to_slide=True, description=desc,
    )


def _image_by_index(name: str, idx: int, source: str, desc: str = '') -> ShapeRole:
    return ShapeRole(
        name=name, cardinality=1, kind=ContentKind.IMAGE, source_path=source,
        find_strategy=ShapeFindStrategy.BY_INDEX, find_params={'index': idx},
        description=desc,
    )


def _text_collection_by_names(name: str, names: list[str], source: str, desc: str = '',
                              item_field: str = None, font_group: str = None) -> ShapeRole:
    """N-cardinality role: list of shapes, each looked up by exact name (recursive group search).

    `item_field` names which key to take when the source is a list of dicts —
    used where one list feeds several slots of the same card.

    `font_group` puts these boxes in one font family with the other roles naming
    it, so they are all SET at a single size instead of each being auto-fitted
    on its own by the renderer.
    """
    return ShapeRole(
        name=name, cardinality=len(names), kind=ContentKind.TEXT, source_path=source,
        find_strategy=ShapeFindStrategy.BY_NAME, find_params={'names': names},
        item_field=item_field, font_group=font_group, description=desc,
    )


def _text_collection_by_indices(name: str, indices: list[int], source: str, desc: str = '') -> ShapeRole:
    """N-cardinality role: list of top-level shapes located by index."""
    return ShapeRole(
        name=name, cardinality=len(indices), kind=ContentKind.TEXT, source_path=source,
        find_strategy=ShapeFindStrategy.BY_INDEX, find_params={'indices': indices},
        description=desc,
    )


def _compound_by_names(name: str, source: str, title_names: list[str], body_names: list[str],
                       desc: str = '', font_group: str = None) -> ShapeRole:
    """Compound role: list of (title, body) pairs. Each pair has its own shape names.

    `font_group` puts the pairs' BODY boxes in one font family — see
    `_text_collection_by_names`.
    """
    return ShapeRole(
        name=name, cardinality=len(title_names), kind=ContentKind.TEXT, source_path=source,
        find_strategy=ShapeFindStrategy.BY_NAME,
        find_params={'pair_names': list(zip(title_names, body_names))},
        font_group=font_group,
        sub_roles=[
            ShapeRole(name='title', cardinality=1, kind=ContentKind.TEXT, source_path='title',
                      find_strategy=ShapeFindStrategy.BY_NAME),
            ShapeRole(name='body', cardinality=1, kind=ContentKind.TEXT, source_path='body',
                      find_strategy=ShapeFindStrategy.BY_NAME),
        ],
        description=desc,
    )


def _compound_by_indices(name: str, source: str, title_indices: list[int], body_indices: list[int], desc: str = '') -> ShapeRole:
    """Compound role: list of (title, body) pairs located by top-level index."""
    return ShapeRole(
        name=name, cardinality=len(title_indices), kind=ContentKind.TEXT, source_path=source,
        find_strategy=ShapeFindStrategy.BY_INDEX,
        find_params={'pair_indices': list(zip(title_indices, body_indices))},
        sub_roles=[
            ShapeRole(name='title', cardinality=1, kind=ContentKind.TEXT, source_path='title',
                      find_strategy=ShapeFindStrategy.BY_INDEX),
            ShapeRole(name='body', cardinality=1, kind=ContentKind.TEXT, source_path='body',
                      find_strategy=ShapeFindStrategy.BY_INDEX),
        ],
        description=desc,
    )


# ---------------------------------------------------------------------------
# SVN template configuration
# ---------------------------------------------------------------------------

# Map profile section name → FULL list of slide numbers that section fills.
# Used by (a) extra-slide insertion to resolve `anchor_section` → insert position
# (the section's LAST slide, `SECTION_TO_SLIDES[key][-1]`), and (b) the
# prune+reorder pass to know exactly which template slides a section owns.
# Insertion order = canonical section order (also the fallback for
# `profile.section_order` when a profile predates section-order tracking).
SECTION_TO_SLIDES: dict[str, list[int]] = {
    'project_background': [4],
    'features': [5],
    'nfr_overview': [6],
    'screen_flow': [8],
    'business_process': [10, 11],
    'benefits': [12, 13],
    # Two shapes of one chapter: 16 draws the four POINT cards, 21 the
    # comparison MATRIX. A document writes one or the other, and the prune pass
    # drops whichever slide no role wrote to — so both can be listed here.
    'approach_comparison': [16, 21],
    'assumptions': [23, 24, 25],
    'infrastructure': [33],
    'software_stack': [34],
    'nfr_sections': [35],
    'nfr_detailed': [36],
    'deliverables': [39],
    'schedule': [43],
    'cost': [56],
}

# Map chapter divider slide → the content slide numbers it introduces.
# The prune+reorder pass keeps a divider iff at least one of its content
# slides survives (i.e. the owning section has content).
# The template's nine dividers, in slide order: 3 System Overview,
# 9 Advantages, 14 The essence of the proposal, 17 Sun*'s Scope,
# 22 Estimated Assumptions, 27 System Architecture, 37 The Expected Output,
# 41 Implementation Schedule, 51 Cost.
#
# A divider only reaches the deck when some section with content lists one of
# these slides FIRST in `SECTION_TO_SLIDES` — the prune pass looks the divider
# up from the content slide, never the other way round. So a divider with no
# section pointing into it is dead weight, however real its template slide is.
#
# 21 belongs to 14, not 17: the slide renders `approach_comparison` (§3
# 提案の要諦), so its chapter is The essence of the proposal. It was filed under
# 17 (Sun*'s Scope), which both hid the 提案の要諦 divider and printed §3's
# content under the wrong chapter heading. Sun*'s Scope has no content slide
# of its own; the `team` section (プロジェクト体制) now claims divider 17 through
# `DIVIDER_ONLY_SECTIONS` below, its body arriving as extra slides.
# Every chapter divider the template ships, whether or not a section fills its
# chapter. `CHAPTER_DIVIDERS` below maps only those a section reaches; a chapter
# whose content becomes an appendix slide still needs its divider found here.
CHAPTER_DIVIDER_SLIDES: list[int] = [3, 9, 14, 17, 22, 27, 37, 41, 51]

CHAPTER_DIVIDERS: dict[int, list[int]] = {
    3: [4, 5, 6, 8],
    9: [10, 11, 12, 13],
    14: [16, 21],
    22: [23, 24, 25],
    27: [33, 34, 35, 36],
    37: [39, 40],
    41: [43],
    51: [52, 53, 54, 55, 56],
}

# Sections that own a chapter DIVIDER but no content slide: their body is
# extra slides (`--extra-slides` `org_chart` entries, or a `###` table) pinned
# right after the divider, and the divider is named from the section heading
# (`renderer._retitle_dividers_from_sections`).
DIVIDER_ONLY_SECTIONS: dict[str, int] = {'team': 17}
# What such a divider is called when the document has no chapter heading for it
# (the body came only from `--extra-slides` anchored to the section): JP line,
# EN line. A heading or an AGENDA line, when present, wins over these.
DIVIDER_ONLY_TITLES: dict[str, tuple[str, str]] = {
    'team': ('プロジェクト体制', 'Project Structure'),
}

# Slides kept unconditionally regardless of content (cover + agenda).
ALWAYS_KEEP_SLIDES = [1, 2]

# A role's source attribute usually names its own section — `features.table`
# belongs to `features` — and that is how the renderer works out where an
# overflow slide belongs (`PPTXRenderer._queue_overflow_extra`). These are the
# roles where it does not: a card slide reads `approach_points` while its
# chapter is `approach_comparison`, and slide 38 reads `deliverables_rows`.
#
# Without the translation the section is one `SECTION_TO_SLIDES` has never heard
# of, the anchor cannot resolve, and the overflow lands at the END of the deck —
# on a real proposal, the continuation of slide 23's cards printed as slide 55,
# thirty-two slides from the chapter it belongs to.
#
# `tests/test_template_contract.py` fails the build if a role's source resolves
# to neither a section nor an entry here, so a new role cannot reintroduce this.
SOURCE_SECTION_ALIASES: dict[str, str] = {
    'approach_points': 'approach_comparison',
    'deliverables_rows': 'deliverables',
}

# Template slides an APPENDIX chapter may borrow the design of.
#
# The appendix path used to erase a slide and redraw it from primitives ported
# out of the generate-slide library — which meant redrawing, less well, designs
# this very deck already ships. Slide 16 draws four numbered point cards; the
# ported `numbered_points` layout draws four text boxes.
#
# So a chapter whose shape matches a donor's borrows the real slide instead: the
# donor is cloned and filled through the same role machinery that fills a
# configured slide. A chapter matching no donor keeps the drawn layout, which is
# why `extra_slide_layouts.py` stays.
#
# Per entry:
#   `capacity`  how many items the design has room for. A chapter with more
#               does not match — a design silently dropping the fifth point is
#               the failure this whole registry exists to avoid.
#   `source`    the attribute the slide's roles read. The filler binds the
#               chapter's items to it, so the roles need no special case.
#   `shape`     the content shape this donor serves, matched by the classifier.
#
# Every donor MUST have its slide in `slide_role_configs` with every text shape
# bound — `verify-template-contract.py` enforces that for slide 16, and a new
# donor should be added to its strict set at the same time.
DONOR_SLIDES: dict[int, dict] = {
    15: {'shape': 'numbered_points', 'capacity': 3, 'source': 'approach_points'},
    16: {'shape': 'numbered_points', 'capacity': 4, 'source': 'approach_points'},
    # `header` names the title / breadcrumb shapes when they are not the usual
    # `PlaceHolder 1` / `PlaceHolder 2`. Slide 38 draws its own header inside a
    # group, so without this a borrowed copy would keep the Japanese 想定作成物
    # above a chapter about something else.
    38: {'shape': 'numbered_points', 'capacity': 6, 'source': 'deliverables_rows',
         'header': ('Google Shape;1414;p38', 'Google Shape;1415;p38')},
}

# Template wording that stops being true once a slide is filled from a profile:
# {slide number: {exact text to find: replacement}}.
#
# Matched on text rather than shape index, and searched inside group shapes too,
# because these strings live wherever the template's designer put them — slide
# 39's title sits in a group, so an index would address the group, not the line.
#
# - Slide 21 renders 提案の要諦 and now sits under that chapter's divider, but
#   the template authored it inside Sun*'s Scope and its breadcrumb still said
#   so, naming a chapter the reader never passed through.
# - Slide 39's title is numbered （1/2） because the template pairs it with
#   slide 40. A generated deck fills only 39, so the numbering promises a second
#   page that never comes.
# - Slide 37's divider spells the chapter 想定作成物 where the AGENDA and every
#   proposal write 想定成果物. Two spellings of one chapter inside one deck reads
#   as a typo, and the divider is the one the reader lands on.
SLIDE_TEXT_OVERRIDES: dict[int, dict[str, str]] = {
    21: {'Sun*’s Scope  ｜  Sun*のスコープ': 'The essence of the proposal  ｜  提案の要諦'},
    # Slide 37's divider says 想定作成物 where every proposal says 想定成果物.
    # This is not the rename `_retitle_dividers_from_agenda` does — that one
    # matches a divider to its AGENDA line by the Japanese name, and 作成 vs 成果
    # is a different word, not a spelling it can see through. The typo has to be
    # corrected first, and then the rename finds the chapter.
    37: {'想定作成物': '想定成果物'},
    39: {'想定成果物（1/2）- Advanced': '想定成果物',
         'Expected Output  ｜  想定作成物': 'Expected Deliverables  ｜  想定成果物'},
}

# Template wording to replace with the source document's own, when the profile
# supplies it: {slide number: {exact text to find: dotted profile path}}.
#
# Unlike SLIDE_TEXT_OVERRIDES these are not fixed corrections — the right words
# live in the proposal. Slide 56 is headed 'お見積もりサマリ　補足 - Advanced'
# and its lead-in describes 諸経費, neither of which matches a 役割/工数 table;
# the source's own 9.1 開発費用（概算工数） heading and its paragraph do.
# A path that resolves to nothing leaves the template's wording alone.
SLIDE_TEXT_FROM_PROFILE: dict[int, dict[str, str]] = {
    39: {'想定成果物': 'deliverables.title'},
    56: {'お見積もりサマリ\u3000補足 - Advanced': 'cost.title',
         '開発費用とは別途、以下の諸経費がかかる想定です。\n弊社にて代理支払いを行う場合、'
         '管理手数料(10%)を頂戴します。': 'cost.description'},
}

# Fixed Japanese chrome → English, applied ONLY when the source document is not
# Japanese: {exact template text: replacement}.
#
# These are the labels a slide is BUILT from — the two column headers on the
# background slide, the before/after captions on the business-process panel, the
# swim-lane names down the schedule. Unlike a slide's title they name no chapter,
# so no source heading can supply them (`_retitle_slides_from_headings` handles
# the ones that can) and there is nothing to read them off. A fixed table is the
# only honest source, and the set is closed: the template ships 72 slides and
# never grows one at runtime.
#
# Deliberately NOT here:
#   - the Sun* copyright footer — a legal entity name, not chrome;
#   - the template's sample SENTENCES (`インフラ構成を提案する理由は…`). A label
#     means the same thing in every deck; a sentence is content written for
#     another client, and translating it would ship a fluent English claim this
#     proposal never made. Those belong to the sample-content leak, not here.
TEMPLATE_CHROME_EN: dict[str, str] = {
    '現状の課題': 'Current Issues',
    '目的・実現したいこと': 'Objectives',
    '機能一覧表': 'Feature List',
    '機能一覧表サンプル': 'Sample feature list',
    '非機能要件': 'Non-Functional Requirements',
    'アプローチ比較サマリ': 'Approach Comparison',
    '本提案のポイント': 'Key Points of This Proposal',
    'インフラ構成': 'Infrastructure Configuration',
    'ソフトウェア構成': 'Software Configuration',
    '導入前': 'Before',
    '導入後': 'After',
    '貴社': 'Client',
    '次フェーズ': 'Next Phase',
    'その他': 'Other',
    'お見積もりサマリ　補足 - Advanced': 'Cost Summary — Supplementary',
}

# Slide 2 (agenda) — bespoke shape indices, filled from `profile.agenda`.
# 0-based top-level `slide.shapes` positions specific to this template file,
# same rationale as `COVER_SLIDE_LAYOUT`: the generic text-role path would
# flatten the two type sizes each agenda line is built from.
#
# `chapters` is the main list (9 template lines, ~4.3in tall — it has room for
# a line or two more); `cost_breakdown` is the small 費用 sub-item box below it
# (2 lines in 0.49in — no room to grow, the footer is right underneath).
AGENDA_SLIDE_LAYOUT = {
    'chapters': 1,        # PlaceHolder 2
    'cost_breakdown': 3,  # 'Google Shape;747;p2'
}

# Fallback for a profile with NO `## Agenda` section: Japanese chapter label
# → English gloss.
#
# The template authors the agenda as `<JP label>: <Vietnamese note to the
# proposal writer>`. Those notes are internal authoring guidance, not deck
# content, so a deck must never ship them. The agenda the source proposal
# itself writes is authoritative and wins (see `AGENDA_SLIDE_LAYOUT`); this map
# only keeps an agenda-less profile from shipping the Vietnamese notes.
#
# Wording is taken verbatim from each chapter's own divider slide (slide 3 →
# 'System Overview', 9 → 'Advantage of system introduction', …) so the agenda
# and the divider a reader lands on say the same thing — including the
# template's own sentence-casing. Note the agenda says '想定成果物' where its
# divider (slide 37) says '想定作成物'; both mean the same chapter.
# A line whose label is absent here is left exactly as the template wrote it.
AGENDA_GLOSSES: dict[str, str] = {
    'システムの概要': 'System Overview',
    'システムの導入のメリット': 'Advantage of system introduction',
    '提案の要諦': 'The essence of the proposal',
    'Sun*のスコープ': "Sun*'s Scope",  # ASCII apostrophe: the divider's ’ renders as 'Sun*’ s' here
    'お見積りの前提条件': 'Estimated Assumptions',
    'システム構成図の提案': 'System Architecture',
    '想定成果物': 'The Expected Output',
    '実施スケジュール': 'Implementation Schedule',
    '費用': 'Cost',
    # Sub-items under 費用, in their own box on the same slide.
    '開発費用': 'Development Cost',
    'インフラコスト': 'Infra Cost',  # kept short — the sub-item box wraps into the footer otherwise
}

# Text of shapes the template ships purely as notes to the proposal writer —
# Vietnamese "what to put on this slide" guidance, plus the JP revision notes
# the template's own editors parked off-canvas. None of it is deck content, so
# the renderer deletes these shapes outright from the finished file.
#
# Matched on exact text (whitespace-normalized), NOT on shape index or
# position, because:
#   - indices shift once the fill pass adds/removes shapes, and a note-bearing
#     slide can be duplicated into several output slides (a table that
#     overflows carries its note onto every continuation);
#   - "parked off-canvas" is not a reliable tell — slide 58 keeps a real org
#     chart off to the right, and slide 45 a '想定アウトプット' label, which a
#     positional rule would silently delete.
# A diacritic-based rule is likewise unsafe: a Vietnamese-language profile's
# own content would match it.
TEMPLATE_NOTE_TEXTS: frozenset[str] = frozenset({
    # Vietnamese authoring guidance, one per chapter divider / optional slide
    'Tổng quan về dự án theo ý hiểu của Sun*\nChủ yếu nên phát biểu về vấn đề '
    'và kỳ vọng sau khi hoàn thành hệ thống',
    'Trường hợp khách hàng không đưa ra yêu cầu non-func ngay từ đầu thì bỏ slide này',
    'Lợi ích/giá trị đem lại sau khi hệ thống vận hành',
    'Key point của đề án\nFocus vào điểm khác biệt, điểm mạnh của đề án hiện tại.\n'
    'Vd: global team, gắn AI vào, phát triển agile, tối ưu chi phí vận hành,...',
    'Phạm vi hỗ trợ của Sun*',
    'Điều kiện tiền đề của bản estimation.\nBao gồm cả về techstack, kiến trúc dự kiến, …',
    'Đề xuất về kiến trúc hệ thống',
    'Các output dự kiến sẽ bàn giao cho KH sau khi hoàn thành dự án',
    'Kế hoạch thực hiện',
    'Chi phí, bao gồm chi phí phát triển, chi phí maintain, chi phí infra',
    'Chi phí phát triển\nCó thể phân chia thành các Option, tách thành chi tiết các phase',
    'Phần Infra cost, tách riêng và giải thích keypoint trong việc thiết kế infra '
    'và chi tiết các thành phần chi phí',
    'Trường hợp khách hàng quan tâm sâu về chi tiết infra cost (vì sao đắt thế)',
    # Slide 5's caption over the sample grid — a label about the TEMPLATE's
    # sample, meaningless once the client's own feature table replaces it.
    '機能一覧表サンプル',
    # JP revision notes left off-canvas by the template's editors
    'アイコンが少しずれていたので修正しました',
    'テキストの開始位置を修正しました',
    'スケジュールで使用している点線や実線の位置修正をしました',
})

# The template's own SAMPLE COPY: sentences and chart blocks written for the
# proposal this deck was cloned from. Nothing in this pipeline writes them —
# they sit in shapes no role is bound to — so whatever survives a render is
# another client's words under this client's heading, in a language the deck
# may not even be in.
#
# Matched and deleted exactly like `TEMPLATE_NOTE_TEXTS`, and kept in a
# separate set for the same reason the two are worth telling apart: a note is
# guidance FOR the author, this is copy ABOUT another project. A text listed
# here that a profile field replaces (slide 56) no longer matches by the time
# this pass runs, so supplying the content still wins.
#
# `verify-template-contract.py` fails the build if an entry stops matching the
# shipped template — a silently dead entry would let the sample back in.
TEMPLATE_SAMPLE_TEXTS: frozenset[str] = frozenset({
    # Slide 33 / 34 — the lead-in above the infrastructure and software
    # tables. No role writes them (both sections are a bare list of table
    # rows), so on any deck but the one they were written for they are a
    # Japanese sentence about somebody else's architecture.
    'インフラ構成を提案する理由は以下の通りです。',
    '以下の構成を提案いたします。特にサービスの 安定性・セキュリティ・保守性 を重視しています。',
    # Slide 36 — claims the client supplied a non-functional requirements
    # document. A proposal that never received one would be telling the
    # reader something untrue about their own engagement.
    '貴社からご提供いただきました非機能要件資料をベースに一部弊社側で前提を置いております。',
    # Slide 56 — the 諸経費 note. `SLIDE_TEXT_FROM_PROFILE` replaces it with
    # `cost.description` when the document HAS one; this is what happens
    # when it does not, which used to be that the sample stayed.
    '開発費用とは別途、以下の諸経費がかかる想定です。\n'
    '弊社にて代理支払いを行う場合、管理手数料(10%)を頂戴します。',
    # Slide 43 — the sample Gantt's own phase blocks. The renderer draws
    # this proposal's schedule over the top of them (`_fill_placeholder_
    # with_table`), so what survived was another project's plan showing
    # through this one's. Deleted rather than blanked: an emptied block is
    # still a grey box sitting under the new chart.
    '要件整理（貴社）\n'
    '要件一覧の整理・優先度づけ\n'
    '業務フローなど8月からの要件定義・設計をスムーズにスタートするための要件定義資料の作成',
    'スプリント開始準備\n'
    '要件定義\n'
    '・業務フロー\n'
    '・機能一覧\n'
    '・ER図\n'
    '・システム構成図\n'
    'スプリントサイクルの設計\n'
    '初期スプリントでの実施機能のFix',
    'トーン&マナー策定\n'
    'To-beのデザインガイドラインの\n'
    '作成・ご提案',
    'UIデザイン\n'
    'スプリントに合わせてUIデザインの作成',
    'インフラ構築\n'
    '開発・検証・本番環境のインフラ構築',
    'スプリント開発\n'
    'アジャイル思想に基づくスプリント開発を実施。スプリント開始準備にて設定した機能優先度の高いものから順次開発。\n'
    '10月末以降、毎月のリリースを目指す。',
    'UAT\n'
    '検証環境でのUATを想定',
    'システム移行\n'
    '既存システムからの移行\n'
    '移行設計は8-9月の中で検討を想定',
    'キャッチアップ\n'
    'PJスタート前ですが、資料インプットやサービスが実際に利用されている現場に行き、理解を深められればと考えております。',
})

# Slide 1 (cover) — bespoke shape indices, filled from `profile.cover`.
# Not a SlideRoleConfig on purpose: the generic text-role path normalizes every
# box to 10pt Noto Sans JP and strips "decoration" around empty slots, which
# would flatten the cover's three distinct type sizes and can reach the logo.
# The renderer writes these in place instead, preserving the template's runs.
# 0-based top-level `slide.shapes` positions specific to this template file.
#
# The client line (shape 1, '○○株式会社　御中') is deliberately absent: it stays
# fixed at the template's wording in every deck and is never driven by the
# profile. Do not add it back without asking the kit owner.
COVER_SLIDE_LAYOUT = {
    'company': 0,  # 'SVN Proposal Menu' — headline, filled with the client's name
    'date': 2,     # '2025.04.04'
}

# The small `○○株式会社　御中` line above the headline. It is never FILLED from
# the profile — `御中` is a Japanese business honorific, so the line only makes
# sense as the template wrote it, addressing a Japanese client.
#
# On a proposal written in any other language it is worse than unhelpful: `○○`
# is the placeholder mark for "put the name here", so an English deck opened on
# a literal blank above the client's real name. There is nothing to translate
# it INTO — an English cover simply has no such line — so it is removed rather
# than rewritten. See `_fill_cover_slide`.
COVER_JP_HONORIFIC_IDX = 1

# Template slide whose master carries the canonical footer (Sun* logo ＋
# copyright ＋ page number). Every AI-generated extra slide is created from
# THIS slide's layout so its footer is identical in every deck.
#
# Needed because the template ships 14 different masters whose footers disagree
# — e.g. the master behind slides 33/34/35 has only a page number, and the one
# behind the agenda has only the logo. Picking the canvas from whichever
# section happened to survive pruning therefore produced a different (often
# incomplete) footer per deck.
EXTRA_SLIDE_CHROME_SLIDE = 5

# Slide 11 (business process, horizontal view) — bespoke shape indices for the
# before/after split fallback used when `after_blocks` overflows its 4 slots.
# A human editor wouldn't duplicate the whole slide (repeating the unrelated
# before_steps row); they'd split into a before-only slide and an after-only
# slide with the overflow laid out as a second row. Indices are 0-based
# top-level `slide.shapes` positions specific to this exact template file.
BUSINESS_PROCESS_SLIDE11_LAYOUT = {
    'before_bg': 3,
    'before_label': 4,
    'before_boxes': [8, 9, 10, 11, 12, 13, 15, 14],  # left→right visual order
    'before_connectors': [17, 18, 19, 20, 21, 22, 23],  # connector[i] is between box[i] and box[i+1]
    'after_bg': 2,
    'after_label': 35,
    'after_card_bg': [16, 7, 6, 5],  # per-column card backdrop, col1→col4 (behind title/body)
    'after_title_boxes': [24, 25, 26, 27],
    'after_body_boxes': [31, 32, 33, 34],
    'after_connectors': [28, 29, 30],
    'row_arrow': 36,  # connector between the before/after panels
}


class SVNProposalTemplate(BaseSlideTemplate):
    """72-slide SVN Proposal Menu template — 17 slides configured for filling."""

    def _initialize_configs(self):
        c = self.slide_role_configs

        # Slide 4: System Overview (current issues + objectives)
        c[4] = SlideRoleConfig(
            slide_number=4,
            content_types=['text'],
            roles=[
                _text_by_index('current_issues', 3, 'project_background.current_issues',
                               '現状の課題 - left column'),
                _text_by_index('objectives', 6, 'project_background.objectives',
                               '目的・実現したいこと - right column'),
            ],
            description='Current issues + objectives, 2-column layout',
        )

        # Slide 5: Feature list (description + table)
        c[5] = SlideRoleConfig(
            slide_number=5, content_types=['text', 'table'],
            roles=[
                _text_by_index('feature_description', 3, 'features.description',
                               '機能一覧表の説明文'),
                # `features.groups` when the chapter is split into labelled
                # `####` sub-blocks, `features.table` otherwise — the renderer
                # tells them apart by shape and falls back on its own. The pill
                # above the grid (`機能一覧表サンプル`) names whichever table the
                # slide is showing; before it did, six continuation slides all
                # claimed to be the same "Sample feature list".
                _table_by_index('function_table', 8, 'features.groups',
                                desc='機能一覧テーブル (6 cols)',
                                label_shape_name='Google Shape;776;p5'),
            ],
        )

        # Slide 6: NFR overview (description + table)
        c[6] = SlideRoleConfig(
            slide_number=6, content_types=['text', 'table'],
            roles=[
                _text_by_index('requirements_description', 2, 'nfr_overview.description',
                               '非機能要件の説明文'),
                _table_by_index('requirements_table', 4, 'nfr_overview.table',
                                desc='非機能要件テーブル (5 cols)'),
            ],
        )

        # Slide 8: Screen transition diagram (fill slide content area)
        c[8] = SlideRoleConfig(
            slide_number=8, content_types=['image'],
            roles=[_image_fit_slide('screen_flow_image', 3, 'screen_flow.image_path',
                                    '画面遷移図 PNG — fit to slide content area')],
        )

        # Slide 10: Vertical business process (4 category labels, 8 before_steps in GROUPs, 4 after_blocks)
        # Most editable shapes live in GROUP shapes — must be found by NAME (recursive).
        c[10] = SlideRoleConfig(
            slide_number=10, content_types=['text'],
            roles=[
                _text_collection_by_indices(
                    'category_labels', [5, 9, 7, 6], 'business_process.categories',
                    '4 process category labels (top-level)',
                ),
                _text_collection_by_names(
                    'before_steps',
                    [
                        'Google Shape;859;p10',  # step 1
                        'Google Shape;862;p10',  # step 2
                        'Google Shape;865;p10',  # step 3
                        'Google Shape;868;p10',  # step 4
                        'Google Shape;871;p10',  # step 5
                        'Google Shape;874;p10',  # step 6
                        'Google Shape;877;p10',  # step 7
                        'Google Shape;880;p10',  # step 8
                    ],
                    'business_process.before_steps',
                    '8 before-process step boxes (nested in GROUPs)',
                ),
                _compound_by_names(
                    'after_blocks', 'business_process.after_blocks',
                    title_names=['Google Shape;835;p10', 'Google Shape;839;p10',
                                 'Google Shape;843;p10', 'Google Shape;847;p10'],
                    body_names=['Google Shape;836;p10', 'Google Shape;840;p10',
                                'Google Shape;844;p10', 'Google Shape;848;p10'],
                    desc='4 after-process benefit blocks (title + body)',
                ),
            ],
        )

        # Slide 11: Horizontal business process (8 before_steps top-level, 4 after_blocks top-level)
        c[11] = SlideRoleConfig(
            slide_number=11, content_types=['text'],
            roles=[
                _text_collection_by_indices(
                    'before_steps', [8, 9, 10, 11, 12, 13, 15, 14],
                    'business_process.before_steps',
                    '8 before-step boxes, left → right',
                ),
                _compound_by_indices(
                    'after_blocks', 'business_process.after_blocks',
                    title_indices=[24, 25, 26, 27],
                    body_indices=[31, 32, 33, 34],
                    desc='4 after-block (title+body) pairs, left → right',
                ),
            ],
        )

        # Slides 12 & 13: System benefits (2 title+body pairs each)
        # Slide 12 takes benefits[0:2], slide 13 takes benefits[2:4]
        c[12] = SlideRoleConfig(
            slide_number=12, content_types=['text'],
            roles=[_compound_by_indices(
                'benefit_blocks', 'benefits[0:2]',
                title_indices=[2, 4], body_indices=[3, 5],
                desc='2 benefit title+body pairs (削減コスト / 業務効率)',
            )],
        )

        c[13] = SlideRoleConfig(
            slide_number=13, content_types=['text'],
            roles=[_compound_by_indices(
                'benefit_blocks', 'benefits[2:4]',
                title_indices=[2, 4], body_indices=[3, 5],
                desc='2 benefit title+body pairs (セキュリティ / システム連携)',
            )],
        )

        # Slide 21: Approach comparison table (3-4 columns).
        # The breadcrumb is rewritten because this slide sits under the
        # 提案の要諦 divider (see CHAPTER_DIVIDERS), while the template authored
        # it inside the Sun*'s Scope chapter — leaving it would print a chapter
        # name the reader never passed through.
        # Slide 16: 提案の要諦 as four numbered POINT cards (01-04).
        #
        # Sibling of slide 21, which renders the same chapter as a comparison
        # matrix. Slide 15 draws the same design with only THREE cards, so a
        # four-point chapter would silently lose its fourth — 16 is the one that
        # fits, and the count is why.
        #
        # Located BY NAME, not by index: all twelve slots live inside the group
        # `Google Shape;1000;p16`, where a top-level index addresses the group
        # itself. Names read off the shipped template — see
        # `plans/260816-2356-*/reports/donor-shape-inventory.md`.
        #
        # All three slots of every card are bound. That is not thoroughness for
        # its own sake: an unbound slot keeps the TEMPLATE's sentence, and this
        # slide's sample text is four Japanese claims written for a different
        # client. `verify-template-contract.py` fails the build if any text
        # shape here goes unbound.
        c[16] = SlideRoleConfig(
            slide_number=16, content_types=['text'],
            roles=[
                _compound_by_names(
                    'essence_points', 'approach_points',
                    title_names=['Google Shape;1002;p16', 'Google Shape;1008;p16',
                                 'Google Shape;1014;p16', 'Google Shape;1020;p16'],
                    body_names=['Google Shape;1004;p16', 'Google Shape;1010;p16',
                                'Google Shape;1016;p16', 'Google Shape;1022;p16'],
                    desc='提案の要諦 4 cards: heading + detail',
                    font_group='p16_cards'),
                _text_collection_by_names(
                    'essence_headlines',
                    ['Google Shape;1003;p16', 'Google Shape;1009;p16',
                     'Google Shape;1015;p16', 'Google Shape;1021;p16'],
                    'approach_points',
                    desc='提案の要諦 4 cards: the headline slot above each body',
                    item_field='subtitle', font_group='p16_cards'),
            ],
            description='Essence of the proposal — four point cards',
        )

        # Slide 15: the same 提案の要諦 design as slide 16, drawn with THREE
        # cards instead of four. Wider cards (2.41" against 1.70") and a bigger
        # title (17pt against 12pt), so a three-point chapter reads better here
        # than it would squeezed into the four-card slide with one card blanked.
        #
        # Registered as a donor: an appendix chapter of three labelled points
        # borrows this rather than being drawn as three grey rectangles.
        c[15] = SlideRoleConfig(
            slide_number=15, content_types=['text'],
            roles=[
                _compound_by_names(
                    'essence_points', 'approach_points',
                    title_names=['Google Shape;969;p15', 'Google Shape;975;p15',
                                 'Google Shape;981;p15'],
                    body_names=['Google Shape;971;p15', 'Google Shape;977;p15',
                                'Google Shape;983;p15'],
                    desc='提案の要諦 3 cards: heading + detail',
                    font_group='p15_cards'),
                _text_collection_by_names(
                    'essence_headlines',
                    ['Google Shape;970;p15', 'Google Shape;976;p15',
                     'Google Shape;982;p15'],
                    'approach_points',
                    desc='提案の要諦 3 cards: the headline slot above each body',
                    item_field='subtitle', font_group='p15_cards'),
            ],
            description='Essence of the proposal — three point cards',
        )

        # Slide 38: six full-width rows, each a label chip on the left, a rule,
        # and its description on the right.
        #
        # The one design in this template built for a LABELLED LIST, which is
        # what most appendix content actually is — scope items, assumptions,
        # contract terms, deliverables. Without it those chapters were drawn as
        # a stack of identical rounded rectangles, which is why the appendix
        # read as filler. Six rows is the largest text capacity the template
        # offers, so it is also the fallback for chapters four and five points
        # long that the card designs cannot hold.
        #
        # Rows are listed top-down (0.91" … 4.53"); the template's shape
        # numbering does not follow its own vertical order.
        c[38] = SlideRoleConfig(
            slide_number=38, content_types=['text'],
            roles=[_compound_by_names(
                'deliverable_rows', 'deliverables_rows',
                title_names=['Google Shape;1386;p38', 'Google Shape;1391;p38',
                             'Google Shape;1411;p38', 'Google Shape;1401;p38',
                             'Google Shape;1406;p38', 'Google Shape;1396;p38'],
                body_names=['Google Shape;1385;p38', 'Google Shape;1390;p38',
                            'Google Shape;1410;p38', 'Google Shape;1400;p38',
                            'Google Shape;1405;p38', 'Google Shape;1395;p38'],
                desc='想定作成物 6 labelled rows: label chip + description'),
            ],
            description='Labelled list — six rows of label + description',
        )

        c[21] = SlideRoleConfig(
            slide_number=21, content_types=['table'],
            roles=[_table_by_index('approach_table', 2, 'approach_comparison',
                                   desc='アプローチ比較サマリ')],
        )

        # Slides 23, 24, 25: Assumptions — a two-column grid, BOTH columns
        # written: the label the document gave the row, then what the row says.
        #
        # The label column was left to the template, which was right only while
        # a proposal's assumptions came in the template's own nine categories
        # and in its order. An English proposal writes its own — `Programming
        # stack`, `External APIs and services` — and leaving the column alone
        # printed 開発言語 / 外部API beside them, naming a row after a category
        # the document never used.
        #
        # Each slide takes a slice of the assumptions list.
        c[23] = SlideRoleConfig(
            slide_number=23, content_types=['table'],
            roles=[_table_by_index('assumptions_table', 0, 'assumptions[0:5]',
                                   fill_cols=[0, 1],
                                   desc='前提条件 part1 (5 rows: 開発方針/品質戦略/開発言語/機能要件/非機能要件)')],
        )

        c[24] = SlideRoleConfig(
            slide_number=24, content_types=['table'],
            roles=[_table_by_index('assumptions_table', 0, 'assumptions[5:8]',
                                   fill_cols=[0, 1],
                                   desc='前提条件 part2 (3 rows: デザイン/外部API/その他)')],
        )

        c[25] = SlideRoleConfig(
            slide_number=25, content_types=['table'],
            roles=[_table_by_index('assumptions_table', 0, 'assumptions[8:9]',
                                   fill_cols=[0, 1],
                                   desc='前提条件 part3 (1 row: インフラ)')],
        )

        # Slide 33: Infrastructure configuration table (3 cols)
        c[33] = SlideRoleConfig(
            slide_number=33, content_types=['table'],
            roles=[_table_by_index('infrastructure_table', 0, 'infrastructure',
                                   desc='インフラ構成テーブル')],
        )

        # Slide 34: Software stack table (3 cols)
        c[34] = SlideRoleConfig(
            slide_number=34, content_types=['table'],
            roles=[_table_by_index('software_table', 0, 'software_stack',
                                   desc='ソフトウェア構成テーブル')],
        )

        # Slide 35: NFR sections (4 title+body pairs)
        # Order in template: Performance, Maintainability, Scalability, Availability
        c[35] = SlideRoleConfig(
            slide_number=35, content_types=['text'],
            roles=[_compound_by_indices(
                'nfr_sections', 'nfr_sections',
                title_indices=[5, 18, 14, 10],
                body_indices=[6, 19, 15, 11],
                desc='4 NFR title+body sections (Performance/Maintainability/Scalability/Availability)',
            )],
        )

        # Slide 36: Detailed NFR table (5 cols, 12-18 rows)
        c[36] = SlideRoleConfig(
            slide_number=36, content_types=['table'],
            roles=[_table_by_index('nfr_detailed_table', 0, 'nfr_detailed',
                                   desc='非機能要件詳細版テーブル')],
        )

        # Slide 39: Expected deliverables table (3 cols: 対応タスク/想定成果物/対象).
        # The table sits at index 1 — index 0 is the group holding the slide's
        # title and breadcrumb.
        c[39] = SlideRoleConfig(
            slide_number=39, content_types=['table'],
            roles=[_table_by_index('deliverables_table', 1, 'deliverables.rows',
                                   desc='想定成果物テーブル')],
        )

        # Slide 56: Cost table. The 費用 chapter spreads over slides 52-56 but
        # this is the only one carrying exactly one table, so it is where a
        # cost breakdown can be written without leaving a second sample table
        # beside it (slide 55 ships two, プランA and プランB).
        c[56] = SlideRoleConfig(
            slide_number=56, content_types=['table'],
            roles=[_table_by_index('cost_table', 2, 'cost.rows',
                                   desc='費用テーブル')],
        )

        # Slide 43: Development schedule (description text + Gantt image)
        c[43] = SlideRoleConfig(
            slide_number=43, content_types=['text', 'image'],
            roles=[
                _text_by_index('schedule_description', 0, 'schedule.description',
                               'スケジュール説明文'),
                _image_by_index('schedule_image', 15, 'schedule.image_path',
                                '開発スケジュール Gantt chart PNG'),
            ],
        )

    def get_template_info(self):
        return {
            'name': 'SVN Proposal Menu',
            'total_slides': 72,
            'configured_slides': len(self.slide_role_configs),
            'protected_slides': self.protected_slides,
            'version': '2.0.0',
        }


if __name__ == '__main__':
    t = SVNProposalTemplate()
    print(f'Configured slides: {sorted(t.slide_role_configs.keys())}')
    print(f'Total: {len(t.slide_role_configs)}')
    for sn in sorted(t.slide_role_configs.keys()):
        cfg = t.slide_role_configs[sn]
        print(f'  Slide {sn}: {len(cfg.roles)} role(s) — {[r.name for r in cfg.roles]}')
