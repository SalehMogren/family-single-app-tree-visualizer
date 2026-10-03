export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" aria-hidden className={className}>
    <rect width="64" height="64" rx="14" className="fill-primary" />
    <g fill="none" strokeWidth="3.5" strokeLinecap="round" className="stroke-primary-foreground">
      <path d="M32 50V26" />
      <path d="M32 34c-6 0-10-4-10-9" />
      <path d="M32 30c6 0 10-4 10-9" />
      <path d="M22 50h20" />
    </g>
    <circle cx="22" cy="22" r="5" className="fill-primary-foreground" />
    <circle cx="42" cy="18" r="5" className="fill-primary-foreground" />
    <circle cx="32" cy="16" r="4" className="fill-primary-foreground/70" />
  </svg>
);
