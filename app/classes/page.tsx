import Link from "next/link";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { getClassDisplayName } from "@/lib/constants";

export const revalidate = 60;

export const metadata = {
  title: "Classes — Sabeel-ul-Ilm",
  description: "Browse the complete Dars-e-Nizami curriculum with structured subjects, video lessons, and PDF materials.",
};

export default async function ClassesPage() {
  const classes = await db.class.findMany({
    where: { status: "PUBLISHED" },
    include: {
      subjects: true,
      books: {
        where: { status: "PUBLISHED" },
        include: {
          videos: { where: { status: "PUBLISHED" } },
          assets: { where: { type: "PDF" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="public">
      <Navbar active="classes" />

      {/* Premium Hero */}
      <div className="cls-hero">
        <div className="cls-hero-content">
          <div className="cls-hero-badges">
            <span className="cls-hero-badge cls-hero-badge-gold">DARS-E-NIZAMI CURRICULUM</span>
            <span className="cls-hero-badge cls-hero-badge-light">📚 {classes.length} Classes</span>
          </div>
          <h1 className="cls-hero-title">Browse Classes</h1>
          <p className="cls-hero-sub">
            Structured curriculum with subjects, video lessons, and PDF materials for every level of Dars-e-Nizami study.
          </p>
        </div>
        <div className="cls-hero-icon">📖</div>
      </div>

      <div className="classes-grid">
        {classes.map((c) => {
          const totalLessons = c.books.length;
          const totalVideos = c.books.reduce((acc, b) => acc + b.videos.length, 0);
          const totalPdfs = c.books.reduce((acc, b) => acc + b.assets.length, 0);
          const names = getClassDisplayName(c.slug, c.name);

          return (
            <Link href={`/classes/${c.slug}`} className="class-card-premium" key={c.id}>
              <div className="class-card-top">
                <div className="class-card-icon-wrap">
                  <span className="class-card-icon">📖</span>
                </div>
                {names.ar && <div className="class-card-arabic">{names.ar}</div>}
                <h3 className="class-card-title"><LangText>{c.name}</LangText></h3>
                <p className="class-card-desc"><LangText>{c.description || "Core curriculum, syllabus books, and study materials."}</LangText></p>
              </div>

              <div className="class-card-stats">
                <div className="class-stat">
                  <span className="class-stat-icon">📚</span>
                  <span className="class-stat-value">{c.subjects.length}</span>
                  <span className="class-stat-label">Subject{c.subjects.length === 1 ? "" : "s"}</span>
                </div>
                <div className="class-stat">
                  <span className="class-stat-icon">📖</span>
                  <span className="class-stat-value">{totalLessons}</span>
                  <span className="class-stat-label">Lesson{totalLessons === 1 ? "" : "s"}</span>
                </div>
                <div className="class-stat">
                  <span className="class-stat-icon">🎥</span>
                  <span className="class-stat-value">{totalVideos}</span>
                  <span className="class-stat-label">Video{totalVideos === 1 ? "" : "s"}</span>
                </div>
                <div className="class-stat">
                  <span className="class-stat-icon">📄</span>
                  <span className="class-stat-value">{totalPdfs}</span>
                  <span className="class-stat-label">PDF{totalPdfs === 1 ? "" : "s"}</span>
                </div>
              </div>

              <div className="class-card-action">
                <span className="class-card-btn">Open Class</span>
                <svg className="class-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      {!classes.length && (
        <div className="empty">
          <p>No published classes available yet. Check back soon.</p>
        </div>
      )}
    </main>
  );
}
