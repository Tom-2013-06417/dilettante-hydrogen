type BlueprintRuleProps = {
  orientation: 'h' | 'v';
  className?: string;
};

/** Static dashed blueprint rule (h = horizontal, v = vertical). */
export function BlueprintRule({
  orientation,
  className = '',
}: BlueprintRuleProps) {
  const baseClass =
    orientation === 'h' ? 'blueprint-rule-h' : 'blueprint-rule-v';
  return <div aria-hidden className={`${baseClass} ${className}`.trim()} />;
}
