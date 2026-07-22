// Admin screens (desktop, 1080×680). Screens 25-29.

// ---- 25. Admin dashboard -----------------------------------------------
function A25_AdminDashboard() {
  return (
    <WDesktopFrame title="Dashboard" active="Dashboard">
      <ScreenTitle sub="Platform overview · placeholders where aggregate endpoints don't exist yet">Admin dashboard</ScreenTitle>
      <H size={13} style={{ color: INK_2, marginBottom: 6 }}>Users</H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { n: '142', l: 'Total users' },
          { n: '118', l: 'Students' },
          { n: '21',  l: 'Teachers' },
          { n: '3',   l: 'Admins' },
        ].map(s => (
          <WBox key={s.l} pad={10}><H size={24}>{s.n}</H><T size={11} color={INK_2}>{s.l}</T></WBox>
        ))}
      </div>
      <H size={13} style={{ color: INK_2, marginTop: 12, marginBottom: 6 }}>Content</H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { n: '24', l: 'Classes' },
          { n: '41', l: 'Modules' },
          { n: '286', l: 'Exercises' },
          { n: '1.2k', l: 'Submissions' },
        ].map(s => (
          <WBox key={s.l} pad={10}><H size={24}>{s.n}</H><T size={11} color={INK_2}>{s.l}</T></WBox>
        ))}
      </div>
      <H size={13} style={{ color: INK_2, marginTop: 12, marginBottom: 6 }}>System health <span style={{ color: INK_3 }}>(reserved)</span></H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {['API latency', 'Active sessions', 'Error rate (24h)'].map(l => (
          <WBox key={l} pad={10} dashed style={{ background: PAPER_2 }}>
            <T size={11} color={INK_2}>{l}</T>
            <T size={11} color={INK_3} style={{ fontStyle: 'italic', marginTop: 6 }}>endpoint pending · backend follow-up</T>
          </WBox>
        ))}
      </div>
      <WNote n="25">Three system-health cards are explicit placeholders so the layout doesn't reflow when the endpoints land.</WNote>
    </WDesktopFrame>
  );
}

// ---- 26. User management -----------------------------------------------
function A26_UserManagement() {
  return (
    <WDesktopFrame title="Users" active="Users">
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <ScreenTitle sub="142 users · sortable, filterable">User management</ScreenTitle>
        <WBtn primary>+ Invite user</WBtn>
      </Row>
      <Row gap={8} style={{ marginBottom: 8 }}>
        <WField placeholder="search by name or email…" style={{ flex: 1 }} />
        <div style={{ padding: '4px 10px', border: `1.3px solid ${SKETCH}`, borderRadius: 3, fontFamily: FONT_HAND, fontSize: 13 }}>Role: All ▾</div>
        <div style={{ padding: '4px 10px', border: `1.3px solid ${SKETCH}`, borderRadius: 3, fontFamily: FONT_HAND, fontSize: 13 }}>Status: All ▾</div>
      </Row>
      <div style={{ border: `1.3px solid ${SKETCH}`, borderRadius: 3 }}>
        <Row style={{ background: PAPER_2, padding: '5px 10px', borderBottom: `1px solid ${SKETCH}`, fontFamily: FONT_HAND, fontSize: 12, color: INK_2 }}>
          <div style={{ width: 22 }}></div>
          <div style={{ flex: 1.4 }}>Name</div>
          <div style={{ flex: 1.6 }}>Email</div>
          <div style={{ width: 85 }}>Role</div>
          <div style={{ width: 110 }}>Status</div>
          <div style={{ width: 90 }}>Created</div>
          <div style={{ width: 70 }}></div>
        </Row>
        {[
          ['Mei Lin','mei@school.edu','student','active','Sep 5'],
          ['Jose Alvarez','jose@school.edu','student','active','Sep 5'],
          ['Joon Park','park@school.edu','teacher','active','Aug 12'],
          ['Sara Kim','sara@school.edu','admin','active','Mar 2'],
          ['Mark Vey','mark@school.edu','student','suspended','Sep 11'],
          ['Akira Sato','akira@school.edu','student','inactive','Aug 22'],
          ['Tara Patel','tara@school.edu','student','active','Sep 8'],
        ].map((r,i) => (
          <Row key={i} style={{ padding: '6px 10px', borderBottom: `1px dashed ${INK_3}`, alignItems: 'center' }}>
            <div style={{ width: 16, height: 16, border: `1.2px solid ${SKETCH}`, borderRadius: 2 }} />
            <Row gap={6} style={{ flex: 1.4 }}><WAvatar name={r[0]} size={22} /><T size={11}>{r[0]}</T></Row>
            <T size={11} color={INK_2} style={{ flex: 1.6, fontFamily: FONT_MONO, fontSize: 10 }}>{r[1]}</T>
            <div style={{ width: 85 }}><WBadge kind={r[2]} /></div>
            <Row gap={4} style={{ width: 110 }}>
              <WBadge kind={r[3]} />
              <T size={10} color={INK_3} style={{ textDecoration: 'underline' }}>toggle</T>
            </Row>
            <T size={10} color={INK_3} style={{ width: 90 }}>{r[4]}</T>
            <Row gap={6} style={{ width: 70, justifyContent: 'flex-end' }}>
              <T size={11} color={INK_2} style={{ textDecoration: 'underline' }}>edit</T>
              <T size={11} color="#a8362a" style={{ textDecoration: 'underline' }}>del</T>
            </Row>
          </Row>
        ))}
      </div>
      <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <T size={11} color={INK_2}>Showing 1-7 of 142</T>
        <Row gap={4}>{['‹','1','2','3','…','21','›'].map(p => (
          <div key={p} style={{ padding: '2px 8px', border: `1px solid ${INK_3}`, borderRadius: 3, fontFamily: FONT_HAND, fontSize: 11 }}>{p}</div>
        ))}</Row>
      </Row>
      <WNote>J6 entry — admin types "Mark V", flips status to suspended, confirm toast. Suspended user gets 403 from API next request.</WNote>
    </WDesktopFrame>
  );
}

