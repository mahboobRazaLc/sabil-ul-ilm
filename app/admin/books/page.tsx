import Link from "next/link";
import { deleteBook, saveBook } from "@/app/actions";
import { LessonForm } from "@/components/admin/lesson-form";
import { LangText } from "@/components/lang-text";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [classes, subjects, books, params] = await Promise.all([
    db.class.findMany({ orderBy: { name: "asc" } }),
    db.subject.findMany({
      select: { id: true, name: true, classId: true },
      orderBy: { name: "asc" },
    }),
    db.book.findMany({
      include: {
        class: true,
        subject: true,
        assets: { where: { type: "PDF" } },
        videos: { select: { id: true, url: true } },
      },
      orderBy: [{ class: { name: "asc" } }, { createdAt: "asc" }],
    }),
    searchParams,
  ]);

  const publishedCount = books.filter((b) => b.status === "PUBLISHED").length;
  const withPdfCount = books.filter((b) => b.assets.length > 0).length;
  const withVideoCount = books.filter((b) => b.videos.length > 0).length;

  return (
    <main>
      {/* Premium Hero Header */}
      <div className="admin-books-hero">
        <div className="admin-books-hero-content">
          <div className="admin-books-hero-badges">
            <span className="admin-books-hero-badge admin-books-hero-badge-gold">CONTENT</span>
            <span className="admin-books-hero-badge admin-books-hero-badge-light">📖 Lessons</span>
          </div>
          <h1 className="admin-books-hero-title">Lessons</h1>
          <p className="admin-books-hero-sub">
            Create lessons with video and PDF. Each lesson belongs to a class and optional subject.
          </p>
        </div>
        <div className="admin-books-hero-stats">
          <div className="admin-books-stat">
            <span className="admin-books-stat-value">{books.length}</span>
            <span className="admin-books-stat-label">Total</span>
          </div>
          <div className="admin-books-stat">
            <span className="admin-books-stat-value">{publishedCount}</span>
            <span className="admin-books-stat-label">Published</span>
          </div>
          <div className="admin-books-stat">
            <span className="admin-books-stat-value">{withPdfCount}</span>
            <span className="admin-books-stat-label">PDF</span>
          </div>
          <div className="admin-books-stat">
            <span className="admin-books-stat-value">{withVideoCount}</span>
            <span className="admin-books-stat-label">Video</span>
          </div>
        </div>
      </div>

      {params.notice && (
        <p className="notice" role="status">
          {params.notice}
        </p>
      )}

      {/* Add Lesson Form */}
      <div className="admin-books-add">
        <h2 className="admin-books-section-title">Add a Lesson</h2>
        {classes.length ? (
          <LessonForm classes={classes} subjects={subjects} action={saveBook} />
        ) : (
          <div className="admin-books-empty">
            <div className="admin-books-empty-icon">📖</div>
            <h3>No classes found</h3>
            <p>Please create at least one Class before adding lessons.</p>
            <Link href="/admin/classes" className="button" style={{ marginTop: 12 }}>
              Go to Classes
            </Link>
          </div>
        )}
      </div>

      {/* Lessons List */}
      <div className="admin-books-add">
        <div className="admin-books-header">
          <h2 className="admin-books-section-title">All Lessons</h2>
          <span className="admin-books-count">{books.length}</span>
        </div>

        {books.length ? (
          <div className="admin-books-list">
            {books.map((item) => {
              const hasPdf = item.assets.length > 0;
              const hasVideo = item.videos.length > 0;
              return (
                <article className="admin-book-card" key={item.id}>
                  <div className="admin-book-card-top">
                    <div className="admin-book-cover">
                      {item.coverUrl ? (
                        <img
                          src={item.coverUrl}
                          alt={item.title}
                        />
                      ) : (
                        <span className="admin-book-cover-icon">📖</span>
                      )}
                    </div>

                    <div className="admin-book-info">
                      <div className="admin-book-name-row">
                        <h3 className="admin-book-name"><LangText>{item.title}</LangText></h3>
                        <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                      </div>

                      {item.description && (
                        <p className="admin-book-desc"><LangText>{item.description}</LangText></p>
                      )}

                      <div className="admin-book-meta">
                        <span className="admin-book-meta-item">🏫 <LangText>{item.class.name}</LangText></span>
                        {item.subject && (
                          <span className="admin-book-meta-item">📋 <LangText>{item.subject.name}</LangText></span>
                        )}
                      </div>

                      <div className="admin-book-status-row">
                        {hasPdf ? (
                          <a
                            href={item.assets[0].storageKey}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-book-status admin-book-status-pdf"
                          >
                            📄 PDF ({(item.assets[0].sizeBytes / (1024 * 1024)).toFixed(1)} MB)
                          </a>
                        ) : (
                          <span className="admin-book-status admin-book-status-none">📄 No PDF</span>
                        )}
                        {hasVideo ? (
                          <span className="admin-book-status admin-book-status-video">🎥 Video</span>
                        ) : (
                          <span className="admin-book-status admin-book-status-none">🎥 No video</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="admin-book-actions">
                    <details>
                      <summary className="admin-book-btn admin-book-btn-edit">✏ Edit</summary>
                      <div className="admin-book-edit-form">
                        <LessonForm
                          classes={classes}
                          subjects={subjects}
                          initialData={{
                            id: item.id,
                            title: item.title,
                            description: item.description,
                            classId: item.classId,
                            subjectId: item.subjectId,
                            status: item.status,
                            coverUrl: item.coverUrl,
                            videoUrl: item.videos[0]?.url || null,
                          }}
                          action={saveBook}
                          isEdit
                        />
                        <form action={deleteBook} style={{ marginTop: 12 }}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="danger" type="submit">
                            Delete Lesson
                          </button>
                        </form>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="admin-books-empty">
            <div className="admin-books-empty-icon">📖</div>
            <h3>No lessons yet</h3>
            <p>Add your first lesson using the form above.</p>
          </div>
        )}
      </div>
    </main>
  );
}
