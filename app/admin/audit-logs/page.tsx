import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function getActionBadge(action: string) {
  switch (action) {
    case "CREATE":
      return <span className="admin-audit-badge admin-audit-badge-create">CREATE</span>;
    case "UPDATE":
      return <span className="admin-audit-badge admin-audit-badge-update">UPDATE</span>;
    case "DELETE":
      return <span className="admin-audit-badge admin-audit-badge-delete">DELETE</span>;
    case "ANSWER":
      return <span className="admin-audit-badge admin-audit-badge-answer">ANSWER</span>;
    case "ARCHIVE":
      return <span className="admin-audit-badge admin-audit-badge-archive">ARCHIVE</span>;
    default:
      return <span className="admin-audit-badge">{action}</span>;
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case "CREATE": return "➕";
    case "UPDATE": return "✏️";
    case "DELETE": return "🗑️";
    case "ANSWER": return "💬";
    case "ARCHIVE": return "📦";
    default: return "📝";
  }
}

export default async function AuditLogsPage() {
  const logs = await db.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main>
      {/* Premium Hero Header */}
      <div className="admin-audit-hero">
        <div className="admin-audit-hero-content">
          <div className="admin-audit-hero-badges">
            <span className="admin-audit-hero-badge admin-audit-hero-badge-gold">ADMIN</span>
            <span className="admin-audit-hero-badge admin-audit-hero-badge-light">📝 Audit Logs</span>
          </div>
          <h1 className="admin-audit-hero-title">Audit Logs</h1>
          <p className="admin-audit-hero-sub">
            Complete historical log of administrative content mutations and responses.
          </p>
        </div>
        <div className="admin-audit-hero-stats">
          <div className="admin-audit-stat">
            <span className="admin-audit-stat-value">{logs.length}</span>
            <span className="admin-audit-stat-label">Events</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Panel */}
      <div className="admin-audit-panel">
        <div className="admin-audit-header">
          <h2 className="admin-audit-section-title">System Activity Trail</h2>
          <span className="admin-audit-count">{logs.length} events</span>
        </div>

        {logs.length ? (
          <div className="admin-audit-list">
            {logs.map((log) => (
              <div className="admin-audit-card" key={log.id}>
                <div className="admin-audit-card-left">
                  <div className="admin-audit-icon">{getActionIcon(log.action)}</div>
                  <div className="admin-audit-info">
                    <div className="admin-audit-name-row">
                      {getActionBadge(log.action)}
                      <span className="admin-audit-entity">{log.entity}</span>
                    </div>
                    <div className="admin-audit-meta">
                      <code className="admin-audit-entity-id">{log.entityId}</code>
                      <span className="admin-audit-separator">·</span>
                      <span className="admin-audit-time">
                        {log.createdAt.toLocaleDateString()}{" "}
                        {log.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="admin-audit-actor">
                  {log.user ? (
                    <>
                      <span className="admin-audit-actor-name">{log.user.name || "Admin"}</span>
                      <span className="admin-audit-actor-email">{log.user.email}</span>
                    </>
                  ) : (
                    <span className="admin-audit-actor-system">System / Unknown</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-audit-empty">
            <div className="admin-audit-empty-icon">📝</div>
            <h3>No audit logs yet</h3>
            <p>Administrative actions will be recorded here.</p>
          </div>
        )}
      </div>
    </main>
  );
}
