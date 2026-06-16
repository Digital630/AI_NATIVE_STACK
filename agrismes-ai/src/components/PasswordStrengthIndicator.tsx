import { Check, X } from "lucide-react";
import { validatePassword, passwordRequirements } from "@/utils/passwordValidation";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);
  
  if (!password) return null;
  
  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
      {passwordRequirements.map((req) => {
        const isMet = validation[req.key];
        return (
          <div key={req.key} className="flex items-center gap-2 text-xs">
            {isMet ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <X className="h-3 w-3 text-destructive" />
            )}
            <span className={isMet ? "text-primary" : "text-muted-foreground"}>
              {req.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
