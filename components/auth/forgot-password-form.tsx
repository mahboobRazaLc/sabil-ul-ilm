"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage(data.message || "If an account exists with this email, you will receive a password reset link shortly.");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setBusy(false);
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
          Forgot Password?
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {message && (
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
          {message}
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

        <button
          className="button"
          disabled={busy}
          type="submit"
          style={{ width: "100%", marginTop: 8, padding: "12px 18px", fontSize: 15 }}
        >
          {busy ? "Sending..." : "Send Reset Link"}
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
          Remember your password?{" "}
          <Link href="/login" style={{ color: "var(--green-800)", fontWeight: 700 }}>
            Sign in here →
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
