import type { Ref } from 'react'
import Image from 'next/image'
import { IconClose } from '../sun-kudos/_components/write-kudo-icons'
import { IconPen } from './icons'

/** Id the FAB's `aria-controls` points at. */
export const FAB_MENU_ID = 'fab-menu'

export type FabMenuLabels = { menu: string; rules: string; writeKudo: string; close: string }

type FabMenuViewProps = {
  labels: FabMenuLabels
  menuRef: Ref<HTMLDivElement>
  onRules: () => void
  onWriteKudo: () => void
  onClose: () => void
}

const ACTION =
  'flex h-16 cursor-pointer items-center gap-2 rounded bg-saa-gold p-4 font-[family-name:var(--font-montserrat)] text-2xl leading-8 font-bold text-saa-navy transition-[box-shadow] duration-200 hover:shadow-[0_0_6px_#fae287] focus-visible:outline-2 focus-visible:outline-white'

/**
 * Quick-action group of the opened FAB (mm:313:9140): "Thể lệ" (149x64), "Viết KUDOS" (214x64) and the red round close
 * button (56x56), right-aligned and 20px apart, anchored where the closed pill sits.
 */
export function FabMenuView({ labels, menuRef, onRules, onWriteKudo, onClose }: FabMenuViewProps) {
  return (
    // mm:313:9140
    <div
      ref={menuRef}
      id={FAB_MENU_ID}
      data-testid="fab-menu"
      role="group"
      aria-label={labels.menu}
      className="fixed right-4 bottom-6 z-20 flex flex-col items-end gap-5 md:right-[19px] md:bottom-12"
    >
      {/* mm:I313:9140;214:3799 */}
      <button type="button" data-testid="fab-menu-rules" onClick={onRules} className={ACTION}>
        {/* mm:I313:9140;214:3799;186:1763 */}
        <Image src="/images/homepage/icon-kudos-mark.svg" alt="" width={24} height={24} unoptimized />
        {labels.rules}
      </button>
      {/* mm:I313:9140;214:3732 */}
      <button type="button" data-testid="fab-menu-write-kudo" onClick={onWriteKudo} className={ACTION}>
        {/* mm:I313:9140;214:3732;186:1763 */}
        <IconPen />
        {labels.writeKudo}
      </button>
      {/* mm:I313:9140;214:3827 */}
      <button
        type="button"
        data-testid="fab-menu-close"
        aria-label={labels.close}
        onClick={onClose}
        className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-[#d4271d] text-white transition-[box-shadow] duration-200 hover:shadow-[0_0_8px_#d4271d] focus-visible:outline-2 focus-visible:outline-white"
      >
        {/* mm:I313:9140;214:3827;186:1766 */}
        <IconClose />
      </button>
    </div>
  )
}
