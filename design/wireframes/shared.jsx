// Shared screens: Login (1), Register (2), Profile (3), Logout (4)
// All mobile-format (320×620) since these flow from registration on phone

function S1_Login() {
  return (
    <WMobileFrame title={null} tabBar={false}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: '0 6px' }}>
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <H size={28}>engl.app</H>
          <T color={INK_2}>practice. submit. improve.</T>
        </div>
        <WField label="Email" value="mei@school.edu" />
        <WField label="Password" value="secret" type="password" />
        <WBtn primary style={{ marginTop: 4 }}>Log in →</WBtn>
        <div style={{ textAlign: 'center', fontFamily: FONT_HAND, fontSize: 13, color: INK_2 }}>
          forgot password?
        </div>
        <WSquiggle />
        <div style={{ textAlign: 'center', fontFamily: FONT_HAND, fontSize: 14 }}>
          new here? <span style={{ textDecoration: 'underline', fontWeight: 700 }}>Create account</span>
        </div>
        <WNote n="1" style={{ marginTop: 8 }}>Topbar accent reflects role *after* login — login screen stays neutral.</WNote>
      </div>
    </WMobileFrame>
  );
}

function S2_Register() {
  return (
    <WMobileFrame title={null} tabBar={false}>
      <Col gap={10} style={{ padding: '0 4px' }}>
        <H size={22}>Create account</H>
        <T color={INK_2}>Pick your role. Admins are added by an existing admin.</T>
        <WField label="Full name" value="Mei Lin" />
        <WField label="Email" value="mei@school.edu" />
        <WField label="Password" value="secret123" type="password" />
        <div>
          <T size={12} color={INK_2}>I am a…</T>
          <Row gap={8} style={{ marginTop: 4 }}>
            <WBox role="student" accentBg pad={8} style={{ flex: 1, textAlign: 'center' }}>
              <T size={13} style={{ fontWeight: 700 }}>Student</T>
              <T size={10} color={INK_2}>● selected</T>
            </WBox>
            <WBox pad={8} style={{ flex: 1, textAlign: 'center' }}>
              <T size={13}>Teacher</T>
              <T size={10} color={INK_3}>○</T>
            </WBox>
          </Row>
        </div>
        <WBtn primary style={{ marginTop: 4 }}>Create account →</WBtn>
        <WNote n="2">Admin role isn't here — provisioned by another admin only.</WNote>
      </Col>
    </WMobileFrame>
  );
}

function S3_Profile() {
  const { role } = useWire();
  return (
    <WMobileFrame title="Profile" tabBar>
      <Col gap={10}>
        <Row gap={10} style={{ marginBottom: 4 }}>
          <WAvatar name="Mei Lin" size={56} />
          <Col gap={2}>
            <H size={18}>Mei Lin</H>
            <Row gap={6}>
              <WBadge kind={role} />
              <WBadge kind="active">active</WBadge>
            </Row>
            <T size={11} color={INK_2}>mei@school.edu</T>
          </Col>
        </Row>
        <WSquiggle />
        <WField label="Full name" value="Mei Lin" />
        <WField label="Avatar URL (paste)" value="https://…/mei.jpg" />
        <T size={11} color={INK_3} style={{ fontStyle: 'italic' }}>file upload coming soon</T>
        <Row gap={8} style={{ marginTop: 6 }}>
          <WBtn primary style={{ flex: 1 }}>Save</WBtn>
          <WBtn style={{ flex: 1 }}>Cancel</WBtn>
        </Row>
        <div style={{ marginTop: 6, paddingTop: 8, borderTop: `1px dashed ${INK_3}` }}>
          <WBtn danger sm>Log out</WBtn>
        </div>
      </Col>
    </WMobileFrame>
  );
}

function S4_Logout() {
  return (
    <WMobileFrame title="" tabBar={false}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, padding: '0 8px' }}>
        <WBox pad={16} style={{ background: PAPER }}>
          <H size={20} style={{ textAlign: 'center', marginBottom: 8 }}>Log out?</H>
          <T color={INK_2} style={{ textAlign: 'center', marginBottom: 14 }}>
            You'll be returned to the login screen. Unsaved drafts will be lost.
          </T>
          <Row gap={8}>
            <WBtn style={{ flex: 1 }}>Cancel</WBtn>
            <WBtn primary danger style={{ flex: 1 }}>Log out</WBtn>
          </Row>
        </WBox>
        <WNote>Modal-style confirm; backdrop dimmed in real impl.</WNote>
      </div>
    </WMobileFrame>
  );
}

Object.assign(window, { S1_Login, S2_Register, S3_Profile, S4_Logout });
