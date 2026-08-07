import {useState} from 'react';
import {Link} from 'react-router';
import {PageContainer, SubscribeModal} from '~/components/shared';
import {SOCIAL_LINKS} from '~/lib/constants';

/**
 * `!` on the colours: app.css sets an unlayered `a { color: inherit }` that
 * outranks Tailwind's layered text-* utilities. `hover:underline` is stated
 * rather than left to reset.css's global `a:hover` so the Subscribe button —
 * not an anchor — behaves like its neighbours.
 */
const LINK_CLASS =
  "font-['config-mono-vf'] text-[11px] uppercase tracking-[0.08em] text-vellum-100/80! transition-colors hover:text-vellum-100! hover:underline";

const ICON_LINK_CLASS =
  'flex items-center text-vellum-100/80! transition-colors hover:text-vellum-100!';

/** `[&_li]:mb-0!` clears reset.css's unlayered `li { margin-bottom: 0.5rem }`. */
const LIST_CLASS = 'm-0 flex list-none items-center p-0 [&_li]:mb-0!';

const PAGE_LINKS = [
  {label: 'About', to: '/about'},
  {label: 'FAQs', to: '/faq'},
];

/** Drawn from primitives to match the thin-stroke icon language. */
function InstagramIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5.25" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.4" cy="6.6" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Note glyph only — the container tile from the source file is dropped so the
 * mark reads as a bare icon alongside Instagram.
 * Source: https://commons.wikimedia.org/wiki/File:Tiktok_icon.svg (CC0).
 */
function TiktokIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="currentColor"
      aria-hidden
    >
      <path d="M73.31 25.7456C72.785 25.4743 72.274 25.1769 71.7788 24.8545C70.3389 23.9025 69.0186 22.7808 67.8465 21.5135C64.9139 18.158 63.8186 14.7538 63.4151 12.3705H63.4313C63.0943 10.3921 63.2337 9.11214 63.2547 9.11214H49.8974V60.7624C49.8974 61.4558 49.8974 62.1412 49.8682 62.8185C49.8682 62.9027 49.8601 62.9805 49.8553 63.0712C49.8553 63.1085 49.8553 63.1474 49.8472 63.1863C49.8472 63.196 49.8472 63.2057 49.8472 63.2154C49.7064 65.0686 49.1123 66.8588 48.1173 68.4286C47.1222 69.9983 45.7566 71.2994 44.1407 72.2175C42.4565 73.1757 40.5517 73.6782 38.614 73.6757C32.3906 73.6757 27.3468 68.6011 27.3468 62.334C27.3468 56.0669 32.3906 50.9923 38.614 50.9923C39.7921 50.9912 40.9629 51.1766 42.083 51.5415L42.0992 37.9412C38.6989 37.502 35.2444 37.7722 31.9538 38.7348C28.6631 39.6975 25.6077 41.3317 22.9802 43.5343C20.678 45.5346 18.7425 47.9214 17.2608 50.5872C16.6969 51.5594 14.5695 55.4658 14.3119 61.8058C14.1499 65.4044 15.2306 69.1326 15.7458 70.6734V70.7058C16.0699 71.6132 17.3256 74.7094 19.372 77.3197C21.0221 79.4135 22.9716 81.2527 25.1579 82.7783V82.7459L25.1903 82.7783C31.6567 87.1724 38.8263 86.884 38.8263 86.884C40.0674 86.8338 44.2249 86.884 48.9463 84.6464C54.183 82.1658 57.1642 78.47 57.1642 78.47C59.0688 76.2618 60.5832 73.7452 61.6426 71.0282C62.8513 67.8509 63.2547 64.0401 63.2547 62.5171V35.1155C63.4168 35.2127 65.5749 36.6401 65.5749 36.6401C65.5749 36.6401 68.6842 38.633 73.5352 39.9309C77.0155 40.8544 81.7045 41.0488 81.7045 41.0488V27.7887C80.0615 27.9669 76.7255 27.4485 73.31 25.7456Z" />
    </svg>
  );
}

/** Envelope drawn to match the Instagram mark's thin-stroke language. */
function EmailIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="2.75" y="5" width="18.5" height="14" rx="2.75" />
      <path d="m3.75 7.25 8.25 5.75 8.25-5.75" strokeLinejoin="round" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  tiktok: TiktokIcon,
  email: EmailIcon,
};

/**
 * Site footer: page links opposite the social icons, then the credits.
 */
export function SiteFooter() {
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  return (
    <footer className="site-footer w-full bg-inkwell-800 font-['trust-3a'] text-vellum-100">
      <PageContainer>
        <div className="flex flex-col items-center gap-y-3 pt-4.5 pb-3">
          <nav aria-label="Footer">
            <ul className={`${LIST_CLASS} justify-center gap-x-6`}>
              {PAGE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} prefetch="intent" className={LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setSubscribeOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={subscribeOpen}
                  className={`${LINK_CLASS} cursor-pointer border-0 bg-transparent p-0`}
                >
                  Subscribe
                </button>
              </li>
            </ul>
          </nav>

          <ul className={`${LIST_CLASS} justify-center gap-x-4`}>
            {SOCIAL_LINKS.map((link) => {
              const Icon = SOCIAL_ICONS[link.id];
              // mailto: hands off to the mail client — a new tab would leave a
              // blank window behind, and there's no opener to sever.
              const newTab = link.href.startsWith('http');
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target={newTab ? '_blank' : undefined}
                    rel={newTab ? 'noopener noreferrer' : undefined}
                    aria-label={link.label}
                    className={ICON_LINK_CLASS}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </li>
              );
            })}
          </ul>

          {/* `mt-5!` clears reset.css's unlayered `p { margin: 0 }`. */}
          <p className="mt-5! text-center font-['config-mono-vf'] text-[10px] uppercase tracking-[0.08em] text-vellum-100/45">
            © {new Date().getFullYear()} Dilettante Perfumery. All rights
            reserved.
          </p>
        </div>
      </PageContainer>

      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
      />
    </footer>
  );
}
