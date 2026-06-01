// components/shared/Icon.web.tsx — Lucide icon wrapper for web.
// Metro picks this file over Icon.tsx when bundling for web.

import {
  Grid, Building2, PieChart, TrendingUp, Target, Wallet,
  RefreshCw, Plus, Calendar, CreditCard, ArrowRight,
  Shield, Home, Plane, LayoutDashboard, ChevronRight,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const ICONS: Record<string, React.FC<LucideProps>> = {
  grid:          Grid,
  building:      Building2,
  "pie-chart":   PieChart,
  "trending-up": TrendingUp,
  target:        Target,
  wallet:        Wallet,
  refresh:       RefreshCw,
  plus:          Plus,
  calendar:      Calendar,
  "credit-card": CreditCard,
  arrow:         ArrowRight,
  shield:        Shield,
  home:          Home,
  plane:         Plane,
  dashboard:     LayoutDashboard,
  chevron:       ChevronRight,
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 16, color = "currentColor", className, style }: IconProps) {
  const Comp = ICONS[name];
  if (!Comp) return null;
  return <Comp size={size} color={color} strokeWidth={1.5} className={className} style={style} />;
}
