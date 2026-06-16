import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
  source?: string;
}

export function WaitlistModal({ open, onClose, source = "upgrade_plan" }: WaitlistModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "duplicate">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setStatus("loading");

    try {
      const { data } = await supabase.functions.invoke("waitlist-signup", {
        body: { name, email, role, source },
      });

      if (data?.duplicate) {
        setStatus("duplicate");
      } else if (data?.success) {
        setStatus("success");
      } else {
        throw new Error("Unexpected response");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setName("");
    setEmail("");
    setRole("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Join AGRISMES Early Access
          </DialogTitle>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-medium text-foreground">You're on the list!</p>
            <p className="text-sm text-muted-foreground">We'll notify you when access opens.</p>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "AGRISMES", text: "Join the AGRISMES waitlist for advanced trade intelligence!", url: window.location.origin });
                }
              }}
              className="mt-2 text-sm text-primary hover:underline font-medium"
            >
              Invite others to join →
            </button>
          </div>
        ) : status === "duplicate" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <p className="font-medium text-foreground">Already on the list</p>
            <p className="text-sm text-muted-foreground">We'll keep you updated when access opens.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="wl-name">Full Name</Label>
              <Input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wl-email">Email</Label>
              <Input id="wl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="exporter">Exporter</SelectItem>
                  <SelectItem value="trader">Trader</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {status === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</> : "Join Now"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">Be among the first to unlock advanced trade intelligence.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
