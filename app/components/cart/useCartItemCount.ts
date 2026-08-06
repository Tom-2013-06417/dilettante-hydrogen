import {useOptimisticCart} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useCartLineFeedback} from './CartLineFeedback';

/**
 * Total units in the cart (sum of line quantities, not unique lines).
 * Combines Hydrogen optimistic LinesAdd/LinesUpdate with local +/- drafts.
 */
export function useCartItemCount(
  cart: CartApiQueryFragment | null | undefined,
): number {
  const optimisticCart = useOptimisticCart(cart ?? null);
  const {draftQuantities} = useCartLineFeedback();
  const lines = optimisticCart?.lines?.nodes ?? [];
  const seen = new Set<string>();
  let total = 0;

  for (const line of lines) {
    seen.add(line.id);
    total += draftQuantities[line.id] ?? line.quantity;
  }

  for (const [lineId, quantity] of Object.entries(draftQuantities)) {
    if (!seen.has(lineId)) total += quantity;
  }

  return total;
}
