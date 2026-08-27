import Link from "next/link";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { getFileUrl } from "@/lib/storage";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; subject?: string; q?: string }>;
}) {
  const params = await searchParams;
  const currentClass = params.class || "";
  const currentSubject = params.subject || "";
  const searchQuery = params.q?.trim() || "";

  const classes = await db.class.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
  });

  const subjects = currentClass
    ? await db.subject.findMany({
        where: { class: { slug: currentClass, status: "PUBLISHED" } },
        orderBy: { name: "asc" },
      })
    : [];

  const books = await db.book.findMany({
    where: {
      status: "PUBLISHED",
      class: currentClass ? { slug: currentClass, status: "PUBLISHED" } : { status: "PUBLISHED" },
      subject: currentSubject ? { slug: currentSubject } : undefined,
      ...(searchQuery
        ? {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      class: true,
      subject: true,
      assets: { where: { type: "PDF" } },
    },
    orderBy: { title: "asc" },
  });

  const booksWithUrls = await Promise.all(
    books.map(async (book) => {
      const pdfAsset = book.assets[0];
      const pdfUrl = pdfAsset ? await getFileUrl(pdfAsset.storageKey) : "";
      const coverUrl = book.coverUrl ? await getFileUrl(book.coverUrl) : "";
      return { ...book, pdfUrl, coverUrl };
    })
  );

  return (
    <main className="public">
      <Navbar active="library" />

      <section className="page-intro">
        <p className="eyebrow">RESOURCE LIBRARY</p>
        <h1>Books & Curriculum</h1>
        <p>Explore lessons, study guides, and downloadable PDFs organized by class and subject.</p>
      </section>

      <section className="filters-bar">
        <form className="search-form" method="GET" action="/library">
          {currentClass && <input type="hidden" name="class" value={currentClass} />}
          {currentSubject && <input type="hidden" name="subject" value={currentSubject} />}
          <input
            name="q"
            defaultValue={searchQuery}
            placeholder="Search by title or topic..."
            className="search-input"
          />
          <button type="submit" className="button">
            Search
          </button>
          {searchQuery && (
            <Link
              href={`/library${currentClass ? `?class=${currentClass}` : ""}`}
              className="button-secondary"
            >
              Clear
            </Link>
          )}
        </form>

        <div className="filters-group">
          <span className="filters-label">Classes:</span>
          <div className="filters-pills">
            <Link
              href={`/library${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`}
              className={`pill ${!currentClass ? "active" : ""}`}
            >
              All Classes
            </Link>
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/library?class=${c.slug}${
                  searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
                }`}
                className={`pill ${currentClass === c.slug ? "active" : ""}`}
              >
                <LangText>{c.name}</LangText>
              </Link>
            ))}
          </div>
        </div>

        {subjects.length > 0 && (
          <div className="filters-group">
            <span className="filters-label">Subjects:</span>
            <div className="filters-pills">
              <Link
                href={`/library?class=${currentClass}${
                  searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
                }`}
                className={`pill ${!currentSubject ? "active" : ""}`}
              >
                All Subjects
              </Link>
              {subjects.map((s) => (
                <Link
                  key={s.id}
                  href={`/library?class=${currentClass}&subject=${s.slug}${
                    searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
                  }`}
                  className={`pill ${currentSubject === s.slug ? "active" : ""}`}
                >
                  <LangText>{s.name}</LangText>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="cards">
        {booksWithUrls.map((book) => {
          const pdfAsset = book.assets[0];
          return (
            <article className="card" key={book.id}>
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="card-cover"
                />
              ) : null}
              <div className="card-badges">
                <span className="badge"><LangText>{book.class.name}</LangText></span>
                {book.subject && <span className="badge badge-secondary"><LangText>{book.subject.name}</LangText></span>}
              </div>
              <h2><LangText>{book.title}</LangText></h2>
              <p><LangText>{book.description || "Comprehensive learning resource for this topic."}</LangText></p>
              <div className="card-footer">
                <Link href={`/library/${book.slug}`} className="button-secondary">
                  Details →
                </Link>
                {pdfAsset ? (
                  <a className="button" href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                    Open PDF
                  </a>
                ) : (
                  <span className="muted" style={{ fontSize: 13 }}>
                    PDF unavailable
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {!books.length && (
        <div className="empty">
          <p>No learning resources match your current selection.</p>
          <Link href="/library" className="button" style={{ marginTop: 12 }}>
            Reset Filters
          </Link>
        </div>
      )}
    </main>
  );
}
