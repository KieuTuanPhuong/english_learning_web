// Student screens (mobile, 320×620). Screens 5-12 + dashboard & exercise viewer variations.

const S = ({ children }) => <Col gap={9}>{children}</Col>;

// ---- 5. Student dashboard (default: cards) -----------------------------
function S5_StudentDashboard() {
  const { state } = useWire();
  if (state === 'empty') return <S5_Empty />;
  if (state === 'loading') return <S5_Loading />;
  return (
    <WMobileFrame title="Home">
      <S>
        <H size={20}>Hi, Mei 👋</H>
        <T size={11} color={INK_2}>Tue · 3 things due this week</T>

        <H size={14} style={{ marginTop: 4 }}>Due soon</H>
        <Col gap={6}>
          {[
            { t: 'Essay: My Hometown', sub: 'ENG-201 · Mr. Park', due: 'Tomorrow', kind: 'writing' },
            { t: 'Speaking — Shopping', sub: 'ENG-201 · Mr. Park', due: 'Fri', kind: 'speaking' },
          ].map(a => (
            <WBox key={a.t} pad={8} accentBg>
              <Row style={{ justifyContent: 'space-between' }}>
                <Col gap={1}>
                  <T size={13} style={{ fontWeight: 700 }}>{a.t}</T>
                  <T size={10} color={INK_2}>{a.sub}</T>
                </Col>
                <Col gap={2} style={{ alignItems: 'flex-end' }}>
                  <WBadge kind={a.kind} />
                  <T size={10} color={INK_2}>due {a.due}</T>
                </Col>
              </Row>
            </WBox>
          ))}
        </Col>

        <H size={14} style={{ marginTop: 6 }}>In progress</H>
        <WBox pad={8}>
          <T size={12} style={{ fontWeight: 700 }}>Travel & Tourism · B1</T>
          <Row gap={6} style={{ marginTop: 4 }}>
            <div style={{ flex: 1, height: 8, border: `1px solid ${SKETCH}`, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '62%', height: '100%', background: accent('student') }} />
            </div>
            <T size={11} color={INK_2}>62%</T>
          </Row>
        </WBox>

        <H size={14} style={{ marginTop: 6 }}>Recent feedback</H>
        <WBox pad={8}>
          <Row gap={6} style={{ justifyContent: 'space-between' }}>
            <T size={12} style={{ fontWeight: 700 }}>Essay: Best Meal Ever</T>
            <WBadge kind="graded">85</WBadge>
          </Row>
          <T size={11} color={INK_2} style={{ marginTop: 2 }}>"Great structure — work on tenses…"</T>
        </WBox>
      </S>
    </WMobileFrame>
  );
}

function S5_Empty() {
  return (
    <WMobileFrame title="Home">
      <Col gap={12} style={{ height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 16 }}>
        <div style={{
          width: 70, height: 70, border: `1.5px dashed ${SKETCH}`, borderRadius: 35,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_HAND, fontSize: 30,
        }}>📭</div>
        <H size={18}>Nothing due — yet!</H>
        <T color={INK_2}>When your teacher assigns work, it will show up here.</T>
        <WBtn primary>Browse modules</WBtn>
      </Col>
    </WMobileFrame>
  );
}

function S5_Loading() {
  return (
    <WMobileFrame title="Home">
      <S>
        <div style={{ height: 18, width: '40%', background: PAPER_2, borderRadius: 3 }} />
        <div style={{ height: 10, width: '70%', background: PAPER_2, borderRadius: 3 }} />
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 56, background: PAPER_2, borderRadius: 3, border: `1px dashed ${INK_3}` }} />
        ))}
        <T size={11} color={INK_3} style={{ textAlign: 'center', marginTop: 8 }}>loading…</T>
      </S>
    </WMobileFrame>
  );
}

// ---- Dashboard density variations (3) ----------------------------------
function S5v_Cards() {
  // already the default
  return <S5_StudentDashboard />;
}

