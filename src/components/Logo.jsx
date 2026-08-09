import React from "react";

export default function Logo({ size = 40, className = "" }) {
  const textSize = Math.round(size * 0.45);
  return (
    <div className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="img"
      >
        <title>Betegna</title>
        <desc>Map marker with check — Betegna logo</desc>
        <g>
          <path
            d="M24 3C15.1634 3 8 10.1634 8 19c0 7.9053 10.8409 20.8187 14.3093 24.4185a2 2 0 0 0 2.7814 0C29.1591 39.8187 40 26.9053 40 19 40 10.1634 32.8366 3 24 3z"
            fill="var(--logo-main, #16a34a)"
          />
          <circle cx="24" cy="19" r="6.5" fill="var(--logo-accent, #d1fae5)" />
          <path
            d="M19.5 19.5l3 3 6-6"
            stroke="var(--logo-foreground, #064e3b)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>

      <span
        style={{
          fontFamily: "Poppins, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
          fontWeight: 700,
          fontSize: textSize,
          color: "var(--logo-foreground, #064e3b)",
          lineHeight: 1,
        }}
      >
        Betegna
      </span>
    </div>
  );
}
