import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { ShareButtons } from "@/components/share-buttons";
import { getClassDisplayName, getSubjectDisplayName } from "@/lib/constants";
import { getFileUrl } from "@/lib/storage";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cls = await db.class.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { subjects: true },
  });
  if (!cls) return { title: "Class Not Found — Sabeel-ul-Ilm" };
  const className = getClassDisplayName(cls.slug, cls.name);
  return {
    title: `${className} — Sabeel-ul-Ilm`,
    description: `Explore ${className} Dars-e-Nizami curriculum — ${cls.subjects.length} subjects, video lectures, and PDF notes on Sabeel-ul-Ilm.`,
  };
}

export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subject?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const activeSubjectSlug = sp.subject || "";

  const cls = await db.class.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      subjects: {
        orderBy: { name: "asc" },
      },
      books: {
        where: { status: "PUBLISHED" },
        include: {
          assets: { where: { type: "PDF" } },
          videos: {
            where: { status: "PUBLISHED" },
            orderBy: { createdAt: "asc" },
          },
          subject: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cls) {
    notFound();
  }

  const classNames = getClassDisplayName(cls.slug, cls.name);

  // Group books by subject
  const subjectMap = new Map<string, { name: string; slug: string; books: typeof cls.books }>();
  for (const subject of cls.subjects) {
    subjectMap.set(subject.id, { name: subject.name, slug: subject.slug, books: [] });
  }
  const generalBooks: typeof cls.books = [];
  for (const book of cls.books) {
    if (book.subjectId && subjectMap.has(book.subjectId)) {
      subjectMap.get(book.subjectId)!.books.push(book);
    } else {
      generalBooks.push(book);
    }
  }

  // Generate presigned URLs for PDF assets
  const pdfUrlMap = new Map<string, string>();
  await Promise.all(
    cls.books.map(async (book) => {
      const pdf = book.assets[0];
      if (pdf) {
        const url = await getFileUrl(pdf.storageKey);
        pdfUrlMap.set(book.id, url);
      }
    })
  );

  // Filter by active subject if specified
  const filteredSubjects = activeSubjectSlug
    ? cls.subjects.filter((s) => s.slug === activeSubjectSlug)
    : cls.subjects;

  let lessonCounter = 0;

  return (
    <main className="public">
      <Navbar active="classes" />

      <Link href="/classes" className="back-link">
        ← Back to Classes
      </Link>

      {/* Premium Class Header */}
      <div className="class-detail-header">
        <div className="class-detail-header-content">
          {classNames.ar && (
            <div className="class-detail-arabic">{classNames.ar}</div>
          )}
          <h1 className="class-detail-title"><LangText>{cls.name}</LangText></h1>
          {cls.description && (
            <p className="class-detail-desc">
              <LangText>{cls.description}</LangText>
            </p>
          )}
          <div className="class-detail-meta">
            <span className="class-detail-meta-item">
              📚 {cls.subjects.length} Subject{cls.subjects.length === 1 ? "" : "s"}
            </span>
            <span className="class-detail-meta-sep">·</span>
            <span className="class-detail-meta-item">
              📖 {cls.books.length} Lesson{cls.books.length === 1 ? "" : "s"}
            </span>
          </div>
          <ShareButtons
            url={`${process.env.AUTH_URL || "https://sabeel-ul-ilm.vercel.app"}/classes/${cls.slug}`}
            title={`${classNames.ar ? classNames.ar + " — " : ""}${cls.name} | Sabeel-ul-Ilm`}
          />
        </div>
      </div>

      <div className="class-detail-layout">
        {/* Subject Sidebar */}
        <aside className="class-detail-sidebar">
          <nav className="class-detail-sidebar-nav">
            <Link
              href={`/classes/${cls.slug}`}
              className={`class-detail-sidebar-link ${!activeSubjectSlug ? "class-detail-sidebar-active" : ""}`}
            >
              <span className="class-detail-sidebar-icon">📚</span>
              <span className="class-detail-sidebar-text">
                <span className="class-detail-sidebar-name">All Subjects</span>
                <span className="class-detail-sidebar-count">{cls.books.length} lessons</span>
              </span>
            </Link>
            {cls.subjects.map((s) => {
              const subjectBooks = subjectMap.get(s.id)?.books || [];
              const isActive = activeSubjectSlug === s.slug;
              const subjectNames = getSubjectDisplayName(s.slug, s.name);
              return (
                <Link
                  key={s.id}
                  href={`/classes/${cls.slug}?subject=${s.slug}`}
                  className={`class-detail-sidebar-link ${isActive ? "class-detail-sidebar-active" : ""}`}
                >
                  <span className="class-detail-sidebar-icon">📖</span>
                  <span className="class-detail-sidebar-text">
                    <span className="class-detail-sidebar-name">
                      {subjectNames.ar && (
                        <span className="class-detail-sidebar-ar">{subjectNames.ar} </span>
                      )}
                      <LangText>{s.name}</LangText>
                    </span>
                    <span className="class-detail-sidebar-count">{subjectBooks.length} lessons</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Lessons Content */}
        <div className="class-detail-content">
          {filteredSubjects.length === 0 && cls.books.length === 0 ? (
            <div className="class-detail-empty">
              <span className="class-detail-empty-icon">📖</span>
              <p>No published lessons available yet. Check back soon.</p>
            </div>
          ) : (
            filteredSubjects.map((subject) => {
              const subjectBooks = subjectMap.get(subject.id)?.books || [];
              if (subjectBooks.length === 0) return null;
              lessonCounter = 0;
              const subjectNames = getSubjectDisplayName(subject.slug, subject.name);

              return (
                <section key={subject.id} className="subject-section">
                  <div className="subject-header">
                    <div className="subject-icon">📖</div>
                    <div>
                      {subjectNames.ar && (
                        <div className="subject-header-ar">{subjectNames.ar}</div>
                      )}
                      <h2><LangText>{subject.name}</LangText></h2>
                    </div>
                  </div>

                  <div className="lessons-list">
                    {subjectBooks.map((book) => {
                      lessonCounter++;
                      const video = book.videos[0];
                      const pdf = book.assets[0];

                      return (
                        <div className="lesson-card" key={book.id}>
                          <div className="lesson-card-number">{lessonCounter}</div>

                          <div className="lesson-card-body">
                            <h3 className="lesson-card-title">
                              <Link href={`/library/${book.slug}`}>
                                <LangText>{book.title}</LangText>
                              </Link>
                            </h3>
                          </div>

                          <div className="lesson-card-actions">
                            {video ? (
                              <Link href={`/videos/${video.id}`} className="lesson-btn lesson-btn-video">
                                <span className="lesson-btn-icon">🎥</span>
                                <span>Video</span>
                              </Link>
                            ) : (
                              <span className="lesson-btn lesson-btn-soon">
                                <span className="lesson-btn-icon">🎥</span>
                                <span>Soon</span>
                              </span>
                            )}

                            {pdf ? (
                              <a href={pdfUrlMap.get(book.id) || ""} target="_blank" rel="noopener noreferrer" className="lesson-btn lesson-btn-pdf">
                                <span className="lesson-btn-icon">📄</span>
                                <span>PDF</span>
                              </a>
                            ) : (
                              <span className="lesson-btn lesson-btn-soon">
                                <span className="lesson-btn-icon">📄</span>
                                <span>Soon</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}

          {/* General Lessons (no subject) */}
          {generalBooks.length > 0 && (!activeSubjectSlug || activeSubjectSlug === "") && (
            <section className="subject-section">
              <div className="subject-header">
                <div className="subject-icon">📖</div>
                <h2>General Lessons</h2>
              </div>

              <div className="lessons-list">
                {generalBooks.map((book) => {
                  lessonCounter++;
                  const video = book.videos[0];
                  const pdf = book.assets[0];

                  return (
                    <div className="lesson-card" key={book.id}>
                      <div className="lesson-card-number">{lessonCounter}</div>

                      <div className="lesson-card-body">
                        <h3 className="lesson-card-title">
                          <Link href={`/library/${book.slug}`}>
                            <LangText>{book.title}</LangText>
                          </Link>
                        </h3>
                      </div>

                      <div className="lesson-card-actions">
                        {video ? (
                          <Link href={`/videos/${video.id}`} className="lesson-btn lesson-btn-video">
                            <span className="lesson-btn-icon">🎥</span>
                            <span>Video</span>
                          </Link>
                        ) : (
                          <span className="lesson-btn lesson-btn-soon">
                            <span className="lesson-btn-icon">🎥</span>
                            <span>Soon</span>
                          </span>
                        )}

                        {pdf ? (
                          <a href={pdfUrlMap.get(book.id) || ""} target="_blank" rel="noopener noreferrer" className="lesson-btn lesson-btn-pdf">
                            <span className="lesson-btn-icon">📄</span>
                            <span>PDF</span>
                          </a>
                        ) : (
                          <span className="lesson-btn lesson-btn-soon">
                            <span className="lesson-btn-icon">📄</span>
                            <span>Soon</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
