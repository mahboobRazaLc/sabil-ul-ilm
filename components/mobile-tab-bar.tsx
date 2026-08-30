"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface MobileTabBarProps {
  isLoggedIn: boolean;
}

const tabs = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Classes", href: "/classes", icon: "classes" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "Notes", href: "/notes", icon: "notes" },
];

function TabIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? "#d4a017" : "#94a3b8";
  switch (icon) {
    case "home":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "classes":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      );
    case "search":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "notes":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "profile":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}

export function MobileTabBar({ isLoggedIn }: MobileTabBarProps) {
  const pathname = usePathname();

  const allTabs = [
    ...tabs,
    {
      label: isLoggedIn ? "Profile" : "Sign In",
      href: isLoggedIn ? "/profile" : "/login",
      icon: "profile",
    },
  ];

  return (
    <nav className="mobile-tab-bar" aria-label="Mobile navigation">
      {allTabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`mobile-tab ${isActive ? "mobile-tab-active" : ""}`}
          >
            <TabIcon icon={tab.icon} active={isActive} />
            <span className="mobile-tab-label">{tab.label}</span>
          </Link>
        );
      })}
      {isLoggedIn && (
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mobile-tab"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="mobile-tab-label">Logout</span>
        </button>
      )}
    </nav>
  );
}
