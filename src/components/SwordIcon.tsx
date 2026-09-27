type SwordIconProps = {
  className?: string;
};

export default function SwordIcon({ className }: SwordIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.5 3.5 L10 14 L9 17 L7 19" />
      <path d="M20.5 3.5 L17.5 3 L9 11.5" />
      <path d="M9 17 L7 15" />
      <path d="M3.5 20.5 L7 17" />
      <path d="M13 12.5 L16 15.5" />
    </svg>
  );
}
