// Teacher screens (desktop, 1080×680). Screens 13-24 + nav & dashboard variations.

// ---- 13. Teacher dashboard (default — cards) ---------------------------
function T13_TeacherDashboard() {
  return (
    <WDesktopFrame title="Dashboard" active="Dashboard">
      <ScreenTitle sub="Tuesday, October 8 · welcome back, Mr. Park">Dashboard</ScreenTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { n: '3', l: 'My classes' },
          { n: '18', l: 'Ungraded subs', accent: true },
          { n: '7', l: 'My modules' },
          { n: '42', l: 'Students enrolled' },
        ].map(s => (
          <WBox key={s.l} pad={12} accentBg={s.accent}>
            <H size={28}>{s.n}</H>
            <T size={12} color={INK_2}>{s.l}</T>
          </WBox>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginTop: 14 }}>
        <Col gap={8}>
          <H size={15}>Pending to grade</H>
          {[
            { s: 'Mei Lin', e: 'Essay: My Hometown', c: 'ENG-201', when: '2h ago' },
            { s: 'Jose A', e: 'Speaking — Café', c: 'ENG-105', when: '4h ago' },
            { s: 'Aisha K', e: 'Essay: My Hometown', c: 'ENG-201', when: '6h ago' },
            { s: 'Riku I',  e: 'Quiz — Past tense', c: 'ENG-201', when: '1d ago' },
          ].map((r,i) => (
            <Row key={i} gap={8} style={{ padding: '6px 8px', border: `1px dashed ${INK_3}`, borderRadius: 3, justifyContent: 'space-between' }}>
              <Row gap={8}><WAvatar name={r.s} size={26} /><Col gap={1}><T size={12} style={{ fontWeight: 700 }}>{r.s}</T><T size={11} color={INK_2}>{r.e} · {r.c}</T></Col></Row>
              <Row gap={6}><T size={10} color={INK_3}>{r.when}</T><WBtn sm primary>Grade →</WBtn></Row>
            </Row>
          ))}
          <T size={11} color={INK_2}>· 14 more</T>
        </Col>
        <Col gap={8}>
          <H size={15}>My classes</H>
          {[
            { n: 'ENG-201 Intermediate', st: 18, due: 2 },
            { n: 'ENG-105 Pronunciation', st: 14, due: 0 },
            { n: 'ENG-302 Business', st: 10, due: 1 },
          ].map(c => (
            <WBox key={c.n} pad={9}>
              <T size={12} style={{ fontWeight: 700 }}>{c.n}</T>
              <Row gap={6} style={{ marginTop: 2 }}>
                <T size={11} color={INK_2}>{c.st} students</T>
                {c.due > 0 && <WBadge kind="ungraded">{c.due} to grade</WBadge>}
              </Row>
            </WBox>
          ))}
          <H size={15} style={{ marginTop: 6 }}>Recent activity</H>
          <T size={11} color={INK_2}>• Aisha submitted Essay · 6h</T>
          <T size={11} color={INK_2}>• You assigned Speaking · 1d</T>
          <T size={11} color={INK_2}>• Jose enrolled in ENG-105 · 2d</T>
        </Col>
      </div>
    </WDesktopFrame>
  );
}

// ---- Teacher dashboard density variations (3) --------------------------
function T13v_Cards() { return <T13_TeacherDashboard />; }

function T13v_List() {
  return (
    <WDesktopFrame title="Dashboard" active="Dashboard">
      <ScreenTitle sub="Compact list · everything in one table">Dashboard</ScreenTitle>
      <Row gap={12} style={{ marginBottom: 10 }}>
        <T size={12} color={INK_2}>3 classes · 18 ungraded · 42 students · 7 modules</T>
        <div style={{ flex: 1 }} />
        <WBtn sm primary>+ New class</WBtn>
        <WBtn sm>+ New module</WBtn>
      </Row>
      <H size={14}>Pending submissions</H>
      <div style={{ border: `1.3px solid ${SKETCH}`, borderRadius: 3, marginTop: 6 }}>
        <Row style={{ borderBottom: `1px solid ${SKETCH}`, background: PAPER_2, padding: '4px 10px', fontFamily: FONT_HAND, fontSize: 12, color: INK_2 }}>
          <div style={{ width: 140 }}>Student</div>
          <div style={{ flex: 1 }}>Exercise</div>
          <div style={{ width: 110 }}>Class</div>
          <div style={{ width: 80 }}>When</div>
          <div style={{ width: 80 }}>Type</div>
          <div style={{ width: 80 }}></div>
        </Row>
        {[
          ['Mei Lin','Essay: My Hometown','ENG-201','2h','writing'],
          ['Jose A','Speaking — Café','ENG-105','4h','speaking'],
          ['Aisha K','Essay: My Hometown','ENG-201','6h','writing'],
          ['Riku I','Quiz — Past tense','ENG-201','1d','quiz'],
          ['Tara P','Speaking — Shopping','ENG-201','1d','speaking'],
        ].map((r,i) => (
          <Row key={i} style={{ padding: '5px 10px', borderBottom: `1px dashed ${INK_3}`, alignItems: 'center' }}>
            <Row gap={6} style={{ width: 140 }}><WAvatar name={r[0]} size={22} /><T size={11}>{r[0]}</T></Row>
            <T size={11} style={{ flex: 1 }}>{r[1]}</T>
            <T size={11} color={INK_2} style={{ width: 110 }}>{r[2]}</T>
            <T size={11} color={INK_3} style={{ width: 80 }}>{r[3]}</T>
            <div style={{ width: 80 }}><WBadge kind={r[4]} /></div>
            <div style={{ width: 80 }}><WBtn sm primary>Grade</WBtn></div>
          </Row>
        ))}
      </div>
      <WNote>List view is best when teacher's main job is plowing through ungraded queue.</WNote>
    </WDesktopFrame>
  );
}

