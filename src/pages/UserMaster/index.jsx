import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";
import { User_Manage } from "@/lib/services/MasterService";
import { FaEye, FaEyeSlash } from "react-icons/fa";
const UserMaster = () => {
  /* ─────────────────────── STATE ─────────────────────── */
  const [userList, setUserList] = useState([]);
  const [roleList, setRoleList] = useState([]);

  const [form, setForm] = useState({
    userName: "",
    password: "",
    roleId: "",
    email: "",
    mobileNo: "",
    isActive: true,
  });

  const [editId, setEditId] = useState(null);   // loginId when editing
  const [buttonName, setButtonName] = useState("Save");
  const [error, setError] = useState({});
const [showPassword, setShowPassword] = useState({});
  /* ─────────────────────── VALIDATION ─────────────────────── */
  const handleValidation = () => {
    let flag = true;
    const newErrors = {};

    if (!form.userName.trim()) {
      newErrors.userName = "User name is required";
      flag = false;
    }

    if (!editId && !form.password.trim()) {
      // password required only on insert; on update it is optional (TypeId 6 resets separately)
      newErrors.password = "Password is required";
      flag = false;
    }

    if (!form.roleId) {
      newErrors.roleId = "Role is required";
      flag = false;
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      flag = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email";
      flag = false;
    }

    if (!form.mobileNo.trim()) {
      newErrors.mobileNo = "Mobile no is required";
      flag = false;
    } else if (!/^\d{10}$/.test(form.mobileNo.trim())) {
      newErrors.mobileNo = "Enter a valid 10-digit number";
      flag = false;
    }

    setError(newErrors);
    return flag;
  };

  /* ─────────────────────── LOAD ROLES (TypeId = 7) ─────────────────────── */
  const loadRoles = async () => {
    try {
      const res = await User_Manage({
        loginId: 0,
        userName: "",
        password: "",
        roleId: 0,
        email: "",
        mobileNo: "",
        isActive: true,
        typeId: 7,
      });
      setRoleList(res?.data || []);
    } catch (err) {
      console.error("Error loading roles", err);
    }
  };

  /* ─────────────────────── LOAD USER LIST (TypeId = 1) ─────────────────────── */
  const loadUserList = async () => {
    try {
      const res = await User_Manage({
        loginId: 0,
        userName: "",
        password: "",
        roleId: 0,
        email: "",
        mobileNo: "",
        isActive: true,
        typeId: 1,
      });
      setUserList(res?.data || []);
    } catch (err) {
      console.error("Error loading users", err);
    }
  };

  useEffect(() => {
    loadRoles();
    loadUserList();
  }, []);

  /* ─────────────────────── SUBMIT (Insert TypeId=2 / Update TypeId=3) ─────────────────────── */
  const handleSubmit = async () => {
    if (!handleValidation()) return;

    const payload = {
      loginId: editId || 0,
      userName: form.userName.trim(),
      password: form.password.trim(),
      roleId: Number(form.roleId),
      email: form.email.trim(),
      mobileNo: form.mobileNo.trim(),
      isActive: form.isActive,
      typeId: editId ? 3 : 2,
    };

    try {
      const response = await User_Manage(payload);
      const result = response?.data?.[0];

      if (result && (result.LoginId || result.Success === 1 || result.Success === "1")) {
        await Swal.fire({
          icon: "success",
          title: "Saved!",
          text: result.Message || "Saved successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        loadUserList();
        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.Message || "Save failed",
        });
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Something went wrong";
      Swal.fire({ icon: "error", title: "Error", text: msg });
    }
  };

  /* ─────────────────────── RESET ─────────────────────── */
  const resetForm = () => {
    setForm({ userName: "", password: "", roleId: "", email: "", mobileNo: "", isActive: true });
    setEditId(null);
    setButtonName("Save");
    setError({});
  };

  /* ─────────────────────── EDIT (TypeId = 5 to prefill) ─────────────────────── */
  const handleEdit = async (loginId) => {
    try {
      const res = await User_Manage({
        loginId,
        userName: "", password: "", roleId: 0, email: "", mobileNo: "", isActive: true,
        typeId: 5,
      });
      const u = res?.data?.[0];
      if (!u) return;

      setForm({
        userName: u.UserName || "",
        password: "",              // never pre-fill password hash
        roleId: u.RoleId ? u.RoleId.toString() : "",
        email: u.Email || "",
        mobileNo: u.MobileNo || "",
        isActive: u.IsActive === true || u.IsActive === 1,
      });
      setEditId(loginId);
      setButtonName("Update");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
    }
  };

  /* ─────────────────────── DELETE (TypeId = 4) ─────────────────────── */
  const handleDelete = async (loginId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This user will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;

    try {
      await User_Manage({
        loginId,
        userName: "", password: "", roleId: 0, email: "", mobileNo: "", isActive: true,
        typeId: 4,
      });
      await Swal.fire({ icon: "success", title: "Deleted!", timer: 1200, showConfirmButton: false });
      loadUserList();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Delete failed" });
    }
  };

  /* ─────────────────────── RESET PASSWORD (TypeId = 6) ─────────────────────── */
  const handleResetPassword = async (loginId) => {
    const { value: newPass } = await Swal.fire({
      title: "Reset password",
      input: "password",
      inputLabel: "New password",
      inputPlaceholder: "Enter new password",
      showCancelButton: true,
      confirmButtonText: "Reset",
      inputValidator: (v) => (!v ? "Password is required" : undefined),
    });
    if (!newPass) return;

    try {
      const res = await User_Manage({
        loginId,
        userName: "", password: newPass, roleId: 0, email: "", mobileNo: "", isActive: true,
        typeId: 6,
      });
      const result = res?.data?.[0];
      Swal.fire({
        icon: result?.Success === 1 ? "success" : "error",
        title: result?.Success === 1 ? "Done!" : "Error",
        text: result?.Message || "",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Reset failed" });
    }
  };

  /* ─────────────────────── FIELD CHANGE ─────────────────────── */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError((prev) => ({ ...prev, [field]: "" }));
  };

  /* ─────────────────────── UI ─────────────────────── */
  return (
    <ProtectedRoute>
      <div className="content-wrapper">

        {/* ── Form Card ── */}
        <div className="form-card">
          <h2>{editId ? "Edit user" : "User master"}</h2>
          <hr />

          <div className="form-row">
            <div className="form-group">
              <label>User name</label>
              <input
                placeholder="Enter user name"
                value={form.userName}
                maxLength={50}
                onChange={(e) => handleChange("userName", e.target.value)}
              />
              {error.userName && <p style={{ color: "red", fontSize: 12 }}>{error.userName}</p>}
            </div>

            <div className="form-group">
              <label>{editId ? "New password (leave blank to keep current)" : "Password"}</label>
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                maxLength={100}
                onChange={(e) => handleChange("password", e.target.value)}
              />
              {error.password && <p style={{ color: "red", fontSize: 12 }}>{error.password}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select
                value={form.roleId}
                onChange={(e) => handleChange("roleId", e.target.value)}
              >
                <option value="">— Select role —</option>
                {roleList.map((r) => (
                  <option key={r.RoleId} value={r.RoleId}>
                    {r.RoleName}
                  </option>
                ))}
              </select>
              {error.roleId && <p style={{ color: "red", fontSize: 12 }}>{error.roleId}</p>}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                placeholder="name@example.com"
                value={form.email}
                maxLength={100}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {error.email && <p style={{ color: "red", fontSize: 12 }}>{error.email}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mobile no</label>
              <input
                placeholder="10-digit mobile no"
                value={form.mobileNo}
                maxLength={10}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) handleChange("mobileNo", e.target.value);
                }}
              />
              {error.mobileNo && <p style={{ color: "red", fontSize: 12 }}>{error.mobileNo}</p>}
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={form.isActive ? "1" : "0"}
                onChange={(e) => handleChange("isActive", e.target.value === "1")}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>

          <div className="btn-group">
            <button className="btn-primary" onClick={handleSubmit}>{buttonName}</button>
            <button className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Sr no</th>
                <th>User ID</th>
                <th>User name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Password</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {userList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "1rem", color: "#999" }}>
                    No users found
                  </td>
                </tr>
              ) : (
                userList.map((item, index) => (
                  <tr key={item.LoginId}>
                    <td>{index + 1}</td>
                    <td>{item.UserId}</td>
                    <td>{item.UserName}</td>
                    <td>{item.RoleName}</td>
                    <td>{item.Email}</td>
                    <td>{item.MobileNo}</td>
                    <td>
  <span>
    {showPassword[item.LoginId] ? item.Password : "••••••••"}
  </span>

  <button
    type="button"
    onClick={() =>
      setShowPassword((prev) => ({
        ...prev,
        [item.LoginId]: !prev[item.LoginId],
      }))
    }
    style={{
      border: "none",
      background: "transparent",
      cursor: "pointer",
      marginLeft: "8px",
    }}
  >
    {showPassword[item.LoginId] ? <FaEyeSlash /> : <FaEye />}
  </button>
</td>
                    <td>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          background: item.IsActive ? "#d1fae5" : "#fee2e2",
                          color: item.IsActive ? "#065f46" : "#991b1b",
                        }}
                      >
                        {item.IsActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn-edit-grid" onClick={() => handleEdit(item.LoginId)}>
                        Edit
                      </button>
                      <button
                        className="btn-warning-grid"
                        style={{ marginLeft: 4 }}
                        onClick={() => handleResetPassword(item.LoginId)}
                      >
                        Reset pwd
                      </button>
                      <button
                        className="btn-danger-grid"
                        style={{ marginLeft: 4 }}
                        onClick={() => handleDelete(item.LoginId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </ProtectedRoute>
  );
};

export default UserMaster;
