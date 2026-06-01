# Handoff: CashView — Household Command Center

## Overview
CashView is a household personal-finance dashboard for the **KFJN household** (members Kevin & Flora). It aggregates accounts from **Chase** and **Morgan Stanley** (via Plaid) and presents cash position, spending, investments, debt, net-worth trend, budgets/goals, and upcoming bills. This handoff covers the **finalized direction: "Command Center"** — a left-sidebar, multi-column, data-dense dashboard — in **light mode**.

The longer-term goal is a full household finance app. This dashboard is the home screen; v1 wires up **cash**, then layers in **spending → investments → debt → planning**.

## About the design files
The files in this bundle are **design references created in HTML/React-via-Babel** — a working prototype showing the intended look, layout, and behavior. They are **not production code to ship directly**. The task is to **recreate this design inside your existing app's environment** (its framework, component library, styling system, data layer), following its established patterns. If the project has no front-end environment yet, pick the most appropriate framework and implement there. The HTML is the source of truth for *appearance and interaction*, not for *architecture*.

The prototype uses inline-style React components and a small set of hand-rolled chart primitives so it runs with no build step. In your codebase you'll likely replace these with your charting lib (Recharts/visx/etc.) and your styling system (Tailwind/CSS-modules/etc.).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, and interactions are all specified below and in `cashview/tokens.css`. Recreate pixel-faithfully using your codebase's libraries. Numbers and names (KFJN, Kevin, Flora, all balances/transactions) are **realistic placeholders** — replace with live Plaid data.

---

