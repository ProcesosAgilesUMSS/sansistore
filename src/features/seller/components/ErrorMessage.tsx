export const ErrorMessage = ({ message }: { message: string }) => (
  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-(--theme-error-border) bg-(--theme-error-bg) px-4 py-4">
    <svg
      className="mt-0.5 h-5 w-5 shrink-0 text-(--theme-error)"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <p className="text-sm leading-relaxed text-(--theme-error)">{message}</p>
  </div>
)
