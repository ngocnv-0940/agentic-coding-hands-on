import Image from 'next/image'
import type { ReactNode } from 'react'

type LoginHeroIntroProps = {
  title: string
  subtitle: string
  tagline: string
  loginArea: ReactNode
}

export function LoginHeroIntro({ title, subtitle, tagline, loginArea }: LoginHeroIntroProps) {
  return (
    // mm:662:14393
    <main className="relative z-10 flex min-h-[max(100vh,760px)] flex-col justify-center px-4 pt-[88px] pb-[91px] md:px-12 xl:px-36">
      {/* mm:662:14394 */}
      <div className="flex w-full flex-col items-start gap-10 md:gap-20">
        {/* mm:662:14395 */}
        <h1 className="m-0 flex flex-col">
          {/* mm:2939:9548 */}
          <Image
            src="/images/login/root-further.png"
            alt=""
            width={451}
            height={200}
            priority
            className="h-auto w-[240px] md:w-[451px]"
          />
          <span className="sr-only">{title}</span>
        </h1>
        {/* mm:662:14755 */}
        <div className="flex w-full max-w-[496px] flex-col gap-6 pl-4">
          {/* mm:662:14753 */}
          <div className="font-[family-name:var(--font-montserrat)] text-base leading-8 font-bold tracking-[0.5px] text-white md:text-xl md:leading-10">
            <p className="m-0">{subtitle}</p>
            <p className="m-0">{tagline}</p>
          </div>
          {/* mm:662:14425 */}
          <div className="flex flex-col items-start">{loginArea}</div>
        </div>
      </div>
    </main>
  )
}
