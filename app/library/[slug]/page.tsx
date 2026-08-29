import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { LinkifyText } from "@/components/linkify-text";
import { getOptionalUser } from "@/lib/auth/authorization";
import { submitQuestion, toggleProgressCompleted } from "@/app/actions";
import { getClassDisplayName, getSubjectDisplayName } from "@/lib/constants";
import { getEmbedUrl } from "@/lib/video-embed";
import { getFileUrl } from "@/lib/storage";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await db.book.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { class: true, subject: true },
  });
  if (!book) return { title: "Lesson Not Found — Sabeel-ul-Ilm" };
  const className = getClassDisplayName(book.class.slug, book.class.name);
  const subjectName = book.subject ? getSubjectDisplayName(book.subject.slug, book.subject.name) : "";
  return {
    title: `${book.title} — ${className}${subjectName ? " " + subjectName : ""} | Sabeel-ul-Ilm`,
    description: book.description || `Watch video lectures and download PDF notes for ${book.title}. Part of ${className} Dars-e-Nizami curriculum.`,
  };
}

export default async function BookDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ slug }, search, user] = await Promise.all([
    params,
    searchParams,
    getOptionalUser(),
  ]);

  const book = await db.book.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      class: true,
      subject: true,
      assets: { where: { type: "PDF" } },
      videos: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!book) {
    notFound();
  }

  const pdfAsset = book.assets[0];
  const pdfUrl = pdfAsset ? await getFileUrl(pdfAsset.storageKey) : "";
  const classNames = getClassDisplayName(book.class.slug, book.class.name);
  const subjectNames = book.subject ? getSubjectDisplayName(book.subject.slug, book.subject.name) : null;

  const [progress, bookQuestions] = await Promise.all([
    user
      ? db.learningProgress.findUnique({
          where: { userId_bookId: { userId: user.id!, bookId: book.id } },
        })
      : null,
    user
      ? db.studentQuestion.findMany({
          where: { authorId: user.id!, bookId: book.id },
          include: { answerer: true },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  // Previous/Next lesson navigation
  const siblingBooks = await db.book.findMany({
    where: {
      classId: book.classId,
      subjectId: book.subjectId || null,
      status: "PUBLISHED",
    },
    select: { id: true, slug: true, title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const currentIndex = siblingBooks.findIndex((b) => b.id === book.id);
  const prevBook = currentIndex > 0 ? siblingBooks[currentIndex - 1] : null;
  const nextBook = currentIndex < siblingBooks.length - 1 ? siblingBooks[currentIndex + 1] : null;

  const progressStatus = progress?.status || "NOT_STARTED";

  return (
    <main className="public">
      <Navbar active="library" />

      {search.notice && (
        <p className="notice" role="status">
          {search.notice}
        </p>
      )}

      {/* Breadcrumb */}
      <nav className="lesson-breadcrumb">
        <Link href="/classes">Classes</Link>
        <span className="lesson-breadcrumb-sep">›</span>
        <Link href={`/classes/${book.class.slug}`}>{book.class.name}</Link>
        {book.subject && (
          <>
            <span className="lesson-breadcrumb-sep">›</span>
            <Link href={`/classes/${book.class.slug}?subject=${book.subject.slug}`}>{book.subject.name}</Link>
          </>
        )}
        <span className="lesson-breadcrumb-sep">›</span>
        <span className="lesson-breadcrumb-current">{book.title}</span>
      </nav>

      {/* Lesson Header */}
      <div className="lesson-header">
        <div className="lesson-header-content">
          {classNames.ar && (
            <div className="lesson-header-ar">{classNames.ar}</div>
          )}
          <h1 className="lesson-header-title"><LangText>{book.title}</LangText></h1>
          <div className="lesson-header-meta">
            <span className="lesson-header-meta-item">
              <span className="lesson-header-meta-icon">📚</span>
              {classNames.ar && <span className="lesson-header-meta-ar">{classNames.ar} </span>}
              <LangText>{book.class.name}</LangText>
            </span>
            {book.subject && (
              <>
                <span className="lesson-header-meta-sep">·</span>
                <span className="lesson-header-meta-item">
                  <span className="lesson-header-meta-icon">📖</span>
                  {subjectNames?.ar && <span className="lesson-header-meta-ar">{subjectNames.ar} </span>}
                  <LangText>{book.subject.name}</LangText>
                </span>
              </>
            )}
          </div>
        </div>
        {user && (
          <div className="lesson-header-progress">
            <span className={`lesson-progress-badge lesson-progress-${progressStatus.toLowerCase()}`}>
              {progressStatus === "COMPLETED" && "✓ Completed"}
              {progressStatus === "IN_PROGRESS" && "◐ In Progress"}
              {progressStatus === "NOT_STARTED" && "○ Not Started"}
            </span>
          </div>
        )}
      </div>

      <div className="lesson-layout">
        {/* Main Content */}
        <div className="lesson-main">
          {/* Video Section */}
          {book.videos.length > 0 && (
            <section className="lesson-section">
              <h2 className="lesson-section-title">
                <span className="lesson-section-icon">🎥</span>
                Video Lessons
              </h2>
              <div className="lesson-videos">
                {book.videos.map((vid) => {
                  const embed = getEmbedUrl(vid.url);
                  return (
                    <div className="lesson-video-embed" key={vid.id}>
                      {embed.type === "iframe" ? (
                        <div className="video-player-container">
                          <iframe
                            src={embed.src}
                            title={vid.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="video-player-container">
                          <video controls src={embed.src} preload="metadata">
                            Your browser does not support HTML5 video.
                          </video>
                        </div>
                      )}
                      <div className="lesson-video-embed-info">
                        <h3><LangText>{vid.title}</LangText></h3>
                        {vid.description && (
                          <p><LangText>{vid.description}</LangText></p>
                        )}
                        <Link href={`/videos/${vid.id}`} className="lesson-video-embed-link">
                          Open in full view →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Overview Section */}
          <section className="lesson-section">
            <h2 className="lesson-section-title">
              <span className="lesson-section-icon">📖</span>
              Overview
            </h2>
            <div className="lesson-overview">
              <LangText as="p">
                <LinkifyText text={book.description || "No detailed description available for this lesson."} />
              </LangText>
            </div>
          </section>

          {/* Ask Teacher Section */}
          <section className="lesson-section">
            <h2 className="lesson-section-title">
              <span className="lesson-section-icon">💬</span>
              Ask Teacher About This Lesson
            </h2>
            <p className="lesson-ask-desc">
              Have a question regarding chapters or exercises in <strong>{book.title}</strong>? Submit it below.
            </p>

            <form action={submitQuestion} className="lesson-ask-form">
              <input type="hidden" name="bookId" value={book.id} />
              <input type="hidden" name="returnUrl" value={`/library/${book.slug}`} />

              {!user && (
                <div className="lesson-ask-guest">
                  <label>
                    Your Name
                    <input name="name" required placeholder="Full name" />
                  </label>
                  <label>
                    Your Email
                    <input name="email" type="email" required placeholder="you@example.com" />
                  </label>
                </div>
              )}

              <label className="lesson-ask-label">
                Your Question <span style={{ color: "#ef4444" }}>*</span>
                <textarea
                  name="question"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  placeholder="Ask any specific question or request guidance regarding this lesson..."
                />
              </label>

              <div>
                <button className="button" type="submit">
                  Submit Question to Teacher
                </button>
              </div>
            </form>
          </section>

          {/* Existing Questions */}
          {bookQuestions.length > 0 && (
            <section className="lesson-section">
              <h2 className="lesson-section-title">
                <span className="lesson-section-icon">❓</span>
                Your Questions on This Lesson ({bookQuestions.length})
              </h2>
              <div className="lesson-questions">
                {bookQuestions.map((q) => (
                  <article className="qa-card" key={q.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span className={`badge ${q.status.toLowerCase()}`}>
                        {q.status === "ANSWERED" ? "✓ Answered" : "⏳ Pending Answer"}
                      </span>
                      <small style={{ color: "var(--text-muted)" }}>{q.createdAt.toLocaleDateString()}</small>
                    </div>
                    <p style={{ fontWeight: 700, margin: "6px 0", color: "var(--green-900)" }}>
                      Q: <LangText>{q.question}</LangText>
                    </p>
                    {q.answer ? (
                      <div className="qa-answer">
                        <p style={{ margin: 0 }}>
                          <strong>Teacher Answer:</strong> <LangText>{q.answer}</LangText>
                        </p>
                      </div>
                    ) : (
                      <small style={{ color: "#b45309" }}>Teacher is preparing a response.</small>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lesson-sidebar">
          {/* Progress Card */}
          {user ? (
            <div className="lesson-sidebar-card">
              <h3 className="lesson-sidebar-card-title">My Progress</h3>
              <div className="lesson-sidebar-progress">
                <span className={`lesson-progress-badge lesson-progress-${progressStatus.toLowerCase()}`}>
                  {progressStatus === "COMPLETED" && "✓ Completed"}
                  {progressStatus === "IN_PROGRESS" && "◐ In Progress"}
                  {progressStatus === "NOT_STARTED" && "○ Not Started"}
                </span>
              </div>
              <form action={toggleProgressCompleted}>
                <input type="hidden" name="bookId" value={book.id} />
                <input type="hidden" name="currentStatus" value={progress?.status || "NOT_STARTED"} />
                <input type="hidden" name="returnUrl" value={`/library/${book.slug}`} />
                <button
                  type="submit"
                  className={`lesson-sidebar-btn ${progressStatus === "COMPLETED" ? "lesson-sidebar-btn-secondary" : ""}`}
                >
                  {progressStatus === "COMPLETED"
                    ? "↺ Mark as In Progress"
                    : "✓ Mark as Completed"}
                </button>
              </form>
            </div>
          ) : (
            <div className="lesson-sidebar-card lesson-sidebar-card-muted">
              <p>Sign in to track your learning progress.</p>
              <Link
                href={`/login?callbackUrl=/library/${book.slug}`}
                className="lesson-sidebar-link"
              >
                Sign in here →
              </Link>
            </div>
          )}

          {/* PDF Card */}
          {pdfAsset ? (
            <div className="lesson-sidebar-card">
              <h3 className="lesson-sidebar-card-title">📄 PDF Document</h3>
              <p className="lesson-sidebar-pdf-size">
                Size: {(pdfAsset.sizeBytes / (1024 * 1024)).toFixed(2)} MB
              </p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lesson-sidebar-btn lesson-sidebar-btn-pdf"
              >
                📥 Open / Download PDF
              </a>
            </div>
          ) : (
            <div className="lesson-sidebar-card lesson-sidebar-card-muted">
              <h3 className="lesson-sidebar-card-title">📄 PDF Document</h3>
              <p>PDF document is being prepared.</p>
            </div>
          )}

          {/* Lesson Info */}
          <div className="lesson-sidebar-card">
            <h3 className="lesson-sidebar-card-title">Lesson Details</h3>
            <div className="lesson-sidebar-info">
              <div className="lesson-sidebar-info-row">
                <span className="lesson-sidebar-info-label">Class</span>
                <span className="lesson-sidebar-info-value">
                  {classNames.ar && <span className="lesson-sidebar-info-ar">{classNames.ar} </span>}
                  <LangText>{book.class.name}</LangText>
                </span>
              </div>
              {book.subject && (
                <div className="lesson-sidebar-info-row">
                  <span className="lesson-sidebar-info-label">Subject</span>
                  <span className="lesson-sidebar-info-value">
                    {subjectNames?.ar && <span className="lesson-sidebar-info-ar">{subjectNames.ar} </span>}
                    <LangText>{book.subject.name}</LangText>
                  </span>
                </div>
              )}
              <div className="lesson-sidebar-info-row">
                <span className="lesson-sidebar-info-label">Updated</span>
                <span className="lesson-sidebar-info-value">{book.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Previous / Next Navigation */}
      <nav className="lesson-nav">
        {prevBook ? (
          <Link href={`/library/${prevBook.slug}`} className="lesson-nav-btn lesson-nav-prev">
            <span className="lesson-nav-arrow">←</span>
            <span className="lesson-nav-text">
              <span className="lesson-nav-label">Previous Lesson</span>
              <span className="lesson-nav-title"><LangText>{prevBook.title}</LangText></span>
            </span>
          </Link>
        ) : (
          <div />
        )}
        {nextBook ? (
          <Link href={`/library/${nextBook.slug}`} className="lesson-nav-btn lesson-nav-next">
            <span className="lesson-nav-text">
              <span className="lesson-nav-label">Next Lesson</span>
              <span className="lesson-nav-title"><LangText>{nextBook.title}</LangText></span>
            </span>
            <span className="lesson-nav-arrow">→</span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </main>
  );
}