function T13v_Feed() {
  return (
    <WDesktopFrame title="Dashboard" active="Dashboard">
      <ScreenTitle sub="Activity feed — chronological across all classes">Dashboard</ScreenTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        <Col gap={8}>
          {[
            { when: 'Just now', txt: 'Mei Lin submitted Essay: My Hometown', cls: 'ENG-201', cta: 'Grade now', k: 'writing' },
            { when: '2h', txt: 'Jose A submitted Speaking — Café', cls: 'ENG-105', cta: 'Grade now', k: 'speaking' },
            { when: '4h', txt: 'You assigned Speaking — Shopping (due Fri)', cls: 'ENG-201', cta: 'View', k: null },
            { when: '1d', txt: '3 students completed Quiz — Past tense', cls: 'ENG-201', cta: 'Review', k: 'quiz' },
            { when: '2d', txt: 'You created module Academic Writing', cls: null, cta: 'Open', k: null },
          ].map((e,i) => (
            <WBox key={i} pad={9}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Col gap={1} style={{ flex: 1 }}>
                  <T size={10} color={INK_3}>{e.when} ago{e.cls ? ` · ${e.cls}` : ''}</T>
                  <T size={12}>{e.txt}</T>
                </Col>
                <Row gap={6}>
                  {e.k && <WBadge kind={e.k} />}
                  <WBtn sm primary={!!e.k && e.k !== 'quiz'}>{e.cta}</WBtn>
                </Row>
              </Row>
            </WBox>
          ))}
        </Col>
        <Col gap={10}>
          <WBox pad={10}><T size={11} color={INK_2}>This week</T><H size={22}>18 to grade</H></WBox>
          <WBox pad={10}><T size={11} color={INK_2}>Avg turnaround</T><H size={22}>1.4 days</H></WBox>
          <H size={13}>Quick links</H>
          <WBtn sm>+ Assign exercise</WBtn>
          <WBtn sm>+ New class</WBtn>
          <WBtn sm>+ New module</WBtn>
        </Col>
      </div>
    </WDesktopFrame>
  );
}

