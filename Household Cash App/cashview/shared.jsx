/* global React */
/* Household CashView — shared primitives, icons, charts. */
const { useState, useRef, useEffect, useMemo, createContext, useContext } = React;

/* ---------- formatting ---------- */
const fmtUSD = (n, opts = {}) => {
  const { cents = true, sign = false } = opts;
  const v = Math.abs(n);
  const s = v.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  const pre = n < 0 ? '\u2212' : (sign && n > 0 ? '+' : '');
  return pre + '$' + s;
};
const fmtCompact = (n) => {
  const v = Math.abs(n); const sign = n < 0 ? '\u2212' : '';
  if (v >= 1000) return sign + '$' + (v / 1000).toFixed(v >= 100000 ? 0 : 1) + 'k';
  return sign + '$' + v.toFixed(0);
};

/* ---------- Money (split dollars / cents) ---------- */
function Money({ value, size = 32, cents = true, weight = 600, color, muted, className = '' }) {
  const neg = value < 0;
  const abs = Math.abs(value);
  const whole = Math.floor(abs).toLocaleString('en-US');
  const frac = Math.round((abs - Math.floor(abs)) * 100).toString().padStart(2, '0');
  return (
    <span className={'tnum ' + className} style={{ fontWeight: weight, color: color || 'inherit', letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
      {neg && <span style={{ marginRight: 1 }}>{'\u2212'}</span>}
      <span style={{ fontSize: size * 0.62, verticalAlign: 'top', marginRight: 1, opacity: 0.8 }}>$</span>
      <span style={{ fontSize: size }}>{whole}</span>
      {cents && <span style={{ fontSize: size * 0.5, opacity: muted ? 0.55 : 0.7, marginLeft: 1 }}>.{frac}</span>}
    </span>
  );
}

/* ---------- Icon set (1.5px outline) ---------- */
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5',
  'shopping-cart': 'M2.5 3h2l2.2 11.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  utensils: 'M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 12v9M18 3c-1.7 0-3 2-3 5s1 4 3 4v9',
  car: 'M5 13l1.5-5A2 2 0 0 1 8.4 6.5h7.2a2 2 0 0 1 1.9 1.5L19 13m-14 0h14m-14 0v5h2v-2m10 2h2v-5m-12 2h2m6 0h2',
  baby: 'M9 12a1 1 0 1 0 0-.01M15 12a1 1 0 1 0 0-.01M10 16c.8.7 3.2.7 4 0M12 3a4 4 0 0 0-4 4v1a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4ZM6 11v3a6 6 0 0 0 12 0v-3',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  'shopping-bag': 'M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 8Zm3 0V6a4 4 0 0 1 8 0v2',
  'heart-pulse': 'M3.5 12H7l1.5-3 2.5 6 2-9 2 6 1.5-0H21M4 9a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 4-8 11-8 11',
  clapperboard: 'M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Zm0 0 2-4h14l-2 4M9 4l-2 4m8-4-2 4',
  shield: 'M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z',
  palmtree: 'M12 21V10m0 0c-2-3-6-3-8-1 2-2 6-3 8 1Zm0 0c2-3 6-3 8-1-2-2-6-3-8 1Zm0 0c0-3 2-6 5-7-3-1-6 1-5 7Z',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  chevron: 'M9 6l6 6-6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm3 9a3 3 0 0 0 6 0',
  wallet: 'M3 7a2 2 0 0 1 2-2h12v3M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a2 2 0 0 1 2 2v2h-5a2 2 0 0 0 0 4h5',
  'trending-up': 'M3 17l6-6 4 4 7-8M21 7h-5m5 0v5',
  'pie-chart': 'M12 3v9l7 4A8.5 8.5 0 1 1 12 3Zm0 0a9 9 0 0 1 9 9h-9',
  'credit-card': 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 4h18',
  calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 5h16M8 3v4m8-4v4',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0 .01',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8.5 3a8.5 8.5 0 0 0-.2-1.8l2-1.5-2-3.4-2.3 1a7 7 0 0 0-3-1.8L14.5 2h-5l-.5 2.7a7 7 0 0 0-3 1.8l-2.3-1-2 3.4 2 1.5a8.5 8.5 0 0 0 0 3.6l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 3 1.8L9.5 22h5l.5-2.7a7 7 0 0 0 3-1.8l2.3 1 2-3.4-2-1.5c.1-.6.2-1.2.2-1.8Z',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  check: 'M5 12l5 5 9-11',
  building: 'M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M8 8h3M8 12h3M8 16h3M3 21h18',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01'
};
function Icon({ name, size = 18, stroke = 1.5, color = 'currentColor', style = {}, fill = 'none' }) {
  const d = ICONS[name] || ICONS.wallet;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}

/* ---------- institution mark ---------- */
const INST = {
  Chase: { bg: '#117ACA', fg: '#fff', label: 'C' },
  'Morgan Stanley': { bg: '#00264C', fg: '#fff', label: 'MS' }
};
function InstMark({ inst, size = 36, radius = 9 }) {
  const m = INST[inst] || { bg: 'var(--ink-700)', fg: '#fff', label: inst.slice(0, 1) };
  return (
    <span style={{ width: size, height: size, borderRadius: radius, background: m.bg, color: m.fg,
      display: 'grid', placeItems: 'center', fontWeight: 700, flexShrink: 0,
      fontSize: m.label.length > 1 ? size * 0.34 : size * 0.46, letterSpacing: '-0.02em' }}>{m.label}</span>
  );
}

/* ---------- Avatar ---------- */
function Avatar({ member, size = 28, ring }) {
  return (
    <span title={member.name} style={{ width: size, height: size, borderRadius: '50%', background: member.color,
      color: '#fff', display: 'grid', placeItems: 'center', fontSize: size * 0.42, fontWeight: 600,
      flexShrink: 0, boxShadow: ring ? '0 0 0 2px var(--bg-raised)' : 'none' }}>{member.initials}</span>
  );
}

/* ---------- Badge ---------- */
function Badge({ tone = 'neutral', children, soft = true }) {
  const map = {
    positive: ['var(--positive-soft)', 'var(--positive)'],
    negative: ['var(--negative-soft)', 'var(--negative)'],
    accent: ['var(--accent-soft)', 'var(--accent)'],
    neutral: ['var(--bg-chip)', 'var(--fg-muted)'],
    invest: ['var(--invest-soft)', 'var(--invest)']
  };
  const [bg, fg] = map[tone] || map.neutral;
  return (
    <span className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px',
      borderRadius: 999, background: soft ? bg : 'transparent', color: fg, fontSize: 12, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

/* ---------- Progress bar ---------- */
function Bar({ pct, color = 'var(--accent)', track = 'var(--bg-chip)', height = 8, over }) {
  const w = Math.min(100, Math.max(0, pct));
  return (
    <div style={{ background: track, borderRadius: 999, height, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: w + '%', height: '100%', background: over ? 'var(--negative)' : color, borderRadius: 999,
        transition: 'width 600ms var(--ease-out)' }} />
    </div>
  );
}

/* ---------- Sparkline ---------- */
function Sparkline({ values, color = 'var(--accent)', w = 80, h = 26, fill = false }) {
  const max = Math.max(...values), min = Math.min(...values);
  const x = i => (i / (values.length - 1)) * w;
  const y = v => h - ((v - min) / (max - min || 1)) * (h - 3) - 1.5;
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const id = useMemo(() => 'sl' + Math.random().toString(36).slice(2), []);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      {fill && <>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" /><stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient></defs>
        <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#${id})`} />
      </>}
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Area chart (responsive, animated, hover tooltip) ---------- */
function AreaChart({ series, color = 'var(--accent)', height = 220, valueFmt = fmtCompact, showAxis = true }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(640);
  const [hi, setHi] = useState(null);
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(wrapRef.current); return () => ro.disconnect();
  }, []);
  const padL = showAxis ? 4 : 0, padR = 4, padT = 12, padB = showAxis ? 22 : 6;
  const innerW = w - padL - padR, innerH = height - padT - padB;
  const vals = series.map(s => s.value);
  const max = Math.max(...vals), min = Math.min(...vals);
  const lo = min - (max - min) * 0.15, range = max - lo || 1;
  const X = i => padL + (i / (series.length - 1)) * innerW;
  const Y = v => padT + innerH - ((v - lo) / range) * innerH;
  const pts = series.map((s, i) => [X(i), Y(s.value)]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L ${X(series.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${padL} ${(padT + innerH).toFixed(1)} Z`;
  const id = useMemo(() => 'ar' + Math.random().toString(36).slice(2), []);
  const onMove = e => {
    const r = wrapRef.current.getBoundingClientRect();
    const rel = (e.clientX - r.left - padL) / innerW;
    setHi(Math.max(0, Math.min(series.length - 1, Math.round(rel * (series.length - 1)))));
  };
  return (
    <div ref={wrapRef} style={{ width: '100%', position: 'relative' }}
      onMouseMove={onMove} onMouseLeave={() => setHi(null)}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.20" /><stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient></defs>
        {showAxis && [0, 0.5, 1].map((t, i) => {
          const yv = lo + range * (1 - t) - (range * 0.075);
          const yy = padT + innerH * t;
          return <g key={i}>
            <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 4" />
            <text x={w - padR} y={yy - 4} textAnchor="end" fontSize="10.5" fill="var(--fg-subtle)" fontFamily="var(--font-mono)">{valueFmt(yv)}</text>
          </g>;
        })}
        <path d={area} fill={`url(#${id})`} style={{ transition: 'd 400ms var(--ease-out)' }} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        {hi != null && <>
          <line x1={pts[hi][0]} y1={padT} x2={pts[hi][0]} y2={padT + innerH} stroke="var(--border-strong)" strokeWidth="1" />
          <circle cx={pts[hi][0]} cy={pts[hi][1]} r="4.5" fill="var(--bg-raised)" stroke={color} strokeWidth="2.5" />
        </>}
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={color} />
        {showAxis && series.map((s, i) => (i % 2 === 0 || i === series.length - 1) &&
          <text key={i} x={X(i)} y={height - 5} textAnchor="middle" fontSize="10.5" fill="var(--fg-subtle)" fontFamily="var(--font-sans)">{s.month}</text>)}
      </svg>
      {hi != null && (
        <div className="tnum" style={{ position: 'absolute', top: 0, left: Math.min(Math.max(pts[hi][0] - 50, 0), w - 100),
          background: 'var(--fg)', color: 'var(--bg-raised)', padding: '6px 10px', borderRadius: 8, fontSize: 12,
          fontWeight: 600, pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)' }}>
          {fmtUSD(series[hi].value, { cents: false })}<span style={{ opacity: 0.6, fontWeight: 400 }}> · {series[hi].month}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Donut ---------- */
function Donut({ data, size = 180, thickness = 22, gap = 2, children }) {
  const val = d => { const n = Number(d.value != null ? d.value : d.spent); return Number.isFinite(n) ? n : 0; };
  const total = data.reduce((a, d) => a + val(d), 0) || 1;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {data.map((d, i) => {
          const frac = val(d) / total; const len = frac * c;
          const seg = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color}
            strokeWidth={thickness} strokeDasharray={`${Math.max(len - gap, 0)} ${c}`} strokeDashoffset={-off}
            strokeLinecap="round" style={{ transition: 'stroke-dasharray 600ms var(--ease-out)' }} />;
          off += len; return seg;
        })}
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{children}</div>}
    </div>
  );
}

/* ---------- Column chart ---------- */
function Columns({ series, color = 'var(--accent)', height = 140, valueFmt = fmtCompact, highlightLast = true }) {
  const max = Math.max(...series.map(s => s.value)) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, width: '100%' }}>
      {series.map((s, i) => {
        const last = i === series.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <div title={valueFmt(s.value)} style={{ width: '100%', maxWidth: 26, height: (s.value / max) * (height - 22) + 'px',
              background: highlightLast && last ? color : 'var(--bg-chip)', borderRadius: 5,
              transition: 'height 600ms var(--ease-out)' }} />
            <span style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}>{s.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Card ---------- */
function Card({ children, pad = 20, style = {}, hover = false, onClick, ...rest }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: 'var(--bg-raised)', border: '1px solid ' + (h && hover ? 'var(--border-strong)' : 'var(--border)'),
        borderRadius: 'var(--radius-lg)', padding: pad, transition: 'border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
        cursor: onClick ? 'pointer' : 'default', ...style }} {...rest}>
      {children}
    </div>
  );
}

Object.assign(window, { fmtUSD, fmtCompact, Money, Icon, InstMark, Avatar, Badge, Bar, Sparkline, AreaChart, Donut, Columns, Card });
