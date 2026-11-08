import { Coins, ShieldCheck, Smartphone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthShell, type Pitch } from '@/components/site/auth-shell';
import { Button } from '@/components/ui/button';
import { MIN_WITHDRAWAL_CENTS, PAYOUT_ASSET } from '@/lib/constants';
import { formatMoney } from '@/lib/money';
import { devEvaluatorLoginAction } from '@/server/actions/evaluator-auth';
import { TelegramLogin } from './telegram-login';

export const metadata: Metadata = { title: 'Start earning' };

// Only decides whether to show the shortcut; the action itself re-checks on the server.
const DEV_MOCK = process.env.NEXT_PUBLIC_TMA_DEV_MOCK === 'true' && process.env.NODE_ENV !== 'production';

const evaluatorPitch: Pitch = {
  headline: 'Label data, get paid.',
  points: [
    { icon: Smartphone, text: 'One account on the web and in the Telegram app' },
    { icon: ShieldCheck, text: 'Accurate answers raise your reputation' },
    { icon: Coins, text: `Withdraw ${PAYOUT_ASSET} to your TON wallet from ${formatMoney(MIN_WITHDRAWAL_CENTS)}` },
  ],
};

// Evaluators sign in with Telegram, so the web and the Mini App share one account. Telegram is
// also what makes each account belong to a real phone number, which keeps paid work honest.
export default function EvaluatorLoginPage() {
  return (
    <AuthShell
      title="Start earning"
      description="Sign in with Telegram to label tasks on the web. Your balance and reputation are the same as in the app."
      pitch={evaluatorPitch}
      footer={
        <>
          Have data to label?{' '}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in as a team
          </Link>
        </>
      }
    >
      {/* The error message comes from ?error=, which is request-time data. */}
      <Suspense>
        <TelegramLogin botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME} />
      </Suspense>
      {DEV_MOCK && (
        <form action={devEvaluatorLoginAction} className="mt-4">
          <Button type="submit" variant="outline" className="h-11 w-full">
            Continue as dev evaluator
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
