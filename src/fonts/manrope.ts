import localFont from 'next/font/local';

// Manrope (latin, variable weight). The Mini App's text face: geometric but open, so it stays crisp at
// list sizes. Committed for the same reason as Roboto Flex. The TMA layout exposes it as --font-tma-sans.
export const manrope = localFont({
  src: './manrope-latin.woff2',
  weight: '200 800',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  variable: '--font-tma-sans',
});
