/** Indeterminate progress ring. Spins via the `teaser-spin` keyframe in design.css. */
export function Spinner({
  className = 'motion-safe:animate-[teaser-spin_0.7s_linear_infinite]',
  size = 14,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <circle
        cx="7"
        cy="7"
        r="5.25"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.25"
      />
      <path
        d="M12.25 7a5.25 5.25 0 0 0-5.25-5.25"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}
