import localFont from 'next/font/local';

// Geist (latin, variable weight). The site's text face: clean and neutral with a touch of geometry, and
// it pairs with Geist Mono. Committed for the same reason as Roboto Flex. The site layout exposes it as
// --font-geist-sans, which --font-sans in globals.css picks up.
export const geist = localFont({
  src: './geist-latin.woff2',
  weight: '100 900',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  variable: '--font-geist-sans',
});