// ---- Nav pattern variations (3) ----------------------------------------
// Reuse the dashboard content but swap chrome
function NavVariant({ nav }) {
  const role = 'teacher';
  if (nav === 'top') {
    return (
      <div style={{ width: '100%', height: '100%', background: PAPER, fontFamily: FONT_BODY, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 18px', borderBottom: `2px solid ${accent(role)}`, display: 'flex', alignItems: 'center', gap: 18 }}>
          <H size={20}>engl.app</H>
          <Row gap={14} style={{ fontFamily: FONT_HAND, fontSize: 14 }}>
            {['Dashboard', 'My Classes', 'Modules', 'Submissions', 'Profile'].map((t,i) => (
              <div key={t} style={{
                paddingBottom: 2, borderBottom: i === 0 ? `2px solid ${accent(role)}` : 'none',
                fontWeight: i === 0 ? 700 : 400, color: i === 0 ? SKETCH : INK_2,
              }}>{t}</div>
            ))}
          </Row>
          <div style={{ flex: 1 }} />
          <WBadge kind="teacher" />
          <WAvatar name="J Park" size={26} />
        </div>
        <div style={{ flex: 1, padding: 18, overflow: 'auto' }}>
          <ScreenTitle sub="A — Top nav: more horizontal real estate; fewer nav items.">Dashboard</ScreenTitle>
          <NavDashContent />
        </div>
      </div>
    );
  }
  if (nav === 'sidebar') {
    return (
      <WDesktopFrame title="Dashboard" active="Dashboard">
        <ScreenTitle sub="B — Sidebar: roomy for many sections (admin needs this).">Dashboard</ScreenTitle>
        <NavDashContent />
      </WDesktopFrame>
    );
  }
  // hybrid
  return (
    <div style={{ width: '100%', height: '100%', background: PAPER, fontFamily: FONT_BODY, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 44, padding: '0 18px', borderBottom: `2px solid ${accent(role)}`, display: 'flex', alignItems: 'center', gap: 18 }}>
        <H size={20}>engl.app</H>
        <Row gap={14} style={{ fontFamily: FONT_HAND, fontSize: 14 }}>
          {['Teach', 'Learn'].map((t,i) => (
            <div key={t} style={{
              paddingBottom: 2, borderBottom: i === 0 ? `2px solid ${accent(role)}` : 'none',
              fontWeight: i === 0 ? 700 : 400, color: i === 0 ? SKETCH : INK_2,
            }}>{t}</div>
          ))}
        </Row>
        <div style={{ flex: 1 }} />
        <WBadge kind="teacher" />
        <WAvatar name="J Park" size={26} />
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ width: 56, borderRight: `1.3px solid ${SKETCH}`, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', background: PAPER_2 }}>
          {['◧','◫','✎','⌖','⚑'].map((g, i) => (
            <div key={i} style={{
              width: 30, height: 30, borderRadius: 3,
              border: i === 0 ? `1.3px solid ${SKETCH}` : 'none',
              background: i === 0 ? `color-mix(in oklch, ${accent(role)} 20%, ${PAPER})` : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_HAND, fontSize: 18,
            }}>{g}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 18, overflow: 'auto' }}>
          <ScreenTitle sub="C — Hybrid: top mode-switch (Teach/Learn) + thin icon rail.">Dashboard</ScreenTitle>
          <NavDashContent />
        </div>
      </div>
    </div>
  );
}

function NavDashContent() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
      {[['3','classes'],['18','to grade'],['7','modules'],['42','students']].map(([n,l]) => (
        <WBox key={l} pad={10}><H size={22}>{n}</H><T size={11} color={INK_2}>{l}</T></WBox>
      ))}
    </div>
  );
}

function T_NavTop() { return <NavVariant nav="top" />; }
function T_NavSidebar() { return <NavVariant nav="sidebar" />; }
function T_NavHybrid() { return <NavVariant nav="hybrid" />; }

// ---- 14. My classes (teacher) ------------------------------------------
function T14_MyClasses() {
  return (
    <WDesktopFrame title="My classes" active="My Classes">
      <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <ScreenTitle sub="3 active classes · AY 2024-25">My classes</ScreenTitle>
        <WBtn primary>+ Create class</WBtn>
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { n: 'ENG-201 Intermediate', st: 18, due: 2, lp: 6 },
          { n: 'ENG-105 Pronunciation', st: 14, due: 0, lp: 4 },
          { n: 'ENG-302 Business', st: 10, due: 1, lp: 3 },
        ].map(c => (
          <WBox key={c.n} pad={12}>
            <T size={14} style={{ fontWeight: 700 }}>{c.n}</T>
            <T size={11} color={INK_2}>AY 2024-25 · {c.st} students</T>
            <div style={{ height: 1, borderTop: `1px dashed ${INK_3}`, margin: '8px 0' }} />
            <Col gap={3}>
              <T size={11}>📋 {c.lp} lesson plans</T>
              <T size={11}>📝 {c.due} ungraded</T>
            </Col>
            <Row gap={6} style={{ marginTop: 8 }}>
              <WBtn sm>Open</WBtn>
              <WBtn sm ghost>Rename · Archive</WBtn>
            </Row>
          </WBox>
        ))}
        <WBox pad={12} dashed style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK_3, fontFamily: FONT_HAND, fontSize: 16, minHeight: 130 }}>
          + Create class
        </WBox>
      </div>
    </WDesktopFrame>
  );
}

