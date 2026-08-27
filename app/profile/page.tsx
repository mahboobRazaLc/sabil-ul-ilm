import Link from "next/link";
import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { updateStudentProfile } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [session, params] = await Promise.all([requireUser(), searchParams]);
  const userId = session.user!.id!;

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
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon profile-card-icon-green">&#9998;</div>
            <h2 className="profile-card-title">Personal Information</h2>
          </div>
          <form action={updateStudentProfile} className="profile-form">
            <div>
              <label className="profile-field-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                name="name"
                defaultValue={user.name || ""}
                required
                minLength={2}
                maxLength={100}
                className="profile-field-input"
              />
            </div>

            <div>
              <label className="profile-field-label">
                Email Address <span className="profile-field-hint">(Primary Login)</span>
              </label>
              <input
                type="email"
                defaultValue={user.email}
                disabled
                className="profile-field-input"
              />
            </div>

            <div className="full">
              <label className="profile-field-label">
                Enrolled Class / Grade Level
              </label>
              <select name="classId" defaultValue={user.classId || ""} className="profile-field-select">
                <option value="">No specific class selected</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <hr className="profile-divider" />

            <h3 className="profile-section-label">Change Password (Optional)</h3>
            <p className="profile-section-desc">
              Leave blank if you don&apos;t wish to change your password.
            </p>

            <div>
              <label className="profile-field-label">
                Current Password
              </label>
              <input
                name="currentPassword"
                type="password"
                placeholder="Required only to set new password"
                autoComplete="current-password"
                className="profile-field-input"
              />
            </div>

            <div>
              <label className="profile-field-label">
                New Password <span className="profile-field-hint">(min 8 characters)</span>
              </label>
              <input
                name="newPassword"
                type="password"
                minLength={8}
                placeholder="New strong password"
                autoComplete="new-password"
                className="profile-field-input"
              />
            </div>

            <div className="profile-submit-wrap">
              <button className="profile-submit-btn" type="submit">
                Save Changes
              </button>
            </div>
          </form>
        </section>

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
