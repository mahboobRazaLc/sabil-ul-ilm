/**
 * Shared video embed URL detection.
 * Returns the embed type and source URL for rendering.
 *
 * - YouTube: returns iframe embed via youtube-nocookie.com
 * - Vimeo: returns iframe embed via player.vimeo.com
 * - Direct file: returns the original URL for <video> element
 */

export type EmbedResult =
  | { type: "iframe"; src: string }
  | { type: "video"; src: string };

export function getEmbedUrl(url: string): EmbedResult {
  try {
    // YouTube detection
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (url.includes("watch?v=")) {
        videoId = new URL(url).searchParams.get("v") || "";
      } else if (url.includes("/embed/")) {
        videoId = url.split("/embed/")[1]?.split("?")[0] || "";
      }
      if (videoId) {
        return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` };
      }
    }

    // Vimeo detection
    if (url.includes("vimeo.com/")) {
      const parts = url.split("vimeo.com/");
      const videoId = parts[1]?.split("?")[0] || "";
      if (videoId && !isNaN(Number(videoId))) {
        return { type: "iframe", src: `https://player.vimeo.com/video/${videoId}` };
      }
    }

    // Direct file (e.g. /uploads/video/... or .mp4 / .webm)
    return { type: "video", src: url };
  } catch {
    return { type: "video", src: url };
  }
}
