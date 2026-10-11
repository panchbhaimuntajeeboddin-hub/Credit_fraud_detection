import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, inputCls } from "@/components/auth/AuthShell";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Sentinel" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const res = await login(email.trim(), password);

      if (!res.success) {
        setError(res.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      nav({ to: "/app/dashboard" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Sentinel workspace."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Field label="Work email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@company.com"
            disabled={loading}
          />
        </Field>

        <Field
          label="Password"
          hint={
            <Link to="/forgot-password" className="text-[11px] text-primary hover:underline">
              Forgot?
            </Link>
          }
        >
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="Your password"
            disabled={loading}
          />
        </Field>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border bg-secondary"
            defaultChecked
            disabled={loading}
          />
          Keep me signed in for 30 days
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg btn-primary px-4 py-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Logging in…
            </>
          ) : (
            <>
              Log in <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="relative my-2 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="bg-background px-2">or continue with</span>
          <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="rounded-lg btn-ghost px-3 py-2 text-sm">
            Google
          </button>
          <button type="button" className="rounded-lg btn-ghost px-3 py-2 text-sm">
            SSO
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
