// components/overview/SpendingDonut.web.tsx — Spending donut chart (Recharts).
// Slices are clickable — onCategoryClick fires with the category id.

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import type { Category } from "@/lib/data";
import { formatMoney, formatCompact } from "@/components/shared/Money";

interface SpendingDonutProps {
  categories: Category[];
  total: number;
  onCategoryClick?: (categoryId: string) => void;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="cv-tooltip">
      <div className="cv-label">{d.label}</div>
      <div className="cv-value">{formatMoney(d.spent, false)}</div>
    </div>
  );
}

export default function SpendingDonut({ categories, total, onCategoryClick }: SpendingDonutProps) {
  const top5 = [...categories].sort((a, b) => b.spent - a.spent).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Donut */}
      <div style={{ position: "relative", height: 180 }}>
        <PieChart width={180} height={180} style={{ margin: "0 auto" }}>
          <Pie
            data={categories}
            cx={85}
            cy={85}
            innerRadius={52}
            outerRadius={78}
            dataKey="spent"
            strokeWidth={0}
            paddingAngle={2}
            onClick={onCategoryClick ? (data) => onCategoryClick(data.id) : undefined}
            style={{ cursor: onCategoryClick ? "pointer" : "default" }}
          >
            {categories.map((c) => (
              <Cell key={c.id} fill={c.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
        {/* Center label */}
        <div style={{
          position: "absolute",
          top: 0, left: "50%", transform: "translateX(-50%)",
          width: 180, height: 180,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <span style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 500 }}>spent</span>
          <span style={{ fontSize: 17, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--fg)" }}>
            {formatCompact(total)}
          </span>
        </div>
      </div>

      {/* Legend — clickable */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {top5.map((c) => (
          <div
            key={c.id}
            onClick={() => onCategoryClick?.(c.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, fontSize: 13,
              cursor: onCategoryClick ? "pointer" : "default",
              borderRadius: 6, padding: "2px 4px", margin: "-2px -4px",
              transition: "background 120ms",
            }}
            onMouseEnter={(e) => { if (onCategoryClick) (e.currentTarget as HTMLElement).style.background = "var(--bg-chip)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: c.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: "var(--fg)" }}>{c.label}</span>
            <span style={{ color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
              {formatMoney(c.spent, false)}
            </span>
            {onCategoryClick && <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
