import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const

// Icons of the Viết Kudo modal. The Figma exports ship a hard-coded white fill; each path is re-coloured with
// `currentColor` so the parent sets the design colour. Link, send and chevron reuse the F006 icons in kudos-icons.tsx.

// mm:I520:11647;520:9881;186:1420
export function IconBold(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M13.5 15.5H10V12.5H13.5C13.8978 12.5 14.2794 12.658 14.5607 12.9393C14.842 13.2206 15 13.6022 15 14C15 14.3978 14.842 14.7794 14.5607 15.0607C14.2794 15.342 13.8978 15.5 13.5 15.5ZM10 6.5H13C13.3978 6.5 13.7794 6.65804 14.0607 6.93934C14.342 7.22064 14.5 7.60218 14.5 8C14.5 8.39782 14.342 8.77936 14.0607 9.06066C13.7794 9.34196 13.3978 9.5 13 9.5H10M15.6 10.79C16.57 10.11 17.25 9 17.25 8C17.25 5.74 15.5 4 13.25 4H7V18H14.04C16.14 18 17.75 16.3 17.75 14.21C17.75 12.69 16.89 11.39 15.6 10.79Z"
        fill="currentColor"
      />
    </svg>
  )
}

// mm:I520:11647;662:11119;186:1420
export function IconItalic(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 4V7H12.21L8.79 15H6V18H14V15H11.79L15.21 7H18V4H10Z" fill="currentColor" />
    </svg>
  )
}

// mm:I520:11647;662:11213;186:1420
export function IconStrikethrough(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M7.62432 9.37769C6.42432 7.07769 8.12432 4.37769 10.5243 3.87769C13.6243 2.87769 18.1243 4.27769 18.0243 8.07769H15.0243C15.0243 7.77769 14.9243 7.47769 14.9243 7.27769C14.7243 6.67769 14.3243 6.37769 13.7243 6.17769C12.9243 5.87769 11.6243 5.97769 10.9243 6.47769C9.42432 7.77769 10.8243 9.07769 12.4243 9.57769H7.82432C7.72432 9.47769 7.72432 9.37769 7.62432 9.37769ZM21.4243 12.5777V10.5777H3.42432V12.5777H13.0243C13.2243 12.6777 13.4243 12.6777 13.6243 12.7777C14.2243 13.0777 14.7243 13.2777 14.9243 13.8777C15.0243 14.2777 15.1243 14.7777 14.9243 15.1777C14.7243 15.6777 14.3243 15.8777 13.8243 16.0777C12.0243 16.5777 9.82432 15.8777 9.92432 13.6777H6.92432C6.82432 16.2777 9.02432 18.0777 11.4243 18.3777C15.2243 19.1777 19.7243 16.7777 17.7243 12.4777L21.4243 12.5777Z"
        fill="currentColor"
      />
    </svg>
  )
}

// mm:I520:11647;662:10376;186:1420
export function IconOrderedList(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M7 13V11H21V13H7ZM7 19V17H21V19H7ZM7 7V5H21V7H7ZM3 8V5H2V4H4V8H3ZM2 17V16H5V20H2V19H4V18.5H3V17.5H4V17H2ZM4.25 10C4.44891 10 4.63968 10.079 4.78033 10.2197C4.92098 10.3603 5 10.5511 5 10.75C5 10.95 4.92 11.14 4.79 11.27L3.12 13H5V14H2V13.08L4 11H2V10H4.25Z"
        fill="currentColor"
      />
    </svg>
  )
}

// mm:I520:11647;662:10647;186:1420
export function IconQuote(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M12.9999 6V14H14.8799L12.8799 18H18.6199L20.9999 13.24V6M14.9999 8H18.9999V12.76L17.3799 16H16.1199L18.1199 12H14.9999M2.99988 6V14H4.87988L2.87988 18H8.61988L10.9999 13.24V6M4.99988 8H8.99988V12.76L7.37988 16H6.11988L8.11988 12H4.99988V8Z"
        fill="currentColor"
      />
    </svg>
  )
}

// mm:I520:11647;662:8911;186:2759 and mm:I520:11647;662:9133;186:2759
export function IconPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor" />
    </svg>
  )
}

// mm:I520:11647;520:9906;186:2761 (also the Hủy glyph of the link dialog)
export function IconClose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M13.4759 12.0972L19.0159 17.6372V19.0972H17.5559L12.0159 13.5572L6.47587 19.0972H5.01587V17.6372L10.5559 12.0972L5.01587 6.55717V5.09717H6.47587L12.0159 10.6372L17.5559 5.09717H19.0159V6.55717L13.4759 12.0972Z"
        fill="currentColor"
      />
    </svg>
  )
}

// mm:I520:11647;662:9197;662:9287;186:1420 — drawn in a 17px box, the artwork occupies the centre of an 8px viewBox
export function IconCloseTiny(props: IconProps) {
  return (
    <svg width={17} height={17} viewBox="0 0 8 8" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.49187 4.09701L6.33854 5.94367V6.43034H5.85187L4.00521 4.58367L2.15854 6.43034H1.67188V5.94367L3.51854 4.09701L1.67188 2.25034V1.76367H2.15854L4.00521 3.61034L5.85187 1.76367H6.33854V2.25034L4.49187 4.09701Z"
        fill="currentColor"
      />
    </svg>
  )
}

// mm:1002:13204 — the "selected" tick of a hashtag row. The frame has no export for it, so it is the Material check.
export function IconCheckCircle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Busy indicator of the Gửi button; the wiring decides when it shows (no design asset exists for it). */
export function IconSpinner(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
