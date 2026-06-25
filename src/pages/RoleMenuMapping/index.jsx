"use client";
import React, { useState, useEffect, useCallback } from "react";
import { RoleMaster_Manage, RoleMenuMapping_Manage } from "@/lib/services/masterService";
import ProtectedRoute from "@/components/ProtectedRoute";

// ── CSS (gold jewellery theme) ────────────────────────────────────────────────
const styles = `
  :root {
    --gold:      #B8862C; --gold-lt: #F5E7C8; --gold-dk: #7A5410;
    --surface:   #FDFAF5; --card: #FFFFFF; --border: #E8DEC8;
    --text:      #1C1510; --muted: #7A6A50;
    --success:   #2D7A4F; --danger: #B83232; --danger-lt: #FDEAEA;
    --radius:    8px; --shadow: 0 2px 12px rgba(184,134,44,0.10);
  }
  .rm-page { display:grid; grid-template-columns:360px 1fr; gap:24px; padding:28px 32px; max-width:1280px; margin:0 auto; }
  .rm-card { background:#fff; border:1px solid var(--border); border-radius:var(--radius); box-shadow:var(--shadow); overflow:hidden; }
  .rm-card-head { background:var(--gold-lt); border-bottom:1px solid var(--border); padding:14px 20px; display:flex; align-items:center; justify-content:space-between; }
  .rm-card-head h2 { font-size:.95rem; font-weight:700; color:var(--gold-dk); margin:0; }
  .rm-card-body { padding:20px; }
  .rm-label { display:block; font-size:.78rem; font-weight:600; color:var(--muted); margin-bottom:5px; margin-top:14px; text-transform:uppercase; letter-spacing:.5px; }
  .rm-label:first-of-type { margin-top:0; }
  .rm-input { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:6px; font-size:.9rem; font-family:inherit; background:var(--surface); color:var(--text); outline:none; transition:border-color .2s; box-sizing:border-box; }
  .rm-input:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(184,134,44,.15); }
  .rm-textarea { resize:vertical; min-height:70px; }
  .rm-toggle-row { display:flex; align-items:center; gap:10px; margin-top:14px; }
  .rm-toggle-label { font-size:.85rem; font-weight:500; color:var(--muted); }
  .rm-checkbox { width:17px; height:17px; accent-color:var(--gold); cursor:pointer; }
  .rm-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:6px; border:none; font-size:.875rem; font-weight:600; cursor:pointer; transition:all .18s; font-family:inherit; }
  .rm-btn:disabled { opacity:.55; cursor:not-allowed; }
  .rm-btn-primary { background:var(--gold); color:#fff; }
  .rm-btn-primary:hover:not(:disabled) { background:var(--gold-dk); }
  .rm-btn-ghost { background:transparent; color:var(--gold-dk); border:1px solid var(--gold); }
  .rm-btn-ghost:hover:not(:disabled) { background:var(--gold-lt); }
  .rm-btn-danger { background:var(--danger-lt); color:var(--danger); border:1px solid #f0c0c0; }
  .rm-btn-danger:hover:not(:disabled) { background:#fad5d5; }
  .rm-btn-sm { padding:5px 11px; font-size:.78rem; }
  .rm-btn-row { display:flex; gap:10px; margin-top:18px; }
  .rm-role-item { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid var(--border); cursor:pointer; transition:background .15s; gap:8px; }
  .rm-role-item:last-child { border-bottom:none; }
  .rm-role-item:hover { background:var(--gold-lt); }
  .rm-role-item.active { background:var(--gold-lt); border-left:3px solid var(--gold); }
  .rm-role-name { font-weight:600; font-size:.9rem; }
  .rm-role-desc { font-size:.78rem; color:var(--muted); margin-top:2px; }
  .rm-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:.72rem; font-weight:600; }
  .rm-badge-active { background:#d4f0e2; color:var(--success); }
  .rm-badge-inactive { background:#f0d4d4; color:var(--danger); }
  .rm-banner { background:linear-gradient(90deg,var(--gold-lt),#fff); border:1px solid var(--border); border-radius:var(--radius); padding:14px 20px; display:flex; align-items:center; gap:12px; margin:16px 16px 0; }
  .rm-dot { width:10px; height:10px; border-radius:50%; background:var(--gold); flex-shrink:0; }
  .rm-menu-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:10px; padding:18px; }
  .rm-chip { display:flex; align-items:center; gap:8px; padding:10px 14px; border:1.5px solid var(--border); border-radius:8px; cursor:pointer; transition:all .18s; background:var(--surface); user-select:none; }
  .rm-chip:hover { border-color:var(--gold); background:var(--gold-lt); }
  .rm-chip.selected { border-color:var(--gold); background:var(--gold-lt); }
  .rm-chip-cb { width:15px; height:15px; accent-color:var(--gold); }
  .rm-chip-name { font-size:.85rem; font-weight:600; color:var(--text); }
  .rm-tabs { display:flex; border-bottom:2px solid var(--border); }
  .rm-tab { padding:12px 20px; font-size:.875rem; font-weight:600; color:var(--muted); cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; transition:all .18s; }
  .rm-tab.active { color:var(--gold-dk); border-bottom-color:var(--gold); }
  .rm-table { width:100%; border-collapse:collapse; font-size:.875rem; }
  .rm-table thead { background:var(--gold-lt); }
  .rm-table th { padding:10px 14px; text-align:left; font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--gold-dk); border-bottom:2px solid var(--border); }
  .rm-table td { padding:10px 14px; border-bottom:1px solid var(--border); vertical-align:middle; }
  .rm-table tr:last-child td { border-bottom:none; }
  .rm-table tr:hover td { background:var(--surface); }
  .rm-empty { text-align:center; padding:40px 20px; color:var(--muted); font-size:.9rem; }
  .rm-toast { position:fixed; bottom:28px; right:28px; background:var(--gold-dk); color:#fff; padding:12px 22px; border-radius:8px; font-size:.875rem; font-weight:500; z-index:9999; box-shadow:0 4px 16px rgba(0,0,0,.22); animation:rm-fadeIn .3s ease; }
  .rm-toast.error { background:#B83232; }
  .rm-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:rm-spin .7s linear infinite; display:inline-block; }
  .rm-loading { display:flex; align-items:center; justify-content:center; padding:40px; color:var(--muted); gap:10px; font-size:.9rem; }
  .rm-err-text { color:#B83232; font-size:.8rem; margin-top:5px; }
  @keyframes rm-spin { to { transform:rotate(360deg); } }
  @keyframes rm-fadeIn { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
  @media(max-width:900px){ .rm-page{ grid-template-columns:1fr; padding:16px; } }
`;

