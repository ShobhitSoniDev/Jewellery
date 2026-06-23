"use client";
import React, { useState, useEffect } from "react";
import { commonInputValidator } from "@/utils/inputValidation";
import { CustomerLedger_Manage } from "@/lib/services/TransactionsService";
import { CustomerMaster_Manage } from "@/lib/services/MasterService";
import Select from "react-select";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

const CustomerLedger = () => {

  const [customerList, setCustomerList]               = useState([]);
  const [CustomerCode, setCustomerCode]               = useState("");
  const [balanceAmount, setBalanceAmount]             = useState("");
  const [transactionDate, setTransactionDate]         = useState("");
  const [transactionType, setTransactionType]         = useState("");
  const [amount, setAmount]                           = useState("");
  const [description, setDescription]                 = useState("");
  const [transactionTypeList, setTransactionTypeList] = useState([]);
  const [ledgerList, setLedgerList]                   = useState([]);
  const [editId, setEditId]                           = useState(null);
  const [showCustomerModal, setShowCustomerModal]     = useState(false);
  const [newCustomer, setNewCustomer]                 = useState({ name: "", mobile: "", address: "" });

  const [error, setError] = useState({
    CustomerCode:    "",
    transactionDate: "",
    transactionType: "",
    amount:          "",
    description:     "",
  });

  // ─── Load Customer List ────────────────────────────────────────────────────
  const loadCustomerList = async () => {
    try {
      const payload = {
        CustomerCode: "", customerName: "", mobileNo: "",
        email: "", address: "", city: "", pincode: 0, typeId: 4,
      };
      const res = await CustomerMaster_Manage(payload);
      return res?.data || [];
    } catch (err) {
      console.error("Error loading customers", err);
      return [];
    }
  };

  // ─── Load Balance Amount (TypeId=7) ───────────────────────────────────────
  const loadBalanceAmount = async (customerCode) => {
    try {
      if (!customerCode) { setBalanceAmount(""); return; }
      const payload = { CustomerCode: customerCode, TypeId: 7 };
      const res = await CustomerLedger_Manage(payload);
      const bal = res?.data?.[0]?.BalanceAmount ?? 0;
      setBalanceAmount(bal);
    } catch (err) {
      console.error("Error loading balance", err);
      setBalanceAmount("");
    }
  };

  // ─── Calculated Balance Preview ───────────────────────────────────────────
  const getCalculatedBalance = () => {
    const base = parseFloat(balanceAmount) || 0;
    const amt  = parseFloat(amount)        || 0;
    if (!transactionType || !amt) return base;
    if (Number(transactionType) === 1) return base + amt;
    if (Number(transactionType) === 2) return base - amt;
    return base;
  };

  // ─── Load Ledger by CustomerCode only ─────────────────────────────────────
  const loadLedgerList = async (customerCode) => {
    try {
      if (!customerCode) { setLedgerList([]); return; }
      const payload  = { CustomerCode: customerCode, TypeId: 5 };
      const response = await CustomerLedger_Manage(payload);
      setLedgerList(response?.data || []);
    } catch (error) {
      console.error("Error loading ledger list", error);
    }
  };

  // ─── Load Transaction Type List (TypeId=6) ────────────────────────────────
  const loadTransactionTypeList = async () => {
    try {
      const response = await CustomerLedger_Manage({ TypeId: 6 });
      setTransactionTypeList(response?.data || []);
    } catch (error) {
      console.error("Error loading transaction type list", error);
    }
  };

  useEffect(() => {
    (async () => {
      const list = await loadCustomerList();
      setCustomerList(list);
    })();
    loadTransactionTypeList();
  }, []);

  // ─── Customer change → load balance + ledger ──────────────────────────────
  useEffect(() => {
    if (CustomerCode) {
      loadBalanceAmount(CustomerCode);
      loadLedgerList(CustomerCode);
    } else {
      setBalanceAmount("");
      setLedgerList([]);
    }
  }, [CustomerCode]);

  // ─── Add Customer Modal ───────────────────────────────────────────────────
  const handleAddCustomer = async () => {
    try {
      if (!newCustomer.name || !newCustomer.mobile) {
        await Swal.fire({ icon: "warning", title: "Validation", text: "Name and Mobile are required", zIndex: 99999 });
        return;
      }
      const exists = customerList.find((c) => c.MobileNo === newCustomer.mobile);
      if (exists) {
        await Swal.fire({ icon: "warning", title: "Duplicate", text: "Customer already exists", zIndex: 99999 });
        return;
      }
      const payload = {
        CustomerCode: "", customerName: newCustomer.name, mobileNo: newCustomer.mobile,
        address: newCustomer.address, email: "", city: "", pincode: 0, typeId: 1,
      };
      const res = await CustomerMaster_Manage(payload);
      if (res?.data?.[0]?.Code === 1) {
        setShowCustomerModal(false);
        await Swal.fire({ icon: "success", title: "Saved!", text: res?.data?.[0]?.Message || "Customer added successfully", confirmButtonColor: "#3085d6", zIndex: 99999 });
        const updatedList = await loadCustomerList();
        setCustomerList(updatedList);
        const added = updatedList.find((c) => c.MobileNo === newCustomer.mobile);
        if (added) setCustomerCode(added.CustomerCode);
        setNewCustomer({ name: "", mobile: "", address: "" });
      } else {
        await Swal.fire({ icon: "error", title: "Error", text: res?.data?.[0]?.Message || "Failed to add customer", zIndex: 99999 });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({ icon: "error", title: "Error", text: "Something went wrong", zIndex: 99999 });
    }
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const handleValidation = () => {
    const newErrors = {};
    let flag = true;
    if (!CustomerCode)        { newErrors.CustomerCode    = "Customer is required";         flag = false; }
    if (!transactionDate)     { newErrors.transactionDate = "Transaction Date is required"; flag = false; }
    if (!transactionType)     { newErrors.transactionType = "Transaction Type is required"; flag = false; }
    if (!amount)              { newErrors.amount          = "Amount is required";           flag = false; }
    if (!description)         { newErrors.description     = "Description is required";      flag = false; }
    setError(newErrors);
    return flag;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!handleValidation()) return;
    const payload = {
      TransId:         editId ? editId : 0,
      CustomerCode:    CustomerCode,
      TransactionDate: transactionDate,
      TransactionType: Number(transactionType),
      Amount:          Number(amount),
      Description:     description,
      TypeId:          editId ? 2 : 1,
    };
    try {
      const response = await CustomerLedger_Manage(payload);
      if (response?.data?.[0]?.Code === 1) {
        await Swal.fire({ icon: "success", title: "Saved!", text: response?.data[0].Message || "Saved successfully", confirmButtonColor: "#3085d6" });
        const savedCustomer = CustomerCode;
        resetForm();
        loadLedgerList(CustomerCode);
        setCustomerCode(savedCustomer);
      } else {
        Swal.fire({ icon: "error", title: "Error!", text: response?.data[0].Message || "Failed to save", confirmButtonColor: "#3085d6" });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to save ledger entry", confirmButtonColor: "#3085d6" });
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (transId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?", text: "This entry will be deleted permanently.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6", confirmButtonText: "Yes, delete it!",
    });
    if (!confirm.isConfirmed) return;
    try {
      const response = await CustomerLedger_Manage({ TransId: transId, TypeId: 3 });
      if (response?.data?.[0]?.Code === 1) {
        Swal.fire({ icon: "success", title: "Deleted!", text: "Entry deleted successfully.", confirmButtonColor: "#3085d6" });
        loadLedgerList(CustomerCode);
        loadBalanceAmount(CustomerCode);
      } else {
        Swal.fire({ icon: "error", title: "Error!", text: "Failed to delete entry", confirmButtonColor: "#3085d6" });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error!", text: "Something went wrong", confirmButtonColor: "#3085d6" });
    }
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = async (transId) => {
    try {
      const response = await CustomerLedger_Manage({ TransId: transId, TypeId: 4 });
      const item     = response?.data?.[0];
      if (item) {
        setEditId(item.TransId);
        setCustomerCode(String(item.CustomerCode));
        setTransactionDate(item.TransactionDate?.split("T")[0] || "");
        setTransactionType(String(item.TransactionType));
        setAmount(String(item.TransactionType === 1 ? item.DRAmount : item.CRAmount));
        setDescription(item.Description);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error loading entry", error);
    }
  };

  // ─── Reset ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setTransactionDate("");
    setTransactionType("");
    setAmount("");
    setDescription("");
    setEditId(null);
    setError({ CustomerCode: "", transactionDate: "", transactionType: "", amount: "", description: "" });
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div className="content-wrapper">

        {/* ── Form Card ── */}
        <div className="form-card">
          <h2>Customer Ledger</h2>
          <hr />

          {/* Row 1: Customer Dropdown + Add Button | Balance Amount */}
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
                    onChange={(selected) => {
                      setCustomerCode(selected?.value || "");
                      if (selected?.value)
                        setError((prev) => ({ ...prev, CustomerCode: "" }));
                    }}
                    placeholder="Search Customer..."
                    isClearable
                    isDisabled={editId !== null}
                  />
                  <p style={{ color: "red" }}>{error?.CustomerCode}</p>
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

            <div className="form-group">
              <label>Balance Amount</label>
              <input
                type="text"
                value={CustomerCode ? `₹ ${getCalculatedBalance().toFixed(2)}` : ""}
                disabled
                style={{
                  backgroundColor: "#f0f0f0",
                  cursor:          "not-allowed",
                  color:           getCalculatedBalance() < 0 ? "red" : "green",
                  fontWeight:      "600",
                }}
                placeholder="Select customer to see balance"
              />
              {CustomerCode && (
                <p style={{ color: "#555", fontSize: "12px", marginTop: "4px" }}>
                  Current Balance: ₹ {(parseFloat(balanceAmount) || 0).toFixed(2)}
                  {transactionType && amount
                    ? ` → After Transaction: ₹ ${getCalculatedBalance().toFixed(2)}`
                    : ""}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Transaction Date | Transaction Type */}
          <div className="form-row">
            <div className="form-group">
              <label>Transaction Date</label>
              <input
                type="date"
                className="form-control"
                value={transactionDate}
                onChange={(e) => {
                  setTransactionDate(e.target.value);
                  if (e.target.value !== "")
                    setError((prev) => ({ ...prev, transactionDate: "" }));
                }}
              />
              <p style={{ color: "red" }}>{error?.transactionDate}</p>
            </div>

            <div className="form-group">
              <label>Transaction Type</label>
              <select
                className="dropdown-select"
                value={transactionType}
                onChange={(e) => {
                  setTransactionType(e.target.value);
                  if (e.target.value !== "")
                    setError((prev) => ({ ...prev, transactionType: "" }));
                }}
              >
                <option value="">-- Select --</option>
                {transactionTypeList.map((item) => (
                  <option key={item.TransactionTypeId} value={item.TransactionTypeId}>
                    {item.TransactionType}
                  </option>
                ))}
              </select>
              <p style={{ color: "red" }}>{error?.transactionType}</p>
            </div>
          </div>

          {/* Row 3: Amount | Description */}
          <div className="form-row">
            <div className="form-group">
              <label>Amount</label>
              <input
                type="text"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => {
                  const val    = e.target.value;
                  const result = commonInputValidator(val, { numeric: true, allowDecimal: true, maxDecimalPlaces: 2, minLength: 1, maxLength: 18 });
                  if (result === true) { setAmount(val); setError((prev) => ({ ...prev, amount: "" })); }
                  else                { setError((prev) => ({ ...prev, amount: result })); }
                }}
                onBlur={() => {
                  const result = commonInputValidator(amount, { numeric: true, allowDecimal: true, maxDecimalPlaces: 2, minLength: 1, maxLength: 18 });
                  if (result === true) setError((prev) => ({ ...prev, amount: "" }));
                }}
              />
              <p style={{ color: "red" }}>{error?.amount}</p>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="Enter Description"
                value={description}
                onChange={(e) => {
                  const val    = e.target.value;
                  const result = commonInputValidator(val, { numeric: false, allowDecimal: false, minLength: 1, maxLength: 250 });
                  if (result === true) { setDescription(val); setError((prev) => ({ ...prev, description: "" })); }
                  else                 { setError((prev) => ({ ...prev, description: result })); }
                }}
                onBlur={() => {
                  const result = commonInputValidator(description, { numeric: false, allowDecimal: false, minLength: 1, maxLength: 250 });
                  if (result === true) setError((prev) => ({ ...prev, description: "" }));
                }}
              />
              <p style={{ color: "red" }}>{error?.description}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="btn-group">
            <button className="btn-primary" onClick={handleSubmit}>
              {editId ? "Update Entry" : "Add Entry"}
            </button>
            <button className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>

        {/* ── Add Customer Modal ── */}
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

        {/* ── Table Card — only when customer is selected ── */}
        {CustomerCode && (
          <div className="table-card" style={{ marginTop: "20px" }}>
            <h3 style={{ marginBottom: "12px" }}>Transaction History</h3>
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table style={{ width: "100%", minWidth: "950px", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: "nowrap" }}>Sr No</th>
                    <th style={{ whiteSpace: "nowrap" }}>Customer</th>
                    <th style={{ whiteSpace: "nowrap" }}>Transaction Date</th>
                    <th style={{ whiteSpace: "nowrap" }}>Transaction Type</th>
                    <th style={{ whiteSpace: "nowrap" }}>CR Amount</th>
                    <th style={{ whiteSpace: "nowrap" }}>DR Amount</th>
                    <th style={{ minWidth: "160px" }}>Description</th>
                    <th style={{ whiteSpace: "nowrap" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerList.length > 0 ? (
                    ledgerList.map((item, index) => (
                      <tr key={item.TransId}>
                        <td style={{ whiteSpace: "nowrap" }}>{index + 1}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{item.CustomerName}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{item.TransactionDate?.split("T")[0]}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{item.TransactionType}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{item.CRAmount}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{item.DRAmount}</td>
                        <td>{item.Description}</td>
                        <td>
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                            <button className="btn-primary"   onClick={() => handleEdit(item.TransId)}>Edit</button>
                            <button className="btn-secondary" onClick={() => handleDelete(item.TransId)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "15px" }}>
                        No Record Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

export default CustomerLedger;