// ---- 27. User detail / edit --------------------------------------------
function A27_UserDetail() {
  return (
    <WDesktopFrame title="User · Mark Vey" active="Users">
      <T size={11} color={INK_2}>← Users</T>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <Row gap={12}>
          <WAvatar name="Mark V" size={50} />
          <Col gap={2}>
            <H size={20}>Mark Vey</H>
            <T size={11} color={INK_2}>mark@school.edu · id #u_4821</T>
            <Row gap={6} style={{ marginTop: 2 }}><WBadge kind="student" /><WBadge kind="suspended" /></Row>
          </Col>
        </Row>
        <Row gap={6}>
          <WBtn sm>Cancel</WBtn>
          <WBtn sm primary>Save changes</WBtn>
        </Row>
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 14 }}>
        <Col gap={10}>
          <H size={13}>Profile</H>
          <WField label="Full name" value="Mark Vey" />
          <WField label="Email" value="mark@school.edu" />
          <WField label="Avatar URL" value="" placeholder="(none)" />
          <div>
            <T size={12} color={INK_2}>Role</T>
            <Row gap={6} style={{ marginTop: 4 }}>
              {[['student', true], ['teacher', false], ['admin', false]].map(([r, sel]) => (
                <div key={r} style={{
                  padding: '4px 14px', borderRadius: 4, border: `1.3px solid ${SKETCH}`,
                  background: sel ? accent('admin') : 'transparent',
                  color: sel ? SKETCH : INK_2, fontFamily: FONT_HAND, fontSize: 13,
                  fontWeight: sel ? 700 : 400,
                }}>{r}</div>
              ))}
            </Row>
          </div>
          <div>
            <T size={12} color={INK_2}>Status</T>
            <Row gap={6} style={{ marginTop: 4 }}>
              {[['active', false], ['suspended', true], ['inactive', false]].map(([s, sel]) => (
                <div key={s} style={{
                  padding: '4px 14px', borderRadius: 4, border: `1.3px solid ${SKETCH}`,
                  background: sel ? '#fadcd5' : 'transparent',
                  color: SKETCH, fontFamily: FONT_HAND, fontSize: 13,
                  fontWeight: sel ? 700 : 400,
                }}>{s}</div>
              ))}
            </Row>
            <T size={10} color={INK_3} style={{ marginTop: 4, fontStyle: 'italic' }}>Suspended users get 403 on next API call.</T>
          </div>
        </Col>
        <Col gap={8}>
          <H size={13}>Audit</H>
          <WBox pad={9}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T size={11} color={INK_2}>Created</T>
              <T size={11} style={{ fontFamily: FONT_MONO, fontSize: 10 }}>2024-09-11 14:22</T>
            </Row>
            <Row style={{ justifyContent: 'space-between', marginTop: 3 }}>
              <T size={11} color={INK_2}>Updated</T>
              <T size={11} style={{ fontFamily: FONT_MONO, fontSize: 10 }}>2024-10-07 09:11</T>
            </Row>
            <Row style={{ justifyContent: 'space-between', marginTop: 3 }}>
              <T size={11} color={INK_2}>Last login</T>
              <T size={11} style={{ fontFamily: FONT_MONO, fontSize: 10 }}>2024-10-06 18:40</T>
            </Row>
          </WBox>
          <H size={13} style={{ marginTop: 8 }}>Activity</H>
          <WBox pad={9}><T size={11} color={INK_2}>3 classes · 12 submissions · 0 reports</T></WBox>
          <div style={{ flex: 1 }} />
          <WBtn danger sm>Delete user permanently</WBtn>
          <T size={10} color={INK_3} style={{ fontStyle: 'italic' }}>Cascades: submissions kept (anonymized), enrollments removed.</T>
        </Col>
      </div>
    </WDesktopFrame>
  );
}