// ---- 15. Class detail (teacher) ----------------------------------------
function T15_ClassDetailTeacher() {
  return (
    <WDesktopFrame title="ENG-201" active="My Classes">
      <Row style={{ justifyContent: 'space-between' }}>
        <ScreenTitle sub="Mr. Park · AY 2024-25 · 18 students">ENG-201 Intermediate</ScreenTitle>
        <Row gap={6}><WBtn sm>Rename</WBtn><WBtn sm>Archive</WBtn></Row>
      </Row>
      <Row gap={2} style={{ borderBottom: `1.3px solid ${SKETCH}`, marginTop: 4 }}>
        {['Roster (18)', 'Lesson plans (6)', 'Assignments (12)'].map((t, i) => (
          <div key={t} style={{
            padding: '5px 12px', fontFamily: FONT_HAND, fontSize: 14,
            borderBottom: i === 0 ? `2px solid ${accent('teacher')}` : 'none',
            fontWeight: i === 0 ? 700 : 400, color: i === 0 ? SKETCH : INK_2,
          }}>{t}</div>
        ))}
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginTop: 10 }}>
        <Col gap={6}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H size={14}>Roster</H>
            <WBtn sm primary>+ Add student</WBtn>
          </Row>
          <div style={{ border: `1.3px solid ${SKETCH}`, borderRadius: 3 }}>
            <Row style={{ background: PAPER_2, padding: '4px 10px', borderBottom: `1px solid ${SKETCH}`, fontFamily: FONT_HAND, fontSize: 12, color: INK_2 }}>
              <div style={{ width: 28 }}></div>
              <div style={{ flex: 1 }}>Name</div>
              <div style={{ width: 110 }}>Joined</div>
              <div style={{ width: 80 }}>Submissions</div>
              <div style={{ width: 70 }}></div>
            </Row>
            {[
              ['Mei Lin','Sep 5', 8],
              ['Jose Alvarez','Sep 5', 7],
              ['Aisha Khan','Sep 5', 8],
              ['Riku Ito','Sep 6', 6],
              ['Tara Patel','Sep 8', 5],
            ].map((r,i) => (
              <Row key={i} style={{ padding: '5px 10px', borderBottom: `1px dashed ${INK_3}`, alignItems: 'center' }}>
                <WAvatar name={r[0]} size={22} />
                <T size={11} style={{ flex: 1, marginLeft: 8 }}>{r[0]}</T>
                <T size={11} color={INK_2} style={{ width: 110 }}>{r[1]}</T>
                <T size={11} color={INK_2} style={{ width: 80 }}>{r[2]}</T>
                <T size={11} color={INK_3} style={{ width: 70, textAlign: 'right' }}>remove</T>
              </Row>
            ))}
          </div>
        </Col>
        <Col gap={8}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H size={14}>Assignments</H>
            <WBtn sm primary>+ New</WBtn>
          </Row>
          {[
            { t: 'Essay: My Hometown', d: 'due Wed', stat: '8/18 in' },
            { t: 'Speaking — Shopping', d: 'due Fri', stat: '0/18' },
            { t: 'Quiz — Past tense', d: 'closed', stat: '18/18 graded' },
          ].map(a => (
            <WBox key={a.t} pad={8}>
              <T size={12} style={{ fontWeight: 700 }}>{a.t}</T>
              <Row gap={5} style={{ marginTop: 2 }}>
                <T size={10} color={INK_2}>{a.d}</T><T size={10} color={INK_3}>· {a.stat}</T>
              </Row>
            </WBox>
          ))}
        </Col>
      </div>
    </WDesktopFrame>
  );
}

// ---- 16. Create/edit class ---------------------------------------------
function T16_CreateClass() {
  return (
    <WDesktopFrame title="New class" active="My Classes">
      <Row style={{ justifyContent: 'space-between' }}>
        <ScreenTitle sub="Modal/sheet over the My Classes page">Create class</ScreenTitle>
      </Row>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <WBox pad={18} style={{ width: 460, background: PAPER }}>
          <H size={18} style={{ marginBottom: 12 }}>Create class</H>
          <Col gap={10}>
            <WField label="Class name" value="ENG-201 Intermediate" />
            <Row gap={10}>
              <WField label="Academic year" value="2024-25" style={{ flex: 1 }} />
              <WField label="Code (auto)" value="ENG201-24A" style={{ flex: 1 }} />
            </Row>
            <T size={11} color={INK_3} style={{ fontStyle: 'italic' }}>Students can join by code or by your invitation.</T>
            <Row gap={8} style={{ marginTop: 6, justifyContent: 'flex-end' }}>
              <WBtn>Cancel</WBtn>
              <WBtn primary>Create class</WBtn>
            </Row>
          </Col>
        </WBox>
      </div>
    </WDesktopFrame>
  );
}

// ---- 17. Enroll students -----------------------------------------------
function T17_EnrollStudents() {
  return (
    <WDesktopFrame title="ENG-201 / Enroll" active="My Classes">
      <ScreenTitle sub="Search by email or name · filtered to role=student">Add students to ENG-201</ScreenTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
        <Col gap={8}>
          <WField placeholder="search students by name or email…" value="mei" />
          <T size={11} color={INK_2}>3 matches</T>
          <div style={{ border: `1.3px solid ${SKETCH}`, borderRadius: 3 }}>
            {[
              ['Mei Lin', 'mei@school.edu', true, true],
              ['Mei Chang', 'mei.c@school.edu', false, false],
              ['Meisha B', 'meisha@school.edu', false, false],
            ].map(([n,e,enr,sel]) => (
              <Row key={e} style={{ padding: '7px 10px', borderBottom: `1px dashed ${INK_3}`, alignItems: 'center' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 3, border: `1.3px solid ${SKETCH}`,
                  background: sel ? accent('teacher') : 'transparent',
                  color: PAPER, fontFamily: FONT_HAND, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8,
                }}>{sel ? '✓' : ''}</div>
                <WAvatar name={n} size={22} />
                <Col gap={0} style={{ flex: 1, marginLeft: 8 }}>
                  <T size={12} style={{ fontWeight: 700 }}>{n}</T>
                  <T size={10} color={INK_2}>{e}</T>
                </Col>
                {enr && <WBadge kind="active">already enrolled</WBadge>}
              </Row>
            ))}
          </div>
        </Col>
        <Col gap={8}>
          <H size={14}>To add (1)</H>
          <WBox pad={8}>
            <Row gap={8}><WAvatar name="Mei Chang" size={22} /><T size={12} style={{ flex: 1 }}>Mei Chang</T><T size={11} color={INK_3}>✕</T></Row>
          </WBox>
          <WBtn primary style={{ marginTop: 6 }}>Add 1 student to ENG-201</WBtn>
          <WNote>Bulk add via email paste is a future enhancement; not in MVP.</WNote>
        </Col>
      </div>
    </WDesktopFrame>
  );
}

