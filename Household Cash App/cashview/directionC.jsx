/* global React, HH, Money, Icon, InstMark, Avatar, Badge, Bar, Sparkline, AreaChart, Donut, Columns, fmtUSD, fmtCompact, Card */
/* Direction C — "Bento": rich tiled cards, color-forward, data-viz heavy, warm. */
function DirectionC() {
  const { useState, useEffect } = React;
  const [narrow, setNarrow] = useState(window.innerWidth < 820);
  const [spin, setSpin] = useState(false);
  const [stamp, setStamp] = useState('moments ago');
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth < 820);
    window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, []);
  const refresh = () => { setSpin(true); setTimeout(() => { setSpin(false); setStamp('just now'); }, 850); };
  const t = HH.totals;
  const cats = [...HH.categories].sort((a, b) => b.spent - a.spent);
  const col = narrow ? 'span 1' : null;
  const span = n => narrow ? 'span 1' : 'span ' + n;

  const Tile = ({ children, c = 2, pad = 22, bg = 'var(--bg-raised)', border = true, style = {} }) => (
    <div style={{ gridColumn: span(c), background: bg, borderRadius: 'var(--radius-xl)',
      border: border ? '1px solid var(--border)' : 'none', padding: pad, display: 'flex', flexDirection: 'column', minWidth: 0, ...style }}>
      {children}
    </div>
  );
  const Head = ({ icon, children, color = 'var(--fg-subtle)', right }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {icon && <Icon name={icon} size={16} color={color} />}
      <span className="eyebrow" style={{ fontSize: 12 }}>{children}</span>
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
  );

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: narrow ? '24px 16px 70px' : '32px 32px 80px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ display: 'flex' }}>{HH.members.map((m, i) => <span key={m.id} style={{ marginLeft: i ? -9 : 0 }}><Avatar member={m} size={36} ring /></span>)}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>KFJN</div>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Household finances · May 2026</div>
          </div>
        </div>
        <button onClick={refresh} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--fg)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Icon name="refresh" size={15} style={{ animation: spin ? 'spin 0.85s var(--ease-in-out)' : 'none' }} /> Sync
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'repeat(4, minmax(0,1fr))', gap: 16, alignItems: 'stretch' }}>
        {/* HERO — total cash, coral */}
        <Tile c={2} bg="var(--accent)" border={false} pad={26} style={{ color: '#fff', justifyContent: 'space-between', minHeight: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,.8)' }}>Total household cash</span>
            <Icon name="wallet" size={20} color="rgba(255,255,255,.85)" />
          </div>
          <div>
            <Money value={t.cash} size={52} weight={700} cents={false} color="#fff" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,.18)', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                <Icon name="trending-up" size={13} color="#fff" /> +$1,420 this month
              </span>
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.75)' }}>updated {stamp}</span>
            </div>
          </div>
          <Sparkline values={HH.cashSeries.map(s => s.value)} w={narrow ? 280 : 340} h={36} color="rgba(255,255,255,.9)" />
        </Tile>

        {/* Net worth area */}
        <Tile c={2} pad={20}>
          <Head icon="trending-up" right={<Badge tone="positive">+5.2%</Badge>}>Net worth · 12 mo</Head>
          <div style={{ marginBottom: 4 }}><Money value={t.netWorth} size={28} weight={700} cents={false} /></div>
          <div style={{ flex: 1, minHeight: 130 }}><AreaChart series={HH.netWorthSeries} color="var(--invest)" height={130} showAxis={false} /></div>
        </Tile>

        {/* Investments */}
        <Tile c={1} bg="var(--invest-soft)" style={{ justifyContent: 'space-between', minHeight: 150 }}>
          <Head icon="trending-up" color="var(--invest)">Investments</Head>
          <div><Money value={t.invest} size={26} weight={700} cents={false} color="var(--invest)" /></div>
          <Badge tone="invest"><Icon name="trending-up" size={12} /> +$2,074 today</Badge>
        </Tile>

        {/* Debt */}
        <Tile c={1} style={{ justifyContent: 'space-between', minHeight: 150 }}>
          <Head icon="credit-card" color="var(--negative)">Card debt</Head>
          <div><Money value={-t.debt} size={26} weight={700} cents={false} color="var(--negative)" /></div>
          <Badge tone="negative">due Jun 14</Badge>
        </Tile>

        {/* Spending donut */}
        <Tile c={2} pad={20}>
          <Head icon="pie-chart" right={<span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-muted)' }}>{fmtUSD(HH.spendTotal, { cents: false })} / {fmtUSD(HH.budgetTotal, { cents: false })}</span>}>This month's spending</Head>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <Donut data={cats} size={146} thickness={20}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>of budget</div><div className="tnum" style={{ fontWeight: 700, fontSize: 20 }}>{Math.round(HH.spendTotal / HH.budgetTotal * 100)}%</div></div>
            </Donut>
            <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cats.slice(0, 5).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                  <span style={{ flex: 1 }}>{c.label}</span>
                  <span className="tnum" style={{ fontWeight: 600 }}>{fmtUSD(c.spent, { cents: false })}</span>
                </div>
              ))}
            </div>
          </div>
        </Tile>

        {/* Goals rings */}
        <Tile c={2} pad={20}>
          <Head icon="target">Goals</Head>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'space-around', flexWrap: 'wrap' }}>
            {HH.goals.map(g => {
              const pct = g.saved / g.target;
              return (
                <div key={g.id} style={{ textAlign: 'center', flex: 1, minWidth: 90 }}>
                  <Donut data={[{ value: g.saved, color: g.color }, { value: g.target - g.saved, color: 'var(--bg-chip)' }]} size={92} thickness={11} gap={0}>
                    <span className="tnum" style={{ fontWeight: 700, fontSize: 16, color: g.color }}>{Math.round(pct * 100)}%</span>
                  </Donut>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 8 }}>{g.label}</div>
                  <div className="tnum" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{fmtCompact(g.saved)} / {fmtCompact(g.target)}</div>
                </div>
              );
            })}
          </div>
        </Tile>

        {/* Accounts */}
        <Tile c={2} pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px' }}><Head>Accounts · {HH.accounts.length}</Head></div>
          {HH.accounts.filter(a => a.group !== 'debt').map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderTop: '1px solid var(--border-subtle)' }}>
              <InstMark inst={a.inst} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div><div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{a.inst} ····{a.mask}</div></div>
              <Money value={a.balance} size={15} weight={600} cents={false} />
            </div>
          ))}
        </Tile>

        {/* Monthly columns */}
        <Tile c={2} pad={20}>
          <Head icon="grid">Monthly spend</Head>
          <div style={{ flex: 1, minHeight: 150, display: 'flex', alignItems: 'flex-end' }}><Columns series={HH.spendTrend} color="var(--accent)" height={150} /></div>
        </Tile>

        {/* Recent transactions */}
        <Tile c={2} pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px' }}><Head icon="list">Recent activity</Head></div>
          {HH.tx.slice(0, 6).map(t => {
            const cat = HH.catById[t.cat];
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: cat ? cat.color + '22' : 'var(--positive-soft)', color: cat ? cat.color : 'var(--positive)', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 700 }}>{t.logo}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.merchant}</div><div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{cat ? cat.label : 'Income'} · {t.date}</div></div>
                <Money value={t.amt} size={14.5} weight={600} color={t.amt > 0 ? 'var(--positive)' : 'inherit'} />
              </div>
            );
          })}
        </Tile>
      </div>

      <div style={{ textAlign: 'center', marginTop: 30, fontSize: 12, color: 'var(--fg-subtle)' }}>Synced with Chase &amp; Morgan Stanley · secured by Plaid</div>
    </div>
  );
}
window.DirectionC = DirectionC;
