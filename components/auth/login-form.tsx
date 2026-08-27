"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const notice = searchParams.get("notice");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please verify your credentials.");
      setBusy(false);
    } else {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;

        if (callbackUrl) {
          window.location.href = callbackUrl;
        } else if (role === "ADMIN" || role === "EDITOR") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      } catch {
        window.location.href = callbackUrl || "/dashboard";
      }
    }
  }

  return (
    <div
      className="auth-form-card"
      style={{
        maxWidth: 440,
        margin: "48px auto",
        background: "#ffffff",
        padding: "40px 36px",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 12px 40px rgba(12,60,38,0.08)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: "var(--green-900)", textDecoration: "none", display: "block", marginBottom: 4 }}>
          Sabeel-ul-Ilm
        </Link>
        <span style={{ fontFamily: "var(--font-arabic), 'Noto Sans Arabic', serif", fontSize: 14, color: "var(--gold-600)", fontWeight: 700 }}>
          سبیلُ العلم
        </span>
        <h1 style={{ fontSize: 24, margin: "20px 0 4px", color: "var(--green-900)" }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
          Sign in to access your learning dashboard and materials.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            background: "var(--green-100)",
            border: "1px solid #86efac",
            color: "var(--green-800)",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            marginBottom: 18,
          }}
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            marginBottom: 18,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--green-900)", marginBottom: 6 }}>
            Email Address
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--green-900)", marginBottom: 6 }}>
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />
        </div>

        <button
          className="button"
          disabled={busy}
          type="submit"
          style={{ width: "100%", marginTop: 8, padding: "12px 18px", fontSize: 15 }}
        >
          {busy ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid var(--border-light)",
          fontSize: 14,
          color: "var(--text-muted)",
          textAlign: "center",
          display: "grid",
          gap: 10,
        }}
      >
        <div>
          New student?{" "}
          <Link href="/register" style={{ color: "var(--green-800)", fontWeight: 700 }}>
            Create student account →
          </Link>
        </div>
        <div>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13 }}>
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
