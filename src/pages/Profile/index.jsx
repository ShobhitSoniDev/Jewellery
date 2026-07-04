import React, { useState, useEffect } from "react";
import { commonInputValidator } from "@/utils/inputValidation";
import { ShopMaster_Manage } from "@/lib/services/MasterService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

const ShopProfile = () => {
  const [shopId, setShopId] = useState(null);

  const [shopCode, setShopCode] = useState("");
  const [shopName, setShopName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [logo, setLogo] = useState("");

  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState({ shopName: "", mobileNo: "", email: "" });

  /* ---------------- Load Shop Profile ---------------- */
  const loadShopProfile = async () => {
    try {
      setLoading(true);
      const payload = { TypeId: 1, ShopId: 0 };
      const response = await ShopMaster_Manage(payload);
      const shop = response?.data?.[0];

      if (shop) {
        setShopId(shop.ShopId);
        setShopCode(shop.ShopCode || "");
        setShopName(shop.ShopName || "");
        setTagLine(shop.TagLine || "");
        setOwnerName(shop.OwnerName || "");
        setMobileNo(shop.MobileNo || "");
        setEmail(shop.Email || "");
        setAddress(shop.Address || "");
        setGstNo(shop.GSTNo || "");
        setIsActive(shop.IsActive);
        setLogo(shop.Logo || "");
      }
    } catch (error) {
      console.error("Error loading shop profile", error);
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to load shop profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopProfile();
  }, []);

  /* ---------------- Validation ---------------- */
  const handleValidation = () => {
    const newErrors = {};
    let flag = true;

    if (!shopName.trim()) {
      newErrors.shopName = "Shop Name is required";
      flag = false;
    }
    if (mobileNo && !/^[6-9]\d{9}$/.test(mobileNo)) {
      newErrors.mobileNo = "Enter a valid 10 digit Mobile No";
      flag = false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid Email";
      flag = false;
    }

    setError(newErrors);
    return flag;
  };

  const handleEditClick = () => setIsEditMode(true);

  const handleCancelClick = () => {
    setIsEditMode(false);
    setError({ shopName: "", mobileNo: "", email: "" });
    loadShopProfile();
  };

  /* ---------------- Update Submit ---------------- */
  const handleUpdate = async () => {
    if (!handleValidation()) return;
    setSaving(true);

    const payload = {
      TypeId: 2,
      ShopId: shopId,
      ShopCode: shopCode,
      ShopName: shopName,
      TagLine: tagLine,
      OwnerName: ownerName,
      MobileNo: mobileNo,
      Email: email,
      Address: address,
      GSTNo: gstNo,
      Logo: logo,
      IsActive: isActive,
    };

    try {
      const response = await ShopMaster_Manage(payload);
      if (response?.data?.[0]?.Code === 1) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: response?.data?.[0]?.Message || "Updated Successfully",
          confirmButtonColor: "#C9A24B",
        });
        setIsEditMode(false);
        loadShopProfile();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: response?.data?.[0]?.Message || "Failed to update",
          confirmButtonColor: "#C9A24B",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error?.response?.data?.[0]?.Message || "Failed to update",
        confirmButtonColor: "#C9A24B",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Logo Change (preview only) ---------------- */
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <>
        <div className="sp-wrapper">
          <div className="sp-card sp-loading">
            <div className="sp-spinner" />
            <p>Loading shop profile...</p>
          </div>
        </div>
        <ShopProfileStyles />
      </>
    );
  }

  return (
    <>
      <div className="sp-wrapper">
        <div className="sp-card">
          {/* Header */}
          <div className="sp-header">
            <div>
              <span className="sp-eyebrow">Business Profile</span>
              <h1>{shopName || "Shop Profile"}</h1>
            </div>
            {!isEditMode ? (
              <button className="sp-btn sp-btn-gold" onClick={handleEditClick}>
                Edit Profile
              </button>
            ) : (
              <span className={`sp-status-pill ${isActive ? "on" : "off"}`}>
                {isActive ? "Active" : "Inactive"}
              </span>
            )}
          </div>

          <div className="sp-divider" />

          <div className="sp-body">
            {/* Left: Logo + identity */}
            <div className="sp-identity">
              <div className="sp-logo-frame">
                {logo ? (
                  <img src={logo} alt="Shop Logo" />
                ) : (
                  <div className="sp-logo-placeholder">No Logo</div>
                )}
              </div>

              {isEditMode && (
                <label className="sp-upload-btn">
                  Change Logo
                  <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
                </label>
              )}

              <div className="sp-code-tag">{shopCode || "—"}</div>

              {!isEditMode && (
                <span className={`sp-status-pill ${isActive ? "on" : "off"}`}>
                  {isActive ? "Active" : "Inactive"}
                </span>
              )}
            </div>

            {/* Right: Details */}
            <div className="sp-details">
              <div className="sp-grid">
                {/* Shop Name */}
                <div className="sp-field">
                  <label>Shop Name</label>
                  {isEditMode ? (
                    <>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: false,
                            allowDecimal: false,
                            minLength: 1,
                            maxLength: 200,
                          });
                          if (result === true) {
                            setShopName(val);
                            setError((p) => ({ ...p, shopName: "" }));
                          } else setError((p) => ({ ...p, shopName: result }));
                        }}
                      />
                      {error.shopName && <p className="sp-error">{error.shopName}</p>}
                    </>
                  ) : (
                    <p className="sp-value">{shopName || "—"}</p>
                  )}
                </div>

                {/* Tag Line */}
                <div className="sp-field">
                  <label>Tag Line</label>
                  {isEditMode ? (
                    <input type="text" value={tagLine} onChange={(e) => setTagLine(e.target.value)} />
                  ) : (
                    <p className="sp-value sp-italic">{tagLine || "—"}</p>
                  )}
                </div>

                {/* Owner Name */}
                <div className="sp-field">
                  <label>Owner Name</label>
                  {isEditMode ? (
                    <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                  ) : (
                    <p className="sp-value">{ownerName || "—"}</p>
                  )}
                </div>

                {/* Mobile No */}
                <div className="sp-field">
                  <label>Mobile No</label>
                  {isEditMode ? (
                    <>
                      <input
                        type="text"
                        maxLength={10}
                        value={mobileNo}
                        onChange={(e) => {
                          setMobileNo(e.target.value);
                          setError((p) => ({ ...p, mobileNo: "" }));
                        }}
                      />
                      {error.mobileNo && <p className="sp-error">{error.mobileNo}</p>}
                    </>
                  ) : (
                    <p className="sp-value">{mobileNo || "—"}</p>
                  )}
                </div>

                {/* Email */}
                <div className="sp-field">
                  <label>Email</label>
                  {isEditMode ? (
                    <>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError((p) => ({ ...p, email: "" }));
                        }}
                      />
                      {error.email && <p className="sp-error">{error.email}</p>}
                    </>
                  ) : (
                    <p className="sp-value">{email || "—"}</p>
                  )}
                </div>

                {/* GST No */}
                <div className="sp-field">
                  <label>GST No</label>
                  {isEditMode ? (
                    <input type="text" value={gstNo} onChange={(e) => setGstNo(e.target.value)} />
                  ) : (
                    <p className="sp-value">{gstNo || "—"}</p>
                  )}
                </div>

                {/* Address - full width */}
                <div className="sp-field sp-field-full">
                  <label>Address</label>
                  {isEditMode ? (
                    <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
                  ) : (
                    <p className="sp-value">{address || "—"}</p>
                  )}
                </div>
              </div>

              {isEditMode && (
                <div className="sp-actions">
                  <button className="sp-btn sp-btn-gold" onClick={handleUpdate} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button className="sp-btn sp-btn-ghost" onClick={handleCancelClick} disabled={saving}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ShopProfileStyles />
    </>
  );
};

