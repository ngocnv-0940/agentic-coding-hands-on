import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { IconBell, IconUser } from './icons'

export type HeaderIconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: 'bell' | 'account'
  /** Accessible name (aria-label); the icon itself is decorative. */
  label: string
}

/** 40x40 icon trigger. Spreads every button prop so Track B can attach menu behaviour (ref, aria-*, testid). */
export const HeaderIconButton = forwardRef<HTMLButtonElement, HeaderIconButtonProps>(function HeaderIconButton(
  { icon, label, className = '', ...rest },
  ref,
) {
  // Figma: the account button carries a 1px #998C5F border, the bell is borderless.
  const border = icon === 'account' ? 'border border-saa-gold-border' : 'border border-transparent'
  return (
    // mm:I2167:9091;186:1597 / mm:I2167:9091;186:2101;186:2020
    <button
      ref={ref}
      type="button"
      aria-label={label}
      {...rest}
      className={`flex size-10 cursor-pointer items-center justify-center rounded p-2.5 text-white transition-colors duration-200 hover:bg-saa-gold/10 focus-visible:outline-2 focus-visible:outline-white ${border} ${className}`}
    >
      {icon === 'bell' ? <IconBell /> : <IconUser />}
    </button>
  )
})
