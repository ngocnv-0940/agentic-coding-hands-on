"""Canonical ProjectProfile dataclass — the contract between gen-md and gen-slide.

The profile is domain-organized (not slide-organized). Each section maps to
one `## Heading` in the project_profile markdown.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Optional


# ---------------------------------------------------------------------------
# Compound sub-blocks
# ---------------------------------------------------------------------------

@dataclass
class AfterBlock:
    """One business_process 'after' block: category benefit title + body."""
    title: str = ''
    body: str = ''


@dataclass
class BenefitSection:
    """One benefit (title + multi-line content). Slides 12+13 fill 2 each."""
    title: str = ''
    content: str = ''


@dataclass
class AssumptionSection:
    """One assumption row: label (fixed in template) + content (filled)."""
    label: str = ''
    content: str = ''


@dataclass
class NFRSection:
    """One non-functional requirement section: title + body (5 bullets)."""
    title: str = ''
    body: str = ''


# ---------------------------------------------------------------------------
# Top-level section wrappers (for sections with multiple subfields)
# ---------------------------------------------------------------------------

@dataclass
class CoverSection:
    """Cover slide (template slide 1) text. Empty fields keep the template's
    own wording, so a profile without a `## Cover` section renders as before.

    `company` is the CLIENT COMPANY NAME (e.g. 'Styleport'), not a product or
    proposal title — it fills the cover's large headline. A company name is
    always short enough for that box's single line, which is why the box is
    never resized. The smaller '○○株式会社　御中' line above it is intentionally
    not a field: it is fixed at the template's own wording in every deck.
    """
    company: str = ''
    date: str = ''


@dataclass
class AgendaSection:
    """Agenda slide (template slide 2) lines, copied from the source document's
    own AGENDA block rather than glossed by the renderer.

    Each item is one display line, `<JP chapter label> — <English gloss>` (the
    exact form the source proposals write). The renderer splits on the dash so
    the label keeps the template's bold black run and the gloss its grey 9pt
    one; an item with no dash renders as a label-only line.

    `chapters` fills the main list; `cost_breakdown` fills the small box under
    it (the 費用 sub-items). Empty lists keep the template's own lines, which
    the renderer then glosses from `AGENDA_GLOSSES` as a fallback.
    """
    chapters: list[str] = field(default_factory=list)
    cost_breakdown: list[str] = field(default_factory=list)


@dataclass
class BackgroundSection:
    current_issues: str = ''
    objectives: str = ''


@dataclass
class FeaturesSection:
    description: str = ''
    table: list[dict] = field(default_factory=list)
    # The chapter's `####` sub-blocks, each `{label, table}`. A feature chapter
    # written as `#### 1.4.1 Screen groups` / `#### 1.4.2 Full feature breakdown`
    # holds SEVERAL tables, and slide 5 has a labelled pill above its grid that
    # exists precisely to name which one is on screen.
    #
    # Read as one block those tables merged: the second table's header row
    # rendered as a data row, and its extra column was cut to fit the first
    # table's grid. Kept apart, each gets its own slide with its own label.
    #
    # Empty for a chapter with a single unlabelled table — `table` alone still
    # describes it, which is the shape gen-md.py emits.
    groups: list[dict] = field(default_factory=list)


@dataclass
class NFROverviewSection:
    description: str = ''
    table: list[dict] = field(default_factory=list)


@dataclass
class ScreenFlowSection:
    image_path: str = ''


@dataclass
class BusinessProcessSection:
    categories: list[str] = field(default_factory=list)
    before_steps: list[str] = field(default_factory=list)
    after_blocks: list[AfterBlock] = field(default_factory=list)


@dataclass
class TableSection:
    """A chapter the deck renders as one table, plus the wording around it.

    `title` and `description` matter because the template slides these fill were
    authored for a different proposal: slide 56 is headed
    'お見積もりサマリ　補足 - Advanced' and describes 諸経費, which says nothing
    about a 役割/工数 table written in the source document. Carrying the source's
    own heading and lead-in lets the renderer replace both.
    """
    title: str = ''
    description: str = ''
    rows: list[dict] = field(default_factory=list)


@dataclass
class ScheduleSection:
    description: str = ''
    image_path: str = ''
    # A milestone table the schedule chapter carries alongside its Gantt chart.
    # Slide 43 has no table shape to hold it, so the renderer gives it a slide
    # of its own rather than dropping it — see `_build_orphan_table_extras`.
    table: list[dict] = field(default_factory=list)
    # A `工程 | 担当 | 開始 | 終了` table becomes bars drawn natively inside
    # slide 43's Gantt frame (`schedule_gantt_fill`); ▲/★ rows are milestones.
    gantt_rows: list[dict] = field(default_factory=list)
    milestones: list[dict] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Root ProjectProfile
# ---------------------------------------------------------------------------

@dataclass
class ProjectProfile:
    """Root project profile, organized by business domain."""
    project_id: str = ''
    timestamp: str = ''

    cover: CoverSection = field(default_factory=CoverSection)
    agenda: AgendaSection = field(default_factory=AgendaSection)
    project_background: BackgroundSection = field(default_factory=BackgroundSection)
    features: FeaturesSection = field(default_factory=FeaturesSection)
    # Nothing else to add here — `FeaturesSection` carries the groups.
    nfr_overview: NFROverviewSection = field(default_factory=NFROverviewSection)
    screen_flow: ScreenFlowSection = field(default_factory=ScreenFlowSection)
    business_process: BusinessProcessSection = field(default_factory=BusinessProcessSection)

    # Variable-length collections (no fixed structure beyond sub-block)
    benefits: list[BenefitSection] = field(default_factory=list)
    approach_comparison: list[dict] = field(default_factory=list)
    # The same chapter (提案の要諦 / The essence of the proposal) written as
    # POINTS rather than as a comparison matrix. A Japanese proposal states it as
    # a table and fills slide 21; an English one states it as `###` subsections
    # and fills slide 16's four cards. One chapter, two shapes, two slides —
    # whichever the document actually wrote is the one that survives pruning.
    # Each entry: {title, subtitle, body}.
    approach_points: list[dict] = field(default_factory=list)
    assumptions: list[AssumptionSection] = field(default_factory=list)
    infrastructure: list[dict] = field(default_factory=list)
    software_stack: list[dict] = field(default_factory=list)
    nfr_sections: list[NFRSection] = field(default_factory=list)
    nfr_detailed: list[dict] = field(default_factory=list)
    # Chapters the SVN template gives their own divider + slide but the
    # schema had no home for, so they used to land as loose appendix slides.
    deliverables: TableSection = field(default_factory=TableSection)
    cost: TableSection = field(default_factory=TableSection)

    schedule: ScheduleSection = field(default_factory=ScheduleSection)
    # プロジェクト体制 — owns chapter divider 17 but no content slide: its body
    # is `--extra-slides` (`org_chart`) and/or a `###` table, pinned after the
    # divider (see `DIVIDER_ONLY_SECTIONS` in templates/svn.py).
    team: TableSection = field(default_factory=TableSection)

    # Parser-internal: order in which `##` section headings were first seen in
    # the source markdown. NOT part of the agent-authored JSON contract — it is
    # derived by `parse_profile` and excluded from `to_dict`/`from_dict`.
    section_order: list[str] = field(default_factory=list)

    # Parser-internal: {section key: the heading the SOURCE DOCUMENT gave it},
    # numbering stripped. The template titles each slide with the wording of
    # the proposal it was authored for (`プロジェクト背景`), which is the wrong
    # chapter name — and, on an English document, the wrong language too. The
    # document's own heading is the right answer to both, so the renderer
    # retitles from here. Excluded from `to_dict`/`from_dict`.
    section_headings: dict[str, str] = field(default_factory=dict)

    # Parser-internal: {section key: the `##` CHAPTER heading it sat under}.
    # `section_headings` records the subsection (`Key Benefits`); a chapter
    # divider announces the chapter (`Benefits of the Proposed Solution`), and
    # those are different lines of the document. Without this the renderer had
    # only string similarity to connect a divider to the chapter it introduces,
    # which fails for any proposal not worded like the template.
    #
    # For a CONTAINER chapter the heading recorded here is the container's, so
    # its siblings group under one name and share one divider — see
    # `chapter_dividers.chapter_groups`. Excluded from `to_dict`/`from_dict`.
    section_chapters: dict[str, str] = field(default_factory=dict)

    # Parser-internal: {section key: the CONTAINER chapter it was lifted out
    # of}. A container is a `##` chapter whose `###` subsections are the real
    # sections; its siblings share ONE divider, named after the container.
    #
    # Kept apart from `section_chapters` on purpose. That one answers "what did
    # the document call this section's chapter" for EVERY section, which is a
    # different question: reading it as container membership made an ordinary
    # chapter its own container and renamed its divider after its single
    # section — `System Overview ｜ 機能一覧` came out `機能一覧 ｜ 機能一覧`.
    # Deciding by group SIZE instead was no better: a container whose second
    # subsection is absent from this document is still a container, and it lost
    # its name. Only the parser knows which it is, so it says so here.
    # Excluded from `to_dict`/`from_dict`.
    section_containers: dict[str, str] = field(default_factory=dict)

    # Parser-internal: whether the SOURCE DOCUMENT is written in Japanese,
    # decided by the presence of kana. The template is a Japanese deck, so a
    # few of its fixed shapes only make sense on a Japanese proposal — see
    # `_fill_cover_slide`. Excluded from `to_dict`/`from_dict`.
    is_japanese_source: bool = True

    # Parser-internal: whether this document opted into content SHAPING — list
    # items promoted into the prose boxes, and text condensed to each box's real
    # budget instead of poured in until full.
    #
    # The switch is the presence of front matter, which only a supplied document
    # carries: an agent that read the whole proposal wrote it. gen-md.py's own
    # markdown has none, so the Clio path keeps its exact prior behavior and
    # cannot be changed by this feature. Excluded from `to_dict`/`from_dict`.
    shape_content: bool = False

    # Parser-internal: extra-slide entries auto-routed by
    # `extra_slide_classifier` for `##` headings that didn't match any known
    # section (hand-written markdown with its own heading vocabulary). Same
    # shape as --extra-slides JSON entries. Excluded from `to_dict`/`from_dict`.
    auto_extra_slides: list[dict] = field(default_factory=list)

    @classmethod
    def empty(cls, project_id: str = '', timestamp: str = '') -> 'ProjectProfile':
        """Factory returning an instance with all fields defaulted."""
        return cls(project_id=project_id, timestamp=timestamp)

    @classmethod
    def from_dict(cls, data: dict) -> 'ProjectProfile':
        """Build a ProjectProfile from a plain dict (e.g. JSON input from agent).

        Tolerant: unknown keys ignored, missing keys use defaults.
        """
        def _section(cls_, payload):
            if not isinstance(payload, dict):
                return cls_()
            valid = {f for f in cls_.__dataclass_fields__}
            return cls_(**{k: v for k, v in payload.items() if k in valid})

        def _list_of(cls_, payload):
            if not isinstance(payload, list):
                return []
            return [_section(cls_, item) for item in payload]

        return cls(
            project_id=data.get('project_id', ''),
            timestamp=data.get('timestamp', ''),
            cover=_section(CoverSection, data.get('cover')),
            agenda=_section(AgendaSection, data.get('agenda')),
            project_background=_section(BackgroundSection, data.get('project_background')),
            features=_section(FeaturesSection, data.get('features')),
            nfr_overview=_section(NFROverviewSection, data.get('nfr_overview')),
            screen_flow=_section(ScreenFlowSection, data.get('screen_flow')),
            business_process=BusinessProcessSection(
                categories=data.get('business_process', {}).get('categories', []) or [],
                before_steps=data.get('business_process', {}).get('before_steps', []) or [],
                after_blocks=_list_of(AfterBlock, data.get('business_process', {}).get('after_blocks')),
            ),
            benefits=_list_of(BenefitSection, data.get('benefits')),
            approach_comparison=data.get('approach_comparison', []) or [],
            assumptions=_list_of(AssumptionSection, data.get('assumptions')),
            infrastructure=data.get('infrastructure', []) or [],
            software_stack=data.get('software_stack', []) or [],
            nfr_sections=_list_of(NFRSection, data.get('nfr_sections')),
            nfr_detailed=data.get('nfr_detailed', []) or [],
            deliverables=_section(TableSection, data.get('deliverables')),
            cost=_section(TableSection, data.get('cost')),
            schedule=_section(ScheduleSection, data.get('schedule')),
            team=_section(TableSection, data.get('team')),
        )

    def to_dict(self) -> dict:
        """Serialize to a plain dict (round-trippable through from_dict).

        `section_order`, `section_headings`, `is_japanese_source` and
        `auto_extra_slides` are parser-internal (derived from source markdown),
        not part of the agent-authored JSON contract, so they're excluded here.
        """
        d = asdict(self)
        for internal in ('section_order', 'section_headings', 'section_chapters',
                         'section_containers', 'is_japanese_source',
                         'auto_extra_slides'):
            d.pop(internal, None)
        return d


# ---------------------------------------------------------------------------
# Section content predicates — single source of truth for "does this section
# have content", shared by gen-md (`_emit_*` guards) and the renderer's
# prune+reorder pass so the two can never diverge.
# ---------------------------------------------------------------------------

_SECTION_CONTENT_CHECKS = {
    # cover/agenda own no SECTION_TO_SLIDES entry — they fill slides 1 and 2 in
    # place. They are listed anyway so the parser's duplicate-section guard can
    # ask about every key an alias can resolve to; without them a second
    # `## Cover` would silently overwrite the first.
    'cover':              lambda p: bool(p.cover.company or p.cover.date),
    'agenda':             lambda p: bool(p.agenda.chapters or p.agenda.cost_breakdown),
    'project_background': lambda p: bool(p.project_background.current_issues or p.project_background.objectives),
    'features':           lambda p: bool(p.features.description or p.features.table),
    'nfr_overview':       lambda p: bool(p.nfr_overview.description or p.nfr_overview.table),
    'screen_flow':        lambda p: bool(p.screen_flow.image_path),
    'business_process':   lambda p: bool(p.business_process.categories or p.business_process.before_steps or p.business_process.after_blocks),
    'benefits':           lambda p: bool(p.benefits),
    'approach_comparison': lambda p: bool(p.approach_comparison or p.approach_points),
    'assumptions':        lambda p: bool(p.assumptions),
    'infrastructure':     lambda p: bool(p.infrastructure),
    'software_stack':     lambda p: bool(p.software_stack),
    'nfr_sections':       lambda p: bool(p.nfr_sections),
    'nfr_detailed':       lambda p: bool(p.nfr_detailed),
    'deliverables':       lambda p: bool(p.deliverables.rows),
    'cost':               lambda p: bool(p.cost.rows),
    'schedule':           lambda p: bool(p.schedule.description or p.schedule.image_path
                                          or p.schedule.gantt_rows),
    'team':               lambda p: bool(p.team.description or p.team.rows),
}


def section_has_content(profile: 'ProjectProfile', key: str) -> bool:
    """Return True if `profile`'s section `key` has content worth rendering.

    `key` must be one of `SECTION_TO_SLIDES`'s keys (== ProjectProfile field
    names). Unknown keys are treated as empty (False) rather than raising, so
    callers iterating over an untrusted/older `section_order` stay safe.
    """
    check = _SECTION_CONTENT_CHECKS.get(key)
    return bool(check(profile)) if check else False


# ---------------------------------------------------------------------------
# Field-level targets — a heading may name one BOX of a section, not the section
# ---------------------------------------------------------------------------
#
# A template slide can carry two boxes with different meanings: slide 4 heads its
# left column `現状の課題` and its right one `目的・実現したいこと`. A proposal
# routinely writes those as two separate chapters (`1.2 Current Challenges`,
# `1.3 Primary Objective`), and a mapping that only addresses SECTIONS cannot say
# which chapter fills which box — the first chapter to resolve claims the whole
# section and the second is locked out by the duplicate-section guard.
#
# So a mapping target may also be `section.field`. The set below is the allowlist
# that makes that safe: only dataclass sections with more than one meaningful
# text field are listed, and only their own field names are accepted. It is
# deliberately NOT derived from `dataclasses.fields` wholesale — `table` /
# `image_path` / `rows` are structural, not prose boxes, and letting a heading
# target them would put raw markdown where a grid belongs.
FIELD_TARGETS: dict[str, set[str]] = {
    'project_background': {'current_issues', 'objectives'},
    'features':           {'description'},
    'nfr_overview':       {'description'},
    'schedule':           {'description'},
}


def field_has_content(profile: 'ProjectProfile', dotted: str) -> bool:
    """Return True if `profile`'s `section.field` already holds content.

    The field-level twin of `section_has_content`, powering the same
    first-occupant-wins rule at box resolution: two chapters may fill two boxes
    of one section, but never the same box twice.
    """
    section_key, _, field_name = dotted.partition('.')
    if field_name not in FIELD_TARGETS.get(section_key, ()):
        return False
    section = getattr(profile, section_key, None)
    return bool(getattr(section, field_name, '')) if section is not None else False