// ---- 18. Lesson plan editor --------------------------------------------
function T18_LessonPlanEditor() {
  return (
    <WDesktopFrame title="Lesson plan" active="My Classes">
      <Row style={{ justifyContent: 'space-between' }}>
        <ScreenTitle sub="ENG-201 · plan #3">Edit lesson plan</ScreenTitle>
        <Row gap={6}><WBtn sm>Cancel</WBtn><WBtn sm primary>Save plan</WBtn></Row>
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <Col gap={10}>
          <WField label="Title" value="Week 3 — Past tenses in storytelling" />
          <div>
            <T size={12} color={INK_2}>Objectives</T>
            <div style={{
              border: `1.3px solid ${SKETCH}`, borderRadius: 3, padding: 10,
              minHeight: 220, background: PAPER, fontFamily: FONT_MONO, fontSize: 11, lineHeight: 1.5,
            }}>
              • Distinguish past simple vs past continuous{'\n'}
              • Use sequencers (then, after, finally){'\n'}
              • Tell a 90-second personal story{'\n\n'}
              [rich-text or plaintext per stakeholder]
            </div>
          </div>
        </Col>
        <Col gap={10}>
          <Row gap={10}>
            <WField label="Start date" value="Oct 7, 2024" style={{ flex: 1 }} />
            <WField label="End date" value="Oct 13, 2024" style={{ flex: 1 }} />
          </Row>
          <H size={13}>Linked exercises</H>
          <WBox pad={8}><T size={11} style={{ fontWeight: 700 }}>Essay: My Hometown</T><T size={10} color={INK_2}>writing</T></WBox>
          <WBox pad={8}><T size={11} style={{ fontWeight: 700 }}>Speaking — Shopping</T><T size={10} color={INK_2}>speaking</T></WBox>
          <WBtn sm>+ Link exercise</WBtn>
          <WNote>Linked from teacher's modules; doesn't auto-assign.</WNote>
        </Col>
      </div>
    </WDesktopFrame>
  );
}

// ---- 19. My modules ----------------------------------------------------
function T19_MyModules() {
  return (
    <WDesktopFrame title="Modules" active="Modules">
      <Row style={{ justifyContent: 'space-between' }}>
        <ScreenTitle sub="7 modules · 41 exercises total">My modules</ScreenTitle>
        <WBtn primary>+ Create module</WBtn>
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { t: 'Travel & Tourism', d: 'intermediate', ex: 8 },
          { t: 'Daily Conversation', d: 'beginner', ex: 12 },
          { t: 'Academic Writing', d: 'advanced', ex: 10 },
          { t: 'Business Email', d: 'intermediate', ex: 6 },
          { t: 'Pronunciation Drills', d: 'beginner', ex: 5 },
        ].map(m => (
          <WBox key={m.t} pad={10}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T size={13} style={{ fontWeight: 700 }}>{m.t}</T>
              <WBadge kind={m.d} />
            </Row>
            <T size={11} color={INK_2}>{m.ex} exercises</T>
            <Row gap={5} style={{ marginTop: 8 }}>
              <WBtn sm>Edit</WBtn>
              <WBtn sm ghost>·</WBtn>
            </Row>
          </WBox>
        ))}
        <WBox pad={10} dashed style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100, color: INK_3 }}>
          + Create module
        </WBox>
      </div>
    </WDesktopFrame>
  );
}

