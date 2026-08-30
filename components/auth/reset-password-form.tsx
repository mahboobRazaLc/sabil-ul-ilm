"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
        setMessage(data.message || "Your password has been reset successfully!");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
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
          <h1 style={{ fontSize: 24, margin: "20px 0 4px", color: "var(--green-900)" }}>
            Invalid Link
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "8px 0 0" }}>
            This password reset link is invalid or missing a token.
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <Link href="/forgot-password" style={{ color: "var(--green-800)", fontWeight: 700, fontSize: 14 }}>
            Request a new reset link →
          </Link>
        </div>
      </div>
    );
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
          Set New Password
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
          Enter your new password below.
        </p>
      </div>

      {message && (
        <div
          role="status"
          style={{
            background: success ? "var(--green-100)" : "#fee2e2",
            border: success ? "1px solid #86efac" : "1px solid #fca5a5",
            color: success ? "var(--green-800)" : "#991b1b",
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

      {success ? (
        <div style={{ textAlign: "center" }}>
          <Link href="/login" style={{ color: "var(--green-800)", fontWeight: 700, fontSize: 15 }}>
            Go to Sign In →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--green-900)", marginBottom: 6 }}>
              New Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--green-900)", marginBottom: 6 }}>
              Confirm New Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <button
            className="button"
            disabled={busy}
            type="submit"
            style={{ width: "100%", marginTop: 8, padding: "12px 18px", fontSize: 15 }}
          >
            {busy ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid var(--border-light)",
          fontSize: 14,
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        <Link href="/login" style={{ color: "var(--text-muted)", fontSize: 13 }}>
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}
