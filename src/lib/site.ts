// Public origin for absolute URLs in metadata (og:image, canonical). Falls back to localhost in development.
export const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

export const siteName = 'RealCheck';
