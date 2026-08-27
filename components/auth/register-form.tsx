import Link from "next/link";
import { registerStudent } from "@/app/actions";

interface RegisterFormProps {
  classes: Array<{ id: string; name: string }>;
  notice?: string;
}

export function RegisterForm({ classes, notice }: RegisterFormProps) {
  return (
    <div
      className="auth-form-card"
      style={{
        maxWidth: 460,
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
          Create Student Account
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
          Join to access textbooks, track your learning progress, and ask teacher questions.
        </p>
      </div>

      {notice && (
        <div
          role="alert"
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {notice}
        </div>
      )}

      <form action={registerStudent} style={{ display: "grid", gap: 18 }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--green-900)", marginBottom: 6 }}>
            Full Name <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. Samira Khan"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--green-900)", marginBottom: 6 }}>
            Email Address <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="student@example.com"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--green-900)", marginBottom: 6 }}>
            Password <span style={{ color: "#ef4444" }}>*</span> <small style={{ color: "var(--text-muted)" }}>(min 8 characters)</small>
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••••••"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--green-900)", marginBottom: 6 }}>
            Your Class / Grade Level <small style={{ color: "var(--text-muted)" }}>(optional)</small>
          </label>
          <select name="classId" defaultValue="">
            <option value="">Select your enrolled class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="button"
          type="submit"
          style={{ width: "100%", marginTop: 8, padding: "12px 18px", fontSize: 15 }}
        >
          Create Free Student Account
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
        }}
      >
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--green-800)", fontWeight: 700 }}>
          Sign in here →
        </Link>
      </div>
    </div>
  );
}
