import { RegisterForm } from "@/components/auth/register-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [params, classes] = await Promise.all([
    searchParams,
    db.class.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main>
      <RegisterForm classes={classes} notice={params.notice} />
    </main>
  );
}
