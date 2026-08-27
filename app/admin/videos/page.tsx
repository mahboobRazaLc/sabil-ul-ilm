import Link from "next/link";
import { deleteVideo, saveVideo } from "@/app/actions";
import { LangText } from "@/components/lang-text";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function getVideoSourceType(url: string): { label: string; icon: string; color: string } {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return { label: "YouTube", icon: "▶", color: "admin-vsrc-youtube" };
  }
  if (url.includes("vimeo.com")) {
    return { label: "Vimeo", icon: "▶", color: "admin-vsrc-vimeo" };
  }
  if (url.includes(".mp4") || url.includes(".webm") || url.includes(".ogg") || url.includes(".mov")) {
    return { label: "Direct File", icon: "🎬", color: "admin-vsrc-direct" };
  }
  return { label: "External", icon: "🔗", color: "admin-vsrc-external" };
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [videos, params] = await Promise.all([
    db.video.findMany({
      include: { book: { include: { class: true, subject: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    searchParams,
  ]);

  const publishedCount = videos.filter((v) => v.status === "PUBLISHED").length;
  const youtubeCount = videos.filter((v) => v.url.includes("youtube.com") || v.url.includes("youtu.be")).length;
  const vimeoCount = videos.filter((v) => v.url.includes("vimeo.com")).length;
  const directCount = videos.filter((v) => v.url.includes(".mp4") || v.url.includes(".webm") || v.url.includes(".ogg") || v.url.includes(".mov")).length;

  return (
    <main>
      {/* Premium Hero Header */}
      <div className="admin-videos-hero">
        <div className="admin-videos-hero-content">
          <div className="admin-videos-hero-badges">
            <span className="admin-videos-hero-badge admin-videos-hero-badge-gold">CONTENT</span>
            <span className="admin-videos-hero-badge admin-videos-hero-badge-light">🎬 Videos</span>
          </div>
          <h1 className="admin-videos-hero-title">Videos</h1>
          <p className="admin-videos-hero-sub">
            Manage existing video lessons. To add a video, create or edit a lesson and attach the video there.
          </p>
        </div>
        <div className="admin-videos-hero-stats">
          <div className="admin-videos-stat">
            <span className="admin-videos-stat-value">{videos.length}</span>
            <span className="admin-videos-stat-label">Total</span>
          </div>
          <div className="admin-videos-stat">
            <span className="admin-videos-stat-value">{publishedCount}</span>
            <span className="admin-videos-stat-label">Published</span>
          </div>
          <div className="admin-videos-stat">
            <span className="admin-videos-stat-value">{youtubeCount}</span>
            <span className="admin-videos-stat-label">YouTube</span>
          </div>
          <div className="admin-videos-stat">
            <span className="admin-videos-stat-value">{vimeoCount + directCount}</span>
            <span className="admin-videos-stat-label">Other</span>
          </div>
        </div>
      </div>

      <div className="admin-videos-hero-actions">
        <Link href="/admin/books" className="button">
          Go to Lessons →
        </Link>
      </div>

      {params.notice && (
        <p className="notice" role="status">
          {params.notice}
        </p>
      )}

      {/* Videos List */}
      <div className="admin-videos-panel">
        <div className="admin-videos-header">
          <h2 className="admin-videos-section-title">All Video Lessons</h2>
          <span className="admin-videos-count">{videos.length}</span>
        </div>

        {videos.length ? (
          <div className="admin-videos-list">
            {videos.map((item) => {
              const source = getVideoSourceType(item.url);
              return (
                <article className="admin-video-card" key={item.id}>
                  <div className="admin-video-card-top">
                    <div className="admin-video-thumb">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} />
                      ) : (
                        <span className="admin-video-thumb-icon">▶</span>
                      )}
                    </div>

                    <div className="admin-video-info">
                      <div className="admin-video-name-row">
                        <h3 className="admin-video-name"><LangText>{item.title}</LangText></h3>
                        <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                      </div>

                      <p className="admin-video-desc"><LangText>{item.description || "No description provided."}</LangText></p>

                      <div className="admin-video-meta">
                        {item.book ? (
                          <>
                            <span className="admin-video-meta-item">📖 <LangText>{item.book.title}</LangText></span>
                            <span className="admin-video-meta-item">🏫 <LangText>{item.book.class.name}</LangText></span>
                            {item.book.subject && (
                              <span className="admin-video-meta-item">📋 <LangText>{item.book.subject.name}</LangText></span>
                            )}
                          </>
                        ) : (
                          <span className="admin-video-meta-item admin-video-meta-general">🎥 General (not linked to a lesson)</span>
                        )}
                      </div>

                      <div className="admin-video-source-row">
                        <span className={`admin-video-source ${source.color}`}>
                          {source.icon} {source.label}
                        </span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="admin-video-link">
                          ↗ Open Source
                        </a>
                        <Link href={`/videos/${item.id}`} className="admin-video-link">
                          ▶ Watch
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="admin-video-actions">
                    <details>
                      <summary className="admin-video-btn admin-video-btn-edit">✏ Edit</summary>
                      <div className="admin-video-edit-form">
                        <form action={saveVideo} className="form-grid compact">
                          <input type="hidden" name="id" value={item.id} />
                          <label>
                            Title
                            <input name="title" defaultValue={item.title} required />
                          </label>
                          <label>
                            Video URL
                            <input
                              name="url"
                              type="url"
                              defaultValue={item.url.includes(".mp4") || item.url.includes(".webm") || item.url.includes(".ogg") || item.url.includes(".mov") ? "" : item.url}
                            />
                          </label>
                          <label>
                            Replace Video File
                            <input
                              name="video"
                              type="file"
                              accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            />
                          </label>
                          <label>
                            Replace Thumbnail
                            <input
                              name="thumbnail"
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                            />
                          </label>
                          <label>
                            Status
                            <select name="status" defaultValue={item.status}>
                              <option value="DRAFT">DRAFT</option>
                              <option value="PUBLISHED">PUBLISHED</option>
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
                        <form action={deleteVideo} style={{ marginTop: 12 }}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="danger" type="submit">
                            Delete Video
                          </button>
                        </form>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="admin-videos-empty">
            <div className="admin-videos-empty-icon">🎬</div>
            <h3>No videos yet</h3>
            <p>Go to Lessons to create a lesson with a video attached.</p>
            <Link href="/admin/books" className="button" style={{ marginTop: 12 }}>
              Go to Lessons
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
