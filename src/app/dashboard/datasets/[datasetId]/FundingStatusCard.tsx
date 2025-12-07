'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, X, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { addFundsAction } from '@/app/actions/payments/addFundsAction';

interface Props {
  balance: number;
  estimatedCost: number;
  isInsufficient: boolean;
}

export function FundingStatusCard({ balance, estimatedCost, isInsufficient }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate deficit for the placeholder/suggestion
  const deficit = Math.max(0, estimatedCost - balance);
  const suggestAmount = deficit > 0 ? Math.ceil(deficit) : 10;

  const handleTopUp = () => {
    const value = parseFloat(amountToAdd);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    startTransition(async () => {
      // Call the server action
      const result = await addFundsAction(value);
      if (result.success) {
        toast.success(`Successfully added ${formatCurrency(value)}`);
        setShowModal(false);
        setAmountToAdd('');
      } else {
        toast.error(result.message);
      }
    });
  };

  // --- 1. RENDER: The Card Wrapper ---
  // If insufficient, it's a button. If sufficient, it's a div.
  const Wrapper = isInsufficient ? 'button' : 'div';
  
  console.log('➡️➡️➡️', isInsufficient);
  
  return (
    <>
      <Wrapper
        onClick={() => isInsufficient && setShowModal(true)}
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-lg border shadow-sm text-left w-full h-full transition-all duration-200",
          "bg-card border-border", // Default styles
          isInsufficient 
            ? "cursor-pointer border-destructive/50 bg-destructive/5 hover:bg-destructive/10 hover:shadow-md group" 
            : ""
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors",
          isInsufficient 
            ? "bg-destructive/10 text-destructive group-hover:bg-destructive/20" 
            : "bg-green-500/10 text-green-600"
        )}>
          {isInsufficient ? <AlertCircle className="w-5 h-5" /> : "💰"}
        </div>
        
        <div>
          <p className={cn(
            "text-xs uppercase font-semibold tracking-wide",
            isInsufficient ? "text-destructive" : "text-muted-foreground"
          )}>
            {isInsufficient ? "Insufficient Funds" : "Est. Cost to Finish"}
          </p>
          <p className={cn(
            "text-lg font-bold",
            isInsufficient ? "text-destructive" : "text-foreground"
          )}>
            {formatCurrency(estimatedCost)}
          </p>
          {isInsufficient && (
             <span className="text-[10px] font-medium text-destructive/80 animate-pulse">
               Click to Top Up
             </span>
          )}
        </div>
      </Wrapper>

      {/* --- 2. RENDER: The Top Up Modal --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-popover border border-border rounded-xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            
            {/* Close */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Add Funds</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your balance is low. Add funds to continue task activation.
              </p>
            </div>

            {/* Financial Details */}
            <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required for Dataset:</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(estimatedCost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border mt-2">
                <span className="text-destructive font-medium">Shortage:</span>
                <span className="font-mono font-bold text-destructive">-{formatCurrency(deficit)}</span>
              </div>
            </div>

            {/* Input */}
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium leading-none text-foreground">Amount to Add ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amountToAdd}
                  onChange={(e) => setAmountToAdd(e.target.value)}
                  placeholder={`Suggested: ${suggestAmount.toFixed(2)}`}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-7 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "text-foreground"
                  )}
                  autoFocus
                />
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleTopUp}
              disabled={!amountToAdd || parseFloat(amountToAdd) <= 0 || isPending}
              className={cn(
                "w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 py-2 px-4",
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isPending ? (
                  <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                  </>
              ) : (
                  `Pay $${amountToAdd || '0.00'}`
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