// ---- 20. Module editor -------------------------------------------------
function T20_ModuleEditor() {
  return (
    <WDesktopFrame title="Edit module" active="Modules">
      <ScreenTitle sub="Editing 'Travel & Tourism'">Module editor</ScreenTitle>
      <Row gap={2} style={{ borderBottom: `1.3px solid ${SKETCH}`, marginBottom: 12 }}>
        {['Overview', 'Exercises (8)'].map((t, i) => (
          <div key={t} style={{
            padding: '5px 12px', fontFamily: FONT_HAND, fontSize: 14,
            borderBottom: i === 0 ? `2px solid ${accent('teacher')}` : 'none',
            fontWeight: i === 0 ? 700 : 400, color: i === 0 ? SKETCH : INK_2,
          }}>{t}</div>
        ))}
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <Col gap={10}>
          <WField label="Title" value="Travel & Tourism" />
          <div>
            <T size={12} color={INK_2}>Description</T>
            <div style={{ border: `1.3px solid ${SKETCH}`, borderRadius: 3, padding: 10, minHeight: 100, fontFamily: FONT_MONO, fontSize: 11 }}>
              Build confidence booking hotels, ordering food, and asking for directions.
            </div>
          </div>
          <div>
            <T size={12} color={INK_2}>Difficulty</T>
            <Row gap={6} style={{ marginTop: 4 }}>
              {['beginner', 'intermediate', 'advanced'].map((d, i) => (
                <div key={d} style={{
                  padding: '4px 12px', borderRadius: 14,
                  border: `1.3px solid ${SKETCH}`,
                  background: i === 1 ? accent('teacher') : 'transparent',
                  color: i === 1 ? PAPER : SKETCH,
                  fontFamily: FONT_HAND, fontSize: 13,
                }}>{d}</div>
              ))}
            </Row>
          </div>
        </Col>
        <Col gap={8}>
          <H size={13}>Quick stats</H>
          <WBox pad={9}><T size={11} color={INK_2}>Used in classes</T><T size={14} style={{ fontWeight: 700 }}>2 classes</T></WBox>
          <WBox pad={9}><T size={11} color={INK_2}>Total submissions</T><T size={14} style={{ fontWeight: 700 }}>87</T></WBox>
          <WBox pad={9}><T size={11} color={INK_2}>Average score</T><T size={14} style={{ fontWeight: 700 }}>78 / 100</T></WBox>
          <Row gap={6} style={{ marginTop: 8 }}>
            <WBtn sm primary>Save</WBtn>
            <WBtn sm>Cancel</WBtn>
            <div style={{ flex: 1 }} />
            <WBtn sm danger>Delete</WBtn>
          </Row>
        </Col>
      </div>
    </WDesktopFrame>
  );
}

// ---- 21. Exercises tab inside module editor ----------------------------
function T21_ExercisesTab() {
  return (
    <WDesktopFrame title="Module / Exercises" active="Modules">
      <ScreenTitle sub="Editing 'Travel & Tourism' · 8 exercises">Module · Exercises</ScreenTitle>
      <Row gap={2} style={{ borderBottom: `1.3px solid ${SKETCH}`, marginBottom: 12 }}>
        {['Overview', 'Exercises (8)'].map((t, i) => (
          <div key={t} style={{
            padding: '5px 12px', fontFamily: FONT_HAND, fontSize: 14,
            borderBottom: i === 1 ? `2px solid ${accent('teacher')}` : 'none',
            fontWeight: i === 1 ? 700 : 400, color: i === 1 ? SKETCH : INK_2,
          }}>{t}</div>
        ))}
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 14 }}>
        <Col gap={6}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H size={14}>Exercises</H>
            <WBtn sm primary>+ Add</WBtn>
          </Row>
          {[
            { i: 1, t: 'Greetings at hotels', k: 'writing' },
            { i: 2, t: 'Ordering food', k: 'speaking' },
            { i: 3, t: 'Asking directions', k: 'speaking', active: true },
            { i: 4, t: 'Buying tickets', k: 'quiz' },
            { i: 5, t: 'Cultural notes', k: 'writing' },
          ].map(e => (
            <Row key={e.i} gap={8} style={{
              padding: '6px 10px',
              border: `1.3px ${e.active ? 'solid' : 'dashed'} ${e.active ? SKETCH : INK_3}`,
              borderRadius: 3,
              background: e.active ? `color-mix(in oklch, ${accent('teacher')} 16%, ${PAPER})` : PAPER,
            }}>
              <T size={11} color={INK_3} style={{ width: 16 }}>⋮⋮</T>
              <T size={11} color={INK_2}>{e.i}</T>
              <T size={12} style={{ flex: 1, fontWeight: e.active ? 700 : 400 }}>{e.t}</T>
              <WBadge kind={e.k} />
            </Row>
          ))}
        </Col>
        <Col gap={8}>
          <H size={14}>Add / edit exercise</H>
          <div>
            <T size={12} color={INK_2}>Type</T>
            <Row gap={5} style={{ marginTop: 4 }}>
              {['writing', 'speaking', 'quiz'].map((k, i) => (
                <div key={k} style={{
                  padding: '4px 12px', borderRadius: 14, border: `1.3px solid ${SKETCH}`,
                  background: i === 1 ? accent('teacher') : 'transparent',
                  color: i === 1 ? PAPER : SKETCH, fontFamily: FONT_HAND, fontSize: 13,
                }}>{k}</div>
              ))}
            </Row>
          </div>
          <WField label="Title" value="Asking directions" />
          <div>
            <T size={12} color={INK_2}>Prompt text</T>
            <div style={{ border: `1.3px solid ${SKETCH}`, borderRadius: 3, padding: 8, minHeight: 70, fontFamily: FONT_MONO, fontSize: 11 }}>
              Listen to the dialog, then respond as if you are lost in a new city.
            </div>
          </div>
          <WField label="Audio prompt URL (optional)" value="https://cdn…/directions.mp3" />
          <T size={10} color={INK_3} style={{ fontStyle: 'italic' }}>paste URL — file upload coming soon</T>
          <Row gap={6} style={{ marginTop: 6 }}>
            <WBtn sm primary>Save exercise</WBtn>
            <WBtn sm>Cancel</WBtn>
          </Row>
        </Col>
      </div>
    </WDesktopFrame>
  );
}

