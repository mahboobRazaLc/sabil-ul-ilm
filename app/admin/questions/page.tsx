import Link from "next/link";
import { answerQuestion, archiveQuestion } from "@/app/actions";
import { LangText } from "@/components/lang-text";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || "ALL";

  const [questions, openCount, answeredCount, archivedCount] = await Promise.all([
    db.studentQuestion.findMany({
      where:
        statusFilter && statusFilter !== "ALL"
          ? { status: statusFilter as "OPEN" | "ANSWERED" | "ARCHIVED" }
          : undefined,
      include: { answerer: true, book: true, author: true },
      orderBy: { createdAt: "desc" },
    }),
    db.studentQuestion.count({ where: { status: "OPEN" } }),
    db.studentQuestion.count({ where: { status: "ANSWERED" } }),
    db.studentQuestion.count({ where: { status: "ARCHIVED" } }),
  ]);

  const totalCount = openCount + answeredCount + archivedCount;

  return (
    <main>
      {/* Premium Hero Header */}
      <div className="admin-questions-hero">
        <div className="admin-questions-hero-content">
          <div className="admin-questions-hero-badges">
            <span className="admin-questions-hero-badge admin-questions-hero-badge-gold">TEACHER</span>
            <span className="admin-questions-hero-badge admin-questions-hero-badge-light">❓ Questions</span>
          </div>
          <h1 className="admin-questions-hero-title">Questions Inbox</h1>
          <p className="admin-questions-hero-sub">
            Review student inquiries, publish educator answers, and organize curriculum help.
          </p>
        </div>
        <div className="admin-questions-hero-stats">
          <div className="admin-questions-stat">
            <span className="admin-questions-stat-value">{totalCount}</span>
            <span className="admin-questions-stat-label">Total</span>
          </div>
          <div className="admin-questions-stat">
            <span className="admin-questions-stat-value">{openCount}</span>
            <span className="admin-questions-stat-label">Open</span>
          </div>
          <div className="admin-questions-stat">
            <span className="admin-questions-stat-value">{answeredCount}</span>
            <span className="admin-questions-stat-label">Answered</span>
          </div>
        </div>
      </div>

      {params.notice && (
        <p className="notice" role="status">
          {params.notice}
        </p>
      )}

      {/* Filter Tabs */}
      <div className="admin-questions-filters">
        <div className="admin-questions-filter-pills">
          <Link
            href="/admin/questions"
            className={`admin-questions-pill ${statusFilter === "ALL" ? "admin-questions-pill-active" : ""}`}
          >
            All ({totalCount})
          </Link>
          <Link
            href="/admin/questions?status=OPEN"
            className={`admin-questions-pill ${statusFilter === "OPEN" ? "admin-questions-pill-active" : ""}`}
          >
            Open ({openCount})
          </Link>
          <Link
            href="/admin/questions?status=ANSWERED"
            className={`admin-questions-pill ${statusFilter === "ANSWERED" ? "admin-questions-pill-active" : ""}`}
          >
            Answered ({answeredCount})
          </Link>
          <Link
            href="/admin/questions?status=ARCHIVED"
            className={`admin-questions-pill ${statusFilter === "ARCHIVED" ? "admin-questions-pill-active" : ""}`}
          >
            Archived ({archivedCount})
          </Link>
        </div>
      </div>

      {/* Questions List */}
      <div className="admin-questions-panel">
        <div className="admin-questions-header">
          <h2 className="admin-questions-section-title">Questions</h2>
          <span className="admin-questions-count">{questions.length}</span>
        </div>

        {questions.length ? (
          <div className="admin-questions-list">
            {questions.map((item) => {
              const isOpen = item.status === "OPEN";
              const isAnswered = item.status === "ANSWERED";
              return (
                <article className={`admin-question-card ${isOpen ? "admin-question-card-open" : ""} ${isAnswered ? "admin-question-card-answered" : ""}`} key={item.id}>
                  <div className="admin-question-card-top">
                    <div className="admin-question-status-indicator">
                      {isOpen ? "📬" : isAnswered ? "✅" : "📦"}
                    </div>
                    <div className="admin-question-info">
                      <div className="admin-question-name-row">
                        <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                        {item.book && (
                          <span className="admin-question-book-badge">📖 <LangText>{item.book.title}</LangText></span>
                        )}
                        <span className="admin-question-date">{item.createdAt.toLocaleDateString()}</span>
                      </div>

                      <div className="admin-question-student">
                        👤 {item.author?.name || item.name || "Anonymous Student"}
                        {(item.author?.email || item.email) && (
                          <span className="admin-question-email"> · ✉ {item.author?.email || item.email}</span>
                        )}
                        {item.author && (
                          <span className="admin-question-registered"> (Registered)</span>
                        )}
                      </div>

                      <h3 className="admin-question-text"><LangText>{item.question}</LangText></h3>

                      {item.answer && (
                        <div className="admin-question-answer">
                          <div className="admin-question-answer-label">Answer:</div>
                          <p className="admin-question-answer-text"><LangText>{item.answer}</LangText></p>
                          {item.answerer && (
                            <div className="admin-question-answerer">
                              Answered by: {item.answerer.name || item.answerer.email}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-question-actions">
                    <details>
                      <summary className="admin-question-btn admin-question-btn-edit">
                        {item.answer ? "✏ Edit Answer" : "💬 Answer"}
                      </summary>
                      <div className="admin-question-edit-form">
                        <form action={answerQuestion} className="form-grid compact">
                          <input type="hidden" name="id" value={item.id} />
                          <label className="full">
                            Educator Answer
                            <textarea
                              name="answer"
                              required
                              minLength={2}
                              rows={4}
                              defaultValue={item.answer || ""}
                              placeholder="Type a clear, detailed response to the student..."
                            />
                          </label>
                          <label>
                            Status
                            <select name="status" defaultValue={item.answer ? item.status : "ANSWERED"}>
                              <option value="OPEN">OPEN</option>
                              <option value="ANSWERED">ANSWERED</option>
                              <option value="ARCHIVED">ARCHIVED</option>
                            </select>
                          </label>
                          <div className="full" style={{ display: "flex", gap: 10 }}>
                            <button className="button" type="submit">
                              Save Response
                            </button>
                          </div>
                        </form>
                        {item.status !== "ARCHIVED" && (
                          <form action={archiveQuestion} style={{ marginTop: 12 }}>
                            <input type="hidden" name="id" value={item.id} />
                            <button className="danger" type="submit">
                              Archive
                            </button>
                          </form>
                        )}
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="admin-questions-empty">
            <div className="admin-questions-empty-icon">❓</div>
            <h3>No questions found</h3>
            <p>No questions in this view. Student questions will appear here.</p>
          </div>
        )}
      </div>
    </main>
  );
}
