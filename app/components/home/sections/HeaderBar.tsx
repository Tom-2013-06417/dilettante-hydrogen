import {Link} from 'react-router';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {PlaceholderFrame} from './PlaceholderFrame';

export function HeaderBar({className = ''}: {className?: string}) {
  return (
    <header
      className={`relative flex w-full flex-none items-stretch bg-vellum-100 text-inkwell-700 ${className}`}
    >
      <div className="blueprint-rule-h absolute inset-x-0 top-2 text-inkwell-700/35 sm:top-4" />
      <div className="blueprint-rule-h absolute inset-x-0 bottom-0 text-inkwell-700/35" />
      <div className="relative ml-4 flex items-center px-2 pb-2 pt-4 sm:ml-8 sm:px-7 sm:pb-5 sm:pt-8">
        <div className="blueprint-rule-v absolute inset-y-0 left-0 text-inkwell-700/35" />
        <div className="blueprint-rule-v absolute inset-y-0 right-0 text-inkwell-700/35" />
        <Link to="/" prefetch="intent">
          <img
            className="h-6 w-auto sm:h-9"
            src={wordmarkInkwell}
            alt="Dilettante"
          />
        </Link>
      </div>
      <div className="ml-auto mr-4 flex items-center pb-2 pt-4 sm:mr-6 sm:pb-5 sm:pt-8">
        <PlaceholderFrame className="h-6 w-6 text-inkwell-700/45 sm:h-11 sm:w-14" />
      </div>
    </header>
  );
}
