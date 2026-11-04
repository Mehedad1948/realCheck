'use client';

import { BadgeCheck, MousePointerClick, ShieldCheck } from 'lucide-react';
import { useCallback, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useTelegram } from './telegram-provider';
import { IconTile } from './ui';

const STORAGE_KEY = 'rc:onboarded:v1';
const EVENT = 'rc-onboarding';

function readSeen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return true; // storage blocked: don't nag on every launch
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

const steps = [
  {
    icon: <MousePointerClick />,
    tone: 'bg-sky-500',
    title: 'Pick a task, tap an answer',
    text: 'Each card asks one quick question about a text or an image.',
  },
  {
    icon: <ShieldCheck />,
    tone: 'bg-amber-500',
    title: 'Answers are final',
    text: 'Some cards are check questions with known answers. Careless answers pause your account.',
  },
  {
    icon: <BadgeCheck />,
    tone: 'bg-emerald-500',
    title: 'Get paid per answer',
    text: 'Every accepted answer is added to your balance right away.',
  },
];

/** A one-time introduction shown on the first launch inside Telegram. */
export function Onboarding() {
  const { canAuthenticate } = useTelegram();
  // The server snapshot says "seen", so nothing flashes before hydration.
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return (
    <Drawer open={canAuthenticate && !seen} onOpenChange={(open) => !open && dismiss()}>
      <DrawerContent className="bg-card">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="text-left md:text-left">
            <DrawerTitle className="text-2xl">Welcome to RealCheck</DrawerTitle>
            <DrawerDescription>Earn by helping teams label their data.</DrawerDescription>
          </DrawerHeader>
          <ol className="space-y-5 px-4 py-2">
            {steps.map((step) => (
              <li key={step.title} className="flex gap-4">
                <IconTile className={step.tone}>{step.icon}</IconTile>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <DrawerFooter className="pb-[calc(1rem+var(--tg-safe-area-inset-bottom,0px))]">
            <Button size="lg" className="h-12 rounded-xl text-base" onClick={dismiss}>
              Start earning
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
