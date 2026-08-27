import Link from "next/link";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; book?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q?.trim() || "";
  const bookFilter = params.book || "";

  const [videos, books] = await Promise.all([
    db.video.findMany({
      where: {
        status: "PUBLISHED",
        ...(bookFilter ? { book: { slug: bookFilter } } : {}),
        ...(searchQuery
          ? {
              OR: [
                { title: { contains: searchQuery, mode: "insensitive" } },
                { description: { contains: searchQuery, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { book: { include: { class: true, subject: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.book.findMany({
      where: { status: "PUBLISHED", videos: { some: { status: "PUBLISHED" } } },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <main className="public">
      <Navbar active="videos" />

      {/* Premium Hero */}
      <div className="videos-hero">
        <div className="videos-hero-content">
          <div className="videos-hero-badges">
            <span className="videos-hero-badge videos-hero-badge-gold">WATCH & LEARN</span>
            <span className="videos-hero-badge videos-hero-badge-light">🎥 Video Library</span>
          </div>
          <h1 className="videos-hero-title">Video Lessons</h1>
          <p className="videos-hero-sub">
            Short, focused interactive lessons linked to your Dars-e-Nizami curriculum.
          </p>
        </div>
        <div className="videos-hero-icon">🎥</div>
      </div>

      {/* Filter Bar */}
      <div className="videos-filters">
        <form className="videos-search-form" method="GET" action="/videos">
          {bookFilter && <input type="hidden" name="book" value={bookFilter} />}
          <input
            name="q"
            defaultValue={searchQuery}
            placeholder="Search video lessons..."
            className="videos-search-input"
          />
          <button type="submit" className="button">Search</button>
          {searchQuery && (
            <Link
              href={`/videos${bookFilter ? `?book=${bookFilter}` : ""}`}
              className="button-secondary"
            >
              Clear
            </Link>
          )}
        </form>

        {books.length > 0 && (
          <div className="videos-filters-pills">
            <span className="videos-filters-label">Book:</span>
            <Link
              href={`/videos${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`}
              className={`videos-filter-pill ${!bookFilter ? "videos-filter-pill-active" : ""}`}
            >
              All Videos
            </Link>
            {books.map((b) => (
              <Link
                key={b.id}
                href={`/videos?book=${b.slug}${
                  searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
                }`}
                className={`videos-filter-pill ${bookFilter === b.slug ? "videos-filter-pill-active" : ""}`}
              >
                <LangText>{b.title}</LangText>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Video Grid */}
      {videos.length > 0 ? (
        <div className="videos-grid">
          {videos.map((video) => (
            <Link href={`/videos/${video.id}`} className="videos-card" key={video.id}>
              {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title} className="videos-card-thumb" />
              ) : (
                <div className="videos-card-placeholder">▶</div>
              )}
              <div className="videos-card-body">
                <div className="videos-card-badges">
                  <span className="videos-card-badge videos-card-badge-type">🎥 Video</span>
                  {video.book ? (
                    <>
                      <span className="videos-card-badge videos-card-badge-context">
                        <LangText>{video.book.class.name}</LangText>
                      </span>
                      {video.book.subject && (
                        <span className="videos-card-badge videos-card-badge-context">
                          <LangText>{video.book.subject.name}</LangText>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="videos-card-badge videos-card-badge-context">General</span>
                  )}
                </div>
                <h3 className="videos-card-title"><LangText>{video.title}</LangText></h3>
                {video.description && (
                  <p className="videos-card-desc"><LangText>{video.description}</LangText></p>
                )}
              </div>
              <div className="videos-card-footer">
                <span className="videos-card-action">▶ Watch Video</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="videos-empty">
          <div className="videos-empty-icon">🎥</div>
          <h3>No videos available</h3>
          <p>
            {searchQuery
              ? `No videos found for "${searchQuery}". Try different keywords.`
              : "No video lessons available yet. Check back soon for educational content."}
          </p>
          <Link href="/videos" className="button" style={{ marginTop: 12 }}>
            View All Videos
          </Link>
        </div>
      )}
    </main>
  );
}
