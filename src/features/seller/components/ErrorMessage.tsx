export const ErrorMessage = ({ message }: { message: string }) => (
  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-800/40 dark:bg-red-900/20">
    <svg
      className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
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
    <p className="text-sm leading-relaxed text-red-700 dark:text-red-300">{message}</p>
  </div>
)
