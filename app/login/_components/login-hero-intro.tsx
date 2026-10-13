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
    <main className="relative z-10 flex min-h-[max(100vh,760px)] flex-col justify-center px-3 pt-[88px] pb-[91px] sm:px-6 md:px-8">
      {/* mm:662:14394 */}
      <div className="mx-auto flex w-full max-w-[1152px] flex-col items-start gap-10 xl:gap-20">
        {/* mm:662:14395 */}
        <h1 className="m-0 flex flex-col">
          {/* mm:2939:9548 */}
          <Image
            src="/images/login/root-further.png"
            alt=""
            width={451}
            height={200}
            priority
            className="h-[120px] w-auto sm:h-40 lg:h-auto lg:w-[451px]"
          />
          <span className="sr-only">{title}</span>
        </h1>
        {/* mm:662:14755 */}
        <div className="flex w-full max-w-[496px] flex-col gap-6 pl-0 xl:pl-4">
          {/* mm:662:14753 */}
          <div className="font-[family-name:var(--font-montserrat)] text-xl leading-10 font-bold tracking-[0.5px] text-white">
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
