// Wireframe primitives — sketchy low-fi components with role accent colors.
// Everything inline-styled to avoid global collisions inside the design canvas.

const ROLE_COLORS = {
  student:  'oklch(0.55 0.13 270)', // indigo
  teacher:  'oklch(0.58 0.10 195)', // teal
  admin:    'oklch(0.72 0.13 75)',  // amber
};
const INK     = '#1a1612';
const INK_2   = '#5a544c';
const INK_3   = '#9b958c';
const PAPER   = '#fdfcfa';
const PAPER_2 = '#f4f1ea';
const SKETCH  = '#2a251f';

const FONT_HAND  = '"Caveat", "Marker Felt", "Patrick Hand", cursive';
const FONT_BODY  = '"Patrick Hand", "Caveat", "Comic Sans MS", system-ui, sans-serif';
const FONT_MONO  = '"JetBrains Mono", "Courier New", monospace';

// ---- Context for active role + annotation toggle -----------------------
const WireCtx = React.createContext({ role: 'student', annotations: true, state: 'populated' });
const useWire = () => React.useContext(WireCtx);
const accent = (role) => ROLE_COLORS[role] || ROLE_COLORS.student;

// ---- Sketchy box: hand-drawn-looking double border ---------------------
function WBox({ children, style = {}, pad = 10, dashed = false, filled = false, accentBg = false, role }) {
  const { role: ctxRole } = useWire();
  const r = role || ctxRole;
  return (
    <div style={{
      border: `1.5px solid ${SKETCH}`,
      borderRadius: 3,
      padding: pad,
      background: filled ? PAPER_2 : (accentBg ? `color-mix(in oklch, ${accent(r)} 14%, ${PAPER})` : 'transparent'),
      borderStyle: dashed ? 'dashed' : 'solid',
      position: 'relative',
      boxSizing: 'border-box',
      ...style,
    }}>{children}</div>
  );
}

// ---- Hand-drawn squiggle separator -------------------------------------
function WSquiggle({ width = '100%', color = SKETCH, style = {} }) {
  return (
    <svg width={width} height="6" viewBox="0 0 200 6" preserveAspectRatio="none" style={{ display: 'block', ...style }}>
      <path d="M0 3 Q 10 0, 20 3 T 40 3 T 60 3 T 80 3 T 100 3 T 120 3 T 140 3 T 160 3 T 180 3 T 200 3"
            stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

// ---- Button: outlined w/ optional accent fill --------------------------
function WBtn({ children, primary = false, ghost = false, danger = false, sm = false, role, style = {}, ...p }) {
  const { role: ctxRole } = useWire();
  const r = role || ctxRole;
  const bg = primary ? accent(r) : 'transparent';
  const color = primary ? PAPER : (danger ? '#a8362a' : SKETCH);
  const border = danger ? '#a8362a' : SKETCH;
  return (
    <div {...p} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: sm ? '3px 9px' : '6px 14px',
      borderRadius: 4,
      border: ghost ? 'none' : `1.5px solid ${border}`,
      background: bg,
      color,
      fontFamily: FONT_HAND, fontSize: sm ? 14 : 17, fontWeight: 600,
      letterSpacing: 0.2,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      ...style,
    }}>{children}</div>
  );
}

// ---- Form field: label + input box -------------------------------------
function WField({ label, value = '', placeholder, multi = false, type = 'text', style = {}, h }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...style }}>
      {label && <div style={{ fontFamily: FONT_HAND, fontSize: 13, color: INK_2 }}>{label}</div>}
      <div style={{
        border: `1.3px solid ${SKETCH}`, borderRadius: 3,
        padding: '6px 8px', minHeight: multi ? (h || 60) : 26,
        height: h || 'auto',
        fontFamily: FONT_MONO, fontSize: 11, color: value ? INK : INK_3,
        background: PAPER, boxSizing: 'border-box',
        display: 'flex', alignItems: multi ? 'flex-start' : 'center',
      }}>
        {value || placeholder || ''}
        {type === 'password' && value && <span>{'•'.repeat(8)}</span>}
      </div>
    </div>
  );
}

