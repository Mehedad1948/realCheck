import { ImageResponse } from 'next/og';

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
          color: '#ffffff',
          fontSize: 112,
          fontWeight: 700,
          letterSpacing: -6,
        }}
      >
        R
      </div>
    ),
    { width: 180, height: 180 },
  );
}
