"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/db/supabase-browser";

/**
 * Passwordless email-OTP sign-in. Works on Supabase out of the box (no SMS or
 * OAuth provider needed). Phone OTP and Google/Apple can be layered on later.
 */
export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setStep("code");
  }

  async function verify() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setBusy(false);
    if (error) return setError(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">Sign in to Dwello</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        We&apos;ll email you a one-time code — no password needed.
      </p>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive mt-4 rounded-md border p-3 text-sm">
          {error}
        </p>
      )}

      {step === "email" ? (
        <div className="mt-6 space-y-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && sendCode()}
            placeholder="you@example.com"
          />
          <Button
            onClick={sendCode}
            disabled={busy || !email}
            className="w-full"
          >
            {busy ? "Sending…" : "Send code"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <Label htmlFor="code">Enter the 6-digit code sent to {email}</Label>
          <Input
            id="code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && code && verify()}
            placeholder="123456"
          />
          <Button onClick={verify} disabled={busy || !code} className="w-full">
            {busy ? "Verifying…" : "Verify & sign in"}
          </Button>
          <button
            className="text-muted-foreground text-sm underline"
            onClick={() => setStep("email")}
          >
            Use a different email
          </button>
        </div>
      )}
    </main>
  );
}
