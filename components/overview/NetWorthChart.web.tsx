// components/overview/NetWorthChart.web.tsx — Net-worth area chart (Recharts).

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SeriesPoint } from "@/lib/data";
import { formatCompact } from "@/components/shared/Money";
import { T } from "@/lib/tokens";

interface NetWorthChartProps {
  series: SeriesPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="cv-tooltip">
      <div className="label">{label}</div>
      <div className="value">{formatCompact(payload[0].value)}</div>
    </div>
  );
}

export default function NetWorthChart({ series }: NetWorthChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={180}>
      <AreaChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={T.invest} stopOpacity={0.28} />
            <stop offset="95%" stopColor={T.invest} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCompact(v)}
          tick={{ fontSize: 11, fill: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
          width={52}
          domain={["auto", "auto"]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--invest)"
          strokeWidth={2}
          fill="url(#nwGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "var(--invest)", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
