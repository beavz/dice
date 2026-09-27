type WizardHatIconProps = {
  className?: string;
};

export default function WizardHatIcon({ className }: WizardHatIconProps) {
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
      <path d="M13 2 L19 16.5 L6 16.5 Z" />
      <ellipse cx="12.5" cy="18" rx="8.5" ry="2.2" />
      <path d="M8.7 11.5 L16.3 11.5" />
      <path d="M13 5 L13.6 6.3 L15 6.5 L14 7.4 L14.3 8.7 L13 8 L11.7 8.7 L12 7.4 L11 6.5 L12.4 6.3 Z" />
    </svg>
  );
}
