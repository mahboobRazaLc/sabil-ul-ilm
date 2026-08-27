"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) return;

      setNavigating(true);
    };

    const handlePopState = () => {
      setNavigating(true);
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    setNavigating(false);
    setVisible(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!navigating) return;
    const timer = setTimeout(() => setVisible(true), 180);
    return () => clearTimeout(timer);
  }, [navigating]);

  if (!visible) return null;

  return (
    <div className="sabeel-nav-overlay" role="status" aria-label="Loading">
      <div className="sabeel-nav-spinner" />
    </div>
  );
}
