"""Which chapter divider a section reaches, and what that divider is called.

Two cases the plain `CHAPTER_DIVIDERS` reverse lookup cannot express:

- A CONTAINER chapter (`## 5. 開発スケジュールおよび成果物` holding `###`
  schedule and `###` deliverables): its sections own two different template
  dividers (41 and 37), but the document has ONE chapter — so every sibling
  maps to the first sibling's divider, and that divider is named after the
  container heading, not the template's wording.
- A DIVIDER-ONLY section (`team` → slide 17): it has no content slide; its
  body arrives as extra slides pinned right after the divider.

Pure functions over the profile — the renderer owns the slide surgery.
"""
from __future__ import annotations

import re
from typing import Optional

from lib.section_aliases import heading_variants


def own_divider(key: str, slide_to_divider: dict, section_to_slides: dict,
                divider_only: dict) -> Optional[int]:
    """The template divider *key* reaches on its own (ignoring containers)."""
    if key in divider_only:
        return divider_only[key]
    slides = section_to_slides.get(key) or []
    return slide_to_divider.get(slides[0]) if slides else None


def chapter_groups(profile) -> dict:
    """{container heading: [section keys]} in markdown order.

    Reads `section_containers`, which the parser writes ONLY for a section it
    lifted out of a container chapter. `section_chapters` records the `##`
    heading of every section for a different purpose and must not be read here:
    doing so turned each ordinary chapter into its own container.
    """
    groups: dict = {}
    for key in profile.section_order:
        chapter = getattr(profile, 'section_containers', {}).get(key)
        if chapter:
            groups.setdefault(chapter, []).append(key)
    return groups


def chapter_divider_map(profile, slide_to_divider: dict, section_to_slides: dict,
                        divider_only: dict) -> dict:
    """{section key: divider slide number}, siblings of one container sharing
    the first sibling's divider."""
    keys = list(profile.section_order) + [k for k in divider_only if k not in profile.section_order]
    result = {key: own_divider(key, slide_to_divider, section_to_slides, divider_only)
              for key in keys}
    for keys in chapter_groups(profile).values():
        shared = next((result[k] for k in keys if result.get(k) is not None), None)
        for key in keys:
            result[key] = shared
    return result


def divider_titles(profile, slide_to_divider: dict, section_to_slides: dict,
                   divider_only: dict, has_content, default_headings: dict = None) -> list:
    """[(divider slide number, chapter heading, section keys)] for every divider
    whose name must come from the SOURCE rather than the template: container
    chapters and divider-only sections that have content."""
    dividers = chapter_divider_map(profile, slide_to_divider, section_to_slides, divider_only)
    out = []
    for heading, keys in chapter_groups(profile).items():
        live = [k for k in keys if has_content(profile, k)]
        if live and dividers.get(live[0]) is not None:
            out.append((dividers[live[0]], heading, live))
    grouped = {key for keys in chapter_groups(profile).values() for key in keys}
    for key, divider in divider_only.items():
        # A divider-only section names its own divider unless a container
        # gathered it. Testing `section_chapters` here swept `team` into any
        # chapter that happened to share its heading text.
        if key in grouped or not has_content(profile, key):
            continue
        fallback = (default_headings or {}).get(key)
        heading = profile.section_headings.get(key) or (
            f'{fallback[0]} — {fallback[1]}' if fallback else key)
        out.append((divider, heading, [key]))
    return out


def chapter_name_parts(heading: str) -> tuple:
    """`開発スケジュールおよび成果物 — Schedule & Deliverables` → (JP, gloss).
    A heading without a gloss returns ('' , '') for the gloss half."""
    variants = heading_variants(heading)
    if len(variants) >= 3 and variants[0] != variants[1]:
        return variants[1], variants[2]
    return (variants[0] if variants else heading), ''


def _key_of(text: str) -> str:
    return re.sub(r'\s+', '', text.replace('　', '')).casefold()


def extends_label(title: str, label: str) -> bool:
    """True when *title* is *label* plus a qualifier — `プロジェクト体制（要件定義）`
    against `プロジェクト体制` — so the slide must keep its own, longer name."""
    label_key = _key_of(label)
    return any(_key_of(v) != label_key and _key_of(v).startswith(label_key)
               for v in heading_variants(title))
