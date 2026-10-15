'use client'

import type { FilterOptions, KudoFilters } from '@/lib/kudos/kudo-board-types'
import { useFilterDropdown } from '../_behavior/use-filter-dropdown'
import { useKudoFilterNavigation } from '../_behavior/use-kudo-filter-navigation'
import { FilterDropdownView } from '../_components/filter-dropdown-view'
import type { FilterOption } from '../_components/kudos-view-types'
import type { FilterTexts } from './build-kudos-labels'

type DropdownProps = {
  testId: string
  label: string
  clearLabel: string
  options: FilterOption[]
  selected: string | null
  onSelect: (value: string | null) => void
}

/** One dropdown with its own open state; the wrapper with `contents` lets the hook tell inside clicks from outside ones. */
function FilterDropdown({ onSelect, ...view }: DropdownProps) {
  const { open, rootRef, toggle, select } = useFilterDropdown(onSelect)
  return (
    <div ref={rootRef} className="contents">
      <FilterDropdownView {...view} open={open} onToggle={toggle} onSelect={select} />
    </div>
  )
}

type FilterBarContainerProps = { filters: KudoFilters; options: FilterOptions; texts: FilterTexts }

/** Hashtag and department dropdowns (B.1.1, B.1.2). A choice rewrites the URL query; the server re-renders both blocks. */
export function FilterBarContainer({ filters, options, texts }: FilterBarContainerProps) {
  const { selectHashtag, selectDepartment } = useKudoFilterNavigation(filters)

  return (
    <div className="flex flex-wrap items-center gap-4">
      <FilterDropdown
        testId="kudos-filter-hashtag"
        label={texts.hashtag}
        clearLabel={texts.clear}
        options={options.hashtags.map((tag) => ({ value: tag.slug, label: tag.label }))}
        selected={filters.hashtag}
        onSelect={selectHashtag}
      />
      <FilterDropdown
        testId="kudos-filter-department"
        label={texts.department}
        clearLabel={texts.clear}
        options={options.departments.map((entry) => ({ value: entry.code, label: entry.name }))}
        selected={filters.department}
        onSelect={selectDepartment}
      />
    </div>
  )
}
