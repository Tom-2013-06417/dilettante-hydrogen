type ProductTitleProps = {
  number: string;
  title: string;
  className?: string;
};

/** Product-page scent title: No. badge + vellum plate with dashed cap/baseline rules. */
export function ProductTitle({
  number,
  title,
  className = '',
}: ProductTitleProps) {
  return (
    <div className={`relative overflow-visible ${className}`}>
      <div className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[0.02em]">
        No.
        <span className="flex h-4.25 w-8 items-center justify-center rounded-[50%] bg-inkwell-700 font-['config-mono-vf'] text-[14px] font-bold leading-none text-vellum-100 [font-variant-numeric:slashed-zero]">
          {number}
        </span>
      </div>

      <div className="relative block w-fit max-w-full overflow-visible bg-vellum-100 pt-1 pb-3 shadow-[0_2px_3px_rgba(21,32,21,0.35)]">
        <div className="relative overflow-visible">
          <div
            aria-hidden
            className="blueprint-rule-h absolute inset-x-0 top-0 z-10 text-inkwell-700/35"
          />
          <div
            aria-hidden
            className="blueprint-rule-h absolute inset-x-0 bottom-0 z-10 text-inkwell-700/35"
          />
          <span className="relative z-0 block px-2 translate-y-0.5 whitespace-nowrap font-['wayfinder-cf'] text-[60px] font-light leading-[0.72] tracking-[-6%] text-[#3E423F]">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
}
