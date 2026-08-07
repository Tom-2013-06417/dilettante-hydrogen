import {PlusIcon} from '@heroicons/react/24/outline';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {useId, useState} from 'react';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import type {FaqItem} from '~/lib/staticPages';
import {ClientOnly} from './ClientOnly';

export type {FaqItem};

/** Matches the easing used by PageTransition and the home deck. */
const EASE = [0.32, 0.72, 0, 1] as const;
const DURATION = 0.32;

const RULE_COLOR = 'text-inkwell-700/35';
const ICON_CLASS = 'h-4 w-4 flex-none text-inkwell-700/70';
/**
 * The font is set here rather than inherited: app.css styles h1–h6 unlayered
 * with `font-family: var(--font-heading)`, which the animated variant's <h3>
 * wrapper would otherwise pass down to the button.
 */
const ROW_CLASS =
  "flex w-full cursor-pointer items-center justify-between gap-6 bg-transparent py-4 text-left font-['trust-3a'] text-[15px] font-medium tracking-[0.02em] text-inkwell-700/90";
/**
 * Wraps the answer paragraphs, so the padding lives on a div and doesn't need
 * `!` to beat reset.css's unlayered `p { padding: 0 }`.
 */
const ANSWER_CLASS =
  'flex max-w-[46ch] flex-col gap-y-3 pb-4 pr-6 text-[14px] tracking-[0.02em] text-inkwell-700/75';

/**
 * Server/no-JS rendering: native <details>, so every answer is reachable and
 * indexable before hydration. The plus rotates into a cross via group-open.
 */
function FaqAccordionStatic({items}: {items: FaqItem[]}) {
  return (
    <div className="w-full">
      {items.map((item) => (
        <div key={item.question}>
          <BlueprintRule orientation="h" className={RULE_COLOR} />
          <details className="group">
            <summary
              className={`${ROW_CLASS} list-none [&::-webkit-details-marker]:hidden`}
            >
              <span className="max-w-[40ch]">{item.question}</span>
              <PlusIcon
                className={`${ICON_CLASS} transition-transform group-open:rotate-45`}
                aria-hidden="true"
              />
            </summary>
            <div className={ANSWER_CLASS}>
              {item.answer.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        </div>
      ))}
      <BlueprintRule orientation="h" className={RULE_COLOR} />
    </div>
  );
}

/**
 * Client rendering: one row open at a time, with the panel height animated.
 * `height: auto` is animatable by motion, which plain CSS can't do on <details>.
 */
function FaqAccordionAnimated({items}: {items: FaqItem[]}) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const baseId = useId();

  const transition = reducedMotion
    ? {duration: 0}
    : {duration: DURATION, ease: EASE};

  return (
    <div className="w-full">
      {items.map((item, index) => {
        const isOpen = openQuestion === item.question;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={item.question}>
            <BlueprintRule orientation="h" className={RULE_COLOR} />
            {/* The button carries all the type — utilities on the h3 itself
                would lose to app.css's unlayered h1–h6 rule. */}
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenQuestion(isOpen ? null : item.question)}
                className={`${ROW_CLASS} border-0`}
              >
                <span className="max-w-[40ch]">{item.question}</span>
                <motion.span
                  className="flex flex-none items-center"
                  animate={{rotate: isOpen ? 45 : 0}}
                  initial={false}
                  transition={transition}
                >
                  <PlusIcon className={ICON_CLASS} aria-hidden="true" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="overflow-hidden"
                  initial={{height: 0, opacity: 0}}
                  animate={{height: 'auto', opacity: 1}}
                  exit={{height: 0, opacity: 0}}
                  transition={transition}
                >
                  <div className={ANSWER_CLASS}>
                    {item.answer.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
      <BlueprintRule orientation="h" className={RULE_COLOR} />
    </div>
  );
}

/** Blueprint-ruled FAQ list. Animated once hydrated, native <details> before. */
export function FaqAccordion({items}: {items: FaqItem[]}) {
  return (
    <ClientOnly fallback={<FaqAccordionStatic items={items} />}>
      <FaqAccordionAnimated items={items} />
    </ClientOnly>
  );
}
