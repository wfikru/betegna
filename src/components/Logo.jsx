import React from "react";

export default function Logo({
  size = 44,
  className = "",
  showText = true,
  showAmharic = true,
  variant = "default" // "default" | "light" | "icon"
}) {
  const isLight = variant === "light";
  const textColor = isLight ? "#ffffff" : "#0f172a";
  const subColor = isLight ? "#a7f3d0" : "#059669";

  // Calculate text scale based on icon size
  const mainTextSize = Math.max(16, Math.round(size * 0.44));
  const amharicSize = Math.max(10, Math.round(size * 0.22));

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Modern Iconic Betegna Emblem (Home + Trusted Hand + Ascending Checkmark) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Betegna Logo"
        className="flex-shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Main Brand Emerald Gradient */}
          <linearGradient id="betegna-grad-main" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Accent Glow Green */}
          <linearGradient id="betegna-grad-accent" x1="14" y1="20" x2="34" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          {/* Golden Quality Accent */}
          <linearGradient id="betegna-grad-gold" x1="30" y1="8" x2="38" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Drop shadow filter */}
          <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#064e3b" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Outer Rounded Home Shield Container (Representing 'Bet' - Home & Safety) */}
        <path
          d="M24 4L7 16.5V36C7 39.866 10.134 43 14 43H34C37.866 43 41 39.866 41 36V16.5L24 4Z"
          fill="url(#betegna-grad-main)"
          filter="url(#logo-shadow)"
        />

        {/* Inner Subtle Architectural Silhouette */}
        <path
          d="M24 7.5L10 17.8V36C10 38.2 11.8 40 14 40H34C36.2 40 38 38.2 38 36V17.8L24 7.5Z"
          fill="#064e3b"
          fillOpacity="0.25"
        />

        {/* Dynamic Ascending Checkmark & Helpful Hand Ribbon (Representing Trusted Worker / Betegna) */}
        <path
          d="M16 26.5L21.5 32L33.5 20"
          stroke="url(#betegna-grad-accent)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 26.5L21.5 32L33.5 20"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Golden Spark / Quality Star (Ethiopian Pride & 5-Star Service) */}
        <circle cx="33.5" cy="14" r="3" fill="url(#betegna-grad-gold)" />
        <circle cx="33.5" cy="14" r="1.5" fill="#fffef0" />
      </svg>

      {/* Typography Section */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline gap-1.5">
            <span
              style={{
                fontSize: `${mainTextSize}px`,
                fontWeight: 800,
                color: textColor,
                letterSpacing: "-0.03em",
              }}
            >
              Betegna
            </span>
            {showAmharic && (
              <span
                style={{
                  fontSize: `${amharicSize}px`,
                  fontWeight: 700,
                  color: subColor,
                  letterSpacing: "0.02em",
                  paddingBottom: "1px",
                }}
              >
                ቤተኛ
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: `${Math.max(9, Math.round(size * 0.22))}px`,
              fontWeight: 600,
              color: isLight ? "rgba(255, 255, 255, 0.7)" : "#64748b",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginTop: "2px",
            }}
          >
            Home Services
          </span>
        </div>
      )}
    </div>
  );
}
