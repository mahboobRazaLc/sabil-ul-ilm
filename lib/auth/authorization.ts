import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function getOptionalUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function requireStudent() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }
  if (!role || !["ADMIN", "EDITOR"].includes(role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireAdminUser() {
  const session = await requireAdmin();
  if (!session.user?.email) {
    redirect("/login");
  }
  return session;
}

