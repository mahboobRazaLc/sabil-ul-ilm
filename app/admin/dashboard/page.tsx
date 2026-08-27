import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    classesCount,
    booksCount,
    videosCount,
    openQuestionsCount,
    answeredQuestionsCount,
    recentLogs,
  ] = await Promise.all([
    db.class.count(),
    db.book.count(),
    db.video.count(),
    db.studentQuestion.count({ where: { status: "OPEN" } }),
    db.studentQuestion.count({ where: { status: "ANSWERED" } }),
    db.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const metrics = [
    { label: "Classes", count: classesCount, href: "/admin/classes", icon: "🏫" },
    { label: "Lessons", count: booksCount, href: "/admin/books", icon: "📚" },
    { label: "Videos", count: videosCount, href: "/admin/videos", icon: "🎬" },
    {
      label: "Open Questions",
      count: openQuestionsCount,
      href: "/admin/questions?status=OPEN",
      icon: "❓",
      highlight: openQuestionsCount > 0,
    },
    {
      label: "Answered Q&A",
      count: answeredQuestionsCount,
      href: "/admin/questions?status=ANSWERED",
      icon: "✅",
    },
  ];

  return (
    <main>
      {/* Premium Hero Header */}
      <div className="admin-hero">
        <div className="admin-hero-content">
          <div className="admin-hero-badges">
            <span className="admin-hero-badge admin-hero-badge-gold">ADMIN</span>
            <span className="admin-hero-badge admin-hero-badge-light">Dashboard</span>
          </div>
          <h1 className="admin-hero-title">Dashboard Overview</h1>
          <p className="admin-hero-sub">
            Real-time platform metrics, content operations, and student interaction status.
          </p>
        </div>
        <div className="admin-hero-actions">
          <Link className="button" href="/admin/books">
            + Add Book
          </Link>
          <Link className="button-secondary" href="/admin/videos">
            + Add Video
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="admin-stats">
        {metrics.map((m) => (
          <Link
            className={`admin-stat-card ${m.highlight ? "admin-stat-card-highlight" : ""}`}
            href={m.href}
            key={m.label}
          >
            <div className="admin-stat-top">
              <span className="admin-stat-label">{m.label}</span>
              <div className="admin-stat-icon">{m.icon}</div>
            </div>
            <div className="admin-stat-value">{m.count}</div>
            <span className="admin-stat-link">Manage records →</span>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Activity */}
      <div className="admin-quick-section">
        {/* Quick Actions */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Quick Actions</h2>
          </div>
          <div className="admin-quick-grid">
            <Link href="/admin/classes" className="admin-quick-btn">
              🏫 New Class
            </Link>
            <Link href="/admin/subjects" className="admin-quick-btn">
              📋 New Subject
            </Link>
            <Link href="/admin/books" className="admin-quick-btn">
              📚 New Lesson
            </Link>
            <Link href="/admin/videos" className="admin-quick-btn">
              🎬 Post Video
            </Link>
          </div>
          <div className="admin-public-link">
            Need to test student perspective?{" "}
            <Link href="/" target="_blank">
              Open Public Catalog ↗
            </Link>
          </div>
        </div>

        {/* Recent Activity Trail */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Recent Activity</h2>
            <Link href="/admin/audit-logs" className="admin-panel-link">
              View all →
            </Link>
          </div>

          {recentLogs.length ? (
            <div className="admin-activity-list">
              {recentLogs.map((log) => (
                <div key={log.id} className="admin-activity-item">
                  <div className="admin-activity-left">
                    <span className="admin-activity-badge">{log.action}</span>
                    <span className="admin-activity-entity">{log.entity}</span>
                  </div>
                  <span className="admin-activity-time">
                    {log.createdAt.toLocaleDateString()}{" "}
                    {log.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-activity-empty">No activity events logged yet.</div>
          )}
        </div>
      </div>
    </main>
  );
}
