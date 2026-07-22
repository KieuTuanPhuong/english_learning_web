// Wires everything into the design canvas + tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "roleLens": "student",
  "showAnnotations": true,
  "state": "populated"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const ctxValue = React.useMemo(() => ({
    role: t.roleLens,
    annotations: t.showAnnotations,
    state: t.state,
  }), [t.roleLens, t.showAnnotations, t.state]);

  // Sizes
  const M = { w: 320, h: 620 }; // mobile (student)
  const D = { w: 1080, h: 680 }; // desktop (teacher / admin)
  const F = { w: 1240, h: 460 }; // flow
  const K = { w: 720, h: 760 }; // tokens/components

  return (
    <WireCtx.Provider value={ctxValue}>
      <DesignCanvas>

        {/* ─── Design system ─── */}
        <DCSection id="design-system" title="Design system" subtitle="tokens · component library · role accents">
          <DCArtboard id="tokens" label="Tokens" width={K.w} height={K.h}><Tokens /></DCArtboard>
          <DCArtboard id="components" label="Component library" width={K.w} height={K.h}><Components /></DCArtboard>
        </DCSection>

        {/* ─── Shared screens ─── */}
        <DCSection id="shared" title="Shared screens" subtitle="login · register · profile · logout — neutral chrome">
          <DCArtboard id="s1" label="01 · Login"     width={M.w} height={M.h}><S1_Login /></DCArtboard>
          <DCArtboard id="s2" label="02 · Register"  width={M.w} height={M.h}><S2_Register /></DCArtboard>
          <DCArtboard id="s3" label="03 · Profile"   width={M.w} height={M.h}><S3_Profile /></DCArtboard>
          <DCArtboard id="s4" label="04 · Logout"    width={M.w} height={M.h}><S4_Logout /></DCArtboard>
        </DCSection>

        {/* ─── Student (mobile) ─── */}
        <DCSection id="student" title="Student · mobile" subtitle="8 screens — phone-first; indigo accent">
          <DCArtboard id="s5"  label="05 · Dashboard"        width={M.w} height={M.h}><S5_StudentDashboard /></DCArtboard>
          <DCArtboard id="s6"  label="06 · My classes"       width={M.w} height={M.h}><S6_MyClasses /></DCArtboard>
          <DCArtboard id="s7"  label="07 · Class detail"     width={M.w} height={M.h}><S7_ClassDetailStudent /></DCArtboard>
          <DCArtboard id="s8"  label="08 · Module catalog"   width={M.w} height={M.h}><S8_ModuleCatalog /></DCArtboard>
          <DCArtboard id="s9"  label="09 · Module detail"    width={M.w} height={M.h}><S9_ModuleDetail /></DCArtboard>
          <DCArtboard id="s10" label="10 · Exercise viewer"  width={M.w} height={M.h}><S10_ExerciseViewer /></DCArtboard>
          <DCArtboard id="s11" label="11 · My submissions"   width={M.w} height={M.h}><S11_MySubmissions /></DCArtboard>
          <DCArtboard id="s12" label="12 · Submission detail" width={M.w} height={M.h}><S12_SubmissionDetail /></DCArtboard>
        </DCSection>

        {/* ─── Teacher (desktop) ─── */}
        <DCSection id="teacher" title="Teacher · desktop" subtitle="12 screens — desktop-first; teal accent">
          <DCArtboard id="t13" label="13 · Dashboard"          width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T13_TeacherDashboard /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t14" label="14 · My classes"         width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T14_MyClasses /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t15" label="15 · Class detail"       width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T15_ClassDetailTeacher /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t16" label="16 · Create class"       width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T16_CreateClass /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t17" label="17 · Enroll students"    width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T17_EnrollStudents /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t18" label="18 · Lesson plan editor" width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T18_LessonPlanEditor /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t19" label="19 · My modules"         width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T19_MyModules /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t20" label="20 · Module editor"      width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T20_ModuleEditor /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t21" label="21 · Exercises tab"      width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T21_ExercisesTab /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t22" label="22 · Assignment creator" width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T22_AssignmentCreator /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t23" label="23 · Submissions inbox"  width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T23_SubmissionsInbox /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="t24" label="24 · Grading screen"     width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T24_GradingScreen /></WireCtx.Provider></DCArtboard>
        </DCSection>

        {/* ─── Admin (desktop) ─── */}
        <DCSection id="admin" title="Admin · desktop" subtitle="5 screens — superset of teacher; amber accent">
          <DCArtboard id="a25" label="25 · Admin dashboard"   width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'admin' }}><A25_AdminDashboard /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="a26" label="26 · User management"   width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'admin' }}><A26_UserManagement /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="a27" label="27 · User detail / edit" width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'admin' }}><A27_UserDetail /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="a28" label="28 · All classes"       width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'admin' }}><A28_AllClasses /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="a29" label="29 · All modules"       width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'admin' }}><A29_AllModules /></WireCtx.Provider></DCArtboard>
        </DCSection>

        {/* ─── Variations — exercise viewer ─── */}
        <DCSection id="var-exercise" title="Variation · exercise viewer (student screen 10)" subtitle="three layouts to compare">
          <DCArtboard id="ev-single"  label="A · Single column"       width={M.w} height={M.h}><S10v_Single /></DCArtboard>
          <DCArtboard id="ev-split"   label="B · Split prompt / response" width={M.w} height={M.h}><S10v_Split /></DCArtboard>
          <DCArtboard id="ev-stepper" label="C · Stepper (read / respond / review)" width={M.w} height={M.h}><S10v_Stepper /></DCArtboard>
        </DCSection>

        {/* ─── Variations — dashboards (student) ─── */}
        <DCSection id="var-student-dash" title="Variation · student dashboard density" subtitle="cards vs list vs feed">
          <DCArtboard id="sd-cards" label="A · Cards" width={M.w} height={M.h}><S5v_Cards /></DCArtboard>
          <DCArtboard id="sd-list"  label="B · List"  width={M.w} height={M.h}><S5v_List /></DCArtboard>
          <DCArtboard id="sd-feed"  label="C · Feed"  width={M.w} height={M.h}><S5v_Feed /></DCArtboard>
        </DCSection>

        {/* ─── Variations — dashboards (teacher) ─── */}
        <DCSection id="var-teacher-dash" title="Variation · teacher dashboard density" subtitle="cards vs list vs feed (desktop)">
          <DCArtboard id="td-cards" label="A · Cards" width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T13v_Cards /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="td-list"  label="B · List"  width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T13v_List /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="td-feed"  label="C · Feed"  width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T13v_Feed /></WireCtx.Provider></DCArtboard>
        </DCSection>

        {/* ─── Variations — navigation ─── */}
        <DCSection id="var-nav" title="Variation · navigation pattern" subtitle="top vs sidebar vs hybrid (shown on teacher dashboard)">
          <DCArtboard id="nav-top"     label="A · Top nav"   width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T_NavTop /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="nav-sidebar" label="B · Sidebar"   width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T_NavSidebar /></WireCtx.Provider></DCArtboard>
          <DCArtboard id="nav-hybrid"  label="C · Hybrid"    width={D.w} height={D.h}><WireCtx.Provider value={{ ...ctxValue, role: 'teacher' }}><T_NavHybrid /></WireCtx.Provider></DCArtboard>
        </DCSection>

        {/* ─── Student dashboard states ─── */}
        <DCSection id="states" title="Screen states" subtitle="empty · loading · populated (student dashboard)">
          <DCArtboard id="state-empty"      label="Empty"      width={M.w} height={M.h}><S5_Empty /></DCArtboard>
          <DCArtboard id="state-loading"    label="Loading (skeleton)" width={M.w} height={M.h}><S5_Loading /></DCArtboard>
          <DCArtboard id="state-populated"  label="Populated"  width={M.w} height={M.h}><S5_StudentDashboard /></DCArtboard>
        </DCSection>

        {/* ─── User journeys ─── */}
        <DCSection id="journeys" title="User journeys" subtitle="J1 · J3 · J4 · J6 — screen-by-screen flow">
          <DCArtboard id="j1" label="J1 · Student submits writing"  width={F.w} height={F.h}><F_J1 /></DCArtboard>
          <DCArtboard id="j3" label="J3 · Teacher creates & assigns" width={F.w} height={F.h}><F_J3 /></DCArtboard>
          <DCArtboard id="j4" label="J4 · Teacher grades (batch)"   width={F.w} height={F.h}><F_J4 /></DCArtboard>
          <DCArtboard id="j6" label="J6 · Admin suspends a user"    width={F.w} height={F.h}><F_J6 /></DCArtboard>
        </DCSection>

      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Role lens" />
        <TweakRadio
          label="Active role"
          value={t.roleLens}
          options={['student', 'teacher', 'admin']}
          onChange={(v) => setTweak('roleLens', v)}
        />

        <TweakSection label="States" />
        <TweakRadio
          label="Dashboard state"
          value={t.state}
          options={['empty', 'loading', 'populated']}
          onChange={(v) => setTweak('state', v)}
        />

        <TweakSection label="Notes" />
        <TweakToggle
          label="Show annotations"
          value={t.showAnnotations}
          onChange={(v) => setTweak('showAnnotations', v)}
        />
      </TweaksPanel>
    </WireCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