// ---- 22. Assignment creator --------------------------------------------
function T22_AssignmentCreator() {
  return (
    <WDesktopFrame title="New assignment" active="My Classes">
      <ScreenTitle sub="Drop a teacher-owned exercise on a class">Create assignment</ScreenTitle>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <WBox pad={16} style={{ width: 560 }}>
          <H size={16} style={{ marginBottom: 12 }}>New assignment</H>
          <Col gap={10}>
            <div>
              <T size={12} color={INK_2}>1. Pick exercise (from your modules)</T>
              <WField placeholder="search…" value="Essay: My Hometown" />
              <T size={10} color={INK_3}>Travel & Tourism · writing · 100-150 words</T>
            </div>
            <div>
              <T size={12} color={INK_2}>2. Pick class</T>
              <Row gap={6} style={{ marginTop: 4 }} wrap>
                {[['ENG-201', true], ['ENG-105', false], ['ENG-302', false]].map(([n, sel]) => (
                  <div key={n} style={{
                    padding: '4px 12px', borderRadius: 4, border: `1.3px solid ${SKETCH}`,
                    background: sel ? accent('teacher') : 'transparent',
                    color: sel ? PAPER : SKETCH, fontFamily: FONT_HAND, fontSize: 13,
                  }}>{n}</div>
                ))}
              </Row>
            </div>
            <WField label="3. Due date" value="Wed Oct 16, 11:59 pm" />
            <T size={11} color={INK_2}>18 students will see this on next login</T>
            <Row gap={8} style={{ marginTop: 6, justifyContent: 'flex-end' }}>
              <WBtn>Cancel</WBtn>
              <WBtn primary>Assign →</WBtn>
            </Row>
          </Col>
        </WBox>
      </div>
    </WDesktopFrame>
  );
}

// ---- 23. Submissions inbox ---------------------------------------------
function T23_SubmissionsInbox() {
  return (
    <WDesktopFrame title="Submissions" active="Submissions">
      <ScreenTitle sub="18 ungraded · 67 graded · across 3 classes">Submissions inbox</ScreenTitle>
      <Row gap={8} style={{ marginBottom: 8 }}>
        {[['All','#'],['Ungraded','18'],['Graded','67']].map(([t,c],i) => (
          <div key={t} style={{
            padding: '3px 10px', borderRadius: 12, border: `1.3px solid ${SKETCH}`,
            background: i === 1 ? SKETCH : 'transparent', color: i === 1 ? PAPER : SKETCH,
            fontFamily: FONT_HAND, fontSize: 12,
          }}>{t} <span style={{ opacity: .7 }}>({c})</span></div>
        ))}
        <div style={{ flex: 1 }} />
        <T size={11} color={INK_2}>Class:</T>
        <div style={{ padding: '3px 10px', border: `1.3px solid ${SKETCH}`, borderRadius: 3, fontFamily: FONT_HAND, fontSize: 12 }}>All ▾</div>
        <T size={11} color={INK_2}>Type:</T>
        <div style={{ padding: '3px 10px', border: `1.3px solid ${SKETCH}`, borderRadius: 3, fontFamily: FONT_HAND, fontSize: 12 }}>All ▾</div>
      </Row>
      <div style={{ border: `1.3px solid ${SKETCH}`, borderRadius: 3 }}>
        <Row style={{ background: PAPER_2, padding: '5px 10px', borderBottom: `1px solid ${SKETCH}`, fontFamily: FONT_HAND, fontSize: 12, color: INK_2 }}>
          <div style={{ width: 22 }}></div>
          <div style={{ width: 150 }}>Student</div>
          <div style={{ flex: 1 }}>Exercise</div>
          <div style={{ width: 100 }}>Class</div>
          <div style={{ width: 80 }}>Type</div>
          <div style={{ width: 80 }}>Submitted</div>
          <div style={{ width: 90 }}>Status</div>
          <div style={{ width: 80 }}></div>
        </Row>
        {[
          ['Mei Lin','Essay: My Hometown','ENG-201','writing','2h ago','ungraded'],
          ['Jose A','Speaking — Café','ENG-105','speaking','4h ago','ungraded'],
          ['Aisha K','Essay: My Hometown','ENG-201','writing','6h ago','ungraded'],
          ['Riku I','Quiz — Past tense','ENG-201','quiz','1d ago','ungraded'],
          ['Tara P','Speaking — Shopping','ENG-201','speaking','1d ago','ungraded'],
          ['Mei Lin','Essay: Best Meal','-','writing','3d ago','graded'],
          ['Jose A','Quiz — Past tense','ENG-201','quiz','3d ago','graded'],
        ].map((r,i) => (
          <Row key={i} style={{ padding: '6px 10px', borderBottom: `1px dashed ${INK_3}`, alignItems: 'center' }}>
            <div style={{ width: 22, height: 14, border: `1.2px solid ${SKETCH}`, borderRadius: 2 }} />
            <Row gap={6} style={{ width: 150 }}><WAvatar name={r[0]} size={22} /><T size={11}>{r[0]}</T></Row>
            <T size={11} style={{ flex: 1, fontWeight: r[5] === 'ungraded' ? 700 : 400 }}>{r[1]}</T>
            <T size={11} color={INK_2} style={{ width: 100 }}>{r[2]}</T>
            <div style={{ width: 80 }}><WBadge kind={r[3]} /></div>
            <T size={10} color={INK_3} style={{ width: 80 }}>{r[4]}</T>
            <div style={{ width: 90 }}><WBadge kind={r[5]} /></div>
            <div style={{ width: 80 }}><WBtn sm primary={r[5] === 'ungraded'}>{r[5] === 'ungraded' ? 'Grade →' : 'View'}</WBtn></div>
          </Row>
        ))}
      </div>
      <WNote>Bulk action bar (when rows selected) lives where the column headers are.</WNote>
    </WDesktopFrame>
  );
}

