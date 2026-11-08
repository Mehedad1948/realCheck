import { renderOgImage } from '@/lib/og-image';

// Share card for the website: the landing headline on the dark silk.

export const alt = 'RealCheck: training data you can trust. Labeled by people, accepted only on consensus.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return renderOgImage({ lines: ['Training data', 'you can trust.'], subtitle: 'Labeled by people. Accepted only on consensus.' });
}
