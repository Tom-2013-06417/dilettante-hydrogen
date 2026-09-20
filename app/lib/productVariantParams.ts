import {getAdjacentAndFirstAvailableVariants} from '@shopify/hydrogen';
import {useEffect, useMemo, useRef} from 'react';
import {useLocation, useSearchParams} from 'react-router';
import type {ProductFragment} from 'storefrontapi.generated';

type SelectedOption = {name: string; value: string};
type ProductVariant = ProductFragment['selectedOrFirstAvailableVariant'];

/** Seed option search params when the URL has none. Preserves location.state. */
export function useSeedVariantSearchParams(
  selectedOptions: SelectedOption[] | undefined | null,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {state} = useLocation();
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current || !selectedOptions?.length) return;

    const alreadyHasOptionParam = selectedOptions.some((option) =>
      searchParams.has(option.name),
    );
    if (alreadyHasOptionParam) {
      seededRef.current = true;
      return;
    }

    seededRef.current = true;
    const next = new URLSearchParams(searchParams);
    for (const option of selectedOptions) {
      next.set(option.name, option.value);
    }
    setSearchParams(next, {
      replace: true,
      preventScrollReset: true,
      state,
    });
  }, [selectedOptions, searchParams, setSearchParams, state]);
}

/** Active variant from URL params + adjacent / option variants (no loader wait). */
export function useVariantFromSearchParams(
  product: ProductFragment,
  loaderVariant: ProductVariant,
): ProductVariant {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    if (!searchParams.toString()) return loaderVariant;

    const matched = getAdjacentAndFirstAvailableVariants(product).find(
      (variant) => {
        const options = variant.selectedOptions;
        if (!options?.length) return false;
        return options.every(
          (option) => searchParams.get(option.name) === option.value,
        );
      },
    );

    return (matched as ProductVariant) ?? loaderVariant;
  }, [searchParams, product, loaderVariant]);
}
