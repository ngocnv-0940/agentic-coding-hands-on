export type LoginErrorMessageProps = {
  message?: string | null
}

export function LoginErrorMessage({ message }: LoginErrorMessageProps) {
  if (!message) return null
  return (
    <p role="alert" className="mt-4 font-[family-name:var(--font-montserrat)] text-sm leading-5 font-bold text-[#FF8A8A]">
      {message}
    </p>
  )
}
