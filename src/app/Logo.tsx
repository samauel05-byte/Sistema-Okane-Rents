export default function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 100 100" className="h-7 w-7 shrink-0" aria-hidden="true">
        <rect width="100" height="100" rx="20" fill="#D2491C" />
        <path
          d="M40 30 L26 50 L40 70"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="50" r="13" fill="none" stroke="#FFFFFF" strokeWidth="9" />
        <path
          d="M60 30 L74 50 L60 70"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        Okane <span className="text-[#D2491C]">Rents</span>
      </span>
    </span>
  );
}
