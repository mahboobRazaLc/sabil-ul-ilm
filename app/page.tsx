import Link from "next/link";
export const revalidate = 60;
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { getOptionalUser } from "@/lib/auth/authorization";

import { CLASS_NAMES } from "@/lib/constants";

export default async function HomePage() {
  const [classes, recentBooks, user] = await Promise.all([
    db.class.findMany({
      where: { status: "PUBLISHED" },
      include: {
        subjects: true,
        books: { where: { status: "PUBLISHED" } },
      },
      orderBy: { name: "asc" },
    }),
    db.book.findMany({
      where: { status: "PUBLISHED" },
      include: {
        class: true,
        subject: true,
        videos: { where: { status: "PUBLISHED" }, take: 1 },
        assets: { where: { type: "PDF" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    getOptionalUser(),
  ]);

  let inProgressItems: { id: string; book?: { title: string; slug: string; class: { name: string } } | null; video?: { title: string; id: string } | null }[] = [];
  if (user?.id) {
    inProgressItems = await db.learningProgress.findMany({
      where: { userId: user.id, status: "IN_PROGRESS" },
      include: {
        book: { include: { class: true } },
        video: true,
      },
      orderBy: { lastAccessedAt: "desc" },
      take: 4,
    });
  }

  return (
    <main className="public">
      <Navbar active="home" />

      {/* ═══════════ Premium Hero ═══════════ */}
      <section className="hp-hero">
        <div className="hp-hero-bg" aria-hidden="true">
          <div className="hp-hero-orb hp-hero-orb-1" />
          <div className="hp-hero-orb hp-hero-orb-2" />
          <div className="hp-hero-grid" />
        </div>
        <div className="hp-hero-content">
          <div className="hp-hero-badge">
            <span className="hp-hero-badge-dot" />
            DARS-E-NIZAMI
          </div>
          <p className="hp-hero-bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          <h1 className="hp-hero-title">
            <span className="hp-hero-brand">Sabeel-ul-Ilm</span>
            <span className="hp-hero-arabic">سبیلُ العلم</span>
          </h1>
          <p className="hp-hero-sub">
            A comprehensive platform for traditional Islamic scholarship &mdash;
            structured classes, video lessons, PDF resources, and direct teacher support.
          </p>
          <div className="hp-hero-actions">
            <Link className="hp-hero-btn hp-hero-btn-primary" href="/classes">
              Explore Classes
              <span className="hp-hero-btn-arrow">→</span>
            </Link>
            <Link className="hp-hero-btn hp-hero-btn-secondary" href="/register">
              Create Free Account
            </Link>
          </div>
          <div className="hp-hero-stats">
            <div className="hp-hero-stat">
              <span className="hp-hero-stat-icon">📚</span>
              <span className="hp-hero-stat-text">{classes.length} Classes</span>
            </div>
            <div className="hp-hero-stat-sep" />
            <div className="hp-hero-stat">
              <span className="hp-hero-stat-icon">📖</span>
              <span className="hp-hero-stat-text">{recentBooks.length}+ Lessons</span>
            </div>
            <div className="hp-hero-stat-sep" />
            <div className="hp-hero-stat">
              <span className="hp-hero-stat-icon">❓</span>
              <span className="hp-hero-stat-text">Teacher Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Browse by Class ═══════════ */}
      <section className="hp-section">
        <div className="hp-section-header">
          <div className="hp-section-header-left">
            <span className="hp-section-eyebrow">CURRICULUM</span>
            <h2 className="hp-section-title">Browse by Class</h2>
            <p className="hp-section-sub">Structured Dars-e-Nizami curriculum with all subjects and study materials.</p>
          </div>
          <Link href="/classes" className="hp-section-link">View all →</Link>
        </div>

        <div className="hp-class-grid">
          {classes.map((c) => {
            const names = CLASS_NAMES[c.slug];
            return (
              <Link href={`/classes/${c.slug}`} className="hp-class-card" key={c.id}>
                <div className="hp-class-card-accent" />
                <div className="hp-class-card-body">
                  <div className="hp-class-card-top">
                    <span className="hp-class-card-icon">📖</span>
                    {names && <span className="hp-class-card-ar">{names.ar}</span>}
                  </div>
                  <h3 className="hp-class-card-name"><LangText>{c.name}</LangText></h3>
                  <p className="hp-class-card-desc">
                    <LangText>{c.description || "Core curriculum, syllabus books, and study materials."}</LangText>
                  </p>
                  <div className="hp-class-card-meta">
                    <span>{c.subjects.length} subject{c.subjects.length === 1 ? "" : "s"}</span>
                    <span className="hp-class-card-meta-dot">·</span>
                    <span>{c.books.length} lesson{c.books.length === 1 ? "" : "s"}</span>
                  </div>
                  <span className="hp-class-card-cta">View Class →</span>
                </div>
              </Link>
            );
          })}
        </div>

        {!classes.length && (
          <div className="hp-empty">
            <p>Published curriculum classes will appear here soon.</p>
          </div>
        )}
      </section>

      {/* ═══════════ Continue Learning ═══════════ */}
      {user && inProgressItems.length > 0 && (
        <section className="hp-section">
          <div className="hp-section-header">
            <div className="hp-section-header-left">
              <span className="hp-section-eyebrow">RESUME</span>
              <h2 className="hp-section-title">Continue Learning</h2>
            </div>
            <Link href="/profile" className="hp-section-link">View profile →</Link>
          </div>
          <div className="hp-class-grid">
            {inProgressItems.map((item) => {
              if (item.book) {
                return (
                  <Link href={`/library/${item.book.slug}`} className="hp-class-card" key={item.id}>
                    <div className="hp-class-card-accent" />
                    <div className="hp-class-card-body">
                      <span className="hp-class-card-badge">📖 Lesson</span>
                      <h3 className="hp-class-card-name"><LangText>{item.book.title}</LangText></h3>
                      <p className="hp-class-card-desc"><LangText>{item.book.class.name}</LangText></p>
                      <span className="hp-class-card-cta">Resume →</span>
                    </div>
                  </Link>
                );
              }
              if (item.video) {
                return (
                  <Link href={`/videos/${item.video.id}`} className="hp-class-card" key={item.id}>
                    <div className="hp-class-card-accent" />
                    <div className="hp-class-card-body">
                      <span className="hp-class-card-badge">🎬 Video</span>
                      <h3 className="hp-class-card-name"><LangText>{item.video.title}</LangText></h3>
                      <span className="hp-class-card-cta">Watch →</span>
                    </div>
                  </Link>
                );
              }
              return null;
            })}
          </div>
        </section>
      )}

      {/* ═══════════ Featured Lessons ═══════════ */}
      {recentBooks.length > 0 && (
        <section className="hp-section">
          <div className="hp-section-header">
            <div className="hp-section-header-left">
              <span className="hp-section-eyebrow">FEATURED</span>
              <h2 className="hp-section-title">Recent Lessons</h2>
              <p className="hp-section-sub">Latest content from across the curriculum.</p>
            </div>
            <Link href="/classes" className="hp-section-link">Browse all →</Link>
          </div>
          <div className="hp-class-grid">
            {recentBooks.map((book) => (
              <Link href={`/library/${book.slug}`} className="hp-class-card" key={book.id}>
                <div className="hp-class-card-accent" />
                <div className="hp-class-card-body">
                  <div className="hp-class-card-badges">
                    <span className="hp-class-card-badge">{book.class.name}</span>
                    {book.subject && <span className="hp-class-card-badge hp-class-card-badge-outline">{book.subject.name}</span>}
                    {book.videos.length > 0 && <span className="hp-class-card-badge">🎥 Video</span>}
                    {book.assets.length > 0 && <span className="hp-class-card-badge hp-class-card-badge-outline">📄 PDF</span>}
                  </div>
                  <h3 className="hp-class-card-name"><LangText>{book.title}</LangText></h3>
                  <p className="hp-class-card-desc">
                    <LangText>{book.description || "Curriculum lesson with video and PDF resources."}</LangText>
                  </p>
                  <span className="hp-class-card-cta">View Lesson →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════ Ask Teacher ═══════════ */}
      <section className="hp-section">
        <div className="hp-cta-card">
          <div className="hp-cta-content">
            <span className="hp-cta-icon">💬</span>
            <div>
              <span className="hp-section-eyebrow" style={{ color: "var(--gold-400)" }}>DIRECT TEACHER SUPPORT</span>
              <h2 className="hp-cta-title">Have a Question?</h2>
              <p className="hp-cta-desc">
                Ask our educators directly from any lesson page. Get personalized
                guidance on your Dars-e-Nizami studies.
              </p>
            </div>
          </div>
          <Link href="/questions" className="hp-cta-btn">
            Ask a Question →
          </Link>
        </div>
      </section>

      {/* ═══════════ Founder Section ═══════════ */}
      <section className="hp-section">
        <div className="hp-founder-card">
          <div className="hp-founder-left">
            <div className="hp-founder-image-frame">
              <img
                src="/founder.jpg"
                alt="Mahboob Raza"
                className="hp-founder-image"
              />
            </div>
          </div>
          <div className="hp-founder-right">
            <span className="hp-section-eyebrow">FOUNDER</span>
            <h2 className="hp-founder-name">Mahboob Raza</h2>
            <p className="hp-founder-role">Founder, Sabeel-ul-Ilm</p>
            <div className="hp-founder-divider" />
            <p className="hp-founder-bio">
              Mahboob Raza is a Hafiz-e-Qur&apos;an and currently pursuing his Islamic education at
              Al Jamiatul Ashrafia, Mubarakpur, Azamgarh, in the Salisa (third-year) class.
            </p>
            <p className="hp-founder-bio">
              With a passion for knowledge and education, he founded Sabeel-ul-Ilm to connect
              traditional learning with modern technology and make beneficial knowledge more
              accessible to students.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ Footer ═══════════ */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand">
            <span className="hp-footer-name">Sabeel-ul-Ilm</span>
            <span className="hp-footer-arabic">سبیلُ العلم</span>
          </div>
          <p className="hp-footer-tagline">Dars-e-Nizami Online Learning Platform</p>
          <div className="hp-footer-links">
            <Link href="/classes">Classes</Link>
            <Link href="/notes">Notes</Link>
            <Link href="/questions">Questions</Link>
            <Link href="/login">Sign In</Link>
          </div>
          <p className="hp-footer-copy">&copy; {new Date().getFullYear()} Sabeel-ul-Ilm. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
