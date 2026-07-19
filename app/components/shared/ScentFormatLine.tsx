import {formatVolumeSuffix} from '~/lib/scentVolume';

type ScentFormatLineProps = {
  concentration?: string;
  /** Shopify variant title, e.g. "30 mL". */
  variantTitle?: string | null;
  className?: string;
};

/**
 * Concentration (bold) + volume line under price / scent titles:
 * `Eau de Toilette — ℮ 30 mL · 1.01 fl oz`
 */
export function ScentFormatLine({
  concentration,
  variantTitle,
  className = '',
}: ScentFormatLineProps) {
  const volume =
    variantTitle != null && variantTitle !== ''
      ? formatVolumeSuffix(variantTitle)
      : undefined;

  if (!concentration && !volume) return null;

  return (
    <span className={className}>
      {concentration ? (
        <span className="font-bold">{concentration}</span>
      ) : null}
      {concentration && volume ? ' — ' : null}
      {volume ? <span>{volume}</span> : null}
    </span>
  );
}
