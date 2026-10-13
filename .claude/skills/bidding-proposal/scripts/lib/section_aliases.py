"""Heading vocabulary — resolves one markdown heading to a profile section key.

`gen-md.py` writes profile markdown with fixed English headings (`## Features`),
but a proposal a human wrote names its chapters the way the document does:
`## 1\\. システムの概要 — System Overview`, `### 1.2 機能一覧`. Both must land on
the same section key, or the proposal's chapters fall out of the schema and get
rendered as loose appendix slides instead of filling their template slides.

Resolution is deliberately narrow. A heading is normalized (markdown escapes
removed, chapter numbering stripped, the `JP — English` gloss split) into a few
candidate spellings, and each is looked up in a fixed table. Nothing is guessed:
a heading that matches no entry resolves to None and the caller keeps its
existing fallback. Adding a new document wording means adding a line here.

Kept dependency-free so `profile_parser.py` and any future consumer can import
it without a cycle.
"""
from __future__ import annotations

import re

# `Sun\*` → `Sun*`, `1\.` → `1.` — markdown escapes as Google Docs exports them.
_MD_ESCAPE = re.compile(r'\\(.)')

# Chapter numbering a proposal puts in front of the real title: `1. `, `1.2 `,
# `5.1 `, `9.1 `, and the JP full-width variants.
_LEADING_NUMBER = re.compile(r'^\d+(?:\.\d+)*\s*[.．、）)]?\s+')

# `<JP title> — <English gloss>`; en dash and hyphen are accepted because which
# one a document uses is arbitrary.
_GLOSS_DASH = re.compile(r'\s+[—–-]\s+')

# Trailing parenthetical qualifier: `非機能要件（ROOV SLO 準拠）` → `非機能要件`.
_PAREN_SUFFIX = re.compile(r'[（(][^（()）]*[）)]\s*$')

# Canonical headings as gen-md.py writes them. Keys are lookup-normalized
# (casefolded, whitespace collapsed) — see `_lookup_key`.
_CANONICAL: dict[str, str] = {
    'cover': 'cover',
    'agenda': 'agenda',
    'project background': 'project_background',
    'features': 'features',
    'non-functional requirements (overview)': 'nfr_overview',
    'nfr overview': 'nfr_overview',
    'screen flow': 'screen_flow',
    'business process': 'business_process',
    'benefits': 'benefits',
    'approach comparison': 'approach_comparison',
    'assumptions': 'assumptions',
    'infrastructure': 'infrastructure',
    'software stack': 'software_stack',
    'nfr sections': 'nfr_sections',
    'nfr detailed': 'nfr_detailed',
    'schedule': 'schedule',
    'expected deliverables': 'deliverables',
    'deliverables': 'deliverables',
    'cost': 'cost',
    'team': 'team',
}

