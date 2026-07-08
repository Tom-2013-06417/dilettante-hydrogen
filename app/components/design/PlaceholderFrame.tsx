export function PlaceholderFrame({className = ''}: {className?: string}) {
  return (
    <svg
      className={`overflow-visible ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {['M0 0 H100 V100 H0 Z', 'M0 0 L100 100', 'M100 0 L0 100'].map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
