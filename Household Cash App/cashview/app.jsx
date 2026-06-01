/* global React, ReactDOM, DirectionA, DirectionB, DirectionC, Icon */
const { useState, useEffect } = React;

const DIRECTIONS = [
  { id: 'A', label: 'Calm Ledger', sub: 'Single column · minimal', cmp: 'DirectionA', full: false },
  { id: 'B', label: 'Command Center', sub: 'Sidebar · data-dense', cmp: 'DirectionB', full: true },
  { id: 'C', label: 'Bento', sub: 'Tiled · color-forward', cmp: 'DirectionC', full: false }
];

function Shell() {
  const [dir, setDir] = useState(() => localStorage.getItem('cv_dir') || 'A');
  const [theme, setTheme] = useState(() => localStorage.getItem('cv_theme') || 'light');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('cv_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('cv_dir', dir); }, [dir]);

  const active = DIRECTIONS.find(d => d.id === dir);
  const Cmp = window[active.cmp];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* control bar */}
      <header style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px',
        background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)', zIndex: 50, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', display: 'grid', placeItems: 'center' }}><Icon name="wallet" size={15} color="#fff" /></span>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>CashView</span>
          <span style={{ fontSize: 12, color: 'var(--fg-subtle)', marginLeft: 2, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-chip)' }}>concept</span>
        </div>

        {/* segmented direction switcher */}
        <div style={{ display: 'flex', gap: 3, padding: 3, background: 'var(--bg-chip)', borderRadius: 11, marginLeft: 'auto' }}>
          {DIRECTIONS.map(d => (
            <button key={d.id} onClick={() => setDir(d.id)} title={d.sub} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15,
              padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: dir === d.id ? 'var(--bg-raised)' : 'transparent',
              boxShadow: dir === d.id ? 'var(--shadow-sm)' : 'none',
              color: dir === d.id ? 'var(--fg)' : 'var(--fg-muted)', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{d.label}</span>
              <span style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }}>{d.sub}</span>
            </button>
          ))}
        </div>

        {/* theme toggle */}
        <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} title="Toggle theme" style={{
          width: 40, height: 40, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg-raised)',
          color: 'var(--fg-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
        </button>
      </header>

      {/* canvas */}
      <div key={dir} style={{ flex: 1, minHeight: 0, overflowY: active.full ? 'hidden' : 'auto', background: 'var(--bg)' }}>
        <Cmp />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Shell />);
