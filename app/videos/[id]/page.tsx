import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { getOptionalUser } from "@/lib/auth/authorization";
import { toggleProgressCompleted } from "@/app/actions";
import { getEmbedUrl } from "@/lib/video-embed";
import { getFileUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function VideoPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ id }, search, user] = await Promise.all([
    params,
    searchParams,
    getOptionalUser(),
  ]);

  const video = await db.video.findUnique({
    where: { id, status: "PUBLISHED" },
    include: {
      book: {
        include: {
          class: true,
          subject: true,
          assets: { where: { type: "PDF" } },
        },
      },
    },
  });

  if (!video) {
    notFound();
  }

  const embed = getEmbedUrl(video.url);
  const pdfAsset = video.book?.assets[0];
  const pdfUrl = pdfAsset ? await getFileUrl(pdfAsset.storageKey) : "";

  // If user is logged in, fetch their video progress
  const progress = user
    ? await db.learningProgress.findUnique({
        where: { userId_videoId: { userId: user.id!, videoId: video.id } },
      })
    : null;

  return (
    <main className="public">
      <Navbar active="videos" />

      {search.notice && (
        <p className="notice" role="status">
          {search.notice}
        </p>
      )}

      {/* Breadcrumb */}
      <nav className="video-detail-breadcrumb">
        <Link href="/videos">Videos</Link>
        <span className="video-detail-breadcrumb-sep">›</span>
        {video.book && (
          <>
            <Link href={`/classes/${video.book.class.slug}`}>{video.book.class.name}</Link>
            <span className="video-detail-breadcrumb-sep">›</span>
          </>
        )}
        <span>{video.title}</span>
      </nav>

      {/* Video Player */}
      <div className="video-player-container">
        {embed.type === "iframe" ? (
          <iframe
            src={embed.src}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video controls poster={video.thumbnail || undefined} src={embed.src} preload="metadata">
            Your browser does not support HTML5 video streaming.
          </video>
        )}
      </div>

      {/* Header */}
      <div className="video-detail-header">
        <div className="video-detail-badges">
          {video.book ? (
            <>
              <span className="video-detail-badge video-detail-badge-class">
                📚 <LangText>{video.book.class.name}</LangText>
              </span>
              {video.book.subject && (
                <span className="video-detail-badge video-detail-badge-subject">
                  📖 <LangText>{video.book.subject.name}</LangText>
                </span>
              )}
            </>
          ) : (
            <span className="video-detail-badge video-detail-badge-general">🎥 General Lesson</span>
          )}
        </div>
        <h1 className="video-detail-title"><LangText>{video.title}</LangText></h1>
        <div className="video-detail-meta">
          <span>Published {video.createdAt.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="detail-view" style={{ marginTop: 0 }}>
        <div className="detail-main">
          {/* Lesson Notes */}
          <div className="video-notes-section">
            <h2 className="video-notes-title">Lesson Notes</h2>
            <p className="video-notes-content">
              <LangText>{video.description || "No specific lesson notes provided."}</LangText>
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="detail-sidebar">
          {/* Student Progress Widget */}
          {user ? (
            <div className="video-sidebar-section">
              <div className="video-sidebar-label">My Video Progress</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: "var(--green-900)", fontSize: 14 }}>
                  {progress?.status ? progress.status.replace("_", " ") : "NOT STARTED"}
                </span>
                <span
                  className={`video-sidebar-progress-badge ${
                    progress?.status === "COMPLETED"
                      ? "video-progress-completed"
                      : progress?.status === "IN_PROGRESS"
                      ? "video-progress-in-progress"
                      : "video-progress-not-started"
                  }`}
                >
                  {progress?.status === "COMPLETED" ? "✓ Done" : progress?.status === "IN_PROGRESS" ? "◐ Active" : "○ New"}
                </span>
              </div>

              <form action={toggleProgressCompleted}>
                <input type="hidden" name="videoId" value={video.id} />
                <input
                  type="hidden"
                  name="currentStatus"
                  value={progress?.status || "NOT_STARTED"}
                />
                <input type="hidden" name="returnUrl" value={`/videos/${video.id}`} />
                <button
                  type="submit"
                  className={`video-progress-btn ${
                    progress?.status === "COMPLETED" ? "video-progress-btn-reset" : "video-progress-btn-complete"
                  }`}
                >
                  {progress?.status === "COMPLETED"
                    ? "↺ Mark as In Progress"
                    : "✓ Mark Video Complete"}
                </button>
              </form>
            </div>
          ) : (
            <div className="video-sidebar-section" style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", margin: "0 0 10px", fontSize: 14 }}>
                Sign in to save your video progress.
              </p>
              <Link
                href={`/login?callbackUrl=/videos/${video.id}`}
                className="video-sidebar-btn video-sidebar-btn-primary"
              >
                Sign in →
              </Link>
            </div>
          )}

          {/* Linked Lesson */}
          {video.book && (
            <div className="video-sidebar-section">
              <div className="video-sidebar-label">Linked Lesson</div>
              <p className="video-sidebar-lesson-title"><LangText>{video.book.title}</LangText></p>
              <p className="video-sidebar-lesson-meta">
                <LangText>{video.book.class.name}</LangText>
                {video.book.subject ? ` · ` : ""}
                {video.book.subject ? <LangText>{video.book.subject.name}</LangText> : ""}
              </p>
              <div className="video-sidebar-actions">
                <Link href={`/library/${video.book.slug}`} className="video-sidebar-btn video-sidebar-btn-secondary">
                  View Lesson →
                </Link>
                {pdfAsset ? (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-sidebar-btn video-sidebar-btn-primary"
                  >
                    📄 Open PDF Document
                  </a>
                ) : null}
              </div>
            </div>
          )}

          {/* Ask a Question */}
          <div className="video-sidebar-section">
            <div className="video-sidebar-label">Have a question?</div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 12px" }}>
              Get help from teachers and educators on this lesson.
            </p>
            <Link
              href={video.book ? `/library/${video.book.slug}` : "/classes"}
              className="video-sidebar-btn video-sidebar-btn-primary"
            >
              Ask an Educator
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