// ---- 24. Grading screen ------------------------------------------------
function T24_GradingScreen() {
  return (
    <WDesktopFrame title="Grade · Mei Lin" active="Submissions">
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <ScreenTitle sub="Submission 1 of 18 ungraded · ENG-201">Grade submission</ScreenTitle>
        <Row gap={6}>
          <WBtn sm>← Prev</WBtn>
          <WBtn sm>Skip</WBtn>
          <WBtn sm>Next →</WBtn>
        </Row>
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
        {/* Prompt + response side-by-side */}
        <Col gap={8}>
          <WBox pad={10} filled>
            <T size={11} color={INK_2}>PROMPT</T>
            <T size={13} style={{ fontWeight: 700, marginTop: 2 }}>Essay: My Hometown</T>
            <T size={11} style={{ marginTop: 4 }}>In 100–150 words, describe your hometown. Where is it? What's it known for? Use simple past + present tense.</T>
          </WBox>
          <WBox pad={10}>
            <Row gap={6} style={{ marginBottom: 4 }}>
              <WAvatar name="Mei Lin" size={22} /><T size={12} style={{ fontWeight: 700 }}>Mei Lin</T>
              <T size={10} color={INK_3}>submitted 2h ago</T>
            </Row>
            <div style={{
              border: `1px dashed ${INK_3}`, borderRadius: 3, padding: 8, minHeight: 200,
              fontFamily: FONT_MONO, fontSize: 11, lineHeight: 1.5,
            }}>
              My hometown is Hangzhou, a city in eastern China famous for West Lake.
              When I was younger I went there every weekend with my grandmother. The
              city has many temples and the food is sweet… (134 words)
            </div>
          </WBox>
        </Col>
        {/* Grade panel */}
        <Col gap={10}>
          <H size={14}>Feedback</H>
          <div>
            <T size={12} color={INK_2}>Score (0–100)</T>
            <Row gap={8} style={{ marginTop: 4 }}>
              <div style={{ border: `1.5px solid ${SKETCH}`, borderRadius: 3, padding: '4px 10px', width: 70, fontFamily: FONT_HAND, fontSize: 22, fontWeight: 700 }}>85</div>
              <div style={{ flex: 1, height: 8, border: `1px solid ${SKETCH}`, borderRadius: 4, overflow: 'hidden', alignSelf: 'center' }}>
                <div style={{ width: '85%', height: '100%', background: accent('teacher') }} />
              </div>
            </Row>
            <Row gap={4} style={{ marginTop: 4 }}>
              {[70, 80, 90, 100].map(p => (
                <div key={p} style={{ padding: '2px 8px', border: `1px solid ${INK_3}`, borderRadius: 3, fontFamily: FONT_HAND, fontSize: 11, color: INK_2 }}>{p}</div>
              ))}
            </Row>
          </div>
          <div>
            <T size={12} color={INK_2}>Comments</T>
            <div style={{ border: `1.3px solid ${SKETCH}`, borderRadius: 3, padding: 10, minHeight: 150, fontFamily: FONT_MONO, fontSize: 11, lineHeight: 1.4 }}>
              Great structure & vivid details. Watch your past-tense verb endings (paragraph 2).
              Try replacing "go" with "went" in line 4. Strong opening!
            </div>
          </div>
          <Row gap={6} style={{ marginTop: 4 }}>
            <WBtn primary>Save & next →</WBtn>
            <WBtn>Save · back to inbox</WBtn>
          </Row>
          <WNote>"Save & next" auto-loads next ungraded — the J4 fast path.</WNote>
        </Col>
      </div>
    </WDesktopFrame>
  );
}

Object.assign(window, {
  T13_TeacherDashboard, T13v_Cards, T13v_List, T13v_Feed,
  T_NavTop, T_NavSidebar, T_NavHybrid,
  T14_MyClasses, T15_ClassDetailTeacher, T16_CreateClass, T17_EnrollStudents,
  T18_LessonPlanEditor, T19_MyModules, T20_ModuleEditor, T21_ExercisesTab,
  T22_AssignmentCreator, T23_SubmissionsInbox, T24_GradingScreen,
});
