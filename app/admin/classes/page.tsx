import { deleteClass, saveClass } from "@/app/actions";
import { LangText } from "@/components/lang-text";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [classes, params] = await Promise.all([
    db.class.findMany({
      include: { _count: { select: { books: true, subjects: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    searchParams,
  ]);

  return (
    <main>
      {/* Premium Hero Header */}
      <div className="admin-classes-hero">
        <div className="admin-classes-hero-content">
          <div className="admin-classes-hero-badges">
            <span className="admin-classes-hero-badge admin-classes-hero-badge-gold">CONTENT</span>
            <span className="admin-classes-hero-badge admin-classes-hero-badge-light">🏫 Classes</span>
          </div>
          <h1 className="admin-classes-hero-title">Classes</h1>
          <p className="admin-classes-hero-sub">
            Create and organize curriculum grade levels or study cohorts.
          </p>
        </div>
      </div>

      {params.notice && (
        <p className="notice" role="status">
          {params.notice}
        </p>
      )}

      {/* Add Class Form */}
      <div className="admin-add-class">
        <div className="admin-add-class-header">
          <h2 className="admin-add-class-title">Add a Class</h2>
        </div>
        <form action={saveClass} className="form-grid">
          <label>
            Name <span style={{ color: "#ef4444" }}>*</span>
            <input name="name" required minLength={2} placeholder="e.g. Grade 10" />
          </label>
          <label>
            Status
            <select name="status" defaultValue="PUBLISHED">
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
          <label className="full">
            Description
            <textarea
              name="description"
              rows={3}
              placeholder="What curriculum level or subjects are included in this class?"
            />
          </label>
          <div className="full">
            <button className="button" type="submit">
              Save Class
            </button>
          </div>
        </form>
      </div>

      {/* Classes List */}
      <div className="admin-add-class">
        <div className="admin-classes-header">
          <h2 className="admin-classes-title">All Classes</h2>
          <span className="admin-classes-count">{classes.length}</span>
        </div>

        {classes.length ? (
          <div className="admin-classes-list">
            {classes.map((item) => (
              <div className="admin-class-card" key={item.id}>
                <div className="admin-class-card-top">
                  <div className="admin-class-icon">🏫</div>
                  <div className="admin-class-info">
                    <h3 className="admin-class-name"><LangText>{item.name}</LangText></h3>
                    {item.description && (
                      <p className="admin-class-desc"><LangText>{item.description}</LangText></p>
                    )}
                  </div>
                  <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                </div>

                <div className="admin-class-meta">
                  <span className="admin-class-meta-item">📚 {item._count.books} lesson{item._count.books === 1 ? "" : "s"}</span>
                  <span className="admin-class-meta-item">📋 {item._count.subjects} subject{item._count.subjects === 1 ? "" : "s"}</span>
                  <span className="admin-class-meta-slug">Slug: {item.slug}</span>
                </div>

                <div className="admin-class-actions">
                  <details>
                    <summary className="admin-class-btn admin-class-btn-edit">✏ Edit</summary>
                    <div className="admin-class-edit-form">
                      <form action={saveClass} className="form-grid compact">
                        <input type="hidden" name="id" value={item.id} />
                        <label>
                          Name
                          <input name="name" defaultValue={item.name} required />
                        </label>
                        <label>
                          Status
                          <select name="status" defaultValue={item.status}>
                            <option value="PUBLISHED">PUBLISHED</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                          </select>
                        </label>
                        <label className="full">
                          Description
                          <textarea
                            name="description"
                            rows={3}
                            defaultValue={item.description || ""}
                          />
                        </label>
                        <div className="full" style={{ display: "flex", gap: 10 }}>
                          <button className="button" type="submit">
                            Update
                          </button>
                        </div>
                      </form>
                      <form action={deleteClass} style={{ marginTop: 10 }}>
                        <input type="hidden" name="id" value={item.id} />
                        <button className="danger" type="submit">
                          Delete Class
                        </button>
                      </form>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-classes-empty">
            <div className="admin-classes-empty-icon">🏫</div>
            <h3>No classes yet</h3>
            <p>Create your first class using the form above.</p>
          </div>
        )}
      </div>
    </main>
  );
}
