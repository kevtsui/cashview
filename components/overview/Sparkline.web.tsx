// components/overview/Sparkline.web.tsx — Tiny 66×28 inline SVG sparkline.

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function Sparkline({ values, width = 66, height = 28, color = "var(--accent)" }: SparklineProps) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={pts.join(" ")} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
