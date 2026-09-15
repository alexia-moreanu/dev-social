type IconProps = { className?: string };

const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" />
    </svg>
  );
}

export function ReelsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M9.5 9.2v5.6l4.8-2.8-4.8-2.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function NewsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M4 5h13a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
      <path d="M4 5v13a2 2 0 002 2" />
      <path d="M8 9h7M8 12.5h7M8 16h4" />
    </svg>
  );
}

export function LearnIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M4 19.5V6a2 2 0 012-2h13v14.5" />
      <path d="M6 21a2 2 0 01-2-2c0-1.1.9-2 2-2h13" />
      <path d="M8 8h7" />
    </svg>
  );
}

export function WebIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
      <circle cx="9" cy="19" r="1.6" />
      <circle cx="17" cy="19" r="1.6" />
      <path d="M12 6.6L6 11M12 6.6l6 4.5M6.4 13l2.2 4.4M17.6 13l-2.2 4.4M10.6 19h4" />
    </svg>
  );
}

export function MessagesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M21 11.5a7.5 7.5 0 01-10.9 6.7L4 20l1.8-4.5A7.5 7.5 0 1121 11.5z" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function HeartIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.2s-7.6-4.6-9.8-9C.6 7.8 2 4.5 5.2 3.7c2-.5 4 .3 5.4 2.1a.5.5 0 00.8 0c1.4-1.8 3.4-2.6 5.4-2.1 3.2.8 4.6 4.1 3 7.5-2.2 4.4-9.8 9-9.8 9z" />
    </svg>
  );
}

export function CommentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M21 11.5a7.5 7.5 0 01-10.9 6.7L4 20l1.8-4.5A7.5 7.5 0 1121 11.5z" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M21 3L11 13" />
      <path d="M21 3l-7 18-4-8-8-4 19-6z" />
    </svg>
  );
}

export function MoreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}
