import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { ShareButtons } from "@/components/share-buttons";
import { getFileUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = await db.note.findUnique({
    where: { slug },
    select: { title: true, description: true, slug: true },
  });
  if (!note) return { title: "Note Not Found — Sabeel-ul-Ilm" };

  const desc = note.description || `Download ${note.title} — a free educational PDF note for Dars-e-Nizami studies on Sabeel-ul-Ilm.`;

  return {
    title: `${note.title} — Sabeel-ul-Ilm`,
    description: desc,
    alternates: { canonical: `/notes/${note.slug}` },
    openGraph: {
      title: `${note.title} — Sabeel-ul-Ilm`,
      description: desc,
      type: "article",
    },
  };
}

export default async function NoteDetailPage({ params }: Props) {
  const { slug } = await params;
  const note = await db.note.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, pdfUrl: true, pdfFileName: true, description: true, createdAt: true },
  });

  if (!note) notFound();

  const pdfUrl = await getFileUrl(note.pdfUrl);

  return (
    <main className="public">
      <Navbar active="notes" />

      {/* Breadcrumb */}
      <nav className="note-breadcrumb">
        <Link href="/notes">Notes</Link>
        <span className="note-breadcrumb-sep">›</span>
        <span>{note.title}</span>
      </nav>

      {/* Header */}
      <div className="note-detail-header">
        <h1 className="note-detail-title">{note.title}</h1>
        {note.description && (
          <p className="note-detail-desc">{note.description}</p>
        )}
        <div className="note-detail-meta">
          <span className="note-detail-meta-item">📄 PDF Document</span>
          <span className="note-detail-meta-item">📅 {note.createdAt.toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="note-detail-actions">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="note-detail-action-btn note-detail-action-primary"
          >
            📖 Read PDF
          </a>
          <a
            href={pdfUrl}
            download={note.pdfFileName}
            className="note-detail-action-btn note-detail-action-secondary"
          >
            ⬇ Download PDF
          </a>
          <Link
            href="/notes"
            className="note-detail-action-btn note-detail-action-secondary"
          >
            ← Back to Notes
          </Link>
        </div>

        <ShareButtons
          url={`${process.env.AUTH_URL || "https://sabil-ul-ilm.vercel.app"}/notes/${note.slug}`}
          title={`${note.title} | Sabeel-ul-Ilm`}
        />
      </div>

      {/* PDF Viewer */}
      <div className="note-pdf-container">
        <div className="note-pdf-label">
          📄 {note.pdfFileName}
        </div>
        <iframe
          src={pdfUrl}
          className="note-pdf-viewer"
          title={note.title}
        />
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: note.title,
            description: note.description || `Educational PDF note: ${note.title}`,
            provider: { "@type": "Organization", name: "Sabeel-ul-Ilm" },
            datePublished: note.createdAt.toISOString(),
            educationalLevel: "Dars-e-Nizami",
            learningResourceType: "PDF Note",
          }),
        }}
      />
    </main>
  );
}
