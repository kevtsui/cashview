// components/shared/Icon.web.tsx — SVG icon set from the design reference.
// Uses the exact same path data as the standalone HTML prototype.
// No external dependency — fully self-contained.

import React from "react";

const ICONS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5",
  "shopping-cart": "M2.5 3h2l2.2 11.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  utensils: "M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 12v9M18 3c-1.7 0-3 2-3 5s1 4 3 4v9",
  car: "M5 13l1.5-5A2 2 0 0 1 8.4 6.5h7.2a2 2 0 0 1 1.9 1.5L19 13m-14 0h14m-14 0v5h2v-2m10 2h2v-5m-12 2h2m6 0h2",
  baby: "M9 12a1 1 0 1 0 0-.01M15 12a1 1 0 1 0 0-.01M10 16c.8.7 3.2.7 4 0M12 3a4 4 0 0 0-4 4v1a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4ZM6 11v3a6 6 0 0 0 12 0v-3",
  zap: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  "shopping-bag": "M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 8Zm3 0V6a4 4 0 0 1 8 0v2",
  "heart-pulse": "M3.5 12H7l1.5-3 2.5 6 2-9 2 6 1.5-0H21M4 9a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 4-8 11-8 11",
  clapperboard: "M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Zm0 0 2-4h14l-2 4M9 4l-2 4m8-4-2 4",
  shield: "M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z",
  plane: "M12 21V10m0 0c-2-3-6-3-8-1 2-2 6-3 8 1Zm0 0c2-3 6-3 8-1-2-2-6-3-8 1Zm0 0c0-3 2-6 5-7-3-1-6 1-5 7Z",
  palmtree: "M12 21V10m0 0c-2-3-6-3-8-1 2-2 6-3 8 1Zm0 0c2-3 6-3 8-1-2-2-6-3-8 1Zm0 0c0-3 2-6 5-7-3-1-6 1-5 7Z",
  refresh: "M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5",
  plus: "M12 5v14M5 12h14",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chevron: "M9 6l6 6-6 6",
  "chevron-down": "M6 9l6 6 6-6",
  bell: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm3 9a3 3 0 0 0 6 0",
  wallet: "M3 7a2 2 0 0 1 2-2h12v3M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a2 2 0 0 1 2 2v2h-5a2 2 0 0 0 0 4h5",
  "trending-up": "M3 17l6-6 4 4 7-8M21 7h-5m5 0v5",
  "pie-chart": "M12 3v9l7 4A8.5 8.5 0 1 1 12 3Zm0 0a9 9 0 0 1 9 9h-9",
  "credit-card": "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 4h18",
  calendar: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 5h16M8 3v4m8-4v4",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0 .01",
  grid: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",
  check: "M5 12l5 5 9-11",
  building: "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M8 8h3M8 12h3M8 16h3M3 21h18",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
};

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  color?: string;
  style?: React.CSSProperties;
  fill?: string;
  className?: string;
}

export default function Icon({
  name,
  size = 18,
  stroke = 1.5,
  color = "currentColor",
  style = {},
  fill = "none",
  className,
}: IconProps) {
  const d = ICONS[name] ?? ICONS.wallet;
  // Some paths encode multiple subpaths separated by M — split and render each
  const paths = d.split("M").filter(Boolean).map((seg) => "M" + seg);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
      className={className}
    >
      {paths.map((path, i) => (
        <path key={i} d={path} />
      ))}
    </svg>
  );
}
