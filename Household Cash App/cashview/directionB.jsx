/* global React, HH, Money, Icon, InstMark, Avatar, Badge, Bar, Sparkline, AreaChart, Donut, Columns, fmtUSD, fmtCompact, Card */
/* Direction B — "Command Center": sidebar nav + multi-column dashboard, data-dense, charts. */
function DirectionB() {
  const { useState, useEffect } = React;
  const [nav, setNav] = useState('overview');
  const [narrow, setNarrow] = useState(window.innerWidth < 880);
  const [spin, setSpin] = useState(false);
  const [stamp, setStamp] = useState('2 min ago');
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth < 880);
    window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, []);
  const refresh = () => { setSpin(true); setTimeout(() => { setSpin(false); setStamp('just now'); }, 850); };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'accounts', label: 'Accounts', icon: 'building' },
    { id: 'spending', label: 'Spending', icon: 'pie-chart' },
    { id: 'investments', label: 'Investments', icon: 'trending-up' },
    { id: 'goals', label: 'Goals', icon: 'target' }
  ];

  const Side = () => (
    <aside style={{ width: 230, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-raised)',
      height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px' }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
          <Icon name="wallet" size={17} color="#fff" />
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>CashView</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setNav(n.id)} style={{
            display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 9, border: 'none',
            background: nav === n.id ? 'var(--bg-chip)' : 'transparent', color: nav === n.id ? 'var(--fg)' : 'var(--fg-muted)',
            fontWeight: nav === n.id ? 600 : 500, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            <Icon name={n.icon} size={17} color={nav === n.id ? 'var(--accent)' : 'var(--fg-subtle)'} />{n.label}
          </button>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex' }}>{HH.members.map((m, i) => <span key={m.id} style={{ marginLeft: i ? -7 : 0 }}><Avatar member={m} size={28} ring /></span>)}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>KFJN</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>Household</div>
        </div>
      </div>
    </aside>
  );

  const MobileNav = () => (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)', position: 'sticky', top: 0, zIndex: 5 }}>
      {navItems.map(n => (
        <button key={n.id} onClick={() => setNav(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, whiteSpace: 'nowrap',
          border: '1px solid ' + (nav === n.id ? 'transparent' : 'var(--border)'), background: nav === n.id ? 'var(--fg)' : 'transparent',
          color: nav === n.id ? 'var(--bg-raised)' : 'var(--fg-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Icon name={n.icon} size={15} />{n.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100%', height: narrow ? 'auto' : '100%' }}>
      {!narrow && <Side />}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', maxHeight: narrow ? 'none' : '100%' }}>
        {narrow && <MobileNav />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: narrow ? '20px 16px 0' : '26px 32px 0', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: narrow ? 24 : 28, fontWeight: 600, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>{nav}</h1>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>May 2026 · synced {stamp}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={refresh} style={ghostBtn}><Icon name="refresh" size={15} style={{ animation: spin ? 'spin 0.85s var(--ease-in-out)' : 'none' }} /> Refresh</button>
            <button style={primaryBtn}><Icon name="plus" size={15} color="#fff" /> Add account</button>
          </div>
        </div>
        <div style={{ padding: narrow ? 16 : '24px 32px 64px' }}>
          {nav === 'overview' && <BOverview narrow={narrow} go={setNav} />}
          {nav === 'accounts' && <BAccounts narrow={narrow} />}
          {nav === 'spending' && <BSpending narrow={narrow} />}
          {nav === 'investments' && <BInvest narrow={narrow} />}
          {nav === 'goals' && <BGoals narrow={narrow} />}
        </div>
      </main>
    </div>
  );
}

const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--fg)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };

function Kpi({ label, value, tone, delta, deltaTone, spark, sparkColor }) {
  return (
    <Card pad={18} hover>
      <div className="eyebrow" style={{ marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
        <Money value={value} size={23} cents={false} weight={600} color={tone} />
        {spark && <Sparkline values={spark} w={66} h={28} color={sparkColor || 'var(--accent)'} />}
      </div>
      {delta && <div style={{ marginTop: 10 }}><Badge tone={deltaTone}>{delta}</Badge></div>}
    </Card>
  );
}

function BOverview({ narrow, go }) {
  const t = HH.totals;
  const catData = [...HH.categories].sort((a, b) => b.spent - a.spent);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr 1fr' : 'repeat(auto-fit, minmax(168px, 1fr))', gap: 16 }}>
        <Kpi label="Total cash" value={t.cash} delta="+$1,420 (30d)" deltaTone="positive" spark={HH.cashSeries.map(s => s.value)} />
        <Kpi label="Net worth" value={t.netWorth} delta="+5.2% (12mo)" deltaTone="positive" spark={HH.netWorthSeries.map(s => s.value)} sparkColor="var(--invest)" />
        <Kpi label="Investments" value={t.invest} tone="var(--invest)" delta="+0.74% today" deltaTone="invest" />
        <Kpi label="Card debt" value={-t.debt} tone="var(--negative)" delta="due Jun 14" deltaTone="negative" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1.6fr 1fr', gap: 16 }}>
        <Card pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div><div style={{ fontWeight: 600, fontSize: 15 }}>Net worth</div><div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>Last 12 months</div></div>
            <Badge tone="positive"><Icon name="trending-up" size={13} /> +$36,990</Badge>
          </div>
          <AreaChart series={HH.netWorthSeries} color="var(--invest)" height={220} />
        </Card>
        <Card pad={20}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Spending by category</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Donut data={catData} size={140} thickness={20}>
              <div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>spent</div><div className="tnum" style={{ fontWeight: 700, fontSize: 18 }}>{fmtCompact(HH.spendTotal)}</div></div>
            </Donut>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {catData.slice(0, 5).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />
                  <span style={{ flex: 1 }}>{c.label}</span>
                  <span className="tnum" style={{ color: 'var(--fg-muted)' }}>{fmtUSD(c.spent, { cents: false })}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1.4fr 1fr', gap: 16 }}>
        <Card pad={0}>
          <CardHead title="Accounts" action={<button onClick={() => go('accounts')} style={linkBtnB}>View all <Icon name="arrow" size={13} /></button>} />
          {HH.accounts.filter(a => a.group !== 'debt').slice(0, 5).map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
              <InstMark inst={a.inst} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{a.inst} ····{a.mask}</div>
              </div>
              <Money value={a.balance} size={15} weight={600} cents={false} />
            </div>
          ))}
        </Card>
        <Card pad={0}>
          <CardHead title="Upcoming bills" />
          {HH.bills.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-chip)', display: 'grid', placeItems: 'center' }}><Icon name="calendar" size={15} color="var(--fg-muted)" /></span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{b.label}</div><div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{b.due}{b.auto ? ' · auto' : ''}</div></div>
              <Money value={-b.amt} size={14} weight={600} cents={false} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function BAccounts() {
  const groups = [['cash', 'Cash'], ['invest', 'Investments'], ['debt', 'Credit & debt']];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {groups.map(([g, label]) => {
        const accts = HH.accounts.filter(a => a.group === g);
        const tot = accts.reduce((a, b) => a + b.balance, 0);
        return (
          <Card key={g} pad={0}>
            <CardHead title={label} action={<span className="tnum" style={{ fontWeight: 600, color: g === 'debt' ? 'var(--negative)' : 'inherit' }}>{fmtUSD(tot, { cents: false })}</span>} />
            {accts.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
                <InstMark inst={a.inst} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>{a.inst} ····{a.mask} · {HH.memberById[a.owner].name}</div>
                </div>
                {a.apy != null && <Badge tone="neutral">{a.apy}% apy</Badge>}
                {a.dayChange != null && <Badge tone="invest">+{a.dayChange}% today</Badge>}
                {a.type === 'credit' && <Badge tone="negative">{a.apr}% apr</Badge>}
                <Money value={a.balance} size={17} weight={600} />
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

function BSpending({ narrow }) {
  const cats = [...HH.categories].sort((a, b) => b.spent - a.spent);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 16 }}>
        <Card pad={20}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Monthly spending</div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginBottom: 18 }}>Trailing 12 months</div>
          <Columns series={HH.spendTrend} color="var(--accent)" height={170} />
        </Card>
        <Card pad={20}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Budget vs actual</div>
          <div style={{ display: 'grid', gap: 14 }}>
            {cats.slice(0, 6).map(c => {
              const over = c.spent > c.budget;
              return (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{c.label}</span>
                    <span className="tnum" style={{ color: over ? 'var(--negative)' : 'var(--fg-muted)' }}>{fmtUSD(c.spent, { cents: false })} / {fmtUSD(c.budget, { cents: false })}</span>
                  </div>
                  <Bar pct={(c.spent / c.budget) * 100} color={c.color} over={over} height={7} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <Card pad={0}>
        <CardHead title="Recent transactions" action={<span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{HH.tx.length} this week</span>} />
        {HH.tx.map((t, i) => {
          const cat = HH.catById[t.cat]; const acct = HH.acctById[t.acct];
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 18px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-chip)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: 'var(--fg-muted)' }}>{t.logo}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.merchant}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{cat ? cat.label : 'Income'} · {acct.inst} ····{acct.mask}</div>
              </div>
              {!narrow && <Avatar member={HH.memberById[t.who]} size={22} />}
              <span style={{ fontSize: 12, color: 'var(--fg-subtle)', minWidth: 50, textAlign: 'right' }}>{t.date}</span>
              <Money value={t.amt} size={15} weight={600} color={t.amt > 0 ? 'var(--positive)' : 'inherit'} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function BInvest({ narrow }) {
  const accts = HH.accounts.filter(a => a.group === 'invest');
  const alloc = [
    { label: 'US equities', value: 168000, color: '#3C8C7E' },
    { label: 'Intl equities', value: 62000, color: '#E5634A' },
    { label: 'Bonds', value: 34000, color: '#D99A22' },
    { label: 'Cash & other', value: 16631, color: '#7A716A' }
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 16 }}>
        <Card pad={20}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Total invested</div>
          <Money value={HH.totals.invest} size={34} weight={700} color="var(--invest)" />
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}><Badge tone="invest"><Icon name="trending-up" size={13} /> +$2,074 today</Badge><Badge tone="positive">+14.6% YTD</Badge></div>
          <div style={{ marginTop: 20 }}><AreaChart series={HH.netWorthSeries.map(s => ({ month: s.month, value: s.value * 0.7 }))} color="var(--invest)" height={150} /></div>
        </Card>
        <Card pad={20}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Allocation</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Donut data={alloc} size={150} thickness={22}>
              <div><div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>accounts</div><div style={{ fontWeight: 700, fontSize: 20 }}>{accts.length}</div></div>
            </Donut>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {alloc.map(a => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: a.color }} /><span style={{ flex: 1 }}>{a.label}</span>
                  <span className="tnum" style={{ color: 'var(--fg-muted)' }}>{fmtCompact(a.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <Card pad={0}>
        <CardHead title="Investment accounts" />
        {accts.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
            <InstMark inst={a.inst} size={34} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div><div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>{a.inst} ····{a.mask} · {HH.memberById[a.owner].name}</div></div>
            <Badge tone="invest">+{a.dayChange}% today</Badge>
            <Money value={a.balance} size={17} weight={600} />
          </div>
        ))}
      </Card>
    </div>
  );
}

function BGoals({ narrow }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'repeat(3,1fr)', gap: 16 }}>
      {HH.goals.map(g => {
        const pct = (g.saved / g.target) * 100;
        return (
          <Card key={g.id} pad={22} hover>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: g.color + '22', display: 'grid', placeItems: 'center', marginBottom: 16 }}><Icon name={g.icon} size={20} color={g.color} /></span>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{g.label}</div>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16 }} className="tnum">{fmtUSD(g.saved, { cents: false })} of {fmtUSD(g.target, { cents: false })}</div>
            <Bar pct={pct} color={g.color} height={9} />
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span style={{ color: g.color, fontWeight: 600 }} className="tnum">{pct.toFixed(0)}% funded</span>
              <span style={{ color: 'var(--fg-muted)' }} className="tnum">{fmtUSD(g.target - g.saved, { cents: false })} to go</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CardHead({ title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</div>{action}
    </div>
  );
}
const linkBtnB = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0 };
window.DirectionB = DirectionB;
