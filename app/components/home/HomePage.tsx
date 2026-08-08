import {motion, useReducedMotion, type Variants} from 'motion/react';
import {Link} from 'react-router';
import wordmarkVellum from '~/assets/design/wordmark-vellum.png';
import heroHome from '~/assets/design/hero-home.jpg';
import {CTA_SHELL} from '~/components/teaser/TeaserPage';
import {fetchPriorityAttr} from '~/lib/fetchPriority';

/** Seconds before the hero CTA appears, after the wordmark has settled. */
const CTA_DELAY = 0.5;

const heroStagger: Variants = {
  hidden: {},
  show: {
    transition: {staggerChildren: 0.12, delayChildren: 0},
  },
};

const fadeUp: Variants = {
  hidden: {opacity: 0, y: 16},
  show: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.8, ease: [0.22, 1, 0.36, 1]},
  },
};

export function HomePage() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative flex h-svh w-full flex-col items-stretch overflow-hidden bg-inkwell-800">
      {/*
        Image on top, inkwell below — the teaser's arrangement. The wordmark
        straddles the seam from the inkwell band, hanging up over the image.
      */}
      {/*
        Height-first: the photo is 3:2, so a short well crops most of its
        height away. 68svh is the top of the teaser's clamp range — the band
        takes the remainder. Sides crop instead.
      */}
      <div className="relative h-[68svh] min-h-0 w-full shrink-0 overflow-hidden">
        {/*
          LCP slot: single static URL (not a CDN srcset), so the preload
          scanner + fetchpriority=high is enough — no separate <link preload>
          (see ProductHeroPhoto).
        */}
        <motion.img
          className="absolute inset-0 h-full w-full object-cover"
          src={heroHome}
          alt=""
          width={1920}
          height={1280}
          decoding="async"
          {...fetchPriorityAttr('high')}
          initial={reducedMotion ? false : {opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 1.2, ease: 'easeOut'}}
        />
        <div className="absolute inset-0 flex items-start bg-inkwell-900/30" />
      </div>
      <motion.div
        className="relative flex w-full grow items-start bg-inkwell-800"
        variants={heroStagger}
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
      >
        {/*
          Wordmark straddles the seam; the CTA hangs below it, in the slot the
          tagline used to occupy. Both are absolutely placed so neither adds
          height to the block that -translate-y-1/2 centres on the seam.
        */}
        <div className="absolute top-0 left-1/2 z-10 w-[92%] max-w-160 -translate-x-1/2 -translate-y-1/2">
          <h1 className="m-0!">
            <motion.img
              className="w-full"
              src={wordmarkVellum}
              alt="Dilettante"
              variants={fadeUp}
            />
          </h1>
          <div className="absolute top-[calc(100%+3.5rem)] right-0 left-0 flex justify-center">
            {/*
              CTA_SHELL is the teaser's button/input shell — shared so the two
              pages' CTAs can't drift apart.
            */}
            <motion.div
              className="w-full max-w-56 sm:max-w-60"
              initial={reducedMotion ? false : {opacity: 0}}
              animate={{opacity: 1}}
              transition={
                reducedMotion
                  ? {duration: 0.01}
                  : {delay: CTA_DELAY, duration: 0.8, ease: [0.22, 1, 0.36, 1]}
              }
            >
              <Link
                to="/collections"
                // Fill on hover rather than the teaser's opacity dip — motion
                // writes opacity on the wrapper, so hover styles stay free.
                className={`${CTA_SHELL} max-w-none cursor-pointer justify-center text-vellum-100! no-underline transition-colors duration-200 hover:border-vellum-100 hover:bg-vellum-100 hover:text-inkwell-700!`}
              >
                Explore Scents
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
