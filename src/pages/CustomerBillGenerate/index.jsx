"use client";
import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CustomerMaster_Manage } from "@/lib/services/MasterService";
import { CustomerBillGenerate } from "@/lib/services/ReportsService"; // apna service path
import Select from "react-select";
import Swal from "sweetalert2";

// ─── Format Sample Data (right side preview ke liye) ─────────────────────────
const FORMAT_SAMPLES = {
  format1: `23-Jun-2026
Silver Payal = 1000 gm = 25000
Gold Ring = 2 gm = 30000
Old/Purani Jewellery
Purani Payal = 50 gm = 10000`,

  format2: `Date: 23-Jun-2026
Sale / New:
Silver Payal | 1000 gm | 25000
Gold Ring | 2 gm | 30000
Old:
Purani Payal | 50 gm | 10000`,
};

const BillGenerate = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [customerList, setCustomerList] = useState([]);
  const [CustomerCode, setCustomerCode] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState(3); // 1=English, 2=Hindi, 3=Mix
  const [activeFormat, setActiveFormat] = useState("format1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});

  // Add Customer Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    address: "",
  });

  // ── Load Customers (same as LoanEntry) ────────────────────────────────────
  const loadCustomerList = async () => {
    try {
      const payload = {
        CustomerCode: "",
        customerName: "",
        mobileNo: "",
        email: "",
        address: "",
        city: "",
        pincode: 0,
        typeId: 4,
      };
      const res = await CustomerMaster_Manage(payload);
      return res?.data || [];
    } catch (err) {
      console.error("Error loading customers", err);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const list = await loadCustomerList();
      setCustomerList(list);
    })();
  }, []);

  // ── Add Customer (same as LoanEntry) ─────────────────────────────────────
  const handleAddCustomer = async () => {
    try {
      if (!newCustomer.name || !newCustomer.mobile) {
        await Swal.fire({
          icon: "warning",
          title: "Validation",
          text: "Name and Mobile are required",
          zIndex: 99999,
        });
        return;
      }

      const exists = customerList.find(
        (c) => c.MobileNo === newCustomer.mobile
      );
      if (exists) {
        await Swal.fire({
          icon: "warning",
          title: "Duplicate",
          text: "Customer already exists",
          zIndex: 99999,
        });
        return;
      }

      const payload = {
        CustomerCode: "",
        customerName: newCustomer.name,
        mobileNo: newCustomer.mobile,
        address: newCustomer.address,
        email: "",
        city: "",
        pincode: 0,
        typeId: 1,
      };

      const res = await CustomerMaster_Manage(payload);

      if (res?.data?.[0]?.Code === 1) {
        setShowCustomerModal(false);

        await Swal.fire({
          icon: "success",
          title: "Saved!",
          text: res?.data?.[0]?.Message || "Customer added successfully",
          confirmButtonColor: "#3085d6",
          zIndex: 99999,
        });

        const updatedList = await loadCustomerList();
        setCustomerList(updatedList);

        const addedCustomer = updatedList.find(
          (c) => c.MobileNo === newCustomer.mobile
        );
        if (addedCustomer) setCustomerCode(addedCustomer.CustomerCode);

        setNewCustomer({ name: "", mobile: "", address: "" });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: res?.data?.[0]?.Message || "Failed to add customer",
          zIndex: 99999,
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({ icon: "error", title: "Error", text: "Something went wrong", zIndex: 99999 });
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const handleValidation = () => {
    let flag = true;
    let newError = {};

    if (!CustomerCode) {
      newError.CustomerCode = "Customer is required";
      flag = false;
    }
    if (!description.trim()) {
      newError.description = "Bill detail is required";
      flag = false;
    }

    setError(newError);
    return flag;
  };

  // ── Submit → Bill Generate ────────────────────────────────────────────────
  const handleGenerateBill = async () => {
    if (!handleValidation()) return;

    try {
      setLoading(true);

      const payload = {
        customerCode: CustomerCode,
        description: description,
        language: language,
      };

      const result = await CustomerBillGenerate(payload);

      if (result?.code === 1) {
        // Blob URL banao — popup blocker se bachne ke liye

        const blobUrl = result?.data;

        const newTab = window.open(blobUrl, "_blank");

        // Agar browser ne tab block kar diya — fallback download
        if (!newTab) {
          await Swal.fire({
            icon: "warning",
            title: "Popup Blocked",
            text: "Browser ne new tab block kar diya. Bill download ho raha hai.",
            confirmButtonText: "OK",
          });
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `Bill_${CustomerCode}_${Date.now()}.html`;
          a.click();
        }

        // Memory free karo
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.message || "Bill generate failed",
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({ icon: "error", title: "Error", text: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setCustomerCode("");
    setDescription("");
    setLanguage(3);
    setError({});
  };

  // ── Fill Sample Format in Textarea ────────────────────────────────────────
  const handleUseSample = () => {
    setDescription(FORMAT_SAMPLES[activeFormat]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div className="content-wrapper">

        {/* ── MAIN FORM CARD ── */}
        <div className="form-card">
          <h2>Bill Generate</h2>
          <hr />

          {/* ROW 1 — Customer */}
          <div className="form-row">
            <div className="form-group">
              <label>Customer</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <Select
                    options={customerList.map((item) => ({
                      value: item.CustomerCode,
                      label: `${item.CustomerName} | ${item.MobileNo} | ${item.CustomerCode}`,
                    }))}
                    value={
                      customerList
                        .map((item) => ({
                          value: item.CustomerCode,
                          label: `${item.CustomerName} (${item.MobileNo})`,
                        }))
                        .find((c) => c.value === CustomerCode) || null
                    }
                    onChange={(selected) => setCustomerCode(selected?.value || "")}
                    placeholder="Search Customer..."
                    isClearable
                  />
                  <p style={{ color: "red" }}>{error.CustomerCode}</p>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: "6px 10px", fontSize: "12px", height: "38px", flexShrink: 0 }}
                  onClick={() => setShowCustomerModal(true)}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Language Select */}
            <div className="form-group">
              <label>Bill Language</label>
              <select
                className="dropdown-select"
                value={language}
                onChange={(e) => setLanguage(Number(e.target.value))}
              >
                <option value={1}>English</option>
                <option value={2}>Hindi (हिंदी)</option>
                <option value={3}>Hindi + English Mix</option>
              </select>
            </div>
          </div>

          {/* ROW 2 — Textarea + Format Sample */}
          <div className="form-row" style={{ alignItems: "flex-start", gap: "16px" }}>

            {/* LEFT — Textarea */}
            <div className="form-group" style={{ flex: 1 }}>
              <label>
                Bill Detail &nbsp;
                <span style={{ fontSize: "12px", color: "#888", fontWeight: "normal" }}>
                  (Format 1 ya Format 2 dono chalenge)
                </span>
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`23-Jun-2026\nSilver Payal = 1000 gm = 25000\nGold Ring = 2 gm = 30000\nOld/Purani Jewellery\nPurani Payal = 50 gm = 10000`}
                style={{
                  width: "100%",
                  minHeight: "260px",
                  padding: "12px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  lineHeight: "1.8",
                  border: error.description ? "1px solid red" : "1px solid #ccc",
                  borderRadius: "6px",
                  resize: "vertical",
                  backgroundColor: "#FAFAFA",
                }}
              />
              <p style={{ color: "red" }}>{error.description}</p>
            </div>

            {/* RIGHT — Format Sample Box */}
            <div
              style={{
                width: "300px",
                flexShrink: 0,
                border: "1px solid #e0c97a",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "#FFFDF0",
              }}
            >
              {/* Sample Header */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1A1208, #3A2A0A)",
                  color: "#D4A017",
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                }}
              >
                📋 Format Sample
              </div>

              {/* Format Toggle Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid #e0c97a" }}>
                {["format1", "format2"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setActiveFormat(f)}
                    style={{
                      flex: 1,
                      padding: "7px",
                      fontSize: "12px",
                      fontWeight: "600",
                      border: "none",
                      cursor: "pointer",
                      background: activeFormat === f ? "#FBF6EC" : "#F5EDD8",
                      color: activeFormat === f ? "#B8860B" : "#888",
                      borderBottom: activeFormat === f ? "2px solid #B8860B" : "2px solid transparent",
                    }}
                  >
                    {f === "format1" ? "Format 1  (=)" : "Format 2  (|)"}
                  </button>
                ))}
              </div>

              {/* Sample Content */}
              <pre
                style={{
                  margin: 0,
                  padding: "14px",
                  fontSize: "12px",
                  lineHeight: "2",
                  fontFamily: "monospace",
                  color: "#3A2A0A",
                  whiteSpace: "pre-wrap",
                  minHeight: "160px",
                }}
              >
                {/* Date line */}
                <span style={{ color: "#185FA5", fontWeight: "700" }}>
                  {activeFormat === "format1" ? "23-Jun-2026" : "Date: 23-Jun-2026"}
                </span>
                {"\n"}

                {/* New section header */}
                {activeFormat === "format2" && (
                  <>
                    <span style={{ color: "#3B6D11", fontWeight: "700" }}>Sale / New:</span>
                    {"\n"}
                  </>
                )}

                {/* New items */}
                {activeFormat === "format1" ? (
                  <>
                    <span>Silver Payal </span>
                    <span style={{ color: "#B8860B" }}>=</span>
                    <span> 1000 gm </span>
                    <span style={{ color: "#B8860B" }}>=</span>
                    <span> 25000</span>
                    {"\n"}
                    <span>Gold Ring </span>
                    <span style={{ color: "#B8860B" }}>=</span>
                    <span> 2 gm </span>
                    <span style={{ color: "#B8860B" }}>=</span>
                    <span> 30000</span>
                    {"\n"}
                  </>
                ) : (
                  <>
                    <span>Silver Payal </span>
                    <span style={{ color: "#B8860B" }}>|</span>
                    <span> 1000 gm </span>
                    <span style={{ color: "#B8860B" }}>|</span>
                    <span> 25000</span>
                    {"\n"}
                    <span>Gold Ring </span>
                    <span style={{ color: "#B8860B" }}>|</span>
                    <span> 2 gm </span>
                    <span style={{ color: "#B8860B" }}>|</span>
                    <span> 30000</span>
                    {"\n"}
                  </>
                )}

                {/* Old section header */}
                <span style={{ color: "#8B2020", fontWeight: "700" }}>
                  {activeFormat === "format1" ? "Old/Purani Jewellery" : "Old:"}
                </span>
                {"\n"}

                {/* Old item */}
                {activeFormat === "format1" ? (
                  <>
                    <span>Purani Payal </span>
                    <span style={{ color: "#8B2020" }}>=</span>
                    <span> 50 gm </span>
                    <span style={{ color: "#8B2020" }}>=</span>
                    <span> 10000</span>
                  </>
                ) : (
                  <>
                    <span>Purani Payal </span>
                    <span style={{ color: "#8B2020" }}>|</span>
                    <span> 50 gm </span>
                    <span style={{ color: "#8B2020" }}>|</span>
                    <span> 10000</span>
                  </>
                )}
              </pre>

              {/* Legend */}
              <div
                style={{
                  borderTop: "1px dashed #e0c97a",
                  padding: "10px 14px",
                  fontSize: "11px",
                  color: "#666",
                  lineHeight: "1.8",
                }}
              >
                <div><span style={{ color: "#185FA5", fontWeight: "700" }}>■</span> Date</div>
                <div><span style={{ color: "#3B6D11", fontWeight: "700" }}>■</span> New item section</div>
                <div><span style={{ color: "#8B2020", fontWeight: "700" }}>■</span> Old/Purani item section</div>
                <div><span style={{ color: "#B8860B", fontWeight: "700" }}>■</span> Separator (= ya |)</div>
              </div>

              {/* Use Sample Button */}
              <div style={{ padding: "0 14px 14px" }}>
                <button
                  type="button"
                  onClick={handleUseSample}
                  style={{
                    width: "100%",
                    padding: "7px",
                    fontSize: "12px",
                    background: "#FBF6EC",
                    border: "1px solid #C9A84C",
                    borderRadius: "5px",
                    color: "#B8860B",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  ↙ Is Format ko Textarea mein Use Karein
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="btn-group">
            <button
              className="btn-primary"
              onClick={handleGenerateBill}
              disabled={loading}
            >
              {loading ? "Generating..." : "🖨️ Generate Bill"}
            </button>
            <button className="btn-secondary" onClick={handleReset}>
              Cancel
            </button>
          </div>
        </div>

        {/* ── ADD CUSTOMER MODAL (same as LoanEntry) ── */}
        {showCustomerModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal">
              <div className="modal-header">
                <h2>Add Customer</h2>
                <button onClick={() => setShowCustomerModal(false)}>✖</button>
              </div>
              <hr />
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    value={newCustomer.mobile}
                    onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>
                <div className="btn-group">
                  <button className="btn-primary" onClick={handleAddCustomer}>Save</button>
                  <button className="btn-secondary" onClick={() => setShowCustomerModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

export default BillGenerate;
