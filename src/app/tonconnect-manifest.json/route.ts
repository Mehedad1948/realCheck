// TON Connect app manifest: wallets show this name and icon when the evaluator connects,
// and bind the ton_proof signature to this URL's domain.
// https://docs.ton.org/applications/ton-connect/manifest

export function GET() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return Response.json({
    url,
    name: 'RealCheck',
    iconUrl: new URL('/tonconnect-icon.png', url).toString(),
  });
}
