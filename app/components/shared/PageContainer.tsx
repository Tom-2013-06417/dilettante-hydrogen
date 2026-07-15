import type {ReactNode} from 'react';

/**
 * Standard horizontal inset for page content (backgrounds stay full-bleed).
 * 32px left / right — see design.css `.page-container`.
 */
export function PageContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`page-container ${className}`.trim()}>{children}</div>;
}
