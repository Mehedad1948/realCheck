'use client';

import { useState, useTransition } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, CreditCard, Loader2 } from "lucide-react";
import { useHashParams } from "@/hooks/useHashParams";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { dollarsToCents, formatMoney } from '@/lib/money';
import { topUpAction } from '@/server/actions/wallet';

const PRESET_AMOUNTS = [5, 10, 20, 50, 100];

export function TopUpModal({ balanceCents }: { balanceCents: number }) {
    const [amount, setAmount] = useState<string>("");
    const [isPending, startTransition] = useTransition();
    const { setHashParams } = useHashParams();

    // Helper to handle manual typing or preset clicking
    const handleAmountChange = (value: string) => {
        // Only allow numbers and one decimal point
        if (/^\d*\.?\d{0,2}$/.test(value)) {
            setAmount(value);
        }
    };

    const handleSubmit = () => {
        const value = parseFloat(amount);
        if (!value || value <= 0) return;

        startTransition(async () => {
            const result = await topUpAction({ amountCents: dollarsToCents(value) });

            if (result.ok) {
                // 1. Clear Input
                setAmount("");
                // 2. Close Modal (by removing the hash param)
                setHashParams({ topUp: null });
                // 3. Show Success (Optional)
                toast.success(`Added ${formatMoney(dollarsToCents(value))}`);
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <ResponsiveModal
            identifier="topUp"
            title="Add Funds"
            description="Add credits to pay evaluators for your datasets."
        >
            <div className="flex flex-col gap-6 pt-4">

                {/* Visual Header */}
                <div className="flex flex-col items-center justify-center space-y-2 py-4 bg-muted/30 rounded-lg border border-border/50 border-dashed">
                    <span className='text-lg font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg'>
                        {formatMoney(balanceCents)}
                    </span>
                    <p className="text-sm text-muted-foreground font-medium">
                        Current balance
                    </p>
                </div>

                {/* Amount Selection */}
                <div className="space-y-3">
                    <Label>Select Amount</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {PRESET_AMOUNTS.map((preset) => (
                            <Button
                                key={preset}
                                variant={amount === preset.toString() ? "default" : "outline"}
                                onClick={() => setAmount(preset.toString())}
                                className={cn(
                                    "h-12 transition-all",
                                    amount === preset.toString() ? "border-primary" : "hover:border-primary/50"
                                )}
                                disabled={isPending}
                            >
                                ${preset}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Custom Input */}
                <div className="space-y-3">
                    <Label htmlFor="custom-amount">Custom Amount</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                            id="custom-amount"
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pl-9 text-lg font-medium"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    className="w-full text-lg h-12"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!amount || parseFloat(amount) <= 0 || isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Pay ${amount || "0.00"}
                        </>
                    )}
                </Button>

                {/* Footer Note */}
                <p className="text-xs text-center text-muted-foreground">
                    Demo mode: no payment is taken and funds are credited instantly.
                </p>
            </div>
        </ResponsiveModal>
    );
}
