// app/(app)/goals.web.tsx — Goals view with full CRUD stored in Supabase.

import React, { useEffect, useState, useCallback } from "react";
import { fetchGoals, createGoal, updateGoal, deleteGoal, Goal } from "@/lib/api";
import Money, { formatMoney } from "@/components/shared/Money";
import Icon from "@/components/shared/Icon";
import { T } from "@/lib/tokens";

const FONT = '"Noto Sans JP", system-ui, -apple-system, sans-serif';

const GOAL_COLORS = [
  { label: "Coral",  value: "#E5634A" },
  { label: "Teal",   value: "#3C8C7E" },
  { label: "Green",  value: "#1F8A5B" },
  { label: "Gold",   value: "#D99A22" },
  { label: "Plum",   value: "#8A5A7A" },
  { label: "Navy",   value: "#00264C" },
];

const GOAL_ICONS = [
  "shield", "home", "plane", "target", "trending-up", "wallet",
];

// ── Goal form modal ──────────────────────────────────────────────────────────
interface GoalFormProps {
  goal?: Goal;
  onSave: (data: { name: string; target_amount: number; saved_amount: number; color: string; icon: string }) => Promise<void>;
  onClose: () => void;
}

function GoalForm({ goal, onSave, onClose }: GoalFormProps) {
  const [name,       setName]       = useState(goal?.name ?? "");
  const [target,     setTarget]     = useState(goal?.target_amount.toString() ?? "");
  const [saved,      setSaved]      = useState(goal?.saved_amount.toString() ?? "0");
  const [color,      setColor]      = useState(goal?.color ?? "#E5634A");
  const [icon,       setIcon]       = useState(goal?.icon ?? "target");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    const t = parseFloat(target.replace(/,/g, ""));
    const s = parseFloat(saved.replace(/,/g, ""));
    if (isNaN(t) || t <= 0) { setError("Enter a valid target amount."); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), target_amount: t, saved_amount: isNaN(s) ? 0 : s, color, icon });
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to save goal.");
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(22,17,14,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 28, width: 420, maxWidth: "calc(100vw - 32px)", boxShadow: "0 12px 32px rgba(22,17,14,.12)" }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: T.fg, letterSpacing: "-0.02em", fontFamily: FONT }}>
          {goal ? "Edit goal" : "New goal"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={lbl}>Goal name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" style={input} />
          </div>

          {/* Target */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Target ($)</label>
              <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50,000" type="number" min="1" style={input} />
            </div>
            <div>
              <label style={lbl}>Saved so far ($)</label>
              <input value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" type="number" min="0" style={input} />
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={lbl}>Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {GOAL_COLORS.map((c) => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: c.value, border: color === c.value ? `3px solid ${T.fg}` : "2px solid transparent", cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label style={lbl}>Icon</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {GOAL_ICONS.map((ic) => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  style={{ width: 36, height: 36, borderRadius: 9, background: icon === ic ? color + "33" : T.bgChip, border: icon === ic ? `2px solid ${color}` : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                  <Icon name={ic} size={18} color={icon === ic ? color : T.fgMuted} />
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ margin: 0, fontSize: 13, color: T.negative, fontFamily: FONT }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.fg, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 600, fontSize: 14, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1, fontFamily: FONT }}>
              {saving ? "Saving…" : goal ? "Save changes" : "Create goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Goal card ────────────────────────────────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const pct = goal.target_amount > 0 ? Math.min(100, (goal.saved_amount / goal.target_amount) * 100) : 0;
  const remaining = goal.target_amount - goal.saved_amount;

  return (
    <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 22, display: "flex", flexDirection: "column", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: goal.color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={goal.icon} size={20} color={goal.color} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={onEdit} style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.fgMuted, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>Edit</button>
          <button onClick={onDelete} style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.negative, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>Delete</button>
        </div>
      </div>

      <div style={{ fontWeight: 600, fontSize: 16, color: T.fg, marginBottom: 4 }}>{goal.name}</div>
      <div style={{ fontSize: 13, color: T.fgMuted, marginBottom: 16, fontVariantNumeric: "tabular-nums" }}>
        {formatMoney(goal.saved_amount, false)} of {formatMoney(goal.target_amount, false)}
      </div>

      {/* Progress bar */}
      <div style={{ height: 9, background: T.bgChip, borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: goal.color, borderRadius: 999, transition: "width 600ms cubic-bezier(0.22,1,0.36,1)" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
        <span style={{ color: goal.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{pct.toFixed(0)}% funded</span>
        <span style={{ color: T.fgMuted, fontVariantNumeric: "tabular-nums" }}>{remaining > 0 ? `${formatMoney(remaining, false)} to go` : "Goal reached! 🎉"}</span>
      </div>
    </div>
  );
}

// ── Goals screen ──────────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const [goals,    setGoals]    = useState<Goal[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Goal | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchGoals();
      setGoals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = useCallback(async (data: Parameters<typeof createGoal>[0]) => {
    const newGoal = await createGoal({ ...data, sort_order: goals.length });
    setGoals((prev) => [...prev, newGoal]);
  }, [goals.length]);

  const handleUpdate = useCallback(async (data: Parameters<typeof createGoal>[0]) => {
    if (!editing) return;
    await updateGoal(editing.id, data);
    setGoals((prev) => prev.map((g) => g.id === editing.id ? { ...g, ...data } : g));
    setEditing(null);
  }, [editing]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: T.fgMuted, fontFamily: FONT }}>Loading…</div>;
  }

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: T.fg }}>Savings goals</div>
          <div style={{ fontSize: 13, color: T.fgMuted, marginTop: 2 }}>Track progress toward your household goals.</div>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT }}>
          <Icon name="plus" size={15} color="#fff" />
          New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px", gap: 16, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: T.bgChip, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="target" size={26} color={T.fgMuted} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: T.fg, marginBottom: 6 }}>No goals yet</div>
            <div style={{ fontSize: 13.5, color: T.fgMuted }}>Create your first savings goal to start tracking progress.</div>
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT }}>
            Create a goal
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setEditing(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      {(showForm || editing) && (
        <GoalForm
          goal={editing ?? undefined}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: T.fgMuted,
  marginBottom: 6,
  fontFamily: FONT,
};
const input: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  background: T.bg,
  color: T.fg,
  fontSize: 14,
  fontFamily: FONT,
  outline: "none",
  boxSizing: "border-box",
};
