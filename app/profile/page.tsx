import Link from "next/link";
import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { ProfileEditForm } from "@/components/profile-edit-form";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; edit?: string }>;
}) {
  const [session, params] = await Promise.all([requireUser(), searchParams]);
  const userId = session.user!.id!;
  const isEditing = params.edit === "true";

  const [user, classes] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        class: true,
        _count: {
          select: { progress: true, questions: true },
        },
      },
    }),
    db.class.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user) {
    return (
      <main className="public">
        <Navbar active="profile" />
        <p className="empty">User account not found.</p>
      </main>
    );
  }

  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="public">
      <Navbar active="profile" />

      {/* Profile Hero */}
      <div className="profile-hero">
        <div className="profile-hero-inner">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-hero-text">
            <p className="profile-hero-label">Student Account</p>
            <h1 className="profile-hero-name">{user.name}</h1>
            <p className="profile-hero-email">{user.email}</p>
            <span className="profile-hero-role">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {params.notice && (
        <div className="profile-notice" role="status">
          {params.notice}
        </div>
      )}

      <div className="profile-grid">
        {/* Left: Personal Info or Edit Form */}
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon profile-card-icon-green">
              {isEditing ? "✎" : "👤"}
            </div>
            <h2 className="profile-card-title">
              {isEditing ? "Edit Profile" : "Personal Information"}
            </h2>
          </div>

          {isEditing ? (
            <ProfileEditForm
              user={{ name: user.name, email: user.email, classId: user.classId }}
              classes={classes}
            />
          ) : (
            <div className="profile-view">
              <div className="profile-view-row">
                <span className="profile-view-label">Full Name</span>
                <span className="profile-view-value">{user.name || "—"}</span>
              </div>
              <div className="profile-view-row">
                <span className="profile-view-label">Email Address</span>
                <span className="profile-view-value">{user.email}</span>
              </div>
              <div className="profile-view-row">
                <span className="profile-view-label">Enrolled Class</span>
                <span className="profile-view-value">
                  {user.class ? <LangText>{user.class.name}</LangText> : "Not Enrolled"}
                </span>
              </div>
              <div className="profile-view-row">
                <span className="profile-view-label">Role</span>
                <span className="profile-view-value">{user.role}</span>
              </div>
              <Link href="/profile?edit=true" className="profile-edit-btn">
                ✎ Edit Profile
              </Link>
            </div>
          )}
        </section>

        {/* Right: Account Details */}
        <section className="profile-card" style={{ height: "fit-content" }}>
          <div className="profile-card-header">
            <div className="profile-card-icon profile-card-icon-gold">&#9881;</div>
            <h2 className="profile-card-title">Account Details</h2>
          </div>
          <div className="profile-account-grid">
            <div className="profile-account-item">
              <small className="profile-account-label">Account Type</small>
              <strong className="profile-account-value">
                {user.role}
              </strong>
            </div>

            <div className="profile-account-item">
              <small className="profile-account-label">Enrolled Grade</small>
              <strong className="profile-account-value">
                {user.class ? <LangText>{user.class.name}</LangText> : "Not Enrolled"}
              </strong>
            </div>

            <div className="profile-account-item">
              <small className="profile-account-label">Study Activity</small>
              <div className="profile-account-activity">
                <span className="profile-account-stat">
                  <span className="profile-account-stat-icon">&#128218;</span>
                  <strong>{user._count.progress}</strong> tracked resources
                </span>
                <span className="profile-account-stat">
                  <span className="profile-account-stat-icon">&#10067;</span>
                  <strong>{user._count.questions}</strong> asked questions
                </span>
              </div>
            </div>

            <div className="profile-account-item">
              <small className="profile-account-label">Member Since</small>
              <span className="profile-account-value-muted">
                {user.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>

            <Link href="/dashboard" className="profile-dashboard-btn">
              &#8592; Return to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
