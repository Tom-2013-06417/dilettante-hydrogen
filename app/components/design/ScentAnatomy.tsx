import fig02 from '~/assets/design/fig-02.jpg';
import {HeaderBar} from '~/components/design/HeaderBar';

export function ScentAnatomy() {
  return (
    <div className="h-full w-full bg-inkwell-800 p-3 sm:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden bg-vellum-100 font-['trust-3a'] text-inkwell-700">
        <HeaderBar />

        <div className="flex flex-none items-center justify-between px-6 py-6 sm:px-8">
          <p className="text-[16px] font-[700] tracking-[0.02em]">
            Scent Composition
          </p>
          <div className="flex items-center gap-1.5 text-[12px] font-[700] tracking-[0.02em]">
            No.
            <span className="flex h-[17px] w-[32px] items-center justify-center rounded-[50%] bg-inkwell-700 font-['config-mono-vf'] text-[14px] font-[700] leading-none text-vellum-100 [font-variant-numeric:slashed-zero]">
              01
            </span>
          </div>
        </div>

        <div className="relative flex min-h-0 grow-[3] basis-0 flex-col">
          <div className="blueprint-rule-h absolute inset-x-0 top-0 z-10 text-inkwell-700/35" />
          <div className="blueprint-rule-v absolute inset-y-0 left-4 z-10 text-inkwell-700/35 sm:left-8" />
          <div className="blueprint-rule-v absolute inset-y-0 right-4 z-10 text-inkwell-700/35 sm:right-8" />
          {['top', 'heart', 'base'].map((tier) => (
            <div
              key={tier}
              className="relative flex min-h-0 grow basis-0 items-center"
            >
              <div className="blueprint-rule-h absolute inset-x-0 bottom-0 text-inkwell-700/35" />
              <p className="w-[55%] pr-8 text-right text-[15px] tracking-[0.06em] text-inkwell-700/80">
                {tier}
              </p>
            </div>
          ))}
          <img
            className="absolute inset-y-0 left-[55%] right-8 z-[5] h-full w-auto max-w-none object-cover sm:right-12"
            src={fig02}
            alt=""
          />
        </div>

        <div className="relative flex flex-none items-center px-6 py-6 sm:px-8">
          <div className="blueprint-rule-h absolute inset-x-0 bottom-0 text-inkwell-700/35" />
          <div className="blueprint-rule-v absolute inset-y-0 left-4 text-inkwell-700/35 sm:left-8" />
          <div className="blueprint-rule-v absolute inset-y-0 right-4 text-inkwell-700/35 sm:right-8" />
          <div className="pl-4 sm:pl-6">
            <h3 className="font-['wayfinder-cf'] text-[clamp(2rem,3.75vw,2.75rem)] font-[300] leading-[1.05] tracking-[-6%]">
              Kids on the Slope
            </h3>
            <p className="pt-1 font-['trust-3a'] text-[13px] leading-none tracking-[0.01em]">
              <span className="font-[700]">Eau de Toilette</span>
              <span>{' — ℮ 30 ml · 1.01 fl oz'}</span>
            </p>
          </div>
          <div className="ml-auto mr-4 h-20 w-20 flex-none bg-inkwell-600 sm:mr-8" />
        </div>

        <div className="min-h-0 grow-[2] basis-0" />
      </div>
    </div>
  );
}
