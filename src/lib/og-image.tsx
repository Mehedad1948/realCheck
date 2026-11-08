import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { LOGO_PATH } from '@/components/site/logo';

// Shared renderer for the opengraph-image routes. Satori can't read WebP or WOFF2, so it draws from a JPEG
// crop of public/images/silk-card.webp and static TTF instances of the site's variable fonts (src/fonts/og:
// Roboto Flex at wght 280 / opsz 120 like the landing headline, Geist at 400 and 520).

export const ogSize = { width: 1200, height: 630 };

const INK = '#07071a';

function load(...path: string[]) {
  return readFile(join(process.cwd(), ...path));
}

export async function renderOgImage({ lines, subtitle }: { lines: [string, string]; subtitle: string }) {
  const [silk, display, text, textMedium] = await Promise.all([
    load('public/images/silk-og.jpg'),
    load('src/fonts/og/roboto-flex-light.ttf'),
    load('src/fonts/og/geist-regular.ttf'),
    load('src/fonts/og/geist-medium.ttf'),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: INK, fontFamily: 'Geist' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/jpeg;base64,${silk.toString('base64')}`} width={1200} height={630} style={{ position: 'absolute', inset: 0 }} alt="" />

        {/* Scrims: deepen the left for the headline, let the silk breathe on the right, darken the edges. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage: `linear-gradient(100deg, rgba(7,7,26,0.92) 0%, rgba(7,7,26,0.72) 38%, rgba(7,7,26,0.22) 72%, rgba(7,7,26,0.05) 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage: 'radial-gradient(ellipse 90% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(3,3,12,0.55) 100%)',
          }}
        />

        {/* Hairline frame, echoing the landing page's rounded hero panel. */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            display: 'flex',
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', padding: '76px 92px 70px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg viewBox="0 0 1300 1497" width={30} height={35}>
              <defs>
                <linearGradient id="mark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="1" stopColor="#a59dff" />
                </linearGradient>
              </defs>
              <path d={LOGO_PATH} fill="url(#mark)" />
            </svg>
            <span style={{ fontFamily: 'Geist Medium', fontSize: 30, letterSpacing: '-0.02em', color: '#f4f2ff' }}>RealCheck</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Roboto Flex',
                fontSize: 108,
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                textShadow: '0 4px 40px rgba(20,14,80,0.6)',
              }}
            >
              <span style={{ color: '#ffffff' }}>{lines[0]}</span>
              <span style={{ color: 'rgba(236,233,255,0.74)' }}>{lines[1]}</span>
            </div>
            <span style={{ marginTop: 30, fontSize: 30, letterSpacing: '-0.01em', color: 'rgba(236,233,255,0.82)' }}>{subtitle}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px 10px 16px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(12,10,40,0.45)',
                fontFamily: 'Geist Medium',
                fontSize: 20,
                color: '#ece9ff',
              }}
            >
              <svg viewBox="0 0 24 24" width={20} height={20}>
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#a59dff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verified by consensus
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: 'Roboto Flex', data: display, style: 'normal', weight: 300 },
        { name: 'Geist', data: text, style: 'normal', weight: 400 },
        { name: 'Geist Medium', data: textMedium, style: 'normal', weight: 500 },
      ],
    },
  );
}
