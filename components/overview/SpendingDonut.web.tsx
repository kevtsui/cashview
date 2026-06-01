// components/overview/SpendingDonut.web.tsx — Spending donut chart (Recharts).

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Category } from "@/lib/data";
import { formatMoney, formatCompact } from "@/components/shared/Money";

interface SpendingDonutProps {
  categories: Category[];
  total: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="cv-tooltip">
      <div className="label">{d.label}</div>
      <div className="value">{formatMoney(d.spent, false)}</div>
    </div>
  );
}

export default function SpendingDonut({ categories, total }: SpendingDonutProps) {
  const top5 = [...categories].sort((a, b) => b.spent - a.spent).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Donut */}
      <div style={{ position: "relative", height: 180 }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={80}
              dataKey="spent"
              strokeWidth={0}
              paddingAngle={2}
            >
              {categories.map((c) => (
                <Cell key={c.id} fill={c.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <span style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 500 }}>spent</span>
          <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--fg)", letterSpacing: "-0.02em" }}>
            {formatCompact(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {top5.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: c.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: "var(--fg)" }}>{c.label}</span>
            <span style={{ color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
              {formatMoney(c.spent, false)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
