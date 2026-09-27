type CloseIconProps = {
  className?: string;
};

export default function CloseIcon({ className }: CloseIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 5 L19 19" />
      <path d="M19 5 L5 19" />
    </svg>
  );
}
