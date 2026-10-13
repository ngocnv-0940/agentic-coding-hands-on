type LoginFooterProps = {
  text: string
}

export function LoginFooter({ text }: LoginFooterProps) {
  return (
    // mm:662:14447
    <footer className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center border-t border-[#2E3940] px-4 py-6 md:px-[90px] xl:py-[33px]">
      {/* mm:I662:14447;342:1413 */}
      <p className="text-center font-[family-name:var(--font-montserrat-alternates)] text-base leading-6 font-bold text-white">{text}</p>
    </footer>
  )
}