// ---- 28. All classes (admin) -------------------------------------------
function A28_AllClasses() {
  return (
    <WDesktopFrame title="Classes" active="Classes">
      <Row style={{ justifyContent: 'space-between' }}>
        <ScreenTitle sub="24 classes · across all teachers">All classes</ScreenTitle>
        <Row gap={6}>
          <WField placeholder="search…" style={{ width: 180 }} />
          <div style={{ padding: '4px 10px', border: `1.3px solid ${SKETCH}`, borderRadius: 3, fontFamily: FONT_HAND, fontSize: 13 }}>Year ▾</div>
        </Row>
      </Row>
      <div style={{ border: `1.3px solid ${SKETCH}`, borderRadius: 3, marginTop: 10 }}>
        <Row style={{ background: PAPER_2, padding: '5px 10px', borderBottom: `1px solid ${SKETCH}`, fontFamily: FONT_HAND, fontSize: 12, color: INK_2 }}>
          <div style={{ flex: 1.5 }}>Class name</div>
          <div style={{ flex: 1 }}>Teacher</div>
          <div style={{ width: 100 }}>Year</div>
          <div style={{ width: 80 }}>Students</div>
          <div style={{ width: 80 }}>Created</div>
          <div style={{ width: 70 }}></div>
        </Row>
        {[
          ['ENG-201 Intermediate','Joon Park','2024-25', 18, 'Sep 1'],
          ['ENG-105 Pronunciation','Joon Park','2024-25', 14, 'Sep 2'],
          ['ENG-302 Business','Joon Park','2024-25', 10, 'Sep 4'],
          ['IELTS Prep','Ana Diaz','2024-25', 22, 'Aug 28'],
          ['Conversation Club','Sam Lee','2024-25', 9, 'Sep 12'],
          ['ENG-101 (archived)','Joon Park','2023-24', 17, 'Jan 8'],
        ].map((r,i) => (
          <Row key={i} style={{ padding: '6px 10px', borderBottom: `1px dashed ${INK_3}`, alignItems: 'center' }}>
            <T size={11} style={{ flex: 1.5, fontWeight: 700, color: i === 5 ? INK_3 : INK }}>{r[0]}</T>
            <T size={11} color={INK_2} style={{ flex: 1 }}>{r[1]}</T>
            <T size={11} color={INK_2} style={{ width: 100 }}>{r[2]}</T>
            <T size={11} color={INK_2} style={{ width: 80 }}>{r[3]}</T>
            <T size={10} color={INK_3} style={{ width: 80 }}>{r[4]}</T>
            <Row gap={6} style={{ width: 70, justifyContent: 'flex-end' }}>
              <T size={11} color={INK_2} style={{ textDecoration: 'underline' }}>open</T>
              <T size={11} color="#a8362a" style={{ textDecoration: 'underline' }}>del</T>
            </Row>
          </Row>
        ))}
      </div>
    </WDesktopFrame>
  );
}

// ---- 29. All modules (admin) -------------------------------------------
function A29_AllModules() {
  return (
    <WDesktopFrame title="Modules" active="Modules">
      <Row style={{ justifyContent: 'space-between' }}>
        <ScreenTitle sub="41 modules · across all creators">All modules</ScreenTitle>
        <Row gap={6}>
          <WField placeholder="search…" style={{ width: 180 }} />
          <div style={{ padding: '4px 10px', border: `1.3px solid ${SKETCH}`, borderRadius: 3, fontFamily: FONT_HAND, fontSize: 13 }}>Difficulty ▾</div>
        </Row>
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
        {[
          ['Travel & Tourism','Joon Park','intermediate', 8],
          ['Daily Conversation','Joon Park','beginner', 12],
          ['Academic Writing','Ana Diaz','advanced', 10],
          ['Business Email','Joon Park','intermediate', 6],
          ['IELTS Reading','Ana Diaz','advanced', 14],
          ['Casual English','Sam Lee','beginner', 7],
        ].map((m,i) => (
          <WBox key={i} pad={10}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T size={13} style={{ fontWeight: 700 }}>{m[0]}</T>
              <WBadge kind={m[2]} />
            </Row>
            <T size={11} color={INK_2}>by {m[1]} · {m[3]} ex</T>
            <Row gap={6} style={{ marginTop: 8 }}>
              <WBtn sm>Open</WBtn>
              <WBtn sm danger>Delete</WBtn>
            </Row>
          </WBox>
        ))}
      </div>
      <WNote>Admin can delete any module — cascades to exercises but soft-deletes assignments (note for backend).</WNote>
    </WDesktopFrame>
  );
}

Object.assign(window, {
  A25_AdminDashboard, A26_UserManagement, A27_UserDetail, A28_AllClasses, A29_AllModules,
});
