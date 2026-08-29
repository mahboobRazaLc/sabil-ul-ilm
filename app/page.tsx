import Link from "next/link";
export const dynamic = "force-dynamic";
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

      {/* Premium Hero Banner */}
      <section className="hero-banner">
        <div className="hero-banner-pattern" aria-hidden="true">
          <span className="hero-pattern-star">✦</span>
          <span className="hero-pattern-star">✦</span>
          <span className="hero-pattern-star">✦</span>
          <span className="hero-pattern-diamond">◆</span>
          <span className="hero-pattern-diamond">◆</span>
        </div>
        <div className="hero-banner-inner">
          <p className="hero-banner-bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          <p className="hero-banner-eyebrow">DARS-E-NIZAMI</p>
          <h1 className="hero-banner-title">
            <span className="hero-banner-brand">Sabeel-ul-Ilm</span>
            <span className="hero-banner-arabic">سبیلُ العلم</span>
          </h1>
          <p className="hero-banner-subtitle">
            A comprehensive platform for traditional Islamic scholarship &mdash; structured classes, video lessons, PDF resources, and direct teacher support.
          </p>
          <Link className="button hero-banner-btn" href="/classes">
            Explore Classes
          </Link>
        </div>
      </section>

      {/* Browse by Class */}
      <section style={{ marginBottom: 52 }}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">CURRICULUM</p>
            <h2>Browse by Class</h2>
          </div>
          <Link href="/classes">View all classes →</Link>
        </div>

        <div className="cards">
          {classes.map((c) => {
            const names = CLASS_NAMES[c.slug];
            return (
              <Link href={`/classes/${c.slug}`} className="card class-card" key={c.id}>
                <div className="class-icon">📖</div>
                {names ? (
                  <div className="class-arabic">{names.ar}</div>
                ) : null}
                <h3><LangText>{c.name}</LangText></h3>
                <p><LangText>{c.description || "Core curriculum, syllabus books, and study materials."}</LangText></p>
                <div className="class-meta">
                  <span>{c.subjects.length} subject{c.subjects.length === 1 ? "" : "s"}</span>
                  <span>·</span>
                  <span>{c.books.length} lesson{c.books.length === 1 ? "" : "s"}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {!classes.length && (
          <p className="empty">Published curriculum classes will appear here soon.</p>
        )}
      </section>

      {/* Continue Learning (for logged-in students) */}
      {user && inProgressItems.length > 0 && (
        <section style={{ marginBottom: 52 }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">RESUME</p>
              <h2>Continue Learning</h2>
            </div>
            <Link href="/profile">View profile →</Link>
          </div>

          <div className="cards">
            {inProgressItems.map((item) => {
              if (item.book) {
                return (
                  <Link href={`/library/${item.book.slug}`} className="card" key={item.id}>
                    <div className="card-badges">
                      <span className="badge">📖 Lesson</span>
                      <span className="badge badge-secondary"><LangText>{item.book.class.name}</LangText></span>
                    </div>
                    <h3><LangText>{item.book.title}</LangText></h3>
                    <div className="card-footer">
                      <span className="button" style={{ fontSize: 13 }}>Resume →</span>
                    </div>
                  </Link>
                );
              }
              if (item.video) {
                return (
                  <Link href={`/videos/${item.video.id}`} className="card" key={item.id}>
                    <div className="card-badges">
                      <span className="badge">🎬 Video</span>
                    </div>
                    <h3><LangText>{item.video.title}</LangText></h3>
                    <div className="card-footer">
                      <span className="button" style={{ fontSize: 13 }}>Watch →</span>
                    </div>
                  </Link>
                );
              }
              return null;
            })}
          </div>
        </section>
      )}

      {/* Featured Lessons */}
      {recentBooks.length > 0 && (
        <section style={{ marginBottom: 52 }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">FEATURED</p>
              <h2>Recent Lessons</h2>
            </div>
            <Link href="/classes">Browse all classes →</Link>
          </div>

          <div className="cards">
            {recentBooks.map((book) => (
              <Link href={`/library/${book.slug}`} className="card" key={book.id}>
                <div className="card-badges">
                  <span className="badge"><LangText>{book.class.name}</LangText></span>
                  {book.subject && <span className="badge badge-secondary"><LangText>{book.subject.name}</LangText></span>}
                  {book.videos.length > 0 && <span className="badge">🎥 Video</span>}
                  {book.assets.length > 0 && <span className="badge badge-secondary">📄 PDF</span>}
                </div>
                <h3><LangText>{book.title}</LangText></h3>
                <p><LangText>{book.description || "Curriculum lesson with video and PDF resources."}</LangText></p>
                <div className="card-footer">
                  <span className="button-secondary" style={{ fontSize: 13 }}>View Lesson →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ask Teacher */}
      <section style={{ marginBottom: 52 }}>
        <div
          className="panel"
          style={{
            background: "linear-gradient(135deg, var(--green-900) 0%, var(--green-800) 100%)",
            color: "white",
            textAlign: "center",
            padding: "40px 32px",
          }}
        >
          <p className="eyebrow" style={{ color: "var(--gold-400)" }}>DIRECT TEACHER SUPPORT</p>
          <h2 style={{ color: "white", margin: "8px 0 12px", fontSize: 24 }}>Have a Question?</h2>
          <p style={{ color: "#c8e0d0", maxWidth: 500, margin: "0 auto 24px", fontSize: 15 }}>
            Ask our educators directly from any lesson page. Get personalized guidance on your Dars-e-Nizami studies.
          </p>
          <Link
            href="/questions"
            className="button"
            style={{ background: "var(--gold-500)", color: "var(--green-900)", fontWeight: 800 }}
          >
            Ask a Question →
          </Link>
        </div>
      </section>

      {/* Founder Section */}
      <section className="founder-section">
        <div className="founder-card">
          <div className="founder-image-wrap">
            <div className="founder-image-placeholder">
              <span className="founder-image-icon">🕌</span>
              <span className="founder-image-text">Photo coming soon</span>
            </div>
          </div>
          <div className="founder-content">
            <p className="eyebrow">FOUNDER</p>
            <h2 className="founder-name">Mahboob Raza</h2>
            <p className="founder-title">Founder, Sabeel-ul-Ilm</p>
            <p className="founder-bio">
              Mahboob Raza is a Hafiz-e-Qur&apos;an and currently pursuing his Islamic education at
              Al Jamiatul Ashrafia, Mubarakpur, Azamgarh, in the Salisa (third-year) class.
            </p>
            <p className="founder-bio">
              With a passion for knowledge and education, he founded Sabeel-ul-Ilm to connect
              traditional learning with modern technology and make beneficial knowledge more
              accessible to students.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <p>
          <span className="footer-brand">Sabeel-ul-Ilm</span>{" "}
          <span className="footer-arabic">سبیلُ العلم</span>
        </p>
        <p className="footer-sub">Dars-e-Nizami Online Learning Platform</p>
      </footer>
    </main>
  );
}