/* ---------------- Styles ---------------- */
const ShopProfileStyles = () => (
  <style jsx global>{`
    .sp-wrapper {
      min-height: 100vh;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      font-family: "Inter", -apple-system, sans-serif;
    }

    .sp-card {
      width: 100%;
      max-width: 860px;
      background: #1a1a1d;
      border: 1px solid #2b2b2f;
      border-radius: 18px;
      padding: 32px 36px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
    }

    .sp-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 60px 20px;
      color: #b5b5ba;
    }
    .sp-spinner {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid #333;
      border-top-color: #c9a24b;
      animation: sp-spin 0.8s linear infinite;
    }
    @keyframes sp-spin {
      to { transform: rotate(360deg); }
    }

    .sp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .sp-eyebrow {
      display: block;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #c9a24b;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .sp-header h1 {
      font-family: "Georgia", "Playfair Display", serif;
      font-size: 28px;
      color: #f5f1e8;
      margin: 0;
      font-weight: 600;
    }

    .sp-divider {
      height: 1px;
      background: linear-gradient(90deg, #c9a24b 0%, rgba(201, 162, 75, 0.15) 40%, transparent 100%);
      margin: 22px 0 28px;
    }

    .sp-body {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 36px;
    }

    .sp-identity {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }

    .sp-logo-frame {
      width: 270px;
      height: 150px;
      border-radius: 20px;
      padding: 4px;
      background: linear-gradient(135deg, #c9a24b, #7a5f26);
      box-shadow: 0 8px 24px rgba(201, 162, 75, 0.25);
    }
    .sp-logo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 16px;
      background: #000;
      display: block;
    }
    .sp-logo-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 16px;
      background: #101012;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b6b70;
      font-size: 13px;
    }

    .sp-upload-btn {
      font-size: 12px;
      color: #c9a24b;
      border: 1px solid #c9a24b;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sp-upload-btn:hover {
      background: #c9a24b;
      color: #1a1a1d;
    }

    .sp-code-tag {
      font-size: 13px;
      letter-spacing: 0.08em;
      color: #8a8a8e;
      font-family: monospace;
    }

    .sp-status-pill {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 14px;
      border-radius: 20px;
      letter-spacing: 0.03em;
    }
    .sp-status-pill.on {
      background: rgba(74, 222, 128, 0.12);
      color: #4ade80;
      border: 1px solid rgba(74, 222, 128, 0.3);
    }
    .sp-status-pill.off {
      background: rgba(248, 113, 113, 0.12);
      color: #f87171;
      border: 1px solid rgba(248, 113, 113, 0.3);
    }

    .sp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px 24px;
    }
    .sp-field-full {
      grid-column: 1 / -1;
    }

    .sp-field label {
      display: block;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7d7d82;
      margin-bottom: 6px;
      font-weight: 600;
    }

    .sp-value {
      font-size: 16px;
      color: #f0ede4;
      margin: 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #2b2b2f;
    }
    .sp-italic {
      font-style: italic;
      color: #c9a24b;
    }

    .sp-field input,
    .sp-field select,
    .sp-field textarea {
      width: 100%;
      background: #101012;
      border: 1px solid #333338;
      border-radius: 10px;
      padding: 10px 12px;
      color: #f0ede4;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
      font-family: inherit;
    }
    .sp-field input:focus,
    .sp-field select:focus,
    .sp-field textarea:focus {
      border-color: #c9a24b;
    }
    .sp-field textarea {
      resize: vertical;
    }

    .sp-error {
      color: #f87171;
      font-size: 12px;
      margin: 6px 0 0;
    }

    .sp-actions {
      display: flex;
      gap: 12px;
      margin-top: 28px;
    }

    .sp-btn {
      border: none;
      padding: 11px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    .sp-btn:active {
      transform: scale(0.97);
    }
    .sp-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .sp-btn-gold {
      background: linear-gradient(135deg, #d9b25e, #b8863a);
      color: #1a1a1d;
    }
    .sp-btn-ghost {
      background: transparent;
      color: #b5b5ba;
      border: 1px solid #3a3a3f;
    }
    .sp-btn-ghost:hover {
      border-color: #c9a24b;
      color: #c9a24b;
    }

    /* ---------------- Mobile Responsive ---------------- */
    @media (max-width: 640px) {
      .sp-wrapper {
        padding: 16px 12px;
      }
      .sp-card {
        padding: 22px 18px;
        border-radius: 14px;
      }
      .sp-header h1 {
        font-size: 22px;
      }
      .sp-body {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .sp-identity {
        flex-direction: column;
      }
      .sp-logo-frame {
        width: 240px;
        height: 140px;
      }
      .sp-grid {
        grid-template-columns: 1fr;
      }
      .sp-actions {
        flex-direction: column;
      }
      .sp-actions .sp-btn {
        width: 100%;
      }
    }
  `}</style>
);

export default ShopProfile;
