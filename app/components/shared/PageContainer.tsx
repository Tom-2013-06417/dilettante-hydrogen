import type {ReactNode} from 'react';

/**
 * Centered content column (max `--design-content-max`) with horizontal inset.
 * Backgrounds stay full-bleed on the parent. 16px / 32px from sm — see
 * design.css `.page-container`.
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
