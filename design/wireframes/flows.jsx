// Flow diagrams for J1, J3, J4, J6 + design tokens + component library.

// ---- Flow node (mini screen card) --------------------------------------
function FNode({ title, sub, role, big, accent: isAccent, children }) {
  const r = role || 'student';
  return (
    <div style={{
      width: big ? 200 : 150,
      minHeight: big ? 130 : 100,
      border: `1.5px solid ${SKETCH}`,
      borderRadius: 4,
      padding: 8,
      background: isAccent ? `color-mix(in oklch, ${accent(r)} 18%, ${PAPER})` : PAPER,
      flexShrink: 0,
      boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      <T size={9} color={INK_3} style={{ fontFamily: FONT_MONO, letterSpacing: 1 }}>{sub || 'screen'}</T>
      <T size={12} style={{ fontWeight: 700, marginTop: 2, lineHeight: 1.15 }}>{title}</T>
      <div style={{ flex: 1, marginTop: 5 }}>{children}</div>
    </div>
  );
}

// ---- Arrow between flow nodes ------------------------------------------
function FArrow({ label, vert, dashed, color }) {
  const c = color || SKETCH;
  if (vert) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0' }}>
        <svg width="24" height="36" viewBox="0 0 24 36">
          <path d="M12 0 Q 14 18, 12 30" stroke={c} strokeWidth="1.5" fill="none" strokeDasharray={dashed ? '3 3' : ''} />
          <path d="M7 25 L 12 34 L 17 25" stroke={c} strokeWidth="1.5" fill="none" />
        </svg>
        {label && <T size={11} color={INK_2} style={{ fontStyle: 'italic' }}>{label}</T>}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60, alignSelf: 'center' }}>
      {label && <T size={11} color={INK_2} style={{ fontStyle: 'italic', textAlign: 'center', maxWidth: 90 }}>{label}</T>}
      <svg width="60" height="22" viewBox="0 0 60 22">
        <path d="M2 11 Q 30 6, 54 11" stroke={c} strokeWidth="1.5" fill="none" strokeDasharray={dashed ? '3 3' : ''} />
        <path d="M48 6 L 56 11 L 48 16" stroke={c} strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

// ---- Tiny placeholder content for flow nodes ---------------------------
const Stack = ({ rows }) => (
  <Col gap={3}>
    {rows.map((r, i) => (
      <div key={i} style={{
        height: 5, background: PAPER_2, borderRadius: 1,
        width: typeof r === 'number' ? `${r}%` : r,
      }} />
    ))}
  </Col>
);
const Btn = ({ children, role = 'student' }) => (
  <div style={{
    padding: '2px 6px', borderRadius: 3, background: accent(role),
    color: PAPER, fontFamily: FONT_HAND, fontSize: 10, display: 'inline-block', marginTop: 4,
  }}>{children}</div>
);

// ---- J1 — Student completes a writing assignment -----------------------
function F_J1() {
  return (
    <div style={{ padding: 20, background: PAPER, fontFamily: FONT_BODY, width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <T size={11} color={INK_2} style={{ fontFamily: FONT_MONO, letterSpacing: 1 }}>JOURNEY 1</T>
          <H size={24}>Student completes a writing assignment</H>
          <T size={12} color={INK_2}>Happy path · phone · ~90s total</T>
        </div>
        <WBadge kind="student" />
      </Row>
      <Row style={{ alignItems: 'stretch', flexWrap: 'wrap', rowGap: 30 }}>
        <FNode sub="01 LOGIN" title="Log in" role="student">
          <Stack rows={[80, 80]} />
          <Btn>Log in</Btn>
        </FNode>
        <FArrow label="email + pw" />
        <FNode sub="05 DASHBOARD" title="Student dashboard" role="student" accent>
          <T size={10} color={INK_2}>Due soon:</T>
          <T size={10} style={{ fontWeight: 700 }}>Essay: Hometown</T>
          <T size={9} color={INK_2}>due tomorrow</T>
        </FNode>
        <FArrow label="tap card" />
        <FNode sub="10 EXERCISE" title="Exercise viewer" role="student">
          <T size={9} color={INK_2}>PROMPT</T>
          <Stack rows={[90, 80, 70]} />
          <T size={9} color={INK_2} style={{ marginTop: 3 }}>RESPONSE ✎</T>
          <div style={{ border: `1px dashed ${INK_3}`, height: 18, borderRadius: 2, marginTop: 2 }} />
        </FNode>
        <FArrow label="type & submit" />
        <FNode sub="TOAST" title="Confirmation" role="student" accent>
          <Col gap={3} style={{ alignItems: 'center', marginTop: 8 }}>
            <T size={20}>✓</T>
            <T size={10}>Submitted!</T>
            <T size={9} color={INK_2}>back to dash in 2s</T>
          </Col>
        </FNode>
        <FArrow label="auto-return" dashed />
        <FNode sub="05 DASHBOARD" title="Dashboard (post)" role="student">
          <T size={10} color={INK_2}>Due soon:</T>
          <Row gap={4}><T size={10} style={{ fontWeight: 700, textDecoration: 'line-through', opacity: .6 }}>Essay</T><WBadge kind="submitted">✓</WBadge></Row>
        </FNode>
      </Row>
      <WNote n="!" style={{ marginTop: 18, maxWidth: 700 }}>
        Edge cases: lost network during submit → keep draft locally and retry. Resubmission allowed until due date passes.
      </WNote>
    </div>
  );
}

// ---- J3 — Teacher creates and assigns an exercise ----------------------
function F_J3() {
  return (
    <div style={{ padding: 20, background: PAPER, fontFamily: FONT_BODY, width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <T size={11} color={INK_2} style={{ fontFamily: FONT_MONO, letterSpacing: 1 }}>JOURNEY 3</T>
          <H size={24}>Teacher creates &amp; assigns an exercise</H>
          <T size={12} color={INK_2}>Desktop · ~3 min</T>
        </div>
        <WBadge kind="teacher" />
      </Row>
      <Row style={{ alignItems: 'stretch', flexWrap: 'wrap', rowGap: 30 }}>
        <FNode sub="01 LOGIN" title="Log in" role="teacher">
          <Stack rows={[80, 80]} />
          <Btn role="teacher">Log in</Btn>
        </FNode>
        <FArrow />
        <FNode sub="19 MODULES" title="My modules" role="teacher">
          <Stack rows={[60, 50, 70]} />
          <Btn role="teacher">+ Module</Btn>
        </FNode>
        <FArrow label="+ Create" />
        <FNode sub="20 EDITOR" title="Module editor" role="teacher" accent>
          <T size={9} color={INK_2}>title · desc · level</T>
          <Stack rows={[80, 50]} />
        </FNode>
        <FArrow label="add exercise" />
        <FNode sub="21 EXERCISES" title="+ Exercise" role="teacher" accent>
          <T size={9} color={INK_2}>type / prompt / audio?</T>
          <Stack rows={[70, 90, 40]} />
        </FNode>
        <FArrow label="save · go to class" vert />
        <FNode sub="15 CLASS" title="Class detail (teacher)" role="teacher">
          <T size={9} color={INK_2}>tabs: roster · plans · assignments</T>
          <Stack rows={[80, 60, 70]} />
        </FNode>
        <FArrow label="+ New assignment" />
        <FNode sub="22 ASSIGN" title="Assignment creator" role="teacher" accent>
          <T size={9} color={INK_2}>1. pick exercise</T>
          <T size={9} color={INK_2}>2. pick class</T>
          <T size={9} color={INK_2}>3. due date</T>
          <Btn role="teacher">Assign →</Btn>
        </FNode>
        <FArrow label="confirm" dashed />
        <FNode sub="STUDENTS" title="Roster sees next login" role="student">
          <T size={9} color={INK_2}>18 students get it on</T>
          <T size={9} color={INK_2}>next dashboard load</T>
        </FNode>
      </Row>
    </div>
  );
}

// ---- J4 — Teacher grades submissions -----------------------------------
function F_J4() {
  return (
    <div style={{ padding: 20, background: PAPER, fontFamily: FONT_BODY, width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <T size={11} color={INK_2} style={{ fontFamily: FONT_MONO, letterSpacing: 1 }}>JOURNEY 4</T>
          <H size={24}>Teacher grades submissions (batch)</H>
          <T size={12} color={INK_2}>"Save &amp; next" loop · ~45s per submission</T>
        </div>
        <WBadge kind="teacher" />
      </Row>
      <Row style={{ alignItems: 'stretch', flexWrap: 'wrap', rowGap: 30 }}>
        <FNode sub="13 DASHBOARD" title="Teacher dashboard" role="teacher">
          <T size={10} style={{ fontWeight: 700 }}>18 ungraded</T>
          <Btn role="teacher">Grade →</Btn>
        </FNode>
        <FArrow />
        <FNode sub="23 INBOX" title="Submissions inbox" role="teacher" accent>
          <T size={9} color={INK_2}>filter: ungraded</T>
          <Stack rows={[80, 70, 80, 60]} />
        </FNode>
        <FArrow label="open first" />
        <FNode sub="24 GRADE" title="Grading screen" role="teacher" accent big>
          <Row gap={4}>
            <Col gap={2} style={{ flex: 1 }}>
              <T size={9} color={INK_2}>PROMPT</T>
              <Stack rows={[90, 80]} />
              <T size={9} color={INK_2}>RESPONSE</T>
              <Stack rows={[80, 70, 60]} />
            </Col>
            <Col gap={2} style={{ flex: 1 }}>
              <T size={9} color={INK_2}>SCORE</T>
              <div style={{ border: `1px solid ${SKETCH}`, padding: '2px 6px', fontFamily: FONT_HAND, fontWeight: 700 }}>85</div>
              <T size={9} color={INK_2}>COMMENTS</T>
              <Stack rows={[80, 80, 60]} />
              <Btn role="teacher">Save &amp; next →</Btn>
            </Col>
          </Row>
        </FNode>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'center', padding: '0 6px' }}>
          <T size={11} color={INK_2} style={{ fontStyle: 'italic' }}>auto-load next</T>
          <svg width="50" height="40" viewBox="0 0 50 40">
            <path d="M25 2 Q 48 20, 25 38 Q 2 20, 25 2 Z" stroke={SKETCH} strokeWidth="1.5" fill="none" strokeDasharray="3 3"/>
            <path d="M20 33 L 25 38 L 30 33" stroke={SKETCH} strokeWidth="1.5" fill="none"/>
          </svg>
          <T size={10} color={INK_2}>×18</T>
        </div>
        <FNode sub="24 GRADE" title="next submission" role="teacher">
          <T size={9} color={INK_2}>same screen,</T>
          <T size={9} color={INK_2}>fresh data</T>
        </FNode>
        <FArrow label="queue empty" dashed />
        <FNode sub="23 INBOX" title="Back to inbox" role="teacher">
          <T size={10} style={{ fontWeight: 700 }}>0 ungraded ✓</T>
          <Stack rows={[60, 60]} />
        </FNode>
      </Row>
    </div>
  );
}

// ---- J6 — Admin suspends a misbehaving user ----------------------------
function F_J6() {
  return (
    <div style={{ padding: 20, background: PAPER, fontFamily: FONT_BODY, width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <T size={11} color={INK_2} style={{ fontFamily: FONT_MONO, letterSpacing: 1 }}>JOURNEY 6</T>
          <H size={24}>Admin suspends a misbehaving user</H>
          <T size={12} color={INK_2}>Desktop · ~30s</T>
        </div>
        <WBadge kind="admin" />
      </Row>
      <Row style={{ alignItems: 'stretch', flexWrap: 'wrap', rowGap: 30 }}>
        <FNode sub="01 LOGIN" title="Admin logs in" role="admin">
          <Stack rows={[80, 80]} />
          <Btn role="admin">Log in</Btn>
        </FNode>
        <FArrow />
        <FNode sub="25 DASHBOARD" title="Admin dashboard" role="admin">
          <Stack rows={[40, 60, 50, 50]} />
        </FNode>
        <FArrow label="Users →" />
        <FNode sub="26 USERS" title="User management" role="admin" accent>
          <T size={9} color={INK_2}>search "mark v"</T>
          <Stack rows={[60]} />
          <Stack rows={[70]} />
        </FNode>
        <FArrow label="click row" />
        <FNode sub="27 EDIT" title="User detail" role="admin" accent>
          <T size={9} color={INK_2}>Mark Vey · student</T>
          <T size={9} color={INK_2}>status:</T>
          <Row gap={3}>
            {['active', 'suspended', 'inactive'].map((s,i) => (
              <div key={s} style={{ padding: '1px 5px', border: `1px solid ${SKETCH}`, fontFamily: FONT_HAND, fontSize: 8, background: i === 1 ? '#fadcd5' : 'transparent', fontWeight: i === 1 ? 700 : 400, borderRadius: 2 }}>{s}</div>
            ))}
          </Row>
          <Btn role="admin">Save</Btn>
        </FNode>
        <FArrow label="confirm" dashed />
        <FNode sub="TOAST" title="Saved · suspended" role="admin">
          <Col gap={3} style={{ alignItems: 'center', marginTop: 8 }}>
            <T size={20}>✓</T>
            <T size={10}>status updated</T>
          </Col>
        </FNode>
        <FArrow label="next request" />
        <FNode sub="USER SIDE" title="User gets 403" role="admin">
          <Col gap={4} style={{ alignItems: 'center', marginTop: 8 }}>
            <T size={24}>⊘</T>
            <T size={10} style={{ fontFamily: FONT_MONO, fontSize: 9 }}>HTTP 403</T>
            <T size={9} color={INK_2}>"account suspended"</T>
          </Col>
        </FNode>
      </Row>
    </div>
  );
}

// ---- Design tokens artboard --------------------------------------------
function Tokens() {
  return (
    <div style={{ padding: 22, fontFamily: FONT_BODY, background: PAPER, width: '100%', height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
      <H size={26}>Design tokens</H>
      <T size={12} color={INK_2} style={{ marginBottom: 14 }}>Single source of truth for the wireframes. Tweak the role lens to see accents change.</T>

      <H size={14} style={{ marginTop: 8 }}>Role accents</H>
      <Row gap={12} style={{ marginTop: 6, flexWrap: 'wrap' }}>
        {['student', 'teacher', 'admin'].map(r => (
          <WBox key={r} pad={10} style={{ width: 200 }}>
            <Row gap={8}>
              <div style={{ width: 36, height: 36, borderRadius: 4, background: accent(r), border: `1.3px solid ${SKETCH}` }} />
              <Col gap={1}>
                <T size={13} style={{ fontWeight: 700, textTransform: 'capitalize' }}>{r}</T>
                <T size={10} color={INK_2} style={{ fontFamily: FONT_MONO, fontSize: 9 }}>{ROLE_COLORS[r]}</T>
              </Col>
            </Row>
          </WBox>
        ))}
      </Row>

      <H size={14} style={{ marginTop: 16 }}>Greyscale</H>
      <Row gap={6} style={{ marginTop: 6 }}>
        {[['ink', INK], ['ink-2', INK_2], ['ink-3', INK_3], ['paper-2', PAPER_2], ['paper', PAPER]].map(([n, c]) => (
          <Col key={n} gap={3} style={{ alignItems: 'center' }}>
            <div style={{ width: 60, height: 40, background: c, border: `1.3px solid ${SKETCH}`, borderRadius: 3 }} />
            <T size={10} color={INK_2}>{n}</T>
          </Col>
        ))}
      </Row>

      <H size={14} style={{ marginTop: 16 }}>Status palette</H>
      <Row gap={5} style={{ marginTop: 6, flexWrap: 'wrap' }}>
        {['active','suspended','inactive','graded','ungraded','submitted','pending','beginner','intermediate','advanced','writing','speaking','quiz','student','teacher','admin'].map(k => (
          <WBadge key={k} kind={k} />
        ))}
      </Row>

      <H size={14} style={{ marginTop: 16 }}>Type</H>
      <Col gap={4}>
        <H size={26}>Caveat · headings · 26-28</H>
        <H size={18}>Caveat · sub-headings · 18-22</H>
        <T size={13}>Patrick Hand · body · 12-14</T>
        <T size={11} color={INK_2}>Patrick Hand · secondary · 10-12</T>
        <T size={11} style={{ fontFamily: FONT_MONO }}>JetBrains Mono · field text · 11</T>
      </Col>

      <H size={14} style={{ marginTop: 16 }}>Spacing &amp; radius</H>
      <Row gap={8} style={{ marginTop: 6 }}>
        {[4, 8, 12, 16, 24].map(s => (
          <Col key={s} gap={3} style={{ alignItems: 'center' }}>
            <div style={{ width: s, height: 28, background: SKETCH }} />
            <T size={10} color={INK_2}>{s}</T>
          </Col>
        ))}
        <div style={{ width: 24 }} />
        <Col gap={3} style={{ alignItems: 'center' }}><div style={{ width: 36, height: 36, border: `1.3px solid ${SKETCH}`, borderRadius: 0 }} /><T size={10} color={INK_2}>0</T></Col>
        <Col gap={3} style={{ alignItems: 'center' }}><div style={{ width: 36, height: 36, border: `1.3px solid ${SKETCH}`, borderRadius: 3 }} /><T size={10} color={INK_2}>3</T></Col>
        <Col gap={3} style={{ alignItems: 'center' }}><div style={{ width: 36, height: 36, border: `1.3px solid ${SKETCH}`, borderRadius: 14 }} /><T size={10} color={INK_2}>pill</T></Col>
        <Col gap={3} style={{ alignItems: 'center' }}><div style={{ width: 36, height: 36, border: `1.3px solid ${SKETCH}`, borderRadius: 18 }} /><T size={10} color={INK_2}>round</T></Col>
      </Row>
    </div>
  );
}

// ---- Component library artboard ----------------------------------------
function Components() {
  return (
    <div style={{ padding: 22, fontFamily: FONT_BODY, background: PAPER, width: '100%', height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
      <H size={26}>Components</H>
      <T size={12} color={INK_2} style={{ marginBottom: 14 }}>The reusable kit. Use as-is in every screen.</T>

      <H size={14}>Buttons</H>
      <Row gap={8} style={{ marginTop: 6 }} wrap>
        <WBtn primary>Primary</WBtn>
        <WBtn>Secondary</WBtn>
        <WBtn ghost>Ghost</WBtn>
        <WBtn danger>Delete</WBtn>
        <WBtn sm primary>Primary sm</WBtn>
        <WBtn sm>Secondary sm</WBtn>
      </Row>

      <H size={14} style={{ marginTop: 14 }}>Form fields</H>
      <Row gap={10} style={{ marginTop: 6, maxWidth: 600 }}>
        <WField label="Email" value="mei@school.edu" style={{ flex: 1 }} />
        <WField label="Password" value="secret" type="password" style={{ flex: 1 }} />
      </Row>
      <div style={{ maxWidth: 600, marginTop: 8 }}>
        <WField label="Textarea" value="A multiline response goes here…" multi h={60} />
      </div>

      <H size={14} style={{ marginTop: 14 }}>Badges</H>
      <Row gap={5} style={{ marginTop: 6 }} wrap>
        {['active','suspended','inactive','graded','ungraded','beginner','intermediate','advanced','writing','speaking','quiz','student','teacher','admin'].map(k => (
          <WBadge key={k} kind={k} />
        ))}
      </Row>

      <H size={14} style={{ marginTop: 14 }}>Avatar / progress / squiggle</H>
      <Row gap={12} style={{ marginTop: 6, alignItems: 'center' }}>
        <WAvatar name="Mei L" size={28} />
        <WAvatar name="J Park" size={36} />
        <WAvatar name="Sara K" size={44} />
        <div style={{ width: 140, height: 8, border: `1px solid ${SKETCH}`, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: '62%', height: '100%', background: accent('student') }} />
        </div>
        <T size={11} color={INK_2}>62%</T>
        <div style={{ flex: 1, maxWidth: 200 }}><WSquiggle /></div>
      </Row>

      <H size={14} style={{ marginTop: 14 }}>Cards · tables · modal</H>
      <Row gap={10} style={{ marginTop: 6, alignItems: 'stretch' }}>
        <WBox pad={10} style={{ width: 200 }}>
          <T size={12} style={{ fontWeight: 700 }}>Card title</T>
          <T size={11} color={INK_2}>Subtitle here</T>
          <Row style={{ marginTop: 6 }}><WBadge kind="writing" /></Row>
        </WBox>
        <WBox pad={10} accentBg style={{ width: 200 }}>
          <T size={12} style={{ fontWeight: 700 }}>Card · accent bg</T>
          <T size={11} color={INK_2}>Used for "active" items</T>
        </WBox>
        <WBox pad={10} dashed style={{ width: 200 }}>
          <T size={12} style={{ fontWeight: 700, color: INK_3 }}>+ Empty / add</T>
        </WBox>
      </Row>

      <H size={14} style={{ marginTop: 14 }}>URL field (audio / avatar mock)</H>
      <div style={{ maxWidth: 500 }}>
        <WField label="Audio URL" value="https://drive.google.com/.../recording.mp3" />
        <T size={11} color={INK_3} style={{ fontStyle: 'italic', marginTop: 3 }}>
          📎 paste URL — real file upload coming soon
        </T>
      </div>

      <WNote n="i" style={{ marginTop: 14, maxWidth: 600 }}>
        Same URL-field pattern is used for avatars (profile) &amp; audio prompts (exercise) — single component, one consistent affordance.
      </WNote>
    </div>
  );
}

Object.assign(window, { F_J1, F_J3, F_J4, F_J6, Tokens, Components });
