/** 1 millilitre in US fluid ounces. */
const ML_TO_FL_OZ = 0.0338140227;

/**
 * Parse millilitres from a Shopify variant title (e.g. "30 mL", "50ml").
 */
export function parseVolumeMl(variantTitle: string): number | undefined {
  const match = variantTitle.match(/([\d.]+)\s*mL/i);
  if (!match?.[1]) return undefined;
  const ml = Number(match[1]);
  return Number.isFinite(ml) ? ml : undefined;
}

/** Format ml as fl oz to two decimal places (e.g. 30 → "1.01"). */
export function formatFlOzFromMl(ml: number): string {
  return (ml * ML_TO_FL_OZ).toFixed(2);
}

/**
 * Size suffix after concentration: `℮ 30 mL · 1.01 fl oz`
 * Uses the variant title as the ml label; fl oz is derived from it.
 */
export function formatVolumeSuffix(variantTitle: string): string | undefined {
  const ml = parseVolumeMl(variantTitle);
  if (ml == null) return undefined;
  return `℮ ${variantTitle} · ${formatFlOzFromMl(ml)} fl oz`;
}
