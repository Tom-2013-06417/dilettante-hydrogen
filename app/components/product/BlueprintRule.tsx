type BlueprintRuleProps = {
  orientation: 'h' | 'v';
  /** `dashed` = longer dashes (default); `dotted` = shorter, denser marks. */
  variant?: 'dashed' | 'dotted';
  className?: string;
};

/** Static blueprint rule (h = horizontal, v = vertical). */
export function BlueprintRule({
  orientation,
  variant = 'dashed',
  className = '',
}: BlueprintRuleProps) {
  const baseClass =
    orientation === 'h' ? 'blueprint-rule-h' : 'blueprint-rule-v';
  const variantClass = variant === 'dotted' ? 'blueprint-rule--dotted' : '';
  return (
    <div
      aria-hidden
      className={`${baseClass} ${variantClass} ${className}`.trim()}
    />
  );
}
