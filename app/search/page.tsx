import Link from "next/link";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";

  let classes: (Awaited<ReturnType<typeof db.class.findMany>>[number] & { subjects: Awaited<ReturnType<typeof db.subject.findMany>>; books: { id: string }[] })[] = [];
  let subjects: (Awaited<ReturnType<typeof db.subject.findMany>>[number] & { class: { slug: string; name: string } })[] = [];
  let books: (Awaited<ReturnType<typeof db.book.findMany>>[number] & { class: { name: string }; subject: { name: string } | null; assets: { type: string }[]; videos: { status: string }[] })[] = [];
  let videos: (Awaited<ReturnType<typeof db.video.findMany>>[number] & { book: { class: { name: string }; title: string } | null })[] = [];
  let notes: { id: string; title: string; slug: string; description: string | null }[] = [];

  if (query) {
    const q = query;
    const like = { contains: q, mode: "insensitive" as const };

    [classes, subjects, books, videos, notes] = await Promise.all([
      db.class.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { name: like },
            { description: like },
          ],
        },
        include: { subjects: true, books: { where: { status: "PUBLISHED" } } },
        orderBy: { name: "asc" },
        take: 20,
      }),
      db.subject.findMany({
        where: {
          class: { status: "PUBLISHED" },
          OR: [
            { name: like },
          ],
        },
        include: { class: true },
        orderBy: { name: "asc" },
        take: 20,
      }),
      db.book.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: like },
            { description: like },
          ],
        },
        include: {
          class: true,
          subject: true,
          assets: { where: { type: "PDF" } },
          videos: { where: { status: "PUBLISHED" } },
        },
        orderBy: { title: "asc" },
        take: 30,
      }),
      db.video.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: like },
            { description: like },
          ],
        },
        include: { book: { include: { class: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.note.findMany({
        where: {
          OR: [
            { title: like },
            { description: like },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
  }

  const hasResults = classes.length + subjects.length + books.length + videos.length + notes.length > 0;
  const totalResults = classes.length + subjects.length + books.length + videos.length + notes.length;

  return (
    <main className="public">
      <Navbar active="search" />

      {/* Premium Search Hero */}
      <div className="search-hero">
        <div className="search-hero-badges">
          <span className="search-hero-badge search-hero-badge-gold">SABEEL-UL-ILM</span>
          <span className="search-hero-badge search-hero-badge-light">🔍 Search</span>
        </div>
        <h1>Search Resources</h1>
        <p className="search-hero-sub">
          Find classes, subjects, lessons, videos, and notes across the entire Dars-e-Nizami curriculum.
        </p>
        <form className="search-hero-form" method="GET" action="/search">
          <div className="search-hero-input-wrap">
            <span className="search-hero-icon">🔍</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Search for topics, lessons, videos..."
              className="search-hero-input"
              autoFocus
            />
          </div>
          <button type="submit" className="search-hero-btn">
            Search
          </button>
        </form>
      </div>

      {/* Initial State */}
      {!query && (
        <div className="search-initial">
          <div className="search-initial-icon">🔍</div>
          <h3>What are you looking for?</h3>
          <p>Search across classes, lessons, videos, and notes in the Dars-e-Nizami curriculum.</p>
          <div className="search-initial-types">
            <Link href="/classes" className="search-initial-type">📚 Browse Classes</Link>
            <Link href="/notes" className="search-initial-type">📄 Notes</Link>
            <Link href="/notifications" className="search-initial-type">🔔 Notifications</Link>
          </div>
        </div>
      )}

      {/* Empty State */}
      {query && !hasResults && (
        <div className="search-empty">
          <div className="search-empty-icon">🔍</div>
          <h3>No results found</h3>
          <p>No results found for &ldquo;{query}&rdquo;. Try different keywords or browse content directly.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/classes" className="search-card-action search-card-action-primary">Browse Classes</Link>
            <Link href="/notes" className="search-card-action search-card-action-secondary">View Notes</Link>
          </div>
        </div>
      )}

      {/* Search Results */}
      {query && hasResults && (
        <div style={{ marginTop: 8 }}>
          {/* Summary Bar */}
          <div className="search-summary">
            <span className="search-summary-text">
              Showing results for &ldquo;<strong>{query}</strong>&rdquo;
            </span>
            <span className="search-summary-count">
              {totalResults} result{totalResults === 1 ? "" : "s"} found
            </span>
          </div>

          {/* Classes */}
          {classes.length > 0 && (
            <section className="search-results-section">
              <div className="search-results-heading">
                <div className="search-results-icon">📚</div>
                <h2>Classes</h2>
                <span className="search-results-count">{classes.length}</span>
              </div>
              <div className="search-cards">
                {classes.map((c) => (
                  <Link href={`/classes/${c.slug}`} className="search-card" key={c.id}>
                    <div className="search-card-top">
                      <div className="search-card-icon search-card-icon-class">📚</div>
                      <div className="search-card-info">
                        <div className="search-card-badges">
                          <span className="search-card-badge search-card-badge-type">Class</span>
                        </div>
                        <h3 className="search-card-title"><LangText>{c.name}</LangText></h3>
                      </div>
                    </div>
                    <p className="search-card-desc"><LangText>{c.description || "Curriculum class."}</LangText></p>
                    <div className="search-card-meta">
                      <span>{c.subjects.length} subjects</span>
                      <span className="search-card-meta-dot" />
                      <span>{c.books.length} lessons</span>
                    </div>
                    <span className="search-card-action search-card-action-primary">Open Class →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Subjects */}
          {subjects.length > 0 && (
            <section className="search-results-section">
              <div className="search-results-heading">
                <div className="search-results-icon">📋</div>
                <h2>Subjects</h2>
                <span className="search-results-count">{subjects.length}</span>
              </div>
              <div className="search-cards">
                {subjects.map((s) => (
                  <Link href={`/classes/${s.class.slug}?subject=${s.slug}`} className="search-card" key={s.id}>
                    <div className="search-card-top">
                      <div className="search-card-icon search-card-icon-subject">📋</div>
                      <div className="search-card-info">
                        <div className="search-card-badges">
                          <span className="search-card-badge search-card-badge-type">Subject</span>
                        </div>
                        <h3 className="search-card-title"><LangText>{s.name}</LangText></h3>
                      </div>
                    </div>
                    <p className="search-card-desc">Subject in <LangText>{s.class.name}</LangText></p>
                    <span className="search-card-action search-card-action-primary">View Subject →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Books / Lessons */}
          {books.length > 0 && (
            <section className="search-results-section">
              <div className="search-results-heading">
                <div className="search-results-icon">📖</div>
                <h2>Lessons</h2>
                <span className="search-results-count">{books.length}</span>
              </div>
              <div className="search-cards">
                {books.map((b) => (
                  <Link href={`/library/${b.slug}`} className="search-card" key={b.id}>
                    <div className="search-card-top">
                      <div className="search-card-icon search-card-icon-lesson">📖</div>
                      <div className="search-card-info">
                        <div className="search-card-badges">
                          <span className="search-card-badge search-card-badge-type">Lesson</span>
                          <span className="search-card-badge search-card-badge-meta"><LangText>{b.class.name}</LangText></span>
                          {b.subject && <span className="search-card-badge search-card-badge-meta"><LangText>{b.subject.name}</LangText></span>}
                        </div>
                        <h3 className="search-card-title"><LangText>{b.title}</LangText></h3>
                      </div>
                    </div>
                    <p className="search-card-desc"><LangText>{b.description || "Curriculum lesson resource."}</LangText></p>
                    <div className="search-card-meta">
                      {b.videos.length > 0 && <span>🎥 {b.videos.length} video{b.videos.length === 1 ? "" : "s"}</span>}
                      {b.videos.length > 0 && b.assets.length > 0 && <span className="search-card-meta-dot" />}
                      {b.assets.length > 0 && <span>📄 PDF</span>}
                    </div>
                    <span className="search-card-action search-card-action-primary">View Lesson →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <section className="search-results-section">
              <div className="search-results-heading">
                <div className="search-results-icon">🎥</div>
                <h2>Videos</h2>
                <span className="search-results-count">{videos.length}</span>
              </div>
              <div className="search-cards">
                {videos.map((v) => (
                  <Link href={`/videos/${v.id}`} className="search-card" key={v.id}>
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt={v.title} className="search-card-video-thumb" />
                    ) : (
                      <div className="search-card-video-placeholder">▶</div>
                    )}
                    <div className="search-card-top">
                      <div className="search-card-icon search-card-icon-video">🎥</div>
                      <div className="search-card-info">
                        <div className="search-card-badges">
                          <span className="search-card-badge search-card-badge-type">Video</span>
                          {v.book && (
                            <span className="search-card-badge search-card-badge-meta"><LangText>{v.book.class.name}</LangText></span>
                          )}
                        </div>
                        <h3 className="search-card-title"><LangText>{v.title}</LangText></h3>
                      </div>
                    </div>
                    <p className="search-card-desc"><LangText>{v.description || "Video lesson."}</LangText></p>
                    <span className="search-card-action search-card-action-primary">Watch →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {notes.length > 0 && (
            <section className="search-results-section">
              <div className="search-results-heading">
                <div className="search-results-icon">📄</div>
                <h2>Notes</h2>
                <span className="search-results-count">{notes.length}</span>
              </div>
              <div className="search-cards">
                {notes.map((n) => (
                  <Link href={`/notes/${n.slug}`} className="search-card" key={n.id}>
                    <div className="search-card-top">
                      <div className="search-card-icon search-card-icon-note">📄</div>
                      <div className="search-card-info">
                        <div className="search-card-badges">
                          <span className="search-card-badge search-card-badge-type">PDF Note</span>
                        </div>
                        <h3 className="search-card-title">{n.title}</h3>
                      </div>
                    </div>
                    <p className="search-card-desc">{n.description || "Educational PDF note."}</p>
                    <span className="search-card-action search-card-action-primary">View Note →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
