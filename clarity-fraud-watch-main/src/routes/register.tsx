import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Field, inputCls } from "@/components/auth/AuthShell";
import { ArrowRight, Check, Loader2, AlertCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Sentinel" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [pw, setPw] = useState("");
  const [agree, setAgree] = useState(true);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = Math.min(
    4,
    [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid work email address.");
      return;
    }
    if (!company.trim()) {
      setError("Please enter your company name.");
      return;
    }
    if (pw.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!agree) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        company: company.trim(),
        password: pw,
      });

      if (!res.success) {
        setError(res.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      // Registration succeeded — user is authenticated as the new account
      nav({ to: "/app/dashboard" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start scoring transactions in minutes — no credit card required."
      footer={
        <>
          Already on Sentinel?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
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

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name">
            <input
              className={inputCls}
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Alex"
              disabled={loading}
            />
          </Field>
          <Field label="Last name">
            <input
              className={inputCls}
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Morgan"
              disabled={loading}
            />
          </Field>
        </div>

        <Field label="Work email">
          <input
            type="email"
            required
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            disabled={loading}
          />
        </Field>

        <Field label="Company">
          <input
            className={inputCls}
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
            disabled={loading}
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            required
            className={inputCls}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="At least 8 characters"
            disabled={loading}
          />
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < strength
                    ? strength <= 1
                      ? "bg-destructive"
                      : strength <= 2
                      ? "bg-warning"
                      : "bg-success"
                    : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </Field>

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            required
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border bg-secondary"
            disabled={loading}
          />
          I agree to the{" "}
          <a className="text-primary hover:underline" href="#">
            Terms
          </a>{" "}
          and{" "}
          <a className="text-primary hover:underline" href="#">
            Privacy Policy
          </a>
          .
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg btn-primary px-4 py-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <ul className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-muted-foreground">
          {["14-day free trial", "No credit card", "Cancel anytime", "SOC 2 secure"].map((x) => (
            <li key={x} className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-success" />
              {x}
            </li>
          ))}
        </ul>
      </form>
    </AuthShell>
  );
}
