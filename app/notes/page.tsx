import Link from "next/link";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notes — Sabeel-ul-Ilm",
  description: "Browse and download free educational notes for Dars-e-Nizami studies. PDF notes on Nahw, Sarf, Arabic Grammar, and more.",
};

export default async function NotesPage() {
  const notes = await db.note.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, description: true, pdfFileName: true, createdAt: true },
  });

  return (
    <main className="public">
      <Navbar active="notes" />

      {/* Hero Header */}
      <div className="notes-hero">
        <div className="notes-hero-content">
          <div className="notes-hero-badges">
            <span className="notes-hero-badge notes-hero-badge-gold">EDUCATIONAL RESOURCES</span>
            <span className="notes-hero-badge notes-hero-badge-light">PDF Library</span>
          </div>
          <h1 className="notes-hero-title">Notes</h1>
          <p className="notes-hero-sub">
            Browse and download standalone educational notes for your Dars-e-Nizami studies.
          </p>
        </div>
        <div className="notes-hero-icon">📚</div>
      </div>

      {notes.length > 0 ? (
        <div className="notes-grid">
          {notes.map((note) => (
            <Link href={`/notes/${note.slug}`} className="notes-card" key={note.id}>
              <div className="notes-card-icon">📄</div>
              <div className="notes-card-body">
                <h3 className="notes-card-title">{note.title}</h3>
                {note.description && (
                  <p className="notes-card-desc">{note.description}</p>
                )}
                <div className="notes-card-meta">
                  <span>PDF Document</span>
                  <span className="notes-card-meta-dot" />
                  <span>{note.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="notes-card-footer">
                <span className="notes-card-btn notes-card-btn-primary">Open Note →</span>
                <span className="notes-card-btn notes-card-btn-secondary">View Details</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="notes-empty">
          <div className="notes-empty-icon">📄</div>
          <h3>No Notes Yet</h3>
          <p>Check back soon for educational PDF resources.</p>
        </div>
      )}
    </main>
  );
}
