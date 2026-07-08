import {motion, useReducedMotion} from 'motion/react';
import fig01 from '~/assets/design/fig-01.jpg';
import fig02 from '~/assets/design/fig-02.jpg';
import {
  fadeInItem,
  fadeUpItem,
  staggerContainer,
  wipeItem,
} from '~/components/design/animations';

export function BrandIntro({active = false}: {active?: boolean}) {
  const reducedMotion = useReducedMotion();
  const animate = reducedMotion ? 'show' : active ? 'show' : 'hidden';

  return (
    <div className="h-full w-full bg-inkwell-800 p-3 sm:p-4">
      <motion.div
        className="flex h-full w-full flex-col overflow-hidden bg-vellum-100 font-['trust-3a'] text-inkwell-700"
        variants={staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate={animate}
      >
        <div className="flex min-h-[80px] grow-[4] basis-0">
          <div className="w-[10%] min-w-[72px] max-w-[280px]">
            <motion.img
              className="h-full w-full object-cover"
              src={fig01}
              alt=""
              variants={wipeItem}
            />
          </div>
        </div>

        <div className="relative flex items-stretch">
          <div className="blueprint-rule-h absolute inset-x-0 top-0 text-inkwell-700/35" />
          <div className="blueprint-rule-h absolute inset-x-0 bottom-0 text-inkwell-700/35" />
          <div className="flex w-[10%] min-w-[72px] max-w-[280px] flex-none justify-end">
            <div className="blueprint-rule-v text-inkwell-700/35" />
          </div>
          <motion.h2
            className="relative z-10 -mb-[0.2em] -mt-[0.13em] min-w-0 grow pr-4 text-right font-['wayfinder-cf'] text-[clamp(3rem,9vw,6.5rem)] font-[400] leading-[1.05] tracking-[-5%] text-inkwell-700/90 sm:pr-6"
            variants={fadeUpItem}
          >
            For the love of it.
          </motion.h2>
        </div>

        <motion.div
          className="flex flex-none px-12 pb-4 pl-6 pt-8"
          variants={fadeUpItem}
        >
          <p className="max-w-[58ch] text-[12px] leading-[22px] tracking-[0.02em]">
            Dilettante takes its name from the Italian{' '}
            <em className="font-['wayfinder-cf'] italic">dilettare</em>
            {' — to delight.'}
            <br />
            It is the bespoke perfumery of Paulo Pascua: fragrances composed one
            story at a time, drawn from the places, rituals, and memories of the
            people who wear them. No catalogue, no formula chased for the
            market — only scent pursued the way an amateur pursues anything: out
            of love.
          </p>
        </motion.div>

        <div className="blueprint-rule-h text-inkwell-700/35" />
        <div className="flex min-h-[100px] grow-[3] basis-0 justify-end">
          <div className="w-[62%] sm:w-[48%]">
            <motion.img
              className="h-full w-full object-cover"
              src={fig02}
              alt=""
              variants={wipeItem}
            />
          </div>
        </div>
        <div className="blueprint-rule-h text-inkwell-700/35" />

        <motion.div
          className="flex min-h-[60px] grow-[2] basis-0 items-end justify-center pb-6 sm:pb-8"
          variants={fadeInItem}
        >
          <p className="px-6 text-center text-[13px] leading-[21px] tracking-[0.04em] text-inkwell-700/70">
            <span className="font-['wayfinder-cf'] text-[15px] italic">
              dilettante
            </span>{' '}
            (n.) — one who cultivates an art for the delight of it.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