// ---- Badge / pill ------------------------------------------------------
const BADGE_COLORS = {
  graded:        { bg: '#e3efe7', fg: '#1f6b3f' },
  ungraded:      { bg: '#fbe9d1', fg: '#7a4a17' },
  submitted:     { bg: '#e3efe7', fg: '#1f6b3f' },
  pending:       { bg: '#fbe9d1', fg: '#7a4a17' },
  active:        { bg: '#e3efe7', fg: '#1f6b3f' },
  suspended:     { bg: '#fadcd5', fg: '#7e1e10' },
  inactive:      { bg: '#e6e2db', fg: '#4a4540' },
  beginner:      { bg: '#dfe7f5', fg: '#1f3f7e' },
  intermediate:  { bg: '#e8e0f0', fg: '#532f7a' },
  advanced:      { bg: '#f4d7d0', fg: '#7e2a17' },
  writing:       { bg: '#dfe7f5', fg: '#1f3f7e' },
  speaking:      { bg: '#fbe2db', fg: '#7e3a17' },
  quiz:          { bg: '#e3efe7', fg: '#1f6b3f' },
  student:       { bg: '#dfe1f5', fg: '#1f2e7e' },
  teacher:       { bg: '#d6ece9', fg: '#16504a' },
  admin:         { bg: '#fbecd1', fg: '#7a4a17' },
};
function WBadge({ kind, children, style = {} }) {
  const c = BADGE_COLORS[kind] || { bg: '#e9e6df', fg: SKETCH };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '1px 8px', borderRadius: 10,
      border: `1px solid ${c.fg}33`,
      background: c.bg, color: c.fg,
      fontFamily: FONT_HAND, fontSize: 12, fontWeight: 600,
      lineHeight: 1.4, ...style,
    }}>{children || kind}</span>
  );
}

// ---- Avatar circle -----------------------------------------------------
function WAvatar({ name = 'AB', size = 28, style = {} }) {
  const init = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `1.3px solid ${SKETCH}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT_HAND, fontSize: size * 0.42, fontWeight: 600,
      color: SKETCH, background: PAPER_2, flexShrink: 0,
      ...style,
    }}>{init}</div>
  );
}

// ---- Annotation pill (margin notes) ------------------------------------
function WNote({ children, style = {}, n }) {
  const { annotations } = useWire();
  if (!annotations) return null;
  return (
    <div style={{
      display: 'flex', gap: 6, alignItems: 'flex-start',
      background: '#fef4a8', color: '#5a4a2a',
      padding: '6px 9px', borderRadius: 3,
      fontFamily: FONT_HAND, fontSize: 13, lineHeight: 1.25,
      boxShadow: '0 1px 2px rgba(0,0,0,.06)',
      ...style,
    }}>
      {n != null && <span style={{ fontWeight: 700, opacity: .7 }}>{n}.</span>}
      <span>{children}</span>
    </div>
  );
}

// ---- Placeholder image / audio block -----------------------------------
function WImg({ width = '100%', height = 80, label = 'image', style = {} }) {
  return (
    <div style={{
      width, height,
      border: `1.3px solid ${SKETCH}`,
      borderRadius: 3,
      background: `repeating-linear-gradient(45deg, ${PAPER_2} 0 6px, ${PAPER} 6px 12px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT_MONO, fontSize: 10, color: INK_2,
      position: 'relative', boxSizing: 'border-box',
      ...style,
    }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <line x1="0" y1="0" x2="100" y2="100" stroke={SKETCH} strokeWidth="0.5" opacity=".25" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="0" y2="100" stroke={SKETCH} strokeWidth="0.5" opacity=".25" vectorEffect="non-scaling-stroke" />
      </svg>
      <span style={{ position: 'relative', background: PAPER, padding: '1px 5px', borderRadius: 2 }}>{label}</span>
    </div>
  );
}

