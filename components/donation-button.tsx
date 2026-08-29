"use client";

import { useState } from "react";

export function DonationButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="donation-nav-btn"
        aria-label="Support Us"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        <span>Support Us</span>
      </button>

      {open && (
        <div className="donation-overlay" onClick={() => setOpen(false)}>
          <div className="donation-modal" onClick={(e) => e.stopPropagation()}>
            <button className="donation-close" onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>

            <div className="donation-header">
              <div className="donation-icon">❤️</div>
              <h2 className="donation-title">Support Sabeel-ul-Ilm</h2>
              <p className="donation-sub">
                Your contribution helps us maintain and improve this platform for students of Dars-e-Nizami worldwide.
              </p>
            </div>

            <div className="donation-qr-wrap">
              <img
                src="/donation-qr.png"
                alt="Scan to Donate"
                className="donation-qr"
              />
              <p className="donation-qr-label">Scan QR Code to Donate</p>
            </div>

            <div className="donation-footer">
              <p className="donation-hadith">
                &ldquo;The best charity is that which is given when one is self-sufficient.&rdquo;
              </p>
              <p className="donation-hadith-ref">— Sahih al-Bukhari 1427</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
