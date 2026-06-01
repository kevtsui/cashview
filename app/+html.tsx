// app/+html.tsx — Web HTML shell. Loads Bliss tokens + fonts.
// Uses <link> for Google Fonts (more reliable than @import inside dangerouslySetInnerHTML).

import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const TOKEN_CSS = `
:root {
  --bg:#FAF7F2; --bg-raised:#FFFFFF; --bg-sunken:#F2EDE4; --bg-chip:#F4F0E8;
  --fg:#16110E; --fg-muted:#7A716A; --fg-subtle:#9B9289;
  --border:#DCD6CD; --border-subtle:#ECE7DE;
  --accent:#E5634A; --accent-hover:#C84F36; --accent-soft:#FFF1EB;
  --positive:#1F8A5B; --positive-soft:#E6F1EA;
  --negative:#C0382B; --negative-soft:#FAE7E3;
  --invest:#3C8C7E; --invest-soft:#E4F0ED;
  --gold-500:#D99A22;
  --font-sans:"Noto Sans JP",system-ui,-apple-system,sans-serif;
  --font-mono:"Geist Mono","SF Mono",ui-monospace,monospace;
  --radius-sm:6px; --radius-md:10px; --radius-lg:14px; --radius-pill:999px;
}

*, *::before, *::after { box-sizing: border-box; }

html, body { height: 100%; margin: 0; padding: 0; }

/* Expo Router wraps content in #root */
#root { height: 100%; display: flex; flex-direction: column; }

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--fg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Make sure RN Web root div fills height */
body > div, body > div > div { height: 100%; }

.tnum { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }

/* Recharts tooltip */
.cv-tooltip {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(22,17,14,.08);
}
.cv-tooltip .cv-label { color: var(--fg-muted); font-size: 11px; margin-bottom: 2px; letter-spacing: .04em; text-transform: uppercase; }
.cv-tooltip .cv-value { font-weight: 600; font-variant-numeric: tabular-nums; color: var(--fg); }

/* Spin keyframe for refresh icon */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.85s cubic-bezier(0.65,0,0.35,1); }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; border: 2px solid var(--bg); }
::-webkit-scrollbar-track { background: transparent; }

/* Recharts override: remove outline on svg */
.recharts-wrapper svg { outline: none; }

/* Mobile: collapse 2-col grids to single column */
@media (max-width: 640px) {
  .cv-grid-2 { grid-template-columns: 1fr !important; }
  .cv-grid-accounts { grid-template-columns: 1fr !important; }
}

/* Prevent iOS text size adjustment */
html { -webkit-text-size-adjust: 100%; }

/* Tap highlight removal on interactive elements */
button, a { -webkit-tap-highlight-color: transparent; }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover extends under iPhone notch; safe-area-inset-* push content clear */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>CashView</title>
        {/* PWA support */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CashView" />
        <meta name="theme-color" content="#E5634A" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        {/* Google Fonts via link tags — more reliable than @import in style block */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Noto+Sans+JP:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: TOKEN_CSS }} />
      </head>
      <body style={{ height: "100%" }}>
        {children}
      </body>
    </html>
  );
}
