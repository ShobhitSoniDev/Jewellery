"use client";
import React, { useState } from "react";
import { ChangePassword_Manage } from "@/lib/services/MasterService";

// ── Color tokens matched from screenshot ───────────────────────────────────────
const C = {
  headerBg:      "#1a237e",
  primaryBtn:    "#1a237e",
  primaryBorder: "#1a237e",
  inputBorder:   "#ddd",
  inputErrBorder:"#e53935",
  cardBg:        "#fafafa",
  cardBorder:    "#e0e0e0",
  labelColor:    "#666",
  bodyBg:        "#fff",
  textDark:      "#222",
  errColor:      "#e53935",
  successBg:     "#e8f5e9",
  successBorder: "#a5d6a7",
  successText:   "#2e7d32",
};

// ── Eye SVG icons ─────────────────────────────────────────────────────────────
const EyeIcon = ({ visible }) =>
  visible ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.39 1 12a10.94 10.94 0 0 1 2.06-3.94"/>
      <path d="M9.9 4.24A9 9 0 0 1 12 4c5 0 9.27 3.61 11 8a10.9 10.9 0 0 1-1.21 2.49"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

const ChangePasswordModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState(""); // global API error message

  if (!open) return null;

  // ── Password strength ──────────────────────────────────────────────────────
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8)          score++;
    if (pwd.length >= 12)         score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels = [
      { label: "Very weak",    color: "#e53935", width: "20%" },
      { label: "Weak",         color: "#fb8c00", width: "40%" },
      { label: "Fair",         color: "#fdd835", width: "60%" },
      { label: "Strong",       color: "#43a047", width: "80%" },
      { label: "Very strong",  color: "#1b5e20", width: "100%" },
    ];
    return { score, ...levels[Math.min(score, 4)] };
  };

  const strength = form.newPassword ? getStrength(form.newPassword) : null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (apiError) setApiError("");
  };

  const toggleShow = (field) =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));

  const validate = () => {
    const newErrors = { currentPassword: "", newPassword: "", confirmPassword: "" };
    let valid = true;

    if (!form.currentPassword) {
      newErrors.currentPassword = "Current password is required";
      valid = false;
    }

    const s = getStrength(form.newPassword);
    if (!form.newPassword) {
      newErrors.newPassword = "New password is required";
      valid = false;
    } else if (s.score < 2) {
      newErrors.newPassword = "Password is too weak — add numbers or symbols";
      valid = false;
    } else if (form.newPassword === form.currentPassword) {
      newErrors.newPassword = "New password must be different from current password";
      valid = false;
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
      valid = false;
    } else if (form.confirmPassword !== form.newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ── API Call ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setApiError("");

    try {
      // ChangePassword_Manage ko payload bhejo
      // Apne service function ke hisaab se payload adjust karein
      const payload = {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      };

      const response = await ChangePassword_Manage(payload);

      // ── Success handle ─────────────────────────────────────────────────
      // Agar aapki service ne { success: true } ya { status: 200 } return kiya
      if (response?.success || response?.status === 200 || response?.data) {
        setIsSuccess(true);
        setTimeout(() => handleClose(), 1800);
      } else {
        // Service ne error message return kiya (but throw nahi kiya)
        const msg =
          response?.message ||
          response?.error ||
          "Something went wrong. Please try again.";
        setApiError(msg);
      }
    } catch (error) {
      // Network error ya server 4xx/5xx
      const msg =
        error?.response?.data?.message ||   // axios error
        error?.message ||                    // fetch / generic
        "Failed to update password. Please try again.";

      // Agar current password galat hai to field pe dikhao
      if (
        msg.toLowerCase().includes("current") ||
        msg.toLowerCase().includes("incorrect") ||
        msg.toLowerCase().includes("wrong") ||
        error?.response?.status === 401
      ) {
        setErrors((prev) => ({
          ...prev,
          currentPassword: "Incorrect current password. Please try again.",
        }));
      } else {
        setApiError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPassword({ currentPassword: false, newPassword: false, confirmPassword: false });
    setIsLoading(false);
    setIsSuccess(false);
    setApiError("");
    onClose();
  };

  // ── Field config ───────────────────────────────────────────────────────────
  const fields = [
    { key: "currentPassword", label: "Current Password",     placeholder: "Enter current password", autoComplete: "current-password" },
    { key: "newPassword",     label: "New Password",         placeholder: "Enter new password",      autoComplete: "new-password" },
    { key: "confirmPassword", label: "Confirm New Password", placeholder: "Re-enter new password",   autoComplete: "new-password" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="custom-modal-overlay">
      <div
        className="custom-modal"
        style={{
          width: "460px",
          maxWidth: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "10px",
          background: C.bodyBg,
          boxShadow: "0 6px 28px rgba(0,0,0,0.22)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "14px 20px",
            background: C.headerBg,
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
            Change Password
          </h2>
          <button
            onClick={handleClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#fff",
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
              opacity: 0.85,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "22px 20px 18px" }}>

          {/* ── Success Banner ── */}
          {isSuccess && (
            <div
              style={{
                background: C.successBg,
                border: `1px solid ${C.successBorder}`,
                borderRadius: "7px",
                padding: "11px 14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: C.successText,
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              ✔ Password updated successfully!
            </div>
          )}

          {/* ── Global API Error Banner ── */}
          {apiError && (
            <div
              style={{
                background: "#fdecea",
                border: "1px solid #f5c6cb",
                borderRadius: "7px",
                padding: "11px 14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#c62828",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              ⚠ {apiError}
            </div>
          )}

          {/* ── Fields ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
            {fields.map(({ key, label, placeholder, autoComplete }) => (
              <div
                key={key}
                style={{
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: "8px",
                  padding: "12px",
                  background: C.cardBg,
                }}
              >
                {/* Label */}
                <div style={{ fontSize: "12px", color: C.labelColor, marginBottom: "8px" }}>
                  {label}
                </div>

                {/* Input row */}
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showPassword[key] ? "text" : "password"}
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    disabled={isLoading || isSuccess}
                    style={{
                      width: "100%",
                      padding: "8px 38px 8px 10px",
                      border: `1px solid ${errors[key] ? C.inputErrBorder : C.inputBorder}`,
                      borderRadius: "6px",
                      fontSize: "14px",
                      outline: "none",
                      background: isLoading || isSuccess ? "#f5f5f5" : "#fff",
                      color: C.textDark,
                      boxSizing: "border-box",
                      cursor: isLoading || isSuccess ? "not-allowed" : "text",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(key)}
                    disabled={isLoading || isSuccess}
                    style={{
                      position: "absolute",
                      right: "8px",
                      background: "none",
                      border: "none",
                      cursor: isLoading || isSuccess ? "not-allowed" : "pointer",
                      color: "#888",
                      padding: 0,
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={showPassword[key] ? "Hide password" : "Show password"}
                  >
                    <EyeIcon visible={showPassword[key]} />
                  </button>
                </div>

                {/* Field Error */}
                {errors[key] && (
                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "12px",
                      color: C.errColor,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ⚠ {errors[key]}
                  </div>
                )}

                {/* Strength bar — newPassword only */}
                {key === "newPassword" && form.newPassword && strength && (
                  <div style={{ marginTop: "9px" }}>
                    <div style={{ height: "4px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: strength.width,
                          background: strength.color,
                          borderRadius: "4px",
                          transition: "width 0.3s, background 0.3s",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "11px", marginTop: "4px", color: strength.color, fontWeight: "600" }}>
                      {strength.label}
                    </div>
                  </div>
                )}

                {/* Hint — newPassword only */}
                {key === "newPassword" && !errors.newPassword && (
                  <div style={{ marginTop: "6px", fontSize: "11px", color: "#999" }}>
                    Min. 8 characters — include numbers and symbols
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Footer Buttons ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              onClick={handleClose}
              disabled={isLoading}
              style={{
                padding: "9px 22px",
                border: `1.5px solid ${C.primaryBorder}`,
                background: "#fff",
                color: C.primaryBorder,
                borderRadius: "6px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={isLoading || isSuccess}
              style={{
                padding: "9px 24px",
                background: C.primaryBtn,
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: isLoading || isSuccess ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                opacity: isLoading || isSuccess ? 0.75 : 1,
                display: "flex",
                alignItems: "center",
                gap: "7px",
                minWidth: "140px",
                justifyContent: "center",
              }}
            >
              {isLoading && (
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              )}
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ChangePasswordModal;