## Layout (app shell)
- Full-viewport flex row. **Left sidebar** (fixed 230px) + **main column** (fills remainder, scrolls internally).
- Page background `--bg` (#FAF7F2 warm paper). Cards are `--bg-raised` (#FFFFFF) with a 1px `--border` hairline and `--radius-lg` (14px) corners. **Prefer borders over shadows** — most cards have no shadow.
- **Responsive:** below **880px** viewport width, the sidebar is replaced by a horizontal pill **tab bar** pinned to the top of the main column, and all multi-column grids collapse to a single column. The breakpoint is read from `window.innerWidth` via a resize listener.

### Sidebar (desktop, 230px)
- Top: brand lockup — a 30px coral (`--accent`) rounded square (radius 9px) containing a wallet icon, then wordmark "CashView" (16px, weight 700, letter-spacing -0.02em).
- Nav list (items 9px gap, each `9px 11px` padding, radius 9px): **Overview, Accounts, Spending, Investments, Goals**. Each row = leading 17px outline icon + 14px label. Active row: background `--bg-chip` (#F4F0E8), label weight 600, icon tinted `--accent`. Inactive: label `--fg-muted`, icon `--fg-subtle`, weight 500.
- Bottom (pinned, separated by 1px `--border-subtle`): overlapping member avatars + "KFJN" (13px/600) over "Household" (11.5px `--fg-muted`).

### Top bar (main column header)
- Left: page title (capitalized nav name, 28px/600, tracking -0.02em) + sub-line "May 2026 · synced {timestamp}" (13px `--fg-muted`).
- Right: **Refresh** ghost button (1px border, 13px/600, leading refresh icon that spins 360° for 850ms on click) and **Add account** primary button (coral fill, white text, leading + icon).

---

## Screens / views (sidebar nav)
All views render in the main column under the top bar. Nav switching is client-side state (no route change required, but you may map each to a route).

### 1) Overview (default)
- **KPI strip** — responsive grid `repeat(auto-fit, minmax(168px, 1fr))` (2-up on mobile). Four cards:
  - **Total cash** — $84,870, badge "+$1,420 (30d)" (positive), red/coral sparkline.
  - **Net worth** — $362,217, badge "+5.2% (12mo)" (positive), teal sparkline.
  - **Investments** — $280,631 (value tinted `--invest` teal), badge "+0.74% today".
  - **Card debt** — −$3,284 (tinted `--negative`), badge "due Jun 14".
  - Each KPI card: eyebrow label (uppercase, 11px, tracked), big tabular number (~23px/600), 66×28 sparkline at top-right, badge below.
- **Net worth chart row** — 1.6fr / 1fr grid. Left: "Net worth · Last 12 months" card with a filled **area chart** (teal `--invest`, hover crosshair + tooltip, dashed gridlines, axis labels in mono). Right: "Spending by category" card with a **donut** (center shows total spent) + a 5-row legend (color dot · label · amount).
- **Lower row** — 1.4fr / 1fr grid. Left: "Accounts" card listing top 5 non-debt accounts (institution mark + name + masked number + balance), with a "View all →" link that navigates to Accounts. Right: "Upcoming bills" card (calendar icon + label + due date/auto + amount).

### 2) Accounts
- Three grouped cards: **Cash**, **Investments**, **Credit & debt**. Each card header shows the group label + group total (debt total tinted `--negative`).
- Row = 34px institution mark (Chase = blue "C", Morgan Stanley = navy "MS") + name + "{institution} ····{mask} · {owner}" + a status badge (apy / "+x% today" / apr) + balance (17px/600). Rows separated by 1px `--border-subtle`.

### 3) Spending
- **Row 1** (1fr/1fr): "Monthly spending" card with a **column chart** (trailing 12 months, last bar highlighted coral) + "Budget vs actual" card with up to 6 category rows, each a label + "spent / budget" + progress bar (`--negative` fill when over budget).
- **Transactions** card — full list. Row = 34px square merchant monogram (chip bg) + merchant + "{category} · {institution} ····{mask}" + owner avatar (desktop) + date + amount (income shown positive in `--positive`).

### 4) Investments
- **Row 1** (1fr/1fr): "Total invested" card ($280,631 in `--invest`, badges "+$2,074 today" / "+14.6% YTD", small area chart) + "Allocation" card (donut + legend: US equities, Intl equities, Bonds, Cash & other).
- **Investment accounts** card — Morgan Stanley Brokerage + Joint IRA, each with a "+x% today" badge and balance.

### 5) Goals
- 3-column grid (1-col on mobile) of goal cards. Each: 40px rounded tinted icon, goal name (16px/600), "saved of target" (tabular), progress bar in the goal's color, footer row "{pct}% funded" + "{remaining} to go".
- Goals: Emergency fund ($40k/$50k), Japan trip ($6.2k/$12k), Home down payment ($118k/$200k).

---

## Interactions & behavior
- **Nav switching:** clicking a sidebar/tab item swaps the main view (state: `nav`). Title updates to match.
- **Refresh:** spins the icon (CSS `spin` keyframes, 850ms, `--ease-in-out`) and sets the synced timestamp to "just now". In production: trigger a Plaid balance/transactions refresh.
- **Area chart hover:** mouse over plots a vertical crosshair + dot at the nearest month and shows a tooltip (value + month).
- **Hover states (per Bliss):** card border darkens one step on hover (no scale); buttons darken `--accent` → `--accent-hover`; 120ms transitions.
- **Responsive:** single resize listener at 880px toggles sidebar ↔ top tab bar and 4/2-col ↔ 1-col grids.
- **No bouncy motion.** Easing `--ease-out` for entries, `--ease-in-out` for state changes; durations 120/200/320ms.

## State management
- `nav` — active view: `'overview' | 'accounts' | 'spending' | 'investments' | 'goals'`.
- `narrow` — boolean, `window.innerWidth < 880`.
- `spin` — refresh animation in-flight.
- `stamp` — last-synced label.
- **Data:** a single household model — see `cashview/data.js` for the exact shape: `members[]`, `accounts[]` (grouped `cash | invest | debt`), `totals` (cash / invest / debt / netWorth), `netWorthSeries[]`, `cashSeries[]`, `categories[]` (spent + budget), `spendTrend[]`, `tx[]`, `goals[]`, `bills[]`. In production this comes from Plaid (balances, transactions, investment holdings) keyed per member/account.

## Design tokens (light mode)
Full source of truth: `cashview/tokens.css`. Key semantic values:

| Token | Value | Use |
|---|---|---|
| `--bg` | #FAF7F2 | page background (warm paper) |
| `--bg-raised` | #FFFFFF | cards |
| `--bg-chip` / `--bg-sunken` | #F4F0E8 / #F2EDE4 | chips, wells, active nav |
| `--fg` | #16110E | primary text (warm near-black) |
| `--fg-muted` / `--fg-subtle` | #7A716A / #9B9289 | secondary / tertiary text |
| `--border` / `--border-subtle` | #DCD6CD / #ECE7DE | hairlines / inner dividers |
| `--accent` / `--accent-hover` | #E5634A / #C84F36 | coral — buttons, brand, focus |
| `--positive` | #1F8A5B | gains, income |
| `--negative` | #C0382B | debt, over-budget |
| `--invest` | #3C8C7E | investments (teal) |
| `--gold-500` | #D99A22 | sparing highlight only |

- **Type:** Noto Sans JP (300–800) for everything; Geist Mono for numeric axis/labels. Tabular figures (`font-variant-numeric: tabular-nums`) on all money. Both load from Google Fonts in `tokens.css`.
- **Radii:** badges 999px (pill), inputs 6px, buttons/small cards 10px, cards 14px, feature/KPI 14–20px.
- **Spacing:** 8px base / 4px micro; card padding 18–24px, row padding ~12–18px.
- **Shadows:** mostly none; `--shadow-sm` on the segmented control only.
- **A warm dark theme** also exists (`[data-theme="dark"]` in `tokens.css`) if you want a toggle later — the finalized app locks to light.

## Assets
- **No raster/image assets required.** Institution marks are CSS monogram tiles (Chase `#117ACA` "C"; Morgan Stanley `#00264C` "MS"). Member avatars are colored initial circles.
- **Icons:** a small inline-SVG set (1.5px outline stroke) lives in `cashview/shared.jsx` (`ICONS` map + `<Icon>`). These mirror **Lucide** silhouettes per the Bliss system — in your codebase use the real **Lucide** icon package instead (names: grid, building, pie-chart, trending-up, target, wallet, refresh, plus, calendar, credit-card, list, etc.).
- Charts (sparkline, area, donut, columns) are hand-rolled SVG in `shared.jsx` — replace with your charting library, matching colors/behavior above.

## Files in this bundle
- `CashView - Command Center.html` — the finalized prototype (open in a browser to interact).
- `cashview/tokens.css` — all design tokens (light + dark), font imports, base resets.
- `cashview/data.js` — household data model (shape + placeholder values).
- `cashview/shared.jsx` — primitives: `Money`, `Icon`/`ICONS`, `InstMark`, `Avatar`, `Badge`, `Bar`, `Sparkline`, `AreaChart`, `Donut`, `Columns`, `Card`, formatters.
- `cashview/directionB.jsx` — the Command Center: sidebar, top bar, and the 5 views.
- `cashview/finalize.jsx` — entry point (locks theme to light, mounts the dashboard).
