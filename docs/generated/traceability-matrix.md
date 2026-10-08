# Traceability Matrix

**Project**: Project
**Generated**: 2026-10-08T06:53:23Z
**Scope**: Full codebase

> **Re-projection, not detection.** Every ID below already exists in its source-of-record artifact — this file invents nothing, and is never the first place an ID appears. Source of record per column: `F###` <- `generated/feature-list.md`; `SCR###` <- `generated/screen-list.md`; `US###` <- `generated/user-stories.md`; `BL###` <- `generated/behavior-logic.md`; `ROUTE###` <- `generated/route-list.md` (`Owner F###` column); `PERM###` <- `generated/permissions-matrix.md`.

---

## Matrix

| F### | SCR### | US### | BL### | ROUTE### | PERM### |
|---|---|---|---|---|---|
| F001 | SCR001, SCR002 | US001, US002, US003, US004, US005, US006 | — | ROUTE001, ROUTE002 | PERM001, PERM002, PERM003, PERM004, PERM005, PERM006, PERM007, PERM008, PERM009 |
| F002 | SCR001, SCR002 | US007, US008 | — | — | — |
| F003 | SCR003 | — | — | — | — |

---

## Cross-Reference Validation

- [x] Every `SCR###`/`US###`/`BL###`/`PERM###` cell is projected from `generated/feature-list.md`'s own per-feature `**Related X**:` bullets
- [x] Every `ROUTE###` cell is projected from `generated/route-list.md`'s own `Owner F###` column
- [x] No ID in this matrix is invented — see `validate_traceability_matrix.py` for the WARN-first cross-check against each source-of-record inventory
