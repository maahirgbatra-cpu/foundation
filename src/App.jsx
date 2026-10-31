import { useEffect, useMemo, useState } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseConfigured } from "./firebase";
import {
  BookOpen, GraduationCap, ShieldCheck, Presentation, FolderUp, LogOut,
  Menu, Bell, LockKeyhole, CircleAlert, LayoutDashboard, Users, School,
  BookMarked, Settings, ChevronRight, Search, Plus, ArrowUpRight, X
} from "lucide-react";

const roles = [
  { id: "super_admin", label: "Super Admin", hint: "School-wide control", Icon: ShieldCheck },
  { id: "teacher_admin", label: "Teacher Admin", hint: "Classroom and student management", Icon: Presentation },
  { id: "content_admin", label: "Content Admin", hint: "Learning resources and notices", Icon: FolderUp },
  { id: "student", label: "Student", hint: "Access your class resources", Icon: GraduationCap },
];

const navByRole = {
  super_admin: [
    ["overview", "Overview", LayoutDashboard],
    ["staff", "Staff accounts", Users],
    ["classes", "Classes & sections", School],
    ["resources", "Learning resources", BookOpen],
    ["settings", "School settings", Settings],
  ],
  teacher_admin: [
    ["overview", "Overview", LayoutDashboard],
    ["students", "Students", GraduationCap],
    ["homework", "Homework", BookMarked],
    ["resources", "Learning resources", BookOpen],
  ],
  content_admin: [
    ["overview", "Overview", LayoutDashboard],
    ["resources", "Learning resources", BookOpen],
    ["announcements", "Announcements", Bell],
  ],
  student: [
    ["overview", "Overview", LayoutDashboard],
    ["resources", "Study materials", BookOpen],
    ["homework", "Homework", BookMarked],
    ["profile", "My profile", GraduationCap],
  ],
};

function ComingSoon({ title, description }) {
  return <div className="empty-state"><div className="empty-icon"><BookOpen/></div><h3>{title}</h3><p>{description}</p><span>Next development module</span></div>;
}

