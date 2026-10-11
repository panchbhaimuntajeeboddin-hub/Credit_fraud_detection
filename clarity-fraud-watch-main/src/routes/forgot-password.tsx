import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Field, inputCls } from "@/components/auth/AuthShell";
import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Sentinel" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send you a secure link to set a new password."
      footer={<><Link to="/login" className="text-primary hover:underline">Back to login</Link></>}
    >
      {sent ? (
        <div className="rounded-2xl border border-border bg-secondary/30 p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
            <Mail className="h-5 w-5" />
          </div>
          <div className="mt-3 font-display text-lg font-semibold">Check your inbox</div>
          <p className="mt-1 text-sm text-muted-foreground">We sent a reset link to your email. It expires in 30 minutes.</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e)=>{e.preventDefault(); setSent(true);}}>
          <Field label="Work email"><input type="email" required className={inputCls} placeholder="you@company.com" /></Field>
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg btn-primary px-4 py-2.5 text-sm font-semibold">
            Send reset link <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}
    </AuthShell>
  );
}