function S5v_List() {
  return (
    <WMobileFrame title="Home">
      <S>
        <H size={20}>Hi, Mei</H>
        <T size={11} color={INK_2}>Compact list view · group by urgency</T>
        <div style={{ borderTop: `1.3px solid ${SKETCH}` }}>
          {[
            { t: 'Essay: My Hometown', due: 'tomorrow', k: 'writing', urgent: true },
            { t: 'Speaking — Shopping', due: 'Fri', k: 'speaking' },
            { t: 'Quiz — Past tense', due: 'Mon', k: 'quiz' },
            { t: 'Listening 4.3', due: 'next wk', k: 'speaking' },
          ].map(a => (
            <Row key={a.t} style={{ padding: '7px 2px', borderBottom: `1px dashed ${INK_3}`, justifyContent: 'space-between' }}>
              <Col gap={1}>
                <T size={12} style={{ fontWeight: a.urgent ? 700 : 500 }}>{a.t}</T>
                <T size={10} color={INK_2}>due {a.due}</T>
              </Col>
              <WBadge kind={a.k} />
            </Row>
          ))}
        </div>
        <WBtn ghost sm style={{ alignSelf: 'flex-start', color: accent('student') }}>+ show 3 more</WBtn>
      </S>
    </WMobileFrame>
  );
}

function S5v_Feed() {
  return (
    <WMobileFrame title="Home">
      <S>
        <T size={11} color={INK_2}>Tuesday · activity feed</T>
        {[
          { who: 'Mr. Park', when: '2h', what: 'assigned', it: 'Essay: My Hometown', kind: 'writing', cta: 'Start →' },
          { who: 'Mr. Park', when: '1d', what: 'graded', it: 'Essay: Best Meal', kind: 'graded', cta: 'View 85/100' },
          { who: 'You', when: '2d', what: 'submitted', it: 'Speaking — Greetings', kind: 'speaking', cta: 'View' },
          { who: 'Ms. Yu', when: '3d', what: 'enrolled you in', it: 'ENG-302', kind: null, cta: 'Open class' },
        ].map((e, i) => (
          <WBox key={i} pad={8}>
            <T size={10} color={INK_2}>{e.who} · {e.when} ago</T>
            <T size={12} style={{ marginTop: 2 }}>
              {e.what} <span style={{ fontWeight: 700 }}>{e.it}</span>
            </T>
            <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
              {e.kind && <WBadge kind={e.kind} />}
              <WBtn sm style={{ marginLeft: 'auto' }}>{e.cta}</WBtn>
            </Row>
          </WBox>
        ))}
      </S>
    </WMobileFrame>
  );
}

// ---- 6. My classes -----------------------------------------------------
function S6_MyClasses() {
  return (
    <WMobileFrame title="My classes">
      <S>
        <ScreenTitle sub="3 enrolled · academic year 2024-25">My classes</ScreenTitle>
        {[
          { n: 'ENG-201 Intermediate', t: 'Mr. Park', due: 2 },
          { n: 'ENG-105 Pronunciation', t: 'Ms. Yu', due: 0 },
          { n: 'ENG-302 Business', t: 'Mr. Park', due: 1 },
        ].map(c => (
          <WBox key={c.n} pad={9}>
            <T size={13} style={{ fontWeight: 700 }}>{c.n}</T>
            <T size={11} color={INK_2}>{c.t}</T>
            <Row gap={6} style={{ marginTop: 4 }}>
              {c.due > 0 ? <WBadge kind="ungraded">{c.due} due</WBadge> : <WBadge kind="graded">all caught up</WBadge>}
              <T size={10} color={INK_3}>· tap to open</T>
            </Row>
          </WBox>
        ))}
      </S>
    </WMobileFrame>
  );
}

// ---- 7. Class detail (student view) ------------------------------------
function S7_ClassDetailStudent() {
  return (
    <WMobileFrame title="ENG-201">
      <S>
        <ScreenTitle sub="Mr. Park · AY 2024-25">ENG-201 Intermediate</ScreenTitle>
        <Row gap={4} style={{ borderBottom: `1px solid ${SKETCH}`, paddingBottom: 4 }}>
          {['Assignments', 'Lesson plans', 'Roster'].map((t, i) => (
            <div key={t} style={{
              padding: '2px 8px',
              fontFamily: FONT_HAND, fontSize: 13,
              borderBottom: i === 0 ? `2px solid ${accent('student')}` : 'none',
              fontWeight: i === 0 ? 700 : 400, color: i === 0 ? SKETCH : INK_2,
            }}>{t}</div>
          ))}
        </Row>
        <H size={13}>Active</H>
        {[
          { t: 'Essay: My Hometown', due: 'Wed Oct 8', k: 'writing', state: 'pending' },
          { t: 'Speaking — Shopping', due: 'Fri Oct 10', k: 'speaking', state: 'pending' },
        ].map(a => (
          <WBox key={a.t} pad={8} accentBg>
            <Row style={{ justifyContent: 'space-between' }}>
              <Col gap={1}>
                <T size={12} style={{ fontWeight: 700 }}>{a.t}</T>
                <T size={10} color={INK_2}>due {a.due}</T>
              </Col>
              <WBadge kind={a.k} />
            </Row>
          </WBox>
        ))}
        <H size={13} style={{ marginTop: 4 }}>Past</H>
        <Row style={{ justifyContent: 'space-between', padding: '4px 2px' }}>
          <T size={12}>Essay: Best Meal Ever</T>
          <WBadge kind="graded">85</WBadge>
        </Row>
      </S>
    </WMobileFrame>
  );
}