// ── Toast hook ────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);
  return { toast, show };
}

// ── CheckIcon ─────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
    <path d="M2 8l4 4L14 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Spinner (for loading overlays) ────────────────────────────────────────────
const Spinner = ({ gold = false }) => (
  <span className="rm-spinner" style={gold ? { borderTopColor:"var(--gold)", borderColor:"var(--border)" } : {}} />
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function RoleMenuManagement() {
  const { toast, show: showToast } = useToast();

  // ── State ─────────────────────────────────────────────────────────────────
  const [roles,        setRoles]        = useState([]);
  const [menuList,     setMenuList]     = useState([]);   // menus with IsMapped flag
  const [mappingGrid,  setMappingGrid]  = useState([]);   // current mapping table (TypeId 3)
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTab,    setActiveTab]    = useState("assign");

  // Form state
  const [form,    setForm]    = useState({ roleName: "", roleDescription: "", roleCode: "", isActive: true });
  const [editId,  setEditId]  = useState(null);   // null = new, number = edit
  const [formErr, setFormErr] = useState({ roleName: "", roleCode: "" });

  // Loading flags
  const [loadingRoles,   setLoadingRoles]   = useState(false);
  const [loadingMenus,   setLoadingMenus]   = useState(false);
  const [loadingGrid,    setLoadingGrid]    = useState(false);
  const [savingRole,     setSavingRole]     = useState(false);
  const [savingMapping,  setSavingMapping]  = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  // SP returns data inside response; adjust key if your API wraps differently
  const unwrap = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.result)) return res.result;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.Result)) return res.Result;
    if (Array.isArray(res.value)) return res.value;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    if (typeof res === "object" && !Array.isArray(res)) return [res];
    return [];
  };

  // ── TypeId 1 — Get All Roles ──────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const res = await RoleMaster_Manage({ typeId: 1, roleId: 0, roleName: "", roleDescription: "", isActive: true });
      setRoles(unwrap(res));
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to load roles", "error");
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  // ── TypeId 1 (Mapping) — Get Menus with IsMapped flag ────────────────────
  const fetchMenusForRole = async (roleId) => {
    setLoadingMenus(true);
    try {
      const res = await RoleMenuMapping_Manage({ typeId: 1, roleId, menuIds: "" });
      // Each row: { MenuId, MenuName, MenuUrl, Icon, IsMapped }
      setMenuList(unwrap(res));
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to load menus", "error");
    } finally {
      setLoadingMenus(false);
    }
  };

  // ── TypeId 3 (Mapping) — Current Mapping Grid ────────────────────────────
  const fetchMappingGrid = async (roleId) => {
    setLoadingGrid(true);
    try {
      const res = await RoleMenuMapping_Manage({ typeId: 3, roleId, menuIds: "" });
      // Each row: { Id, RoleId, MenuId, MenuName, MenuUrl, Icon, CreatedBy, CreatedDate }
      setMappingGrid(unwrap(res));
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to load mapping", "error");
    } finally {
      setLoadingGrid(false);
    }
  };

  // ── Select Role ───────────────────────────────────────────────────────────
  const selectRole = (role) => {
    setSelectedRole(role);
    setActiveTab("assign");
    fetchMenusForRole(role.RoleId);   // load chips
  };

  // ── Tab switch ────────────────────────────────────────────────────────────
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === "view" && selectedRole) fetchMappingGrid(selectedRole.RoleId);
  };

  // ── Chip toggle ───────────────────────────────────────────────────────────
  const toggleMenu = (menuId) => {
    debugger
    setMenuList((prev) =>
      prev.map((m) => m.MenuId === menuId ? { ...m, IsMapped: m.IsMapped ? 0 : 1 } : m)
    );
  };

  // ── TypeId 2 (Mapping) — Save Mapping ────────────────────────────────────
  const saveMapping = async () => {
    if (!selectedRole) return;
    const selectedIds = menuList.filter((m) => m.IsMapped).map((m) => m.MenuId).join(",");
    setSavingMapping(true);
    try {
      await RoleMenuMapping_Manage({
        typeId:  2,
        roleId:  selectedRole.RoleId,
        menuIds: selectedIds,   // comma-separated string → STRING_SPLIT in SP
      });
      const count = menuList.filter((m) => m.IsMapped).length;
      showToast(`Mapping saved — ${count} menu${count !== 1 ? "s" : ""} assigned`);
      handleTabSwitch("view");
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to save mapping", "error");
    } finally {
      setSavingMapping(false);
    }
  };

  // ── TypeId 4 (Mapping) — Remove Single Mapping ───────────────────────────
  const removeMapping = async (mappingRow) => {
    // SP TypeId 4 uses @MenuIds (comma string) and @RoleId
    try {
      await RoleMenuMapping_Manage({
        typeId:  4,
        roleId:  selectedRole.RoleId,
        menuIds: String(mappingRow.MenuId),
      });
      // Update grid + chip list
      setMappingGrid((prev) => prev.filter((m) => m.id !== mappingRow.id));
      setMenuList((prev) =>
        prev.map((m) => m.MenuId === mappingRow.MenuId ? { ...m, IsMapped: 0 } : m)
      );
      showToast("Menu removed from mapping");
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to remove mapping", "error");
    }
  };

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleFormChange = (field, value) => {
    // RoleCode: only uppercase letters/digits, max 3 chars
    if (field === "roleCode") {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    }
    setForm((p) => ({ ...p, [field]: value }));
    if (formErr[field]) setFormErr((p) => ({ ...p, [field]: "" }));
  };

  const resetForm = () => {
    setForm({ roleName: "", roleDescription: "", roleCode: "", isActive: true });
    setEditId(null);
    setFormErr({ roleName: "", roleCode: "" });
  };

  const startEdit = (role) => {
    debugger
    setEditId(role.RoleId);
    setForm({
      roleName:        role.RoleName,
      roleDescription: role.RoleDescription || "",
      roleCode:        role.RoleCode || "",
      isActive:        role.IsActive,
    });
    setFormErr({ roleName: "", roleCode: "" });
  };

  // ── TypeId 2 — Insert Role  /  TypeId 3 — Update Role ────────────────────
  const saveRole = async () => {
    // Validate
    const errs = { roleName: "", roleCode: "" };
    if (!form.roleName.trim())          errs.roleName = "Role Name is required";
    if (!form.roleCode.trim())          errs.roleCode = "Role Code is required";
    else if (form.roleCode.length !== 3) errs.roleCode = "Role Code must be exactly 3 characters";
    if (errs.roleName || errs.roleCode) { setFormErr(errs); return; }

    setSavingRole(true);
    try {
      const base = {
        roleName:        form.roleName.trim(),
        roleDescription: form.roleDescription.trim(),
        roleCode:        form.roleCode.trim(),
        isActive:        form.isActive,
      };

      if (editId) {
        // TypeId 3 = Update
        await RoleMaster_Manage({ typeId: 3, roleId: editId, ...base });
        showToast("Role updated successfully");
      } else {
        // TypeId 2 = Insert
        await RoleMaster_Manage({ typeId: 2, roleId: 0, ...base });
        showToast("Role saved successfully");
      }
      resetForm();
      fetchRoles();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || e.message || "Failed to save role";
      if (typeof msg === "string" && msg.toLowerCase().includes("already exists")) {
        setFormErr((p) => ({ ...p, roleName: "Role name already exists" }));
      } else {
        showToast(msg, "error");
      }
    } finally {
      setSavingRole(false);
    }
  };

  // ── TypeId 4 — Delete Role ────────────────────────────────────────────────
  const deleteRole = async (roleId) => {
    if (!confirm("Delete this role and all its menu mappings?")) return;
    try {
      await RoleMaster_Manage({ typeId: 4, roleId, roleName: "", roleDescription: "", isActive: true });
      if (selectedRole?.roleId === roleId) {
        setSelectedRole(null);
        setMenuList([]);
        setMappingGrid([]);
      }
      showToast("Role deleted");
      fetchRoles();
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to delete role", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <style>{styles}</style>

      {/* ── Header ── */}
      <header style={{
        background:"linear-gradient(135deg,#7A5410 0%,#B8862C 100%)",
        padding:"18px 32px", display:"flex", alignItems:"center", gap:"14px",
        boxShadow:"0 2px 8px rgba(0,0,0,0.18)",
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <polygon points="16,4 28,12 28,24 16,28 4,24 4,12" fill="rgba(255,255,255,0.25)" stroke="#fff" strokeWidth="1.5"/>
          <circle cx="16" cy="16" r="5" fill="#fff" opacity=".9"/>
        </svg>
        <div>
          <h1 style={{color:"#fff",fontSize:"1.25rem",fontWeight:700,letterSpacing:".3px",margin:0}}>
            Jewellery — Role &amp; Menu Management
          </h1>
          <span style={{color:"#F5E7C8",fontSize:".85rem"}}>Role entry, Menu assignment, Mapping control</span>
        </div>
      </header>

      <div className="rm-page">

        {/* ══════════ LEFT COLUMN ══════════ */}
        <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>

          {/* Role Form Card */}
          <div className="rm-card">
            <div className="rm-card-head">
              <h2>{editId ? "✏️ Edit Role" : "➕ New Role"}</h2>
              <button className="rm-btn rm-btn-ghost rm-btn-sm" onClick={resetForm}>Clear</button>
            </div>
            <div className="rm-card-body">

              <label className="rm-label">Role Name *</label>
              <input
                className="rm-input"
                placeholder="e.g. Store Manager"
                value={form.roleName}
                onChange={(e) => handleFormChange("roleName", e.target.value)}
              />
              {formErr.roleName && <p className="rm-err-text">⚠ {formErr.roleName}</p>}

              {/* Role Code — exactly 3 chars */}
              <label className="rm-label">Role Code * <span style={{color:"var(--gold)",fontWeight:400,textTransform:"none",letterSpacing:0}}>(exactly 3 characters)</span></label>
              <div style={{position:"relative"}}>
                <input
                  className="rm-input"
                  placeholder="e.g. ADM"
                  value={form.roleCode}
                  maxLength={3}
                  style={{
                    paddingRight:"52px",
                    fontFamily:"monospace",
                    fontSize:"1rem",
                    letterSpacing:"4px",
                    textTransform:"uppercase",
                    borderColor: formErr.roleCode ? "#B83232" : undefined,
                  }}
                  onChange={(e) => handleFormChange("roleCode", e.target.value)}
                />
                {/* Live char counter badge */}
                <span style={{
                  position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)",
                  background: form.roleCode.length === 3 ? "var(--gold)" : "var(--border)",
                  color: form.roleCode.length === 3 ? "#fff" : "var(--muted)",
                  borderRadius:"20px", padding:"2px 8px", fontSize:".72rem", fontWeight:700,
                  transition:"background .2s, color .2s",
                }}>
                  {form.roleCode.length}/3
                </span>
              </div>
              {formErr.roleCode && <p className="rm-err-text">⚠ {formErr.roleCode}</p>}

              <label className="rm-label">Description</label>
              <textarea
                className="rm-input rm-textarea"
                placeholder="Brief description of this role..."
                value={form.roleDescription}
                onChange={(e) => handleFormChange("roleDescription", e.target.value)}
              />

              <div className="rm-toggle-row">
                <input
                  type="checkbox" className="rm-checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleFormChange("isActive", e.target.checked)}
                />
                <span className="rm-toggle-label">Active</span>
              </div>

              <div className="rm-btn-row">
                <button className="rm-btn rm-btn-primary" onClick={saveRole} disabled={savingRole}>
                  {savingRole ? <><Spinner /> Saving…</> : <><CheckIcon /> Save Role</>}
                </button>
                <button className="rm-btn rm-btn-ghost" onClick={resetForm} disabled={savingRole}>Cancel</button>
              </div>
            </div>
          </div>

          {/* Role List Card */}
          <div className="rm-card">
            <div className="rm-card-head">
              <h2>📋 All Roles</h2>
              <span style={{fontSize:".78rem",color:"var(--muted)"}}>
                {roles.length} role{roles.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loadingRoles ? (
              <div className="rm-loading"><Spinner gold /> Loading roles…</div>
            ) : roles.length === 0 ? (
              <div className="rm-empty">No roles yet. Add one above.</div>
            ) : (
              roles.map((r) => (
                <div
                  key={r.roleId}
                  className={`rm-role-item ${selectedRole?.roleId === r.roleId ? "active" : ""}`}
                  onClick={() => selectRole(r)}
                >
                  <div style={{flex:1,minWidth:0}}>
                    <div className="rm-role-name">
                    {r.roleName}
                    {r.roleCode && (
                      <span style={{
                        marginLeft:"8px", background:"var(--gold-lt)", color:"var(--gold-dk)",
                        border:"1px solid var(--border)", borderRadius:"4px",
                        padding:"1px 6px", fontSize:".7rem", fontWeight:700,
                        fontFamily:"monospace", letterSpacing:"2px",
                      }}>{r.roleCode}</span>
                    )}
                  </div>
                    <div className="rm-role-desc">{r.RoleName || "—"}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
                    <span className={`rm-badge ${r.isActive ? "rm-badge-active" : "rm-badge-inactive"}`}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      className="rm-btn rm-btn-ghost rm-btn-sm"
                      onClick={(e) => { e.stopPropagation(); startEdit(r); }}
                    >✏️</button>
                    <button
                      className="rm-btn rm-btn-danger rm-btn-sm"
                      onClick={(e) => { e.stopPropagation(); deleteRole(r.RoleId); }}
                    >🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══════════ RIGHT COLUMN — Menu Mapping ══════════ */}
        <div>
          <div className="rm-card">
            <div className="rm-card-head">
              <h2>🗂️ Menu Mapping</h2>
            </div>

            {!selectedRole ? (
              <div className="rm-empty" style={{padding:"48px 20px"}}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
                  style={{opacity:.35,display:"block",margin:"0 auto 10px"}}>
                  <rect x="8" y="14" width="32" height="4" rx="2" fill="#B8862C"/>
                  <rect x="8" y="22" width="24" height="4" rx="2" fill="#B8862C"/>
                  <rect x="8" y="30" width="28" height="4" rx="2" fill="#B8862C"/>
                </svg>
                Select a role from the left to manage its menu access.
              </div>
            ) : (
              <>
                {/* Selected Role Banner */}
                <div className="rm-banner">
                  <div className="rm-dot" />
                  <div>
                    <span style={{fontWeight:700,fontSize:"1rem",color:"var(--gold-dk)"}}>
                      {selectedRole.RoleName}
                    </span>
                    <br />
                    <small style={{color:"var(--muted)",fontSize:".8rem"}}>
                      {selectedRole.RoleDescription || "No description"}
                    </small>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{padding:"16px 20px 8px"}}>
                  <div className="rm-tabs">
                    <div
                      className={`rm-tab ${activeTab === "assign" ? "active" : ""}`}
                      onClick={() => handleTabSwitch("assign")}
                    >Assign Menus</div>
                    <div
                      className={`rm-tab ${activeTab === "view" ? "active" : ""}`}
                      onClick={() => handleTabSwitch("view")}
                    >Current Mapping</div>
                  </div>
                </div>

                {/* ── Assign Tab ── */}
                {activeTab === "assign" && (
                  <>
                    {loadingMenus ? (
                      <div className="rm-loading"><Spinner gold /> Loading menus…</div>
                    ) : (
                      <div className="rm-menu-grid">
                        {menuList.map((m) => (
                          <label
                            key={m.MenuId}
                            className={`rm-chip ${m.IsMapped ? "selected" : ""}`}
                            onClick={() => toggleMenu(m.MenuId)}
                          >
                            <input
                              type="checkbox" className="rm-chip-cb"
                              checked={!!m.IsMapped}
                              onChange={() => toggleMenu(m.MenuId)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="rm-chip-name">{m.MenuName}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <div style={{padding:"0 18px 18px"}}>
                      <button
                        className="rm-btn rm-btn-primary"
                        onClick={saveMapping}
                        disabled={savingMapping || loadingMenus}
                      >
                        {savingMapping ? <><Spinner /> Saving…</> : <><CheckIcon /> Save Mapping</>}
                      </button>
                    </div>
                  </>
                )}

                {/* ── View Tab (Current Mapping Grid) ── */}
                {activeTab === "view" && (
                  <div style={{overflowX:"auto",padding:"0 0 8px"}}>
                    {loadingGrid ? (
                      <div className="rm-loading"><Spinner gold /> Loading mapping…</div>
                    ) : mappingGrid.length === 0 ? (
                      <div className="rm-empty">No menus assigned yet.</div>
                    ) : (
                      <table className="rm-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Menu Name</th>
                            <th>URL</th>
                            <th>Added By</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mappingGrid.map((m, i) => (
                            <tr key={m.Id}>
                              <td style={{color:"var(--muted)",fontSize:".8rem"}}>{i + 1}</td>
                              <td>
                                <span style={{marginRight:"6px"}}>{m.icon}</span>
                                {m.MenuName}
                              </td>
                              <td style={{color:"var(--muted)",fontFamily:"monospace",fontSize:".82rem"}}>
                                {m.MenuUrl}
                              </td>
                              <td style={{color:"var(--muted)",fontSize:".82rem"}}>
                                {m.CreatedBy || "—"}
                              </td>
                              <td>
                                <button
                                  className="rm-btn rm-btn-danger rm-btn-sm"
                                  onClick={() => removeMapping(m)}
                                >Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rm-toast ${toast.type === "error" ? "error" : ""}`}>
          {toast.type === "error" ? "⚠ " : "✔ "}{toast.msg}
        </div>
      )}
 </ProtectedRoute>
    
  );
}
