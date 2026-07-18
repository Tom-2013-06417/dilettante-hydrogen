import type {ReactNode} from 'react';

/**
 * Standard horizontal inset for page content (backgrounds stay full-bleed).
 * 16px left / right on mobile, 32px from sm — see design.css `.page-container`.
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
