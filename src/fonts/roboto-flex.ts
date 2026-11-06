import localFont from 'next/font/local';

// Roboto Flex (latin, variable weight and optical size). Committed rather than fetched from Google at
// build time, so dev and builds work offline or behind a proxy. Preloaded only on routes that use it:
// the landing headline and the whole Mini App.
export const robotoFlex = localFont({
  src: './roboto-flex-latin.woff2',
  weight: '100 1000',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});