# Japanese chapter and subsection titles as the source proposals write them,
# plus the English glosses their AGENDA block pairs with each chapter.
#
# Note what is deliberately ABSENT: `システムの概要` / `system overview`. That
# chapter is a container — its own `###` subsections (背景・目的, 機能一覧) are
# the real sections, and the caller promotes them. Mapping the container itself
# would swallow all of them into one section.
_DOCUMENT_ALIASES: dict[str, str] = {
    # 1.x — inside the システムの概要 container
    'プロジェクト背景・目的': 'project_background',
    'プロジェクト背景': 'project_background',
    '背景・目的': 'project_background',
    # A chapter that names ONE BOX of the background slide rather than the whole
    # chapter. Slide 4 heads its two columns 現状の課題 and 目的・実現したいこと,
    # and a proposal that writes those as separate chapters is naming exactly
    # those boxes — so they resolve to the box, not to the section. Without this
    # the first chapter to arrive claimed the whole section and the other was
    # locked out by the duplicate-section guard.
    '現状の課題': 'project_background.current_issues',
    '現状の問題点': 'project_background.current_issues',
    'current challenges': 'project_background.current_issues',
    'current issues': 'project_background.current_issues',
    '目的・実現したいこと': 'project_background.objectives',
    '目的': 'project_background.objectives',
    'primary objective': 'project_background.objectives',
    'objectives': 'project_background.objectives',
    '機能一覧': 'features',
    '機能一覧表': 'features',
    'feature list': 'features',
    'function list': 'features',
    'functional requirements list': 'features',
    '画面遷移図': 'screen_flow',
    '業務フロー': 'business_process',
    '業務フロー図': 'business_process',
    # 2 — メリット
    'システム導入のメリット': 'benefits',
    'システムの導入のメリット': 'benefits',  # the template's own wording
    'advantages': 'benefits',
    'advantage of system introduction': 'benefits',
    'key benefits': 'benefits',
    # 3 — 提案の要諦
    '提案の要諦': 'approach_comparison',
    'the essence of the proposal': 'approach_comparison',
    # The same chapter as a Sun* proposal writes it in English. Both apostrophes
    # are listed because which one a document carries depends on whether it was
    # typed or pasted out of a word processor, not on what it means.
    "essence of sun*'s proposal": 'approach_comparison',
    'essence of sun*’s proposal': 'approach_comparison',
    "the essence of sun*'s proposal": 'approach_comparison',
    'the essence of sun*’s proposal': 'approach_comparison',
    # 5 — 前提条件. `estimated assumptions` is the template divider's own
    # wording; `estimation assumptions` is what a proposal actually writes, and
    # its absence sent a whole chapter to the appendix one subsection at a time
    # — with §5.8 `Infrastructure` claiming the System Architecture slides on
    # the way past.
    'お見積りの前提条件': 'assumptions',
    '見積りの前提条件': 'assumptions',
    '前提条件': 'assumptions',
    'estimated assumptions': 'assumptions',
    'estimation assumptions': 'assumptions',
    'assumptions and prerequisites': 'assumptions',
    # 6 — システム構成
    'システム構成図の提案': 'infrastructure',
    'システム構成図': 'infrastructure',
    'システム構成': 'infrastructure',
    'system architecture': 'infrastructure',
    'ソフトウェア構成': 'software_stack',
    '技術スタック': 'software_stack',
    # 8 — スケジュール. `システム開発スケジュール` is the title template slides 43
    # and 46 print above their own charts; without it an English deck kept a
    # Japanese headline over an English timeline.
    '実施スケジュール': 'schedule',
    'スケジュール': 'schedule',
    '全体スケジュール': 'schedule',
    '全体スケジュール案': 'schedule',
    '開発スケジュール': 'schedule',
    'システム開発スケジュール': 'schedule',  # the template's own slide-43 title
    'implementation schedule': 'schedule',
    'development schedule': 'schedule',
    # 7 — 想定成果物. The template's own divider spells it 想定作成物; both mean
    # the same chapter, so both resolve here.
    '想定成果物': 'deliverables',
    '想定作成物': 'deliverables',
    '成果物': 'deliverables',
    '提出物': 'deliverables',
    '納品物': 'deliverables',
    'the expected output': 'deliverables',
    # 9 — 費用
    '費用': 'cost',
    'お見積もりサマリ': 'cost',
    # 体制 — reaches divider 17 (the template's unused Sun*のスコープ chapter);
    # its slides are `org_chart` extras / a `###` table. Not `Sun*のスコープ`
    # itself: that wording names a scope split, which stays an appendix table.
    # Deliberately narrow: a bare 体制 / 開発体制 also names a subsection of
    # 前提条件 in ordinary proposals; a document that means the chapter can say
    # so in its front-matter `sections:` mapping.
    'プロジェクト体制': 'team',
    'プロジェクト体制図': 'team',
    '体制図': 'team',
    'project structure': 'team',
    'project organization': 'team',
    'team structure': 'team',
    'cơ cấu dự án': 'team',
    # non-functional, when a document gives them their own chapter
    'non-functional requirements': 'nfr_overview',
    'nonfunctional requirements': 'nfr_overview',
    '非機能要件': 'nfr_overview',
    '非機能要件一覧': 'nfr_overview',
    '非機能要件詳細': 'nfr_detailed',
}

_ALIASES: dict[str, str] = {**_CANONICAL, **_DOCUMENT_ALIASES}


def _lookup_key(text: str) -> str:
    """Casefold and collapse whitespace, including the JP full-width space."""
    return re.sub(r'\s+', ' ', text.replace('　', ' ')).strip().casefold()


def heading_variants(heading: str) -> list[str]:
    """Spellings of *heading* worth looking up, most specific first.

    `1\\. システムの概要 — System Overview` yields the whole normalized title,
    then the Japanese side, then the English gloss — so a document that writes
    only one of the two still resolves.

    Public because matching a heading against something other than the alias
    table needs the same normalization — the renderer pairs an appendix slide
    with its AGENDA line this way.
    """
    base = _MD_ESCAPE.sub(r'\1', heading).strip()
    base = _LEADING_NUMBER.sub('', base).strip()
    found = [base]
    parts = _GLOSS_DASH.split(base, maxsplit=1)
    if len(parts) > 1:
        found.extend(part.strip() for part in parts)
    # A parenthetical qualifier is a document's aside, never part of the name.
    for text in list(found):
        trimmed = _PAREN_SUFFIX.sub('', text).strip()
        if trimmed and trimmed != text:
            found.append(trimmed)
    return [text for text in found if text]


def heading_display(heading: str) -> str:
    """*heading* as it should READ on a slide: escapes and numbering gone.

    The most specific variant, which is the whole title minus the chapter
    number a document numbers its sections with — `### 1.1. Project Background`
    is titled `Project Background` on the slide, the way the template's own
    chrome is worded. The gloss is deliberately kept: a document writing
    `機能一覧 — Feature List` chose to show both halves.
    """
    variants = heading_variants(heading)
    return variants[0] if variants else ''