export default function App() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("studyspace-theme") === "dark"; } catch { return false; }
  });
  const [navSearch, setNavSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    try { localStorage.setItem("studyspace-theme", darkMode ? "dark" : "light"); } catch {}
  }, [darkMode]);

  useEffect(() => {
    if (!auth) { setChecking(false); return; }
    return onAuthStateChanged(auth, async (current) => {
      setUser(current);
      if (current) {
        try {
          const snap = await getDoc(doc(db, "users", current.uid));
          setProfile(snap.exists() ? snap.data() : null);
        } catch { setProfile(null); }
      } else { setProfile(null); setPage("overview"); }
      setChecking(false);
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const snap = await getDoc(doc(db, "users", result.user.uid));
      if (!snap.exists()) throw new Error("Your account has no school profile. Ask the Super Admin to set it up.");
      const data = snap.data();
      if (data.role !== role) throw new Error("This account does not have the selected login role.");
      if (data.active !== true) throw new Error("This account is inactive. Contact the school administrator.");
      setProfile(data); setPage("overview");
    } catch (err) {
      setError(err.code === "auth/invalid-credential" ? "Incorrect email or password." : (err.message || "Unable to sign in."));
      if (auth?.currentUser) await signOut(auth);
    } finally { setBusy(false); }
  }

  if (checking) return <main className="center"><div className="loader"/>Loading StudySpace…</main>;

  if (user && profile) {
    const currentRole = profile.role;
    const roleInfo = roles.find(r => r.id === currentRole) || roles[0];
    const nav = navByRole[currentRole] || navByRole.student;
    const pageInfo = nav.find(n => n[0] === page) || nav[0];
    const filteredNav = nav.filter((n) => n[1].toLowerCase().includes(navSearch.toLowerCase()));
    const initials = (profile.name || user.email || "U").slice(0,1).toUpperCase();
    return <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-icon"><GraduationCap/></span><span>StudySpace<small>School learning portal</small></span><button className="mobile-close icon-btn" onClick={()=>setMobileNav(false)}><X/></button></div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-search"><Search size={15}/><input aria-label="Search navigation" placeholder="Find a section…" value={navSearch} onChange={e=>setNavSearch(e.target.value)}/></div>
        {filteredNav.length ? filteredNav.map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?"active":""}`} onClick={()=>{setPage(id);setMobileNav(false)}}><Icon size={18}/>{label}{page===id&&<ChevronRight className="nav-arrow" size={15}/>}</button>) : <p className="nav-empty">No matching sections</p>}
        <div className="sidebar-bottom"><div className="avatar">{initials}</div><div className="user-meta"><b>{profile.name || "School user"}</b><small>{roleInfo.label}</small></div><button className="icon-btn" onClick={()=>signOut(auth)} aria-label="Sign out"><LogOut size={18}/></button></div>
      </aside>
      {mobileNav && <button className="nav-scrim" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
      <section className="workspace">
        <header className="topbar"><button className="mobile-brand icon-btn" onClick={()=>setMobileNav(true)}><Menu/> <b>StudySpace</b></button><span className="school-label">SCHOOL PORTAL</span><div className="top-actions"><span className="top-user">{profile.name || user.email}</span><div className="top-pop-wrap"><button className="icon-btn top-action-btn" aria-label="Notifications" aria-expanded={showNotifications} onClick={()=>{setShowNotifications(v=>!v);setShowAccount(false)}}><Bell size={19}/><i className="notification-dot"/></button>{showNotifications&&<div className="top-popover"><b>Notifications</b><p>You're all caught up.</p><small>New school updates will appear here.</small></div>}</div><button className="theme-toggle" onClick={()=>setDarkMode(v=>!v)} aria-label={darkMode?"Switch to light mode":"Switch to dark mode"}>{darkMode?"☀":"☾"}<span>{darkMode?"Light":"Dark"}</span></button><div className="top-pop-wrap"><button className="account-chip" onClick={()=>{setShowAccount(v=>!v);setShowNotifications(false)}} aria-expanded={showAccount}><span className="mini-avatar">{initials}</span><span>{profile.name || "Account"}</span></button>{showAccount&&<div className="top-popover account-pop"><b>{profile.name || "School user"}</b><small>{user.email}</small><small>{roleInfo.label}</small><button onClick={()=>signOut(auth)}><LogOut size={14}/> Sign out</button></div>}</div></div></header>
        <div className="content">
          <div className="welcome"><div><p className="eyebrow">{roleInfo.label.toUpperCase()}</p><h1>{page==="overview" ? `Welcome, ${profile.name || "there"}.` : pageInfo[1]}</h1><p className="muted">{page==="overview" ? "Here is your school workspace at a glance." : "Manage your school workspace from here."}</p><div className="welcome-meta"><span><span className="live-dot"/> Connected to school account</span><span>•</span><span>{roleInfo.label}</span></div></div><span className="welcome-mark"><GraduationCap size={34}/></span></div>
          {page==="overview" ? <>
            <div className="status-card"><div className="status-icon"><ShieldCheck/></div><div><b>Account verified</b><p>You are signed in as <strong>{roleInfo.label}</strong>. Your access is based on your assigned school role.</p></div></div>
            {currentRole==="super_admin" ? <>
              <div className="section-heading"><h2>Administration</h2><span className="pill">Phase 1</span></div>
              <div className="admin-grid">
                <button className="admin-tile" onClick={()=>setPage("staff")}><span className="tile-icon"><Users/></span><b>Staff accounts</b><p>Manage teacher and content-admin access.</p><ArrowUpRight/></button>
                <button className="admin-tile" onClick={()=>setPage("classes")}><span className="tile-icon"><School/></span><b>Classes & sections</b><p>Set up the school's class structure.</p><ArrowUpRight/></button>
                <button className="admin-tile" onClick={()=>setPage("resources")}><span className="tile-icon"><BookOpen/></span><b>Learning resources</b><p>Review the school's learning library.</p><ArrowUpRight/></button>
              </div>
              <div className="section-heading"><h2>Foundation checklist</h2><span className="pill">Setup</span></div>
              <div className="checklist"><div><span className="check">✓</span><span><b>Firebase connected</b><small>Web app configuration is in place.</small></span><em>Ready</em></div><div><span className="check">✓</span><span><b>Admin profile created</b><small>Your Firestore role profile is recognised.</small></span><em>Ready</em></div><div><span className="pending-dot"/> <span><b>Staff provisioning</b><small>Secure staff account creation is the next backend task.</small></span><em className="pending-text">Next</em></div></div>
            </> : <><div className="section-heading"><h2>Your workspace</h2></div><div className="setup-grid"><div className="setup-card"><BookOpen/><b>Learning resources</b><p>Class and subject resources will appear here.</p><span>Coming next</span></div><div className="setup-card"><BookMarked/><b>Homework</b><p>Assignments and due dates will appear here.</p><span>Coming next</span></div></div></>}
          </> : page==="staff" ? <ComingSoon title="Staff accounts" description="The next module will let you create teacher and content-admin accounts securely, assign roles and deactivate access."/> :
            page==="classes" ? <ComingSoon title="Classes & sections" description="Create classes, add sections and organise the school structure here."/> :
            page==="resources" ? <ComingSoon title="Learning resources" description="Upload and organise PDFs, notes and learning materials by class, section and subject."/> :
            page==="settings" ? <ComingSoon title="School settings" description="Configure the school name, academic year and basic preferences."/> :
<ComingSoon title={pageInfo[1]} description="This section will be added in the next development module."/>}
        </div>
      </section>
    </main>;
  }

  return <main className="login-page">
    <section className="login-panel">
      <div className="brand login-brand"><span className="brand-icon"><GraduationCap/></span><span>StudySpace<small>One school. One learning space.</small></span></div>
      <div className="login-heading"><p className="eyebrow">SCHOOL PORTAL</p><h1>Welcome back</h1><p className="muted">Choose your account type to continue.</p></div>
      {!firebaseConfigured && <div className="notice"><CircleAlert size={18}/><span>Firebase configuration is needed before sign-in can work.</span></div>}
      <div className="role-grid">{roles.map(({id,label,hint,Icon})=><button key={id} className={`role-option ${role===id?"selected":""}`} onClick={()=>setRole(id)}><span className="role-icon"><Icon size={20}/></span><span className="role-copy"><b>{label}</b><small>{hint}</small></span><span className="radio-dot"/></button>)}</div>
      <form onSubmit={handleLogin} className="login-form">
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="username" required/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required/></label>
        {error && <div className="error"><CircleAlert size={17}/>{error}</div>}
        <button className="submit-btn" type="submit" disabled={!firebaseConfigured || busy}>{busy?"Signing in…":"Sign in"} <span>→</span></button>
      </form>
      <div className="secure-note"><LockKeyhole size={14}/> Secure school access · Accounts are created by school admins</div>
      <p className="footer-note">Need an account? Contact your school administrator.</p>
    </section>
    <aside className="login-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-content"><div className="art-symbol"><BookOpen size={44}/></div><p className="eyebrow">LEARN · ORGANISE · GROW</p><h2>Everything for school,<br/>in one simple place.</h2><p>Notes, homework and class resources — organised around your classroom.</p><div className="art-chips"><span>Study materials</span><span>Homework</span><span>Class updates</span></div></div><div className="art-footer">STUDYSPACE · SCHOOL PORTAL</div></aside>
  </main>;
}
