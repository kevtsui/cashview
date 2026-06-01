/* global React, HH, Money, Icon, InstMark, Avatar, Badge, Bar, Sparkline, fmtUSD, fmtCompact, Card */
/* Direction A — "Calm Ledger": single narrow column, warm, minimal viz, expandable accounts. */
function DirectionA() {
  const { useState } = React;
  const [open, setOpen] = useState({});
  const [stamp, setStamp] = useState('just now');
  const [spin, setSpin] = useState(false);
  const refresh = () => { setSpin(true); setTimeout(() => { setSpin(false); setStamp('just now'); }, 850); };
  const toggle = id => setOpen(o => ({ ...o, [id]: !o[id] }));

  const cash = HH.accounts.filter(a => a.group === 'cash');
  const byInst = {};
  cash.forEach(a => { (byInst[a.inst] = byInst[a.inst] || []).push(a); });

  const SubStat = ({ label, value, tone }) => (
    <div style={{ flex: 1, padding: '14px 16px' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      <Money value={value} size={22} cents={false} weight={600} color={tone} />
    </div>
  );

  const topCats = [...HH.categories].sort((a, b) => b.spent - a.spent).slice(0, 4);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '36px 22px 80px' }}>
      {/* household line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex' }}>
            {HH.members.map((m, i) => <span key={m.id} style={{ marginLeft: i ? -8 : 0 }}><Avatar member={m} size={30} ring /></span>)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>KFJN</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>Household</div>
          </div>
        </div>
        <button onClick={refresh} title="Refresh" style={iconBtn}>
          <Icon name="refresh" size={17} style={{ animation: spin ? 'spin 0.85s var(--ease-in-out)' : 'none' }} />
        </button>
      </div>

      {/* hero */}
      <Card pad={26} style={{ marginBottom: 14, textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 12 }}>Total household cash</div>
        <div style={{ marginBottom: 14 }}><Money value={HH.totals.cash} size={56} cents weight={700} /></div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <Badge tone="positive"><Icon name="trending-up" size={13} /> +$1,420 this month</Badge>
          <span style={{ fontSize: 12.5, color: 'var(--fg-subtle)' }}>· updated {stamp}</span>
        </div>
        <div style={{ marginTop: 18 }}><Sparkline values={HH.cashSeries.map(s => s.value)} w={520} h={46} fill color="var(--accent)" /></div>
      </Card>

      {/* secondary stats */}
      <Card pad={0} style={{ marginBottom: 28, display: 'flex', overflow: 'hidden' }}>
        <SubStat label="Net worth" value={HH.totals.netWorth} />
        <div style={divider} />
        <SubStat label="Investments" value={HH.totals.invest} tone="var(--invest)" />
        <div style={divider} />
        <SubStat label="Card debt" value={-HH.totals.debt} tone="var(--negative)" />
      </Card>

      {/* accounts */}
      <SectionLabel>Accounts</SectionLabel>
      {Object.entries(byInst).map(([inst, accts]) => (
        <div key={inst} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 4px 10px' }}>
            <InstMark inst={inst} size={22} radius={6} />
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>{inst}</span>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--fg-muted)' }} className="tnum">
              {fmtUSD(accts.reduce((a, b) => a + b.balance, 0), { cents: false })}
            </span>
          </div>
          <Card pad={0} style={{ overflow: 'hidden' }}>
            {accts.map((a, i) => {
              const txs = HH.tx.filter(t => t.acct === a.id);
              const isOpen = open[a.id];
              return (
                <div key={a.id} style={{ borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div onClick={() => toggle(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', cursor: 'pointer' }}>
                    <Avatar member={HH.memberById[a.owner]} size={26} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{a.name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
                        ····{a.mask} {a.apy ? '· ' + a.apy + '% apy' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Money value={a.balance} size={17} weight={600} />
                      <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)', marginTop: 2 }}>
                        {fmtUSD(a.available, { cents: false })} available
                      </div>
                    </div>
                    <Icon name="chevron" size={16} color="var(--fg-subtle)" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform var(--duration-base)' }} />
                  </div>
                  {isOpen && (
                    <div style={{ background: 'var(--bg-sunken)', padding: '6px 18px 14px' }}>
                      <div className="eyebrow" style={{ padding: '8px 0 4px', fontSize: 11 }}>Recent activity</div>
                      {txs.length ? txs.slice(0, 5).map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0' }}>
                          <span style={{ fontSize: 13.5, flex: 1 }}>{t.merchant}</span>
                          <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{t.date}</span>
                          <Money value={t.amt} size={14} weight={600} color={t.amt > 0 ? 'var(--positive)' : 'inherit'} />
                        </div>
                      )) : <div style={{ fontSize: 13, color: 'var(--fg-muted)', padding: '6px 0' }}>No recent transactions.</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      ))}

      {/* spending */}
      <SectionLabel right={<span style={{ fontSize: 13, color: 'var(--fg-muted)' }} className="tnum">{fmtUSD(HH.spendTotal, { cents: false })} of {fmtUSD(HH.budgetTotal, { cents: false })}</span>}>This month's spending</SectionLabel>
      <Card style={{ marginBottom: 28 }}>
        {topCats.map((c, i) => {
          const pct = (c.spent / c.budget) * 100; const over = c.spent > c.budget;
          return (
            <div key={c.id} style={{ padding: '11px 0', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: c.color + '22', color: c.color, display: 'grid', placeItems: 'center' }}>
                  <Icon name={c.icon} size={15} color={c.color} />
                </span>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{c.label}</span>
                <span className="tnum" style={{ fontSize: 13.5, fontWeight: 600, color: over ? 'var(--negative)' : 'inherit' }}>{fmtUSD(c.spent, { cents: false })}</span>
                <span className="tnum" style={{ fontSize: 12.5, color: 'var(--fg-subtle)' }}>/ {fmtUSD(c.budget, { cents: false })}</span>
              </div>
              <Bar pct={pct} color={c.color} over={over} height={6} />
            </div>
          );
        })}
        <button style={{ ...linkBtn, marginTop: 14 }}>See all categories <Icon name="arrow" size={14} /></button>
      </Card>

      {/* upcoming bills */}
      <SectionLabel>Upcoming bills</SectionLabel>
      <Card pad={0}>
        {HH.bills.map((b, i) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-chip)', display: 'grid', placeItems: 'center' }}>
              <Icon name="calendar" size={15} color="var(--fg-muted)" />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{b.label}</div>
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>{b.due} · {b.auto ? 'autopay' : 'manual'}</div>
            </div>
            {b.auto && <Badge tone="neutral">auto</Badge>}
            <Money value={-b.amt} size={15} weight={600} />
          </div>
        ))}
      </Card>

      <div style={{ textAlign: 'center', marginTop: 36, fontSize: 12, color: 'var(--fg-subtle)' }}>
        Synced with Chase &amp; Morgan Stanley · secured by Plaid
      </div>
    </div>
  );
}

const iconBtn = { width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--fg-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer' };
const divider = { width: 1, background: 'var(--border-subtle)' };
const linkBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', padding: 0 };
function SectionLabel({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 14px' }}>
      <h2 className="eyebrow" style={{ margin: 0, fontSize: 12.5 }}>{children}</h2>
      {right}
    </div>
  );
}
window.DirectionA = DirectionA;
window.A_helpers = { iconBtn, linkBtn, SectionLabel };