def is_schema_heading(heading: str) -> bool:
    """True when *heading* is one of gen-md's fixed English schema headings
    (`## Features`, `## Schedule`) rather than a title the document chose.

    A Japanese proposal authored in the schema shape still wants the template's
    Japanese slide titles (機能一覧, not `Features`); only a heading the author
    wrote in their own words should retitle a slide.

    The heading itself must BE the schema name. Matching any variant read a
    bilingual heading the author chose — `## 9. 費用 — Cost` — as plumbing on
    the strength of its gloss, and the slide lost the half the document wrote.
    """
    variants = heading_variants(heading)
    return bool(variants) and _lookup_key(variants[0]) in _CANONICAL


# Second tier: the WORD a chapter is about, for the wordings no table can
# enumerate. `## 5. Estimation Assumptions`, `## Assumptions & Prerequisites`
# and `## Estimation assumptions (POC)` are one chapter written three ways, and
# a table that must list all three will always be one wording behind the next
# proposal — which is not a cosmetic loss: a chapter that resolves to nothing
# gets taken apart into one appendix slide per subsection, where the template
# had a design drawn for exactly that chapter.
#
# Two rules keep this from becoming guesswork:
#
#   * every pattern is a WHOLE word (or the Japanese term), and decisive on its
#     own — `\bassumptions?\b` names the chapter, `\binfrastructure\b` does not
#     (it is equally at home in `Infrastructure cost`), so the second is absent;
#   * a heading matching TWO keys resolves to neither. `Infrastructure cost
#     (AWS pass-through)` is a cost table inside a cost chapter, and guessing
#     between the two is worse than the caller's own fallback.
#
# Exact aliases above always win, so nothing here can re-route a heading the
# table already understands.
_KEYWORD_RULES: tuple[tuple[str, str], ...] = (
    (r'\bassumptions?\b|\bprerequisites?\b|前提条件', 'assumptions'),
    (r'\bbenefits?\b|\badvantages?\b|メリット', 'benefits'),
    (r'\bfeature list\b|\bfunction list\b|\bfeature inventory\b|機能一覧', 'features'),
    (r'\bnon-?functional requirements?\b|非機能要件', 'nfr_overview'),
    (r'\bscreen (?:flow|transition)s?\b|画面遷移', 'screen_flow'),
    (r'\bbusiness (?:process|flow)\b|業務フロー', 'business_process'),
    (r'\b(?:technology|tech|software|programming) stack\b|技術スタック', 'software_stack'),
    (r'\bdeliverables?\b|成果物', 'deliverables'),
    (r'\b(?:implementation|project|delivery) schedule\b|スケジュール', 'schedule'),
    (r'\bcosts?\b|\bpricing\b|\bquotation\b|費用', 'cost'),
    (r'\bsystem architecture\b|システム構成', 'infrastructure'),
)

_KEYWORD_RULES_COMPILED = tuple(
    (re.compile(pattern, re.IGNORECASE), key) for pattern, key in _KEYWORD_RULES
)


def _keyword_key(candidate: str) -> str | None:
    """The one section *candidate* is unambiguously about, or None.

    None on no match AND on more than one match — see `_KEYWORD_RULES`.
    """
    matched = {key for pattern, key in _KEYWORD_RULES_COMPILED
               if pattern.search(candidate)}
    return matched.pop() if len(matched) == 1 else None


def heading_label(heading: str) -> str:
    """*heading* as a table row's NAME: display form, minus any aside.

    `heading_display` keeps a trailing parenthetical because a chapter TITLE may
    depend on it. A label cell cannot afford one: the assumptions grid gives its
    name column about an inch, and `Programming stack (proposed — to be agreed
    with Adrian)` was cut to `Programming stack (proposed…` there, which names
    the row worse than the two words that matter.
    """
    display = heading_display(heading)
    trimmed = _PAREN_SUFFIX.sub('', display).strip()
    return trimmed or display


def resolve_section_key(heading: str, *, keywords: bool = True) -> str | None:
    """Return the profile target *heading* names, or None if it names none.

    The target is a section key (`features`) or, when the heading names one BOX
    of a section rather than the whole chapter, a `section.field` path
    (`project_background.current_issues`) — the same dotted convention
    `ShapeRole.source_path` uses in `templates/svn.py`.

    Two tiers, exact first: the alias table, then — unless `keywords=False` —
    the keyword rules, for a wording no table anticipated. A heading that
    matches neither, or that matches two keywords at once, resolves to None,
    which is not a failure but the signal that the caller should apply its own
    fallback (promote the block's subsections, or route it to an extra slide).

    Pass `keywords=False` when the string is not known to BE a heading. The
    keyword tier answers "what is this chapter about", and asked of arbitrary
    slide text it answers far too readily: `費用の概要です。` is a sentence about
    cost, `System Overview ｜ Feature List` is a breadcrumb naming two chapters,
    and a caller that treats either as a heading will overwrite it.
    """
    candidates = heading_variants(heading)
    for candidate in candidates:
        key = _ALIASES.get(_lookup_key(candidate))
        if key:
            return key
    if not keywords:
        return None
    for candidate in candidates:
        key = _keyword_key(candidate)
        if key:
            return key
    return None
