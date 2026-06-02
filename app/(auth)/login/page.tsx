"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { cn } from "@/lib/utils";

type Mode = "otp" | "password";

/**
 * Sign-in screen. Two methods:
 *  - Email one-time code (passwordless; works on Supabase out of the box).
 *  - Email + password (classic; sign in or create an account).
 * Phone OTP and Google/Apple can be layered on later.
 */
export default function LoginPage() {
  const router = useRouter();
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [mode, setMode] = useState<Mode>("otp");
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function reset() {
    setError(null);
    setNotice(null);
  }

  async function sendCode() {
    setBusy(true);
    reset();
    const supabase = createSupabaseBrowserClient();
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
    reset();
    const supabase = createSupabaseBrowserClient();
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

  async function signInWithPassword() {
    setBusy(true);
    reset();
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (error) return setError(error.message);
    router.push("/");
    router.refresh();
  }

  async function signUpWithPassword() {
    setBusy(true);
    reset();
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    if (data.session) {
      // Email confirmation is disabled → signed in immediately.
      router.push("/");
      router.refresh();
    } else {
      // Email confirmation is on → user must click the link first.
      setNotice("Account created. Check your email to confirm, then sign in.");
    }
  }

  if (!configured) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-bold">Sign-in isn&apos;t configured</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          The Supabase keys aren&apos;t available in this build. Set
          <code className="mx-1">NEXT_PUBLIC_SUPABASE_URL</code> and
          <code className="mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your
          host&apos;s environment variables, then redeploy.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">Sign in to Dwello</h1>

      {/* Method toggle */}
      <div className="mt-4 flex gap-1 rounded-lg border p-1 text-sm">
        <button
          className={cn(
            "flex-1 rounded-md px-3 py-1.5",
            mode === "otp" ? "bg-primary text-primary-foreground" : "",
          )}
          onClick={() => {
            setMode("otp");
            setStep("email");
            reset();
          }}
        >
          Email code
        </button>
        <button
          className={cn(
            "flex-1 rounded-md px-3 py-1.5",
            mode === "password" ? "bg-primary text-primary-foreground" : "",
          )}
          onClick={() => {
            setMode("password");
            reset();
          }}
        >
          Password
        </button>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive mt-4 rounded-md border p-3 text-sm">
          {error}
        </p>
      )}
      {notice && (
        <p className="bg-accent/40 mt-4 rounded-md border p-3 text-sm">
          {notice}
        </p>
      )}

      {mode === "otp" ? (
        step === "email" ? (
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
            <Button
              onClick={verify}
              disabled={busy || !code}
              className="w-full"
            >
              {busy ? "Verifying…" : "Verify & sign in"}
            </Button>
            <button
              className="text-muted-foreground text-sm underline"
              onClick={() => setStep("email")}
            >
              Use a different email
            </button>
          </div>
        )
      ) : (
        <div className="mt-6 space-y-3">
          <Label htmlFor="pemail">Email</Label>
          <Input
            id="pemail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && email && password && signInWithPassword()
            }
            placeholder="••••••••"
          />
          <Button
            onClick={signInWithPassword}
            disabled={busy || !email || !password}
            className="w-full"
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <Button
            variant="outline"
            onClick={signUpWithPassword}
            disabled={busy || !email || password.length < 6}
            className="w-full"
          >
            Create account
          </Button>
          <p className="text-muted-foreground text-xs">
            New here? Use a password of at least 6 characters and tap “Create
            account”.
          </p>
        </div>
      )}
    </main>
  );
}
