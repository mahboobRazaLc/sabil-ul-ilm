"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  message: string;
  read: boolean;
  questionId: string | null;
  targetUrl: string | null;
  createdAt: Date;
};

function getNotificationIcon(message: string): { icon: string; color: string } {
  const lower = message.toLowerCase();
  if (lower.includes("pdf")) return { icon: "📄", color: "var(--gold-600)" };
  if (lower.includes("video")) return { icon: "🎥", color: "var(--green-700)" };
  if (lower.includes("lesson") || lower.includes("library")) return { icon: "📖", color: "var(--green-800)" };
  if (lower.includes("subject")) return { icon: "📚", color: "var(--green-900)" };
  if (lower.includes("answer") || lower.includes("teacher")) return { icon: "💬", color: "var(--gold-600)" };
  return { icon: "🔔", color: "var(--text-secondary)" };
}

function relativeTime(date: Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function markRead(notificationId: string, questionId: string | null, targetUrl: string | null) {
    const form = new FormData();
    form.set("notificationId", notificationId);
    await fetch("/api/notification-read", { method: "POST", body: form });
    setOpen(false);
    if (targetUrl) {
      router.push(targetUrl);
    } else if (questionId) {
      router.push(`/dashboard#question-${questionId}`);
    } else {
      router.refresh();
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications-mark-all-read", { method: "POST" });
    router.refresh();
  }

  return (
    <div ref={ref} className="notif-wrapper">
      <button
        onClick={() => setOpen(!open)}
        className="notif-bell"
        aria-label="Notifications"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-dropdown">
            <div className="notif-sheet-handle" />
            <div className="notif-dropdown-header">
              <span className="notif-dropdown-title">Notifications</span>
              <div className="notif-header-actions">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="notif-mark-all">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="notif-close" aria-label="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="notif-list">
                {notifications.map((n) => {
                  const { icon, color } = getNotificationIcon(n.message);
                  return (
                    <button
                      key={n.id}
                      className={`notif-item ${n.read ? "notif-item-read" : "notif-item-unread"}`}
                      onClick={() => markRead(n.id, n.questionId, n.targetUrl)}
                    >
                      <span className="notif-icon" style={{ color }}>{icon}</span>
                      <div className="notif-content">
                        <p className={`notif-message ${n.read ? "" : "notif-message-unread"}`}>
                          {n.message}
                        </p>
                        <span className="notif-time">{relativeTime(n.createdAt)}</span>
                      </div>
                      {!n.read && <span className="notif-dot" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
