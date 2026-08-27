import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/auth/authorization";

const links: [string, string, string][] = [
  ["/admin/dashboard", "Overview", "📊"],
  ["/admin/classes", "Classes", "🏫"],
  ["/admin/subjects", "Subjects", "📋"],
  ["/admin/books", "Lessons", "📚"],
  ["/admin/videos", "Videos", "🎬"],
  ["/admin/notes", "Notes", "📄"],
  ["/admin/questions", "Questions", "❓"],
  ["/admin/audit-logs", "Audit Logs", "📝"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-main">
            <Link className="brand" href="/admin/dashboard">
              Sabeel-ul-Ilm <small>ADMIN</small>
            </Link>
          </div>
          <div className="sidebar-arabic">سبیلُ العلم</div>
          <Link href="/" target="_blank" className="sidebar-public-link">
            ↗ View Public Site
          </Link>
        </div>

        <nav>
          {links.map(([href, label, icon]) => (
            <Link key={href} href={href}>
              <span className="sidebar-nav-item">
                <span className="sidebar-nav-icon">{icon}</span>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-account">
          <span className="sidebar-account-name">{session.user?.name || "Administrator"}</span>
          <span className="sidebar-account-email">{session.user?.email}</span>
          <span className="badge sidebar-account-role" style={{ fontSize: 10 }}>
            {(session.user as { role?: string })?.role || "ADMIN"}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="sidebar-signout">Sign out</button>
          </form>
        </div>
      </aside>
      <section className="admin-content">{children}</section>
    </div>
  );
}
