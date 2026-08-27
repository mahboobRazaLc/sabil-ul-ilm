import Link from "next/link";
import { db } from "@/lib/db";
import { createNote, updateNote, deleteNote } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const params = await searchParams;

  const notes = await db.note.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      {/* Premium Hero Header */}
      <div className="admin-notes-hero">
        <div className="admin-notes-hero-content">
          <div className="admin-notes-hero-badges">
            <span className="admin-notes-hero-badge admin-notes-hero-badge-gold">CONTENT</span>
            <span className="admin-notes-hero-badge admin-notes-hero-badge-light">📄 Notes</span>
          </div>
          <h1 className="admin-notes-hero-title">Notes</h1>
          <p className="admin-notes-hero-sub">
            Manage standalone educational PDF notes for students.
          </p>
        </div>
        <div className="admin-notes-hero-stats">
          <div className="admin-notes-stat">
            <span className="admin-notes-stat-value">{notes.length}</span>
            <span className="admin-notes-stat-label">Total</span>
          </div>
        </div>
      </div>

      {params.notice && (
        <p className="notice" role="status">
          {params.notice}
        </p>
      )}

      <div className="admin-notes-grid">
        {/* Add Note Form */}
        <div className="admin-notes-add">
          <h2 className="admin-notes-section-title">Add Note</h2>
          <form action={createNote} className="form-grid">
            <div className="full">
              <label>
                Note Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                name="title"
                required
                minLength={2}
                maxLength={180}
                placeholder="e.g. Nahw Important Notes"
              />
            </div>
            <div className="full">
              <label>
                Description <small>(optional)</small>
              </label>
              <textarea
                name="description"
                rows={2}
                maxLength={1000}
                placeholder="Brief description of the note contents..."
              />
            </div>
            <div className="full">
              <label>
                PDF File <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="file"
                name="pdf"
                accept=".pdf,application/pdf"
                required
              />
            </div>
            <div className="full">
              <button className="button" type="submit">
                Save Note
              </button>
            </div>
          </form>
        </div>

        {/* Notes List */}
        <div className="admin-notes-list-panel">
          <div className="admin-notes-header">
            <h2 className="admin-notes-section-title">Existing Notes</h2>
            <span className="admin-notes-count">{notes.length}</span>
          </div>

          {notes.length > 0 ? (
            <div className="admin-notes-list">
              {notes.map((note) => (
                <div className="admin-note-card" key={note.id}>
                  <div className="admin-note-card-top">
                    <div className="admin-note-icon">📄</div>
                    <div className="admin-note-info">
                      <h3 className="admin-note-name">{note.title}</h3>
                      <div className="admin-note-meta">
                        <span className="admin-note-meta-item">📎 {note.pdfFileName}</span>
                        <span className="admin-note-meta-item">📅 {note.createdAt.toLocaleDateString()}</span>
                      </div>
                      {note.description && (
                        <p className="admin-note-desc">{note.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="admin-note-actions-row">
                    <a
                      href={note.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-note-link"
                    >
                      ↗ Open PDF
                    </a>
                    <a
                      href={note.pdfUrl}
                      download
                      className="admin-note-link"
                    >
                      ⬇ Download
                    </a>
                    <span className="admin-note-slug">Slug: {note.slug}</span>
                  </div>

                  <div className="admin-note-actions">
                    <details>
                      <summary className="admin-note-btn admin-note-btn-edit">✏ Edit</summary>
                      <div className="admin-note-edit-form">
                        <form action={updateNote} className="form-grid compact">
                          <input type="hidden" name="id" value={note.id} />
                          <label className="full">
                            Title
                            <input name="title" defaultValue={note.title} required minLength={2} maxLength={180} />
                          </label>
                          <label className="full">
                            Description
                            <textarea name="description" rows={2} maxLength={1000} defaultValue={note.description || ""} />
                          </label>
                          <label className="full">
                            Replace PDF <small>(optional)</small>
                            <input type="file" name="pdf" accept=".pdf,application/pdf" />
                          </label>
                          <div className="full" style={{ display: "flex", gap: 10 }}>
                            <button className="button" type="submit">
                              Update Note
                            </button>
                          </div>
                        </form>
                        <form action={deleteNote} style={{ marginTop: 12 }}>
                          <input type="hidden" name="id" value={note.id} />
                          <button className="danger" type="submit">
                            Delete Note
                          </button>
                        </form>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-notes-empty">
              <div className="admin-notes-empty-icon">📄</div>
              <h3>No notes yet</h3>
              <p>Create your first note using the form above.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
