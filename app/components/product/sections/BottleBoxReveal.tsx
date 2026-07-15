import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import {useRef, useState} from 'react';
import {ClientOnly, PageContainer} from '~/components/shared';
import {BottleBoxCanvasLoader} from './BottleBoxCanvasLoader';

const DEG_60 = (60 * Math.PI) / 180;

export function BottleBoxReveal({title}: {title: string}) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [rotationY, setRotationY] = useState(reducedMotion ? DEG_60 * 0.4 : 0);

  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const rotateY = useTransform(scrollYProgress, [0, 1], [0, DEG_60]);

  useMotionValueEvent(rotateY, 'change', (value) => {
    if (!reducedMotion) setRotationY(value);
  });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] w-full overflow-hidden bg-vellum-100 py-20"
    >
      <div className="blueprint-rule-h pointer-events-none absolute inset-x-0 top-16 text-inkwell-700/25" />
      <div className="blueprint-rule-h pointer-events-none absolute inset-x-0 bottom-16 text-inkwell-700/25" />

      <PageContainer className="relative flex h-full min-h-[calc(100dvh-10rem)] flex-col items-center justify-center">
        <p className="mb-8 font-['trust-3a'] text-[12px] font-[700] uppercase tracking-[0.14em] text-inkwell-700/55">
          The vessel
        </p>

        <div className="relative h-[min(52vh,22rem)] w-full max-w-md">
          <ClientOnly
            fallback={
              <div
                className="flex h-full w-full items-center justify-center bg-inkwell-800/5"
                aria-hidden
              />
            }
          >
            <BottleBoxCanvasLoader rotationY={rotationY} />
          </ClientOnly>
        </div>

        <motion.p
          className="mt-10 max-w-[32ch] text-center font-['trust-3a'] text-[13px] italic leading-[1.65] tracking-[0.02em] text-inkwell-700/45"
          initial={reducedMotion ? false : {opacity: 0, y: 12}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, margin: '-10%'}}
          transition={{duration: 0.7, ease: [0.32, 0.72, 0, 1]}}
        >
          {title} — rendered in Three.js via React Three Fiber.
        </motion.p>
      </PageContainer>
    </section>
  );
}
