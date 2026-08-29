import Link from "next/link";
export const revalidate = 60;
import { submitQuestion } from "@/app/actions";
import { db } from "@/lib/db";

import { Navbar } from "@/components/navbar";
import { LangText } from "@/components/lang-text";
import { getOptionalUser } from "@/lib/auth/authorization";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask a Question — Sabeel-ul-Ilm",
  description: "Get answers from qualified Islamic scholars. Ask questions about Dars-e-Nizami subjects, Fiqh, Hadith, Arabic grammar, and more.",
};

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [params, answeredQuestions, user] = await Promise.all([
    searchParams,
    db.studentQuestion.findMany({
      where: { status: "ANSWERED" },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    getOptionalUser(),
  ]);

  return (
    <main className="public">
      <Navbar active="questions" />

      <div className="q-hero">
        <div className="q-hero-inner">
          <div className="q-hero-icon">&#10067;</div>
          <div className="q-hero-text">
            <p className="q-hero-eyebrow">STUDENT SUPPORT &amp; Q&amp;A</p>
            <h1 className="q-hero-title">Ask an Educator</h1>
            <p className="q-hero-desc">
              Stuck on a problem or concept? Send your question directly to our teaching faculty.
            </p>
          </div>
        </div>
      </div>

      {params.notice && (
        <div className="q-notice" role="status">
          {params.notice}
        </div>
      )}

      <section className="q-form-card">
        <div className="q-form-header">
          <div className="q-form-header-icon">&#9998;</div>
          <h2 className="q-form-header-title">Submit Your Question</h2>
        </div>

        {user && (
          <div className="q-logged-in-banner">
            Logged in as <strong>{user.name || user.email}</strong>. Answers will appear in your{" "}
            <Link href="/dashboard">Student Dashboard</Link>.
          </div>
        )}

        <form action={submitQuestion} className="q-form">
          <input type="hidden" name="returnUrl" value="/questions" />
          {!user && (
            <>
              <div>
                <label className="q-form-label">
                  Your Name <span className="q-form-label-hint">(optional)</span>
                </label>
                <input name="name" maxLength={80} placeholder="e.g. Ahmed" className="q-form-input" />
              </div>
              <div>
                <label className="q-form-label">
                  Email Address <span className="q-form-label-hint">(optional, for follow-up)</span>
                </label>
                <input name="email" type="email" placeholder="alex@example.com" className="q-form-input" />
              </div>
            </>
          )}
          <div className="full">
            <label className="q-form-label">
              Your Question <span className="q-form-label-hint">(required)</span>
            </label>
            <textarea
              name="question"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              placeholder="Explain what concept or problem you need help with..."
              className="q-form-textarea"
            />
          </div>
          <div className="q-form-submit">
            <button className="q-form-submit-btn" type="submit">
              Send Question
            </button>
          </div>
        </form>
      </section>

      <section className="q-answered-section">
        <div className="q-answered-header">
          <div className="q-answered-header-icon">&#128218;</div>
          <div className="q-answered-header-text">
            <h2>Recently Answered Questions</h2>
            <p>Community knowledge from our educators</p>
          </div>
        </div>

        {answeredQuestions.length > 0 ? (
          <div>
            {answeredQuestions.map((q) => (
              <article className="q-card" key={q.id}>
                <div className="q-card-top">
                  <span className="q-card-badge q-card-badge-answered">
                    &#10003; Answered by Educator
                  </span>
                  <span className="q-card-meta">
                    <span className="q-card-meta-icon">&#128197;</span>
                    {q.name ? `${q.name} &middot; ` : ""}
                    {q.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                <h3 className="q-card-question">Q: <LangText>{q.question}</LangText></h3>
                <div className="q-card-answer">
                  <span className="q-card-answer-label">Educator Answer</span>
                  <p><LangText>{q.answer}</LangText></p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="q-empty">
            <span className="q-empty-icon">&#128172;</span>
            <h3>No answered questions yet</h3>
            <p>Be the first to ask! Your question and our educator&apos;s answer will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
