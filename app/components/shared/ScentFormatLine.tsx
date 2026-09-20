import {ChevronDownIcon} from '@heroicons/react/16/solid';
import type {MappedProductOptions} from '@shopify/hydrogen';
import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link, useNavigate} from 'react-router';
import {formatVolumeSuffix} from '~/lib/scentVolume';

type OptionValue = MappedProductOptions['optionValues'][number];

type ScentFormatLineProps = {
  concentration?: string;
  /** Shopify variant title, e.g. "30 mL". */
  variantTitle?: string | null;
  className?: string;
  /**
   * Size (or other) option with 2+ values. When set, the volume suffix becomes
   * an underlined selector with a chevron; omitted / single-value stays plain.
   */
  variantOption?: MappedProductOptions | null;
};

function optionLabel(name: string): string {
  return formatVolumeSuffix(name) ?? name;
}

function menuPositionFromTrigger(
  trigger: HTMLElement | null,
): {top: number; left: number} | null {
  const rect = trigger?.getBoundingClientRect();
  if (!rect) return null;
  return {top: rect.bottom + 6, left: rect.left};
}

/**
 * Concentration (bold) + volume line under price / scent titles:
 * `Eau de Toilette — ℮ 30 mL · 1.01 fl oz`
 *
 * With multiple variants, the volume is underlined with a chevron and opens a
 * compact list that updates the selected option via the URL.
 */
export function ScentFormatLine({
  concentration,
  variantTitle,
  className = '',
  variantOption = null,
}: ScentFormatLineProps) {
  const volume =
    variantTitle != null && variantTitle !== ''
      ? formatVolumeSuffix(variantTitle)
      : undefined;

  if (!concentration && !volume) return null;

  const selectable =
    variantOption != null && variantOption.optionValues.length > 1
      ? variantOption
      : null;

  return (
    <span className={className}>
      {concentration ? (
        <span className="font-bold">{concentration}</span>
      ) : null}
      {concentration && volume ? ' — ' : null}
      {volume ? (
        selectable ? (
          <VolumeSelect
            label={volume}
            optionName={selectable.name}
            optionValues={selectable.optionValues}
          />
        ) : (
          <span>{volume}</span>
        )
      ) : null}
    </span>
  );
}

function VolumeSelect({
  label,
  optionName,
  optionValues,
}: {
  label: string;
  optionName: string;
  optionValues: OptionValue[];
}) {
  const navigate = useNavigate();
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{top: number; left: number} | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;

    const update = () => {
      setMenuPos(menuPositionFromTrigger(triggerRef.current));
    };

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menu =
    open && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={optionName}
            style={{top: menuPos.top, left: menuPos.left}}
            className="fixed z-70 min-w-[8rem] border border-inkwell-700/20 bg-vellum-paper font-['trust-3a'] text-[11px] leading-none tracking-[0.02em] text-inkwell-700 shadow-[0_8px_24px_rgb(0_0_0_/0.08)] lg:text-[13px]"
          >
            {optionValues.map((value) => {
              const {
                name,
                handle,
                variantUriQuery,
                selected,
                available,
                exists,
                isDifferentProduct,
              } = value;
              const itemLabel = optionLabel(name);
              const itemClass = `block w-full whitespace-nowrap px-3.5 py-2.5 text-left transition-opacity ${
                selected ? 'font-bold' : 'font-normal'
              } ${exists && available ? 'opacity-100' : 'opacity-40'} ${
                exists && !selected
                  ? 'cursor-pointer hover:bg-inkwell-700/5'
                  : 'cursor-default'
              }`;

              if (isDifferentProduct) {
                return (
                  <li
                    key={optionName + name}
                    role="option"
                    aria-selected={selected}
                    className="first:mt-1 last:mb-1"
                  >
                    <Link
                      className={itemClass}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      onClick={() => setOpen(false)}
                    >
                      {itemLabel}
                    </Link>
                  </li>
                );
              }

              return (
                <li
                  key={optionName + name}
                  role="option"
                  aria-selected={selected}
                  className="first:mt-1 last:mb-1"
                >
                  <button
                    type="button"
                    className={`${itemClass} rounded-none border-0 bg-transparent font-[inherit] tracking-[inherit]`}
                    disabled={!exists}
                    onClick={() => {
                      if (!selected && exists) {
                        navigate(`?${variantUriQuery}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                      setOpen(false);
                    }}
                  >
                    {itemLabel}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <span className="inline-flex items-baseline gap-1.5">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex cursor-pointer items-baseline gap-0.5 rounded-none border-0 border-b border-inkwell-700/45 bg-transparent p-0 pb-[5px] font-[inherit] text-inherit tracking-[inherit]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Select ${optionName}`}
        onClick={() => {
          setOpen((wasOpen) => {
            if (wasOpen) {
              setMenuPos(null);
              return false;
            }
            setMenuPos(menuPositionFromTrigger(triggerRef.current));
            return true;
          });
        }}
      >
        <span>{label}</span>
        <ChevronDownIcon
          className={`relative top-[4px] h-4 w-4 shrink-0 text-inkwell-700/55 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {menu}
    </span>
  );
}
