import {useEffect} from 'react';

const TYPEKIT_HREF = 'https://use.typekit.net/anf0xzw.css';

export function TypekitFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${TYPEKIT_HREF}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = TYPEKIT_HREF;
    document.head.appendChild(link);
  }, []);

  return null;
}
