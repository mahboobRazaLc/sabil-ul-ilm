import Link from "next/link";
import { deleteSubject, saveSubject } from "@/app/actions";
import { LangText } from "@/components/lang-text";
import { db } from "@/lib/db";
import { getSubjectDisplayName } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; classId?: string }>;
}) {
  const [classes, allSubjects, params] = await Promise.all([
    db.class.findMany({ orderBy: { name: "asc" } }),
    db.subject.findMany({
      include: { class: true, _count: { select: { books: true } } },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
    }),
    searchParams,
  ]);

  const activeClassId = params.classId || "";
  const activeClass = classes.find((c) => c.id === activeClassId);
  const filteredSubjects = activeClassId
    ? allSubjects.filter((s) => s.classId === activeClassId)
    : [];

  return (
    <main>
      {/* Premium Hero Header */}
      <div className="admin-subjects-hero">
        <div className="admin-subjects-hero-content">
          <div className="admin-subjects-hero-badges">
            <span className="admin-subjects-hero-badge admin-subjects-hero-badge-gold">CONTENT</span>
            <span className="admin-subjects-hero-badge admin-subjects-hero-badge-light">📋 Subjects</span>
          </div>
          <h1 className="admin-subjects-hero-title">Subjects</h1>
          <p className="admin-subjects-hero-sub">
            Manage subjects for each class. Each subject belongs to exactly one class.
          </p>
        </div>
      </div>

      {params.notice && (
        <p className="notice" role="status">
          {params.notice}
        </p>
      )}

      {/* Class Selector */}
      <div className="admin-class-selector">
        <h2 className="admin-class-selector-title">Select a Class</h2>
        {classes.length ? (
          <div className="admin-class-pills">
            {classes.map((c) => {
              const isActive = activeClassId === c.id;
              const subjectCount = allSubjects.filter((s) => s.classId === c.id).length;
              return (
                <Link
                  key={c.id}
                  href={`/admin/subjects?classId=${c.id}`}
                  className={`admin-class-pill ${isActive ? "admin-class-pill-active" : ""}`}
                >
                  <LangText>{c.name}</LangText>
                  <span className="admin-class-pill-count">{subjectCount}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="admin-subjects-empty">
            <div className="admin-subjects-empty-icon">📋</div>
            <h3>No classes found</h3>
            <p>Please create at least one Class before adding subjects.</p>
            <Link href="/admin/classes" className="button" style={{ marginTop: 12 }}>
              Go to Classes
            </Link>
          </div>
        )}
      </div>

      {/* Subjects for Selected Class */}
      {activeClassId && (
        <>
          {/* Add Subject Form */}
          <div className="admin-add-subject">
            <h2 className="admin-add-subject-title">Add Subject to <LangText>{activeClass?.name}</LangText></h2>
            <form action={saveSubject} className="form-grid">
              <input type="hidden" name="classId" value={activeClassId} />
              <label>
                Subject Name <span style={{ color: "#ef4444" }}>*</span>
                <input name="name" required minLength={2} placeholder="e.g. Nahw, Sarf, Fiqh..." />
              </label>
              <div className="full">
                <button className="button" type="submit">
                  Add Subject
                </button>
              </div>
            </form>
          </div>

          {/* Subjects List */}
          <div className="admin-add-subject">
            <div className="admin-subjects-header">
              <h2 className="admin-subjects-title">Subjects in <LangText>{activeClass?.name}</LangText></h2>
              <span className="admin-subjects-count">{filteredSubjects.length}</span>
            </div>

            {filteredSubjects.length ? (
              <div className="admin-subjects-list">
                {filteredSubjects.map((item) => {
                  const subjectNames = getSubjectDisplayName(item.slug, item.name);
                  return (
                    <div className="admin-subject-card" key={item.id}>
                      <div className="admin-subject-card-top">
                        <div className="admin-subject-icon">📋</div>
                        <div className="admin-subject-info">
                          <h3 className="admin-subject-name">
                            {subjectNames.ar && (
                              <span className="admin-subject-arabic">{subjectNames.ar}</span>
                            )}
                            <LangText>{item.name}</LangText>
                          </h3>
                        </div>
                      </div>

                      <div className="admin-subject-meta">
                        <span className="admin-subject-meta-item">📚 {item._count.books} lesson{item._count.books === 1 ? "" : "s"}</span>
                        <span className="admin-subject-meta-slug">Slug: {item.slug}</span>
                      </div>

                      <div className="admin-subject-actions">
                        <details>
                          <summary className="admin-subject-btn admin-subject-btn-edit">✏ Edit</summary>
                          <div className="admin-subject-edit-form">
                            <form action={saveSubject} className="form-grid compact">
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="classId" value={activeClassId} />
                              <label>
                                Subject Name
                                <input name="name" required defaultValue={item.name} />
                              </label>
                              <div className="full" style={{ display: "flex", gap: 10 }}>
                                <button className="button" type="submit">
                                  Update
                                </button>
                              </div>
                            </form>
                            <form action={deleteSubject} style={{ marginTop: 10 }}>
                              <input type="hidden" name="id" value={item.id} />
                              <button className="danger" type="submit">
                                Delete Subject
                              </button>
                            </form>
                          </div>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="admin-subjects-empty">
                <div className="admin-subjects-empty-icon">📋</div>
                <h3>No subjects yet</h3>
                <p>Add your first subject using the form above.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Prompt when no class selected */}
      {!activeClassId && classes.length > 0 && (
        <div className="admin-subjects-empty" style={{ marginTop: 0 }}>
          <div className="admin-subjects-empty-icon">👆</div>
          <h3>Select a class</h3>
          <p>Choose a class above to manage its subjects.</p>
        </div>
      )}

      {/* Summary of all subjects grouped by class */}
      {!activeClassId && (
        <div className="admin-subjects-summary">
          <h2 className="admin-subjects-summary-title">All Subjects Summary ({allSubjects.length} total)</h2>
          {classes.map((c) => {
            const classSubjects = allSubjects.filter((s) => s.classId === c.id);
            return (
              <div key={c.id} className="admin-summary-class">
                <div className="admin-summary-class-header">
                  <span className="admin-summary-class-name"><LangText>{c.name}</LangText></span>
                  <span className="admin-summary-class-count">{classSubjects.length}</span>
                </div>
                {classSubjects.length > 0 ? (
                  <div className="admin-summary-subjects">
                    {classSubjects.map((s) => (
                      <span key={s.id} className="admin-summary-subject-badge">
                        <LangText>{s.name}</LangText>
                        {s._count.books > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({s._count.books})</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="admin-summary-empty">No subjects yet</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