// ---- 8. Module catalog -------------------------------------------------
function S8_ModuleCatalog() {
  return (
    <WMobileFrame title="Modules">
      <S>
        <ScreenTitle sub="Browse · 24 modules">Module catalog</ScreenTitle>
        <WField placeholder="search…" />
        <Row gap={5} wrap>
          {['All', 'beginner', 'intermediate', 'advanced'].map((f, i) => (
            <div key={f} style={{
              padding: '2px 9px', borderRadius: 12,
              border: `1.2px solid ${SKETCH}`,
              fontFamily: FONT_HAND, fontSize: 12,
              background: i === 0 ? SKETCH : 'transparent',
              color: i === 0 ? PAPER : SKETCH,
            }}>{f}</div>
          ))}
        </Row>
        <Col gap={6}>
          {[
            { t: 'Travel & Tourism', d: 'intermediate', ex: 8, p: 62 },
            { t: 'Daily Conversation', d: 'beginner', ex: 12, p: 100 },
            { t: 'Academic Writing', d: 'advanced', ex: 10, p: 0 },
            { t: 'Business Email', d: 'intermediate', ex: 6, p: 25 },
          ].map(m => (
            <WBox key={m.t} pad={8}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T size={13} style={{ fontWeight: 700 }}>{m.t}</T>
                <WBadge kind={m.d} />
              </Row>
              <T size={10} color={INK_2}>{m.ex} exercises · {m.p}% done</T>
              <div style={{ height: 4, marginTop: 4, border: `1px solid ${INK_3}`, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${m.p}%`, height: '100%', background: accent('student') }} />
              </div>
            </WBox>
          ))}
        </Col>
      </S>
    </WMobileFrame>
  );
}

// ---- 9. Module detail --------------------------------------------------
function S9_ModuleDetail() {
  return (
    <WMobileFrame title="Module">
      <S>
        <T size={11} color={INK_2}>← Modules</T>
        <H size={20}>Travel & Tourism</H>
        <Row gap={6}><WBadge kind="intermediate" /><T size={11} color={INK_2}>8 exercises</T></Row>
        <T size={12} color={INK}>Build confidence booking hotels, ordering food, and asking for directions.</T>
        <Row gap={6} style={{ marginTop: 2 }}>
          <T size={11} color={INK_2}>Your progress</T>
          <div style={{ flex: 1, height: 8, border: `1px solid ${SKETCH}`, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '62%', height: '100%', background: accent('student') }} />
          </div>
          <T size={11} color={INK_2}>62%</T>
        </Row>
        <H size={14} style={{ marginTop: 4 }}>Exercises</H>
        {[
          { t: '1. Greetings at hotels', k: 'writing', done: true },
          { t: '2. Ordering food', k: 'speaking', done: true },
          { t: '3. Asking directions', k: 'speaking', done: false, current: true },
          { t: '4. Buying tickets', k: 'quiz', done: false },
          { t: '5. Cultural notes', k: 'writing', done: false },
        ].map(e => (
          <Row key={e.t} gap={8} style={{
            padding: '6px 8px',
            border: `1px ${e.current ? 'solid' : 'dashed'} ${e.current ? SKETCH : INK_3}`,
            borderRadius: 3,
            background: e.current ? `color-mix(in oklch, ${accent('student')} 14%, ${PAPER})` : PAPER,
          }}>
            <T size={14} color={e.done ? accent('student') : INK_3}>{e.done ? '✓' : '○'}</T>
            <T size={12} style={{ flex: 1, fontWeight: e.current ? 700 : 400 }}>{e.t}</T>
            <WBadge kind={e.k} />
          </Row>
        ))}
        <WNote>Self-practice variant: every exercise tappable. Assigned-only variant: lock until teacher unlocks.</WNote>
      </S>
    </WMobileFrame>
  );
}

// ---- 10. Exercise viewer (default — single column) ---------------------
function S10_ExerciseViewer() {
  return (
    <WMobileFrame title="Exercise" tabBar={false}>
      <Col gap={8} style={{ height: '100%' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T size={11} color={INK_2}>← back</T>
          <WBadge kind="writing">writing</WBadge>
        </Row>
        <H size={18}>Write about your hometown</H>
        <WBox pad={9} filled>
          <T size={12} style={{ fontWeight: 700, marginBottom: 4 }}>Prompt</T>
          <T size={12}>In 100–150 words, describe your hometown. Where is it? What's it known for? Use simple past + present tense.</T>
        </WBox>
        <T size={12} style={{ fontWeight: 700 }}>Your response</T>
        <div style={{
          flex: 1, border: `1.3px solid ${SKETCH}`, borderRadius: 3,
          padding: 8, background: PAPER,
          fontFamily: FONT_MONO, fontSize: 10, color: INK_3, minHeight: 100,
        }}>
          start typing…
        </div>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <T size={10} color={INK_3}>0 / 150 words · autosave</T>
          <Row gap={6}>
            <WBtn sm>Save draft</WBtn>
            <WBtn sm primary>Submit ✓</WBtn>
          </Row>
        </Row>
      </Col>
    </WMobileFrame>
  );
}

// ---- Exercise viewer variations (3) ------------------------------------
function S10v_Single() { return <S10_ExerciseViewer />; }

function S10v_Split() {
  return (
    <WMobileFrame title="Exercise" tabBar={false}>
      <Col gap={6} style={{ height: '100%' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T size={11} color={INK_2}>← back</T>
          <WBadge kind="speaking">speaking</WBadge>
        </Row>
        {/* sticky prompt half */}
        <WBox pad={8} filled style={{ flexShrink: 0 }}>
          <T size={11} color={INK_2}>PROMPT (sticky)</T>
          <T size={12} style={{ fontWeight: 700 }}>Order coffee at a café</T>
          <T size={11}>Listen, then record yourself responding.</T>
          <Row gap={6} style={{ marginTop: 4 }}>
            <WBtn sm>▶ play audio</WBtn>
            <T size={10} color={INK_3}>0:42</T>
          </Row>
        </WBox>
        <WSquiggle />
        {/* response half */}
        <T size={11} color={INK_2}>YOUR RESPONSE</T>
        <WField label="Audio URL" value="https://drive…/me.mp3" />
        <T size={10} color={INK_3} style={{ fontStyle: 'italic' }}>paste audio URL — file upload coming soon</T>
        <div style={{ flex: 1 }} />
        <WBtn primary>Submit recording</WBtn>
        <WNote>Split keeps prompt visible while typing/recording — good for long prompts.</WNote>
      </Col>
    </WMobileFrame>
  );
}

function S10v_Stepper() {
  return (
    <WMobileFrame title="Exercise" tabBar={false}>
      <Col gap={8} style={{ height: '100%' }}>
        {/* steps */}
        <Row gap={4}>
          {['Read', 'Respond', 'Review'].map((s, i) => (
            <Row key={s} gap={4} style={{ flex: 1 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 9, border: `1.3px solid ${SKETCH}`,
                background: i === 1 ? accent('student') : (i === 0 ? SKETCH : PAPER),
                color: i <= 1 ? PAPER : INK_2,
                fontFamily: FONT_HAND, fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i+1}</div>
              <T size={11} style={{ fontWeight: i === 1 ? 700 : 400, color: i <= 1 ? SKETCH : INK_3 }}>{s}</T>
              {i < 2 && <div style={{ flex: 1, height: 1, borderTop: `1.3px dashed ${INK_3}` }} />}
            </Row>
          ))}
        </Row>
        <WBox pad={9} accentBg>
          <T size={11} color={INK_2}>Step 2 of 3</T>
          <T size={14} style={{ fontWeight: 700, marginTop: 2 }}>Write your response</T>
        </WBox>
        <T size={11} color={INK_2}>Prompt recap: "Describe your hometown in 100–150 words."</T>
        <div style={{
          flex: 1, border: `1.3px solid ${SKETCH}`, borderRadius: 3, padding: 8,
          fontFamily: FONT_MONO, fontSize: 10, color: INK_3,
        }}>
          start typing…
        </div>
        <Row style={{ justifyContent: 'space-between' }}>
          <WBtn sm>← Back</WBtn>
          <WBtn sm primary>Next →</WBtn>
        </Row>
        <WNote>Stepper guides first-time users; review step lets them confirm before final submit.</WNote>
      </Col>
    </WMobileFrame>
  );
}

// ---- 11. My submissions ------------------------------------------------
function S11_MySubmissions() {
  return (
    <WMobileFrame title="My submissions">
      <S>
        <Row gap={4} style={{ marginBottom: 2 }}>
          {['All', 'Graded', 'Awaiting'].map((t, i) => (
            <div key={t} style={{
              padding: '2px 8px', borderRadius: 10,
              border: `1.2px solid ${SKETCH}`,
              background: i === 0 ? SKETCH : 'transparent',
              color: i === 0 ? PAPER : SKETCH,
              fontFamily: FONT_HAND, fontSize: 12,
            }}>{t}</div>
          ))}
        </Row>
        {[
          { t: 'Essay: Best Meal Ever', d: 'Oct 1', k: 'writing', state: 'graded', score: 85 },
          { t: 'Speaking — Greetings', d: 'Sep 28', k: 'speaking', state: 'graded', score: 72 },
          { t: 'Essay: My Hometown', d: 'today', k: 'writing', state: 'pending' },
          { t: 'Quiz — Past tense', d: 'Sep 25', k: 'quiz', state: 'graded', score: 94 },
        ].map(s => (
          <WBox key={s.t} pad={8}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Col gap={1}>
                <T size={12} style={{ fontWeight: 700 }}>{s.t}</T>
                <Row gap={5}><WBadge kind={s.k} /><T size={10} color={INK_2}>· {s.d}</T></Row>
              </Col>
              {s.state === 'graded'
                ? <WBadge kind="graded">{s.score}</WBadge>
                : <WBadge kind="pending">awaiting</WBadge>}
            </Row>
          </WBox>
        ))}
      </S>
    </WMobileFrame>
  );
}

// ---- 12. Submission detail (with feedback) -----------------------------
function S12_SubmissionDetail() {
  return (
    <WMobileFrame title="Submission" tabBar={false}>
      <S>
        <T size={11} color={INK_2}>← My submissions</T>
        <Row style={{ justifyContent: 'space-between' }}>
          <H size={17}>Best Meal Ever</H>
          <WBadge kind="graded">graded</WBadge>
        </Row>
        <T size={10} color={INK_2}>submitted Oct 1 · exercise from "Daily Conversation"</T>
        <WBox pad={8} filled>
          <T size={11} color={INK_2} style={{ marginBottom: 2 }}>PROMPT</T>
          <T size={11}>Write about a memorable meal in 80 words.</T>
        </WBox>
        <WBox pad={8}>
          <T size={11} color={INK_2} style={{ marginBottom: 2 }}>YOUR ANSWER</T>
          <T size={11} style={{ fontFamily: FONT_MONO, fontSize: 10 }}>
            Last summer my grandmother made dumplings…
          </T>
        </WBox>
        <H size={13} style={{ marginTop: 4 }}>Feedback</H>
        <WBox pad={8} accentBg>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={6}><WAvatar name="Park J" size={22} /><T size={12} style={{ fontWeight: 700 }}>Mr. Park</T></Row>
            <T size={16} style={{ fontWeight: 700, color: accent('student') }}>85/100</T>
          </Row>
          <T size={11} style={{ marginTop: 4 }}>"Great structure & vivid details. Watch your past-tense verb endings (paragraph 2)."</T>
          <T size={10} color={INK_2} style={{ marginTop: 4 }}>Oct 2, 4:12 pm</T>
        </WBox>
      </S>
    </WMobileFrame>
  );
}

Object.assign(window, {
  S5_StudentDashboard, S5v_Cards, S5v_List, S5v_Feed,
  S5_Empty, S5_Loading,
  S6_MyClasses, S7_ClassDetailStudent, S8_ModuleCatalog, S9_ModuleDetail,
  S10_ExerciseViewer, S10v_Single, S10v_Split, S10v_Stepper,
  S11_MySubmissions, S12_SubmissionDetail,
});
