import { renderOgImage } from '@/lib/og-image';

// Share card for the Telegram Mini App, shown when /app links are shared in chats.

export const alt = 'RealCheck: label data and get paid, right inside Telegram.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return renderOgImage({ lines: ['Label data.', 'Get paid.'], subtitle: 'Right inside Telegram. Paid out in TON.' });
}
