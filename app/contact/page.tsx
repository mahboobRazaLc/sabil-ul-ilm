import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { getOptionalUser } from "@/lib/auth/authorization";
import { submitQuestion } from "@/app/actions";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact Us — Sabeel-ul-Ilm",
  description: "Get in touch with the Sabeel-ul-Ilm team. Send questions, feedback, or inquiries about our Islamic education platform.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [user, params] = await Promise.all([getOptionalUser(), searchParams]);

  return (
    <main className="public">
      <Navbar active="contact" />

      <div className="c-hero">
        <div className="c-hero-inner">
          <div className="c-hero-icon">&#9993;</div>
          <div className="c-hero-text">
            <p className="c-hero-eyebrow">GET IN TOUCH</p>
            <h1 className="c-hero-title">Contact Us</h1>
            <p className="c-hero-desc">
              Have questions about the curriculum, need technical support, or want to collaborate? Reach out to our team.
            </p>
          </div>
        </div>
      </div>

      {params.notice && (
        <div className="c-notice" role="status">
          {params.notice}
        </div>
      )}

      <div className="c-grid">
        <div className="c-form-card">
          <div className="c-form-header">
            <div className="c-form-header-icon">&#9998;</div>
            <h2 className="c-form-header-title">Send a Message</h2>
          </div>
          <p className="c-form-header-desc">
            Fill out the form below and we will get back to you as soon as possible.
          </p>

          <form action={submitQuestion} className="c-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="returnUrl" value="/contact" />

            <div>
              <label className="c-form-label">
                Your Name <span className="required">*</span>
              </label>
              <input
                name="name"
                required
                defaultValue={user?.name || ""}
                placeholder="Full name"
                className="c-form-input"
              />
            </div>

            <div>
              <label className="c-form-label">
                Your Email <span className="required">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue={user?.email || ""}
                placeholder="you@example.com"
                className="c-form-input"
              />
            </div>

            <div className="full">
              <label className="c-form-label">
                Message <span className="required">*</span>
              </label>
              <textarea
                name="question"
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                placeholder="How can we help you? Include details about your question or feedback..."
                className="c-form-textarea"
              />
            </div>

            <div className="c-form-submit">
              <button className="c-form-submit-btn" type="submit">
                Send Message
              </button>
            </div>
          </form>
        </div>

        <div className="c-info-card">
          <div className="c-info-header">
            <div className="c-info-header-icon">&#128205;</div>
            <h2>Contact Information</h2>
          </div>

          <div className="c-info-list">
            <div className="c-info-item">
              <div className="c-info-item-icon">&#128231;</div>
              <div className="c-info-item-content">
                <strong>Email</strong>
                mahboobrazaaa@gmail.com
              </div>
            </div>

            <div className="c-info-item">
              <div className="c-info-item-icon">&#128205;</div>
              <div className="c-info-item-content">
                <strong>Location</strong>
                Online Platform — Accessible Worldwide
              </div>
            </div>

            <div className="c-info-item">
              <div className="c-info-item-icon">&#128336;</div>
              <div className="c-info-item-content">
                <strong>Response Time</strong>
                We typically respond within 24-48 hours
              </div>
            </div>

            <div className="c-info-item">
              <div className="c-info-item-icon">&#128218;</div>
              <div className="c-info-item-content">
                <strong>Curriculum Support</strong>
                For questions about specific lessons or subjects, use the Ask Teacher feature within each class.
              </div>
            </div>
          </div>

          <div className="c-info-cta">
            <Link href="/classes" className="c-info-cta-link">
              Browse classes &amp; ask teacher &#8594;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
