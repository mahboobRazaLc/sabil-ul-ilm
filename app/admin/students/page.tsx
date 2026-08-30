import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  await requireAdmin();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [students, totalStudents, activeThisWeek, activeThisMonth] = await Promise.all([
    db.user.findMany({
      where: { role: "STUDENT" },
      include: {
        class: { select: { name: true } },
        _count: {
          select: {
            questions: true,
            progress: true,
          },
        },
        progress: {
          select: {
            status: true,
            lastAccessedAt: true,
          },
          orderBy: { lastAccessedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({
      where: {
        role: "STUDENT",
        progress: { some: { lastAccessedAt: { gte: sevenDaysAgo } } },
      },
    }),
    db.user.count({
      where: {
        role: "STUDENT",
        progress: { some: { lastAccessedAt: { gte: thirtyDaysAgo } } },
      },
    }),
  ]);

  const completedCount = students.filter((s) =>
    s.progress.some((p) => p.status === "COMPLETED")
  ).length;

  return (
    <main>
      {/* Hero Header */}
      <div className="admin-hero">
        <div className="admin-hero-content">
          <div className="admin-hero-badges">
            <span className="admin-hero-badge admin-hero-badge-gold">ADMIN</span>
            <span className="admin-hero-badge admin-hero-badge-light">Students</span>
          </div>
          <h1 className="admin-hero-title">Student Activity</h1>
          <p className="admin-hero-sub">
            Monitor student engagement, track learning progress, and identify active learners.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Students</span>
            <div className="admin-stat-icon">👥</div>
          </div>
          <div className="admin-stat-value">{totalStudents}</div>
        </div>
        <div className="admin-stat-card admin-stat-card-highlight">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Active This Week</span>
            <div className="admin-stat-icon">🔥</div>
          </div>
          <div className="admin-stat-value">{activeThisWeek}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Active This Month</span>
            <div className="admin-stat-icon">📈</div>
          </div>
          <div className="admin-stat-value">{activeThisMonth}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">With Progress</span>
            <div className="admin-stat-icon">✅</div>
          </div>
          <div className="admin-stat-value">{completedCount}</div>
        </div>
      </div>

      {/* Students Table */}
      <div className="admin-panel" style={{ marginTop: 24 }}>
        <div className="admin-panel-header">
          <h2 className="admin-panel-title">All Students ({totalStudents})</h2>
        </div>

        {students.length === 0 ? (
          <div className="admin-activity-empty">No students registered yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--green-900)" }}>Student</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--green-900)" }}>Class</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--green-900)" }}>Progress</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--green-900)" }}>Questions</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--green-900)" }}>Last Activity</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--green-900)" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--green-900)" }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const lastActivity = student.progress[0]?.lastAccessedAt;
                  const isRecentActive = lastActivity && lastActivity >= sevenDaysAgo;
                  const isMonthActive = lastActivity && lastActivity >= thirtyDaysAgo;
                  const completedBooks = student.progress.filter((p) => p.status === "COMPLETED").length;

                  let statusLabel = "Inactive";
                  let statusColor = "#9ca3af";
                  if (isRecentActive) {
                    statusLabel = "Active";
                    statusColor = "#16a34a";
                  } else if (isMonthActive) {
                    statusLabel = "This Month";
                    statusColor = "#d97706";
                  }

                  return (
                    <tr key={student.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--green-900)" }}>{student.name || "Unnamed"}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{student.email}</div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                        {student.class?.name || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: 600 }}>
                          {completedBooks} / {student._count.progress}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>done</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: 600 }}>{student._count.questions}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: 13 }}>
                        {lastActivity
                          ? lastActivity.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            color: statusColor,
                            background: `${statusColor}15`,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>
                        {student.createdAt.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
