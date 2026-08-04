type EmptyBasketProps = {
  className?: string;
};

/** Empty shopping bag — `/ | \` marks above the opening. Uses currentColor. */
export function EmptyBasket({className}: EmptyBasketProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4.75 1 6.75 3.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M12 0.75v2.75"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M19.25 1 17.25 3.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M8.5 13V10.5a3.5 3.5 0 0 1 7 0V13"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.75 13h14.5l-1.15 8.1a1 1 0 0 1-.99.9H6.89a1 1 0 0 1-.99-.9L4.75 13Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
