import { ImageResponse } from 'next/og';
import { LOGO_PATH } from '@/components/site/logo';

// 180×180 PNG icon wallets show next to "RealCheck" when connecting.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0b0f',
        }}
      >
        <svg width={104} height={120} viewBox="0 0 1300 1497">
          <path d={LOGO_PATH} fill="#5E5BEA" />
        </svg>
      </div>
    ),
    { width: 180, height: 180 },
  );
}
