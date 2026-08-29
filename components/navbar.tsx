import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/authorization";
import { signOut } from "@/auth";
import { db } from "@/lib/db";
import { NotificationBell } from "@/components/notification-bell";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { DonationButton } from "@/components/donation-button";

export async function Navbar({ active }: { active?: "home" | "classes" | "library" | "videos" | "questions" | "dashboard" | "profile" | "search" | "contact" | "notes" }) {
  const user = await getOptionalUser();
  const isAdminOrEditor = user?.role === "ADMIN" || user?.role === "EDITOR";

  let unreadCount = 0;
  let recentNotifications: { id: string; message: string; read: boolean; questionId: string | null; targetUrl: string | null; createdAt: Date }[] = [];
  if (user?.id) {
    unreadCount = await db.notification.count({ where: { userId: user.id, read: false } });
    recentNotifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, message: true, read: true, questionId: true, targetUrl: true, createdAt: true },
    });
  }

  return (
    <>
    <header className="public-nav">
      <Link className="brand-link" href="/">
        <img src="/logo.png" alt="Sabeel-ul-Ilm" className="brand-logo" />
        <span className="brand-text-group">
          <span className="brand-name">Sabeel-ul-Ilm</span>
          <span className="brand-arabic">سبیلُ العلم</span>
        </span>
      </Link>

      <DonationButton />

      {/* Desktop nav only — hamburger removed, mobile uses bottom tab bar */}
      <nav>
        <Link href="/" style={active === "home" ? { color: "var(--green-800)", fontWeight: 700, background: "var(--green-100)" } : {}}>
          Home
        </Link>
        <Link href="/classes" style={active === "classes" ? { color: "var(--green-800)", fontWeight: 700, background: "var(--green-100)" } : {}}>
          Classes
        </Link>
        <Link href="/search" style={active === "search" ? { color: "var(--green-800)", fontWeight: 700, background: "var(--green-100)" } : {}}>
          Search
        </Link>
        <Link href="/contact" style={active === "contact" ? { color: "var(--green-800)", fontWeight: 700, background: "var(--green-100)" } : {}}>
          Contact
        </Link>
        <Link href="/notes" style={active === "notes" ? { color: "var(--green-800)", fontWeight: 700, background: "var(--green-100)" } : {}}>
          Notes
        </Link>

        <span className="nav-divider" />

        {isAdminOrEditor && (
          <Link
            href="/admin/dashboard"
            style={
              active === "dashboard"
                ? { color: "var(--green-800)", fontWeight: 700, background: "var(--green-100)" }
                : { color: "var(--gold-600)", fontWeight: 700 }
            }
          >
            Admin
          </Link>
        )}

        {user ? (
          <>
            <NotificationBell notifications={recentNotifications} unreadCount={unreadCount} />
            <Link
              href="/profile"
              style={active === "profile" ? { color: "var(--green-800)", fontWeight: 700, background: "var(--green-100)" } : {}}
            >
              Profile
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--white)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="button"
            style={{ padding: "7px 16px", fontSize: 14 }}
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
    <MobileTabBar isLoggedIn={!!user} />
    </>
  );
}
