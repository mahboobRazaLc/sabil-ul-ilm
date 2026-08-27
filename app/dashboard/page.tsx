import Link from "next/link";
import { requireStudent } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { toggleProgressCompleted } from "@/app/actions";
import { getClassDisplayName } from "@/lib/constants";
import { getFileUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [session, params] = await Promise.all([requireStudent(), searchParams]);
  const userId = session.user!.id!;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      class: {
        include: {
          subjects: true,
          books: {
            where: { status: "PUBLISHED" },
            include: { subject: true, assets: { where: { type: "PDF" } }, videos: { where: { status: "PUBLISHED" } } },
          },
        },
      },
    },
  });

  const [inProgressList, completedCount, questions, recentNotifications] = await Promise.all([
    db.learningProgress.findMany({
      where: { userId, status: "IN_PROGRESS" },
      include: {
        book: { include: { class: true, subject: true, assets: { where: { type: "PDF" } } } },
        video: { include: { book: true } },
      },
      orderBy: { lastAccessedAt: "desc" },
      take: 6,
    }),
    db.learningProgress.count({
      where: { userId, status: "COMPLETED" },
    }),
    db.studentQuestion.findMany({
      where: { authorId: userId },
      include: { book: true, answerer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const answeredQuestionsCount = questions.filter((q) => q.status === "ANSWERED").length;
  const unreadNotifications = recentNotifications.filter((n) => !n.read).length;
  const classBooks = user?.class?.books || [];
  const classSubjects = user?.class?.subjects || [];
  const classNames = user?.class ? getClassDisplayName(user.class.slug, user.class.name) : null;

  // Calculate progress percentage
  const totalLessons = classBooks.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Get first in-progress item for "Continue Learning" hero
  const continueItem = inProgressList[0];
  const continueCoverUrl = continueItem?.book?.coverUrl ? await getFileUrl(continueItem.book.coverUrl) : "";

  return (
    <main className="public">
      <Navbar active="dashboard" />

      {params.notice && (
        <p className="notice" role="status">
          {params.notice}
        </p>
      )}

      {/* Welcome Header */}
      <div className="dash-welcome">
        <div className="dash-welcome-content">
          <div className="dash-welcome-badges">
            <span className="dash-welcome-badge dash-welcome-badge-gold">STUDENT PORTAL</span>
            {user?.class && (
              <span className="dash-welcome-badge dash-welcome-badge-light">
                🎓 <LangText>{user.class.name}</LangText>
              </span>
            )}
          </div>
          <h1 className="dash-welcome-title">
            Assalamu Alaikum, {user?.name || "Student"}!
          </h1>
          <p className="dash-welcome-sub">
            Track your study progress, resume learning, and check educator answers.
          </p>
        </div>
        <div className="dash-welcome-actions">
          <Link href="/profile" className="dash-welcome-btn dash-welcome-btn-white">⚙ Profile</Link>
          <Link href="/classes" className="dash-welcome-btn dash-welcome-btn-gold">Browse Classes →</Link>
        </div>
      </div>

      {/* Continue Learning Hero */}
      {continueItem && (
        <section className="dash-section">
          <div className="dash-section-heading">
            <div>
              <p className="eyebrow">RESUME PROGRESS</p>
              <h2>Continue Learning</h2>
            </div>
            <Link href="/classes">View all classes →</Link>
          </div>

          <div className="dash-continue">
            {continueItem.book ? (
              <>
                <div className="dash-continue-info">
                  <div className="dash-continue-badges">
                    <span className="dash-continue-badge">📖 Lesson</span>
                    <span className="dash-continue-badge dash-continue-badge-progress">◐ In Progress</span>
                  </div>
                  <h3 className="dash-continue-title">
                    <Link href={`/library/${continueItem.book.slug}`}>
                      <LangText>{continueItem.book.title}</LangText>
                    </Link>
                  </h3>
                  <div className="dash-continue-meta">
                    <span><LangText>{continueItem.book.class.name}</LangText></span>
                    {continueItem.book.subject && (
                      <>
                        <span>·</span>
                        <span><LangText>{continueItem.book.subject.name}</LangText></span>
                      </>
                    )}
                  </div>
                  <p className="dash-continue-desc">
                    <LangText>{continueItem.book.description || "Curriculum lesson resource."}</LangText>
                  </p>
                  <div className="dash-continue-actions">
                    <Link href={`/library/${continueItem.book.slug}`} className="dash-continue-btn">
                      Continue Lesson →
                    </Link>
                    <form action={toggleProgressCompleted}>
                      <input type="hidden" name="bookId" value={continueItem.book.id} />
                      <input type="hidden" name="currentStatus" value="IN_PROGRESS" />
                      <input type="hidden" name="returnUrl" value="/dashboard" />
                      <button type="submit" className="dash-continue-btn-secondary">✓ Mark Done</button>
                    </form>
                  </div>
                </div>
                {continueCoverUrl && (
                  <img src={continueCoverUrl} alt="" className="dash-continue-cover" />
                )}
              </>
            ) : continueItem.video ? (
              <>
                <div className="dash-continue-info">
                  <div className="dash-continue-badges">
                    <span className="dash-continue-badge">🎬 Video</span>
                    <span className="dash-continue-badge dash-continue-badge-progress">◐ In Progress</span>
                  </div>
                  <h3 className="dash-continue-title">
                    <Link href={`/videos/${continueItem.video.id}`}>
                      <LangText>{continueItem.video.title}</LangText>
                    </Link>
                  </h3>
                  <p className="dash-continue-desc">
                    <LangText>{continueItem.video.description || "Video lecture."}</LangText>
                  </p>
                  <div className="dash-continue-actions">
                    <Link href={`/videos/${continueItem.video.id}`} className="dash-continue-btn">
                      Continue Video →
                    </Link>
                    <form action={toggleProgressCompleted}>
                      <input type="hidden" name="videoId" value={continueItem.video.id} />
                      <input type="hidden" name="currentStatus" value="IN_PROGRESS" />
                      <input type="hidden" name="returnUrl" value="/dashboard" />
                      <button type="submit" className="dash-continue-btn-secondary">✓ Mark Done</button>
                    </form>
                  </div>
                </div>
                {continueItem.video.thumbnail && (
                  <img src={continueItem.video.thumbnail} alt="" className="dash-continue-cover" />
                )}
              </>
            ) : null}
          </div>
        </section>
      )}

      {/* Stats */}
      <div className="dash-stats">
        <div className="dash-stat">
          <span className="dash-stat-icon">📚</span>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{totalLessons}</span>
            <span className="dash-stat-label">Total Lessons</span>
          </div>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-icon">✓</span>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{completedCount}</span>
            <span className="dash-stat-label">Completed</span>
          </div>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-icon">◐</span>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{inProgressList.length}</span>
            <span className="dash-stat-label">In Progress</span>
          </div>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-icon">💬</span>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{answeredQuestionsCount}/{questions.length}</span>
            <span className="dash-stat-label">Answers</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalLessons > 0 && (
        <div className="dash-progress-section">
          <div className="dash-progress-header">
            <span className="dash-progress-title">Overall Progress</span>
            <span className="dash-progress-percent">{progressPercent}%</span>
          </div>
          <div className="dash-progress-bar">
            <div className="dash-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="dash-progress-sub">{completedCount} of {totalLessons} lessons completed</p>
        </div>
      )}

      {/* Enrolled Class */}
      {user?.class && (
        <section className="dash-section">
          <div className="dash-section-heading">
            <div>
              <p className="eyebrow">YOUR ENROLLED CLASS</p>
              <h2><LangText>{user.class.name}</LangText></h2>
            </div>
            <Link href={`/classes/${user.class.slug}`}>View class →</Link>
          </div>

          <div className="dash-class-card">
            <div className="dash-class-card-header">
              {classNames?.ar && <div className="dash-class-card-ar">{classNames.ar}</div>}
              <h3 className="dash-class-card-title"><LangText>{user.class.name}</LangText></h3>
            </div>
            <div className="dash-class-card-stats">
              <div className="dash-class-stat">
                <span className="dash-class-stat-value">{classSubjects.length}</span>
                <span className="dash-class-stat-label">Subjects</span>
              </div>
              <div className="dash-class-stat">
                <span className="dash-class-stat-value">{totalLessons}</span>
                <span className="dash-class-stat-label">Lessons</span>
              </div>
              <div className="dash-class-stat">
                <span className="dash-class-stat-value">{completedCount}</span>
                <span className="dash-class-stat-label">Done</span>
              </div>
            </div>
            <Link href={`/classes/${user.class.slug}`} className="dash-class-card-btn">
              Open Class →
            </Link>
          </div>
        </section>
      )}

      {/* Two-column: Notifications + Quick Actions */}
      <div className="dash-two-col">
        {/* Recent Notifications */}
        <section className="dash-section dash-section-compact">
          <div className="dash-section-heading">
            <div>
              <p className="eyebrow">NOTIFICATIONS</p>
              <h2>Recent Activity</h2>
            </div>
            <Link href="/notifications">View all →</Link>
          </div>

          {recentNotifications.length > 0 ? (
            <div className="dash-notif-list">
              {recentNotifications.map((n) => (
                <div key={n.id} className={`dash-notif ${n.read ? "" : "dash-notif-unread"}`}>
                  <span className="dash-notif-icon">
                    {n.type === "CLASS_CONTENT" ? "📚" : "💬"}
                  </span>
                  <div className="dash-notif-content">
                    <p className="dash-notif-msg">{n.message}</p>
                    <span className="dash-notif-time">{n.createdAt.toLocaleDateString()}</span>
                  </div>
                  {!n.read && <span className="dash-notif-dot" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-empty-small">
              <p>No notifications yet.</p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="dash-section dash-section-compact">
          <div className="dash-section-heading">
            <div>
              <p className="eyebrow">QUICK ACCESS</p>
              <h2>Quick Actions</h2>
            </div>
          </div>
          <div className="dash-quick-actions">
            <Link href="/classes" className="dash-quick-action">
              <span className="dash-quick-icon">📚</span>
              <span className="dash-quick-label">Classes</span>
            </Link>
            <Link href="/notes" className="dash-quick-action">
              <span className="dash-quick-icon">📝</span>
              <span className="dash-quick-label">Notes</span>
            </Link>
            <Link href="/search" className="dash-quick-action">
              <span className="dash-quick-icon">🔍</span>
              <span className="dash-quick-label">Search</span>
            </Link>
            <Link href="/notifications" className="dash-quick-action">
              <span className="dash-quick-icon">🔔</span>
              <span className="dash-quick-label">Notifications</span>
              {unreadNotifications > 0 && (
                <span className="dash-quick-badge">{unreadNotifications}</span>
              )}
            </Link>
          </div>
        </section>
      </div>

      {/* Recent Lessons */}
      {classBooks.length > 0 && (
        <section className="dash-section">
          <div className="dash-section-heading">
            <div>
              <p className="eyebrow">CURRICULUM</p>
              <h2>Recent Lessons</h2>
            </div>
            <Link href={`/classes/${user?.class?.slug}`}>View all →</Link>
          </div>
          <div className="dash-lessons-grid">
            {classBooks.slice(0, 6).map((b) => (
              <Link href={`/library/${b.slug}`} className="dash-lesson-card" key={b.id}>
                <div className="dash-lesson-card-top">
                  {b.subject && (
                    <span className="dash-lesson-subject"><LangText>{b.subject.name}</LangText></span>
                  )}
                  <h4 className="dash-lesson-card-title"><LangText>{b.title}</LangText></h4>
                </div>
                <div className="dash-lesson-card-bottom">
                  {b.videos.length > 0 && <span className="dash-lesson-tag">🎥 Video</span>}
                  {b.assets.length > 0 && <span className="dash-lesson-tag">📄 PDF</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ask Teacher */}
      {questions.length > 0 && (
        <section className="dash-section">
          <div className="dash-section-heading">
            <div>
              <p className="eyebrow">DIRECT TEACHER SUPPORT</p>
              <h2>My Questions ({questions.length})</h2>
            </div>
          </div>
          <div className="dash-questions">
            {questions.slice(0, 3).map((q) => (
              <article className="dash-question-card" key={q.id}>
                <div className="dash-question-header">
                  <span className={`dash-question-badge ${q.status === "ANSWERED" ? "dash-question-answered" : "dash-question-pending"}`}>
                    {q.status === "ANSWERED" ? "✓ Answered" : "⏳ Pending"}
                  </span>
                  <span className="dash-question-date">{q.createdAt.toLocaleDateString()}</span>
                </div>
                <p className="dash-question-text">Q: <LangText>{q.question}</LangText></p>
                {q.answer && (
                  <div className="dash-question-answer">
                    <strong>Teacher:</strong> <LangText>{q.answer}</LangText>
                  </div>
                )}
                {q.book && (
                  <Link href={`/library/${q.book.slug}`} className="dash-question-link">
                    📖 <LangText>{q.book.title}</LangText> →
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
