import Link from "next/link";
import { requireStudent } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions";

export const dynamic = "force-dynamic";

function getNotificationIcon(message: string): { icon: string; color: string } {
  const lower = message.toLowerCase();
  if (lower.includes("pdf")) return { icon: "📄", color: "var(--gold-600)" };
  if (lower.includes("video")) return { icon: "🎥", color: "var(--green-700)" };
  if (lower.includes("lesson") || lower.includes("library")) return { icon: "📖", color: "var(--green-800)" };
  if (lower.includes("subject")) return { icon: "📚", color: "var(--green-900)" };
  if (lower.includes("answer") || lower.includes("teacher")) return { icon: "💬", color: "var(--gold-600)" };
  return { icon: "🔔", color: "var(--text-secondary)" };
}

function relativeTime(date: Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function NotificationsPage() {
  const session = await requireStudent();
  const userId = session.user!.id!;

  const notifications = await db.notification.findMany({
    where: { userId },
    include: { question: { select: { id: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="public">
      <Navbar active="dashboard" />

      <div style={{ marginBottom: 32 }}>
        <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="notif-page-header">
        <div>
          <p className="eyebrow">NOTIFICATIONS</p>
          <h1 style={{ margin: 0, fontSize: 24, color: "var(--green-900)" }}>My Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="notif-page-mark-all">
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="notif-page-empty">
          <span className="notif-page-empty-icon">🔔</span>
          <h3>No notifications yet</h3>
          <p>When a teacher answers your question or new content is added to your class, you will see it here.</p>
        </div>
      ) : (
        <div className="notif-page-list">
          {notifications.map((n) => {
            const { icon, color } = getNotificationIcon(n.message);
            return (
              <div
                key={n.id}
                className={`notif-page-card ${n.read ? "notif-page-card-read" : "notif-page-card-unread"}`}
              >
                <span className="notif-page-icon" style={{ color }}>{icon}</span>
                <div className="notif-page-content">
                  <p className={`notif-page-message ${n.read ? "" : "notif-page-message-unread"}`}>
                    {n.message}
                  </p>
                  <span className="notif-page-time">{relativeTime(n.createdAt)}</span>
                </div>
                <div className="notif-page-actions">
                  {!n.read && (
                    <form action={markNotificationRead}>
                      <input type="hidden" name="notificationId" value={n.id} />
                      <input type="hidden" name="returnUrl" value="/notifications" />
                      <button type="submit" className="notif-page-btn-secondary">
                        Mark read
                      </button>
                    </form>
                  )}
                  <Link
                    href={n.targetUrl || `/dashboard#question-${n.questionId}`}
                    className="notif-page-btn-primary"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
