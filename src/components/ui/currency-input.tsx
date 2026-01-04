import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  currencySymbol?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, currencySymbol = "R$", ...props }, ref) => {
    // Format value in cents to display string (e.g., 1234 cents -> "12,34")
    const formatValueForDisplay = (valueInCents: number): string => {
      const reais = Math.floor(valueInCents / 100);
      const centavos = valueInCents % 100;
      return `${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
    };

    // Internal state to track the raw cents value
    const [internalValue, setInternalValue] = React.useState<number>(Math.round(value * 100));
    
    // Sync with external value changes
    React.useEffect(() => {
      setInternalValue(Math.round(value * 100));
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if ([8, 46, 9, 27, 13].includes(e.keyCode)) {
        if (e.keyCode === 8) { // Backspace
          e.preventDefault();
          const newValue = Math.floor(internalValue / 10);
          setInternalValue(newValue);
          onChange(newValue / 100);
        }
        return;
      }
      
      // Allow numbers 0-9
      if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
        e.preventDefault();
        const digit = e.keyCode >= 96 ? e.keyCode - 96 : e.keyCode - 48;
        
        // Limit to prevent overflow (max R$ 999.999,99)
        if (internalValue >= 99999999) return;
        
        const newValue = internalValue * 10 + digit;
        setInternalValue(newValue);
        onChange(newValue / 100);
        return;
      }
      
      // Prevent all other keys
      e.preventDefault();
    };

    const handleChange = () => {
      // Controlled by keyDown, prevent default change
    };

    const displayValue = formatValueForDisplay(internalValue);

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-bold pointer-events-none">
          {currencySymbol}
        </span>
        <input
          type="text"
          inputMode="numeric"
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 text-right font-mono",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
