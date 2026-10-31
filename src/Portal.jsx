import React, { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import { Plus, Search, Trash2, Pencil, X, Upload, ExternalLink, Download, RefreshCw } from "lucide-react";

const MODULES = {
  staff: { title: "Staff accounts", collection: "users", fields: [["name","Full name"],["email","Email"],["role","Role","select",["teacher_admin","content_admin"]],["active","Active","boolean"]] },
  classes: { title: "Classes & sections", collection: "classes", fields: [["name","Class name"],["section","Section"],["academicYear","Academic year"]] },
  students: { title: "Students", collection: "students", fields: [["name","Full name"],["email","Email"],["classId","Class ID"],["sectionId","Section"],["rollNumber","Roll number"]] },
  resources: { title: "Learning resources", collection: "materials", fields: [["title","Title"],["subject","Subject"],["classId","Class ID"],["sectionId","Section"],["description","Description"],["visibility","Visibility","select",["class","school"]]], upload: true },
  homework: { title: "Homework", collection: "homework", fields: [["title","Assignment title"],["subject","Subject"],["classId","Class ID"],["sectionId","Section"],["description","Instructions"],["dueDate","Due date","date"]] },
  announcements: { title: "Announcements", collection: "announcements", fields: [["title","Title"],["message","Message"],["visibility","Visibility","select",["school","class"]],["classId","Class ID"],["sectionId","Section"]] },
  timetable: { title: "Timetable", collection: "timetable", fields: [["classId","Class ID"],["sectionId","Section"],["day","Day"],["period","Period"],["subject","Subject"],["startTime","Start time"],["endTime","End time"]] },
  settings: { title: "School settings", collection: "school_settings", fields: [["schoolName","School name"],["academicYear","Academic year"],["timezone","Timezone"],["contactEmail","Contact email"]] }
};

function clean(value) { return value == null ? "" : String(value); }

export default function PortalModule({ page, user, profile }) {
  const config = MODULES[page];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const canManage = ["super_admin","teacher_admin","content_admin"].includes(profile?.role);
  async function load() {
    if (!config) return;
    setLoading(true); setError("");
    try {
      let q = collection(db, config.collection);
      if (page === "staff") q = query(q, where("role","in",["teacher_admin","content_admin"]));
      const snap = await getDocs(q);
      setRows(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch (e) { setError(e.code === "permission-denied" ? "Your account does not have permission to view this section. Check Firestore rules and your assigned role." : (e.message || "Could not load records.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [page]);

  const visible = useMemo(() => rows.filter(r => Object.values(r).some(v => clean(v).toLowerCase().includes(search.toLowerCase()))), [rows,search]);
  function startNew() { setEditing("new"); setForm({ active:true, visibility:"class" }); setFile(null); }
  function startEdit(row) { setEditing(row.id); setForm(Object.fromEntries(config.fields.map(([key]) => [key, row[key] ?? (key==="active" ? true : "")]))); setFile(null); }
  function close() { setEditing(null); setForm({}); setFile(null); }
  async function save(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, updatedAt:serverTimestamp() };
      if (page === "staff") { payload.email = clean(payload.email).trim().toLowerCase(); payload.provisioning = "manual_auth_required"; }
      if (page === "resources" && file) {
        const path = `materials/${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
        const fileRef = ref(storage,path);
        await uploadBytes(fileRef,file);
        payload.fileUrl = await getDownloadURL(fileRef); payload.filePath = path; payload.fileName = file.name;
      }
      if (editing === "new") await addDoc(collection(db,config.collection), { ...payload, createdBy:user.uid, createdAt:serverTimestamp() });
      else await updateDoc(doc(db,config.collection,editing),payload);
      close(); await load();
    } catch (e) { setError(e.code === "permission-denied" ? "Permission denied. Check the published Firestore/Storage rules for this role." : (e.message || "Could not save.")); }
    finally { setSaving(false); }
  }
  async function remove(row) {
    if (!window.confirm(`Delete "${row.title || row.name || row.schoolName || "this record"}"? This cannot be undone.`)) return;
    try {
      if (row.filePath) { try { await deleteObject(ref(storage,row.filePath)); } catch {} }
      await deleteDoc(doc(db,config.collection,row.id)); await load();
    } catch(e) { setError(e.message || "Could not delete this record."); }
  }

  if (!config) return <section className="module-panel"><h2>Section unavailable</h2><p>This module is not configured.</p></section>;
  return <section className="module-panel">
    <div className="module-toolbar"><div><h2>{config.title}</h2><p>Records are stored in your connected Firebase project.</p></div><div className="module-actions"><label className="module-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search records"/></label><button className="module-primary" onClick={startNew}><Plus size={16}/> Add new</button><button className="module-icon" onClick={load} aria-label="Refresh"><RefreshCw size={16}/></button></div></div>
    {page==="staff" && <p className="module-hint">Staff profile records can be managed here. Creating a Firebase Authentication login requires the secure server-side provisioning function; this screen will not create a fake login.</p>}
    {error && <div className="module-error">{error}</div>}
    {loading ? <p className="module-muted">Loading records…</p> : visible.length === 0 ? <div className="module-empty"><b>No records yet</b><p>Add your first {config.title.toLowerCase()} record to get started.</p></div> :
      <div className="module-table-wrap"><table className="module-table"><thead><tr>{config.fields.slice(0,5).map(f=><th key={f[0]}>{f[1]}</th>)}<th>Actions</th></tr></thead><tbody>{visible.map(row=><tr key={row.id}>{config.fields.slice(0,5).map(f=><td key={f[0]}>{f[0]==="active" ? (row.active ? "Active" : "Inactive") : clean(row[f[0]]) || "—"}</td>)}<td><div className="module-row-actions">{row.fileUrl && <a href={row.fileUrl} target="_blank" rel="noreferrer" aria-label="Open file"><ExternalLink size={15}/></a>}<button onClick={()=>startEdit(row)} aria-label="Edit"><Pencil size={15}/></button><button onClick={()=>remove(row)} aria-label="Delete"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}
    {editing !== null && <div className="module-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close();}}><form className="module-modal" onSubmit={save}><div className="module-modal-head"><h3>{editing==="new" ? "Add" : "Edit"} {config.title.replace(/s$/,"")}</h3><button type="button" onClick={close} aria-label="Close"><X size={18}/></button></div>
      {config.fields.map(([key,label,type,options])=><label className="module-field" key={key}>{label}{type==="select" ? <select value={clean(form[key])} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select> : type==="boolean" ? <input type="checkbox" checked={!!form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.checked}))}/> : <input type={type==="date"?"date":"text"} value={clean(form[key])} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))} required={["name","title","schoolName"].includes(key)}/>}</label>)}
      {config.upload && <label className="module-field">Attach PDF or document<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg" onChange={e=>setFile(e.target.files?.[0] || null)}/></label>}
      <div className="module-modal-actions"><button type="button" className="module-secondary" onClick={close}>Cancel</button><button className="module-primary" disabled={saving}>{saving?"Saving…":"Save record"}</button></div>
    </form></div>}
  </section>;
}
