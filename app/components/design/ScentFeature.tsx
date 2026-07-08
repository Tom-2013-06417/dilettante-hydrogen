import fig01 from '~/assets/design/fig-01.jpg';
import fig02 from '~/assets/design/fig-02.jpg';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {HeaderBar} from '~/components/design/HeaderBar';
import {ScentTitle} from '~/components/design/ScentTitle';

export function ScentFeature() {
  return (
    <div className="h-full w-full bg-inkwell-800 p-3 sm:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden bg-vellum-100 font-['trust-3a'] text-inkwell-700">
        <div className="relative flex min-h-0 grow-[5] basis-0 flex-col">
          <div className="absolute inset-x-0 bottom-0 top-[11%] flex">
            <div
              aria-hidden
              className="invisible ml-4 flex flex-none items-center px-2 sm:ml-8 sm:px-7"
            >
              <img className="h-6 w-auto sm:h-9" src={wordmarkInkwell} alt="" />
            </div>
            <img className="min-w-0 grow object-cover" src={fig01} alt="" />
          </div>

          <HeaderBar className="z-10" />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-20 flex"
          >
            <div className="relative ml-4 flex items-center px-2 sm:ml-8 sm:px-7">
              <div className="blueprint-rule-v absolute inset-y-0 left-0 text-inkwell-700/35" />
            </div>
          </div>

          <div className="min-h-0 grow" />

          <ScentTitle
            className="z-10 mb-24"
            number="01"
            title="Kids on the Slope"
            style="bordered"
          />
        </div>

        <div className="relative flex flex-none items-center">
          <div className="blueprint-rule-h absolute inset-x-0 top-0 text-inkwell-700/35" />
          <div className="blueprint-rule-h absolute inset-x-0 bottom-0 text-inkwell-700/35" />
          <div className="flex min-w-0 flex-col gap-y-1.5 gap-x-2 py-6 pl-6 pr-6 sm:pl-8">
            <p className="font-['config-mono-vf'] text-[12px] tracking-[0.06em] text-inkwell-700/65">
              citrus&ensp;&bull;&ensp;floral&ensp;&bull;&ensp;musk
            </p>
            <p className="max-w-[42ch] pr-4 text-[18px] italic leading-[20px] tracking-[0.02em]">
              Sanctity of Childhood
            </p>
          </div>
          <div className="ml-auto mr-6 h-[64px] w-[64px] flex-none bg-inkwell-600 sm:mr-10" />
        </div>

        <div className="flex min-h-0 grow-[4] basis-0">
          <div className="w-[38%] min-w-[120px]">
            <img className="h-full w-full object-cover" src={fig02} alt="" />
          </div>
          <div className="blueprint-rule-v text-inkwell-700/35" />
          <div className="flex min-w-0 grow items-center px-6 pb-24 sm:px-10">
            <p className="max-w-[42ch] text-[14px] italic leading-[24px] tracking-[0.02em] text-inkwell-700/45">
              Young love manifested in stolen glances between church pews, hands
              clasped in prayer and garlands of jasmine.
              <br />
              <br />
              Though youth has come and gone, music and memory live forever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
