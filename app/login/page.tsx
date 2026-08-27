import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main>
      <Suspense fallback={<div style={{ textAlign: "center", padding: 40 }}>Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