// ---- Mobile frame (status bar + content) -------------------------------
function WMobileFrame({ children, role, title, tabBar = true, scroll = false }) {
  const { role: ctxRole } = useWire();
  const r = role || ctxRole;
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: PAPER, fontFamily: FONT_BODY, color: INK,
      boxSizing: 'border-box',
    }}>
      {/* status bar */}
      <div style={{
        height: 22, padding: '0 14px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: FONT_MONO, fontSize: 10, color: INK_2,
        borderBottom: `1px dashed ${INK_3}`,
      }}>
        <span>9:41</span>
        <span>● ● ●</span>
      </div>
      {/* topbar w/ role accent */}
      {title !== null && (
        <div style={{
          padding: '8px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `2px solid ${accent(r)}`,
        }}>
          <div style={{ fontFamily: FONT_HAND, fontSize: 18, fontWeight: 700 }}>{title || 'engl.app'}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <WBadge kind={r}>{r}</WBadge>
            <WAvatar name="Mei L" size={22} />
          </div>
        </div>
      )}
      {/* body */}
      <div style={{
        flex: 1, overflow: scroll ? 'auto' : 'hidden',
        padding: '12px 14px', position: 'relative',
      }}>{children}</div>
      {/* tab bar */}
      {tabBar && (
        <div style={{
          borderTop: `1.3px solid ${SKETCH}`,
          display: 'flex', justifyContent: 'space-around',
          padding: '6px 0 8px', background: PAPER,
        }}>
          {['Home', 'Modules', 'Inbox', 'Me'].map((t, i) => (
            <div key={t} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              color: i === 0 ? accent(r) : INK_2,
              fontFamily: FONT_HAND, fontSize: 12,
            }}>
              <div style={{
                width: 18, height: 18, border: `1.2px solid currentColor`, borderRadius: 3,
              }} />
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Desktop frame (sidebar + topbar + content) ------------------------
function WDesktopFrame({ children, role, title, nav = 'sidebar', active = 'Dashboard' }) {
  const { role: ctxRole } = useWire();
  const r = role || ctxRole;
  const navItems = r === 'admin'
    ? ['Dashboard', 'Users', 'Classes', 'Modules', 'Logs']
    : ['Dashboard', 'My Classes', 'Modules', 'Submissions', 'Profile'];

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: PAPER, fontFamily: FONT_BODY, color: INK, boxSizing: 'border-box',
    }}>
      {/* topbar */}
      <div style={{
        height: 44, padding: '0 18px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `2px solid ${accent(r)}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontFamily: FONT_HAND, fontSize: 20, fontWeight: 700 }}>engl.app</div>
          <WBadge kind={r}>{r}</WBadge>
          {title && <div style={{ fontFamily: FONT_HAND, fontSize: 15, color: INK_2 }}>· {title}</div>}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontFamily: FONT_HAND, fontSize: 14, color: INK_2 }}>
          <span>Search…</span>
          <WAvatar name="Sara K" size={26} />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {nav === 'sidebar' && (
          <div style={{
            width: 150, borderRight: `1.3px solid ${SKETCH}`,
            padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 2,
            flexShrink: 0, background: PAPER_2,
          }}>
            {navItems.map(n => (
              <div key={n} style={{
                padding: '6px 14px',
                fontFamily: FONT_HAND, fontSize: 15,
                background: n === active ? `color-mix(in oklch, ${accent(r)} 22%, ${PAPER})` : 'transparent',
                borderLeft: n === active ? `3px solid ${accent(r)}` : '3px solid transparent',
                color: n === active ? SKETCH : INK_2,
                fontWeight: n === active ? 700 : 400,
              }}>{n}</div>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ padding: '8px 14px', fontFamily: FONT_HAND, fontSize: 12, color: INK_3, borderTop: `1px dashed ${INK_3}` }}>
              v0.1 · MVP
            </div>
          </div>
        )}
        <div style={{ flex: 1, padding: 18, overflow: 'auto', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---- Tiny helpers ------------------------------------------------------
const H = ({ children, size = 18, style = {} }) => (
  <div style={{ fontFamily: FONT_HAND, fontWeight: 700, fontSize: size, color: INK, ...style }}>{children}</div>
);
const T = ({ children, size = 13, color = INK, style = {} }) => (
  <div style={{ fontFamily: FONT_BODY, fontSize: size, color, lineHeight: 1.35, ...style }}>{children}</div>
);
const Row = ({ children, gap = 8, style = {}, align = 'center', wrap = false }) => (
  <div style={{ display: 'flex', gap, alignItems: align, flexWrap: wrap ? 'wrap' : 'nowrap', ...style }}>{children}</div>
);
const Col = ({ children, gap = 8, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>{children}</div>
);

// ---- Screen title bar inside frame body --------------------------------
const ScreenTitle = ({ children, sub, right }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
    <div>
      <div style={{ fontFamily: FONT_HAND, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{children}</div>
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK_2, marginTop: 2 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

// Export everything
Object.assign(window, {
  ROLE_COLORS, INK, INK_2, INK_3, PAPER, PAPER_2, SKETCH,
  FONT_HAND, FONT_BODY, FONT_MONO,
  WireCtx, useWire, accent,
  WBox, WSquiggle, WBtn, WField, WBadge, WAvatar, WNote, WImg,
  WMobileFrame, WDesktopFrame,
  H, T, Row, Col, ScreenTitle,
});
