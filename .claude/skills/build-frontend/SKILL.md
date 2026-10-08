---
name: tkm:build-frontend
description: Shape the surface the user touches — React/TypeScript frontends with modern patterns. Components, Suspense, lazy loading, useSuspenseQuery, MUI v7, TanStack Router, performance optimization.
argument-hint: "[component or feature]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
module: design-frontend
triggers: ["React component", "TypeScript frontend", "TanStack Router", "MUI", "useSuspenseQuery", "lazy loading"]
---

# Build Frontend

React/TypeScript frontends: components that settle calmly, data that arrives without the
layout lurching.

## Project-bound, and how to tell

**Read this before using any name below.** The conventions in this skill come from one
codebase. `SuspenseLoader`, `useMuiSnackbar`, the `@/` `~types` `~components` `~features`
aliases, the `features/<name>/{api,components,hooks,helpers}` layout — none of these are React
conventions. They are that project's.

In any other codebase, **grep for the name before you import it.** A `SuspenseLoader` that does
not exist is a build error; a `useMuiSnackbar` invented because this file mentions it is worse,
because it reads as if the project had a notification system when it does not. Where the local
equivalent exists under another name, use that one. Where none exists, write the plain React
and say which convention you did not find.

## Invariants

1. **Anything heavy loads lazily** — routes, data grids, charts, editors — and every lazy
   component sits behind a Suspense boundary.
2. **Suspense owns the loading moment; never return early.** An early return is what makes the
   layout jump when the data lands.
3. **`useSuspenseQuery` is the default for new fetches**, where the project already uses
   TanStack Query.
4. **A feature keeps its shape** — its api, components, hooks and helpers travel together, so
   the feature can be read, moved or deleted as one thing.
5. **Style placement follows size** — inline while small, its own file once it is not.
6. **Check the convention exists before you follow it** (see above).

## Navigation Guide

| When the task is... | Open this resource |
|------------|-------------------|
| Build a component | [component-patterns.md](resources/component-patterns.md) |
| Pull in data | [data-fetching.md](resources/data-fetching.md) |
| Decide where files live | [file-organization.md](resources/file-organization.md) |
| Style a component | [styling-guide.md](resources/styling-guide.md) |
| Wire a route | [routing-guide.md](resources/routing-guide.md) |
| Cover loading and failure | [loading-and-error-states.md](resources/loading-and-error-states.md) |
| Tune performance | [performance.md](resources/performance.md) |
| Get the types right | [typescript-standards.md](resources/typescript-standards.md) |
| Forms, auth, or DataGrid | [common-patterns.md](resources/common-patterns.md) |
| See it all assembled | [complete-examples.md](resources/complete-examples.md) |

---

## File structure (this project's)

```
src/
  features/
    my-feature/
      api/
        myFeatureApi.ts       # API service
      components/
        MyFeature.tsx         # Main component
        SubComponent.tsx      # Related components
      hooks/
        useMyFeature.ts       # Custom hooks
        useSuspenseMyFeature.ts  # Suspense hooks
      helpers/
        myFeatureHelpers.ts   # Utilities
      types/
        index.ts              # TypeScript types
      index.ts                # Public exports

  components/
    SuspenseLoader/
      SuspenseLoader.tsx      # Reusable loader
    CustomAppBar/
      CustomAppBar.tsx        # Reusable app bar

  routes/
    my-route/
      index.tsx               # Route component
      create/
        index.tsx             # Nested route
```

---

## Skills That Sit Alongside This One

- **error-tracking**: Sentry-based error tracking — it reaches into the frontend too
- **backend-dev-guidelines**: the API shapes on the other side of the wire that this code consumes

---

**Skill Status**: Split into modules that load on demand, so the context window only carries what the current task needs.
