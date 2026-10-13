import Image from 'next/image'
import type { ReactNode } from 'react'

type LoginHeaderProps = {
  logoAlt: string
  languageSelector: ReactNode
}

export function LoginHeader({ logoAlt, languageSelector }: LoginHeaderProps) {
  return (
    // mm:662:14391
    <header className="fixed inset-x-0 top-0 z-30 flex h-20 items-center justify-between bg-[rgba(11,15,18,0.8)] px-4 py-3 md:px-12 xl:px-36">
      {/* mm:I662:14391;186:2166 */}
      <div className="flex h-14 w-[52px] items-center">
        {/* mm:I662:14391;178:1033 */}
        <div className="h-12 w-[52px]">
          {/* mm:I662:14391;178:1033;178:1030 */}
          <Image src="/images/login/logo.png" alt={logoAlt} width={52} height={48} priority className="h-12 w-[52px] cursor-default" />
        </div>
      </div>
      {/* mm:I662:14391;186:1601 */}
      <div className="flex h-14 items-center">{languageSelector}</div>
    </header>
  )
}
