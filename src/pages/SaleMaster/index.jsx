import React, { useState, useEffect } from "react";
import { commonInputValidator } from "@/utils/inputValidation";
import {
  ProductMaster_Manage,
  CustomerMaster_Manage,
} from "@/lib/services/MasterService";
import { Sales_Manage } from "@/lib/services/TransactionsService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ------------------------------------------------------------------ */
const emptyRow = () => ({
  _id:             Date.now() + Math.random(),
  productId:       "",
  quantity:        "",
  grossWeight:     "",
  netWeight:       "",
  metalRate:       "",
  makingCharge:    "",
  makingChargeType:"FLAT",
  stoneCharge:     "",
  gstRate:         "3",   // Default 3% Jewellery GST
  amount:          "",
});

/* ================================================================== */
const SalesMaster = () => {

  /* ---------------- HEADER STATES ---------------- */
  const [header, setHeader] = useState({
    billNo:      "",
    billDate:    new Date().toISOString().split("T")[0],
    customerId:  "",
    gstAmount:   "0",
    paidAmount:  "",
    paymentMode: "CASH",
    remarks:     "",
    isActive:    true,
  });

  const [editId,      setEditId]      = useState(null);
  const [buttonName,  setButtonName]  = useState("Save");
  const [headerError, setHeaderError] = useState({});

  /* ---------------- DETAIL ROWS STATES ---------------- */
  const [details,     setDetails]     = useState([emptyRow()]);
  const [detailError, setDetailError] = useState([]);

  /* ---------------- LIST STATE ---------------- */
  const [salesList, setSalesList] = useState([]);

  /* ---------------- DROPDOWN STATES ---------------- */
  const [customerList, setCustomerList] = useState([]);
  const [productList,  setProductList]  = useState([]);

  /* ---------------- VIEW POPUP STATES ---------------- */
  const [viewPopup,   setViewPopup]   = useState(false);
  const [viewHeader,  setViewHeader]  = useState(null);
  const [viewDetails, setViewDetails] = useState([]);

  /* ============================================================
     LOAD DROPDOWNS
  ============================================================ */
  const loadCustomerList = async () => {
    try {
      const res = await CustomerMaster_Manage({
        customerId: 0, customerName: "", isActive: true, typeId: 4,
      });
      setCustomerList(res?.data || []);
    } catch (err) { console.error("Customer load error", err); }
  };

  const loadProductList = async () => {
    try {
      const res = await ProductMaster_Manage({ TypeId: 1 });
      setProductList(res?.data || []);
    } catch (err) { console.error("Product load error", err); }
  };

  const loadSalesList = async () => {
    try {
      const res = await Sales_Manage({ TypeId: 4 });
      setSalesList(res?.data?.header || res?.data || []);
    } catch (err) { console.error("Sales list load error", err); }
  };

  useEffect(() => {
    loadCustomerList();
    loadProductList();
    loadSalesList();
  }, []);

  /* ============================================================
     AMOUNT AUTO CALCULATE
     Amount = (NetWeight × MetalRate) + Making + Stone + GST
  ============================================================ */
  const calculateAmount = (row) => {
    const netWeight   = parseFloat(row.netWeight)    || 0;
    const metalRate   = parseFloat(row.metalRate)    || 0;
    const making      = parseFloat(row.makingCharge) || 0;
    const stone       = parseFloat(row.stoneCharge)  || 0;
    const gstRate     = parseFloat(row.gstRate)      || 0;
    const metalAmount = netWeight * metalRate;

    const makingAmount =
      row.makingChargeType === "PERCENT"
        ? metalAmount * (making / 100)
        : making;

    const subTotal  = metalAmount + makingAmount + stone;
    const gstAmount = subTotal * (gstRate / 100);

    return (subTotal + gstAmount).toFixed(2);
  };

  /* ============================================================
     DETAIL ROW HANDLERS
  ============================================================ */
  const handleDetailChange = (index, field, value) => {
    const updated = [...details];
    updated[index][field] = value;

    const amountFields = [
      "netWeight", "metalRate", "makingCharge",
      "makingChargeType", "stoneCharge", "gstRate"
    ];
    if (amountFields.includes(field)) {
      updated[index].amount = calculateAmount(updated[index]);
    }

    setDetails(updated);

    // Auto calculate total GST amount for header
    const errCopy = [...detailError];
    if (errCopy[index]) {
      errCopy[index][field] = "";
      setDetailError(errCopy);
    }
  };

  const addRow    = () => setDetails([...details, emptyRow()]);
  const removeRow = (index) => {
    if (details.length === 1) return;
    setDetails(details.filter((_, i) => i !== index));
    setDetailError(detailError.filter((_, i) => i !== index));
  };

  /* Computed totals */
  const totalAmount = details
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    .toFixed(2);

  const totalGST = details.reduce((sum, r) => {
    const netWeight   = parseFloat(r.netWeight)    || 0;
    const metalRate   = parseFloat(r.metalRate)    || 0;
    const making      = parseFloat(r.makingCharge) || 0;
    const stone       = parseFloat(r.stoneCharge)  || 0;
    const gstRate     = parseFloat(r.gstRate)      || 0;
    const metalAmount = netWeight * metalRate;
    const makingAmount = r.makingChargeType === "PERCENT"
      ? metalAmount * (making / 100) : making;
    const subTotal = metalAmount + makingAmount + stone;
    return sum + subTotal * (gstRate / 100);
  }, 0).toFixed(2);

  /* ============================================================
     VALIDATION
  ============================================================ */
  const handleValidation = () => {
    let valid = true;
    const hErr = {};

    if (!header.billNo)      { hErr.billNo      = "Bill No is required";    valid = false; }
    if (!header.billDate)    { hErr.billDate     = "Bill Date is required";  valid = false; }
    if (!header.customerId)  { hErr.customerId   = "Customer is required";   valid = false; }
    if (!header.paymentMode) { hErr.paymentMode  = "Payment Mode is required"; valid = false; }

    setHeaderError(hErr);

    const dErr = details.map((row) => {
      const rowErr = {};
      if (!row.productId)    { rowErr.productId   = "Required"; valid = false; }
      if (!row.quantity)     { rowErr.quantity     = "Required"; valid = false; }
      if (!row.grossWeight)  { rowErr.grossWeight  = "Required"; valid = false; }
      if (!row.netWeight)    { rowErr.netWeight    = "Required"; valid = false; }
      if (!row.metalRate)    { rowErr.metalRate    = "Required"; valid = false; }
      if (!row.makingCharge) { rowErr.makingCharge = "Required"; valid = false; }
      if (!row.amount)       { rowErr.amount       = "Required"; valid = false; }
      return rowErr;
    });
    setDetailError(dErr);

    return valid;
  };

  /* ============================================================
     SUBMIT
  ============================================================ */
  const handleSubmit = async () => {
    if (!handleValidation()) return;

    const createdBy = sessionStorage.getItem("username") || "Admin";

    const detailsArray = details.map((r) => ({
      ProductId:        Number(r.productId),
      Quantity:         Number(r.quantity),
      GrossWeight:      parseFloat(r.grossWeight),
      NetWeight:        parseFloat(r.netWeight),
      MetalRate:        parseFloat(r.metalRate),
      MakingCharge:     parseFloat(r.makingCharge),
      MakingChargeType: r.makingChargeType,
      StoneCharge:      parseFloat(r.stoneCharge || 0),
      GSTRate:          parseFloat(r.gstRate || 3),
      Amount:           parseFloat(r.amount),
    }));

    const payload = {
      TypeId:      editId ? 2 : 1,
      SaleId:      editId || 0,
      BillNo:      header.billNo,
      BillDate:    header.billDate,
      CustomerId:  Number(header.customerId),
      TotalAmount: parseFloat(totalAmount),
      GSTAmount:   parseFloat(totalGST),
      PaidAmount:  parseFloat(header.paidAmount || 0),
      PaymentMode: header.paymentMode,
      IsActive:    header.isActive,
      Remarks:     header.remarks,
      CreatedBy:   createdBy,
      DetailsJson: detailsArray,
    };

    try {
      const response = await Sales_Manage(payload);
      const res0 = response?.data?.[0];

      if (res0?.Status === 1) {
        await Swal.fire({ icon: "success", title: "Saved!", text: res0.Message });
        loadSalesList();
        resetForm();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res0?.Message || "Save failed" });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong" });
    }
  };

  /* ============================================================
     RESET
  ============================================================ */
  const resetForm = () => {
    setHeader({
      billNo:      "",
      billDate:    new Date().toISOString().split("T")[0],
      customerId:  "",
      gstAmount:   "0",
      paidAmount:  "",
      paymentMode: "CASH",
      remarks:     "",
      isActive:    true,
    });
    setDetails([emptyRow()]);
    setEditId(null);
    setButtonName("Save");
    setHeaderError({});
    setDetailError([]);
  };

  /* ============================================================
     EDIT
  ============================================================ */
  const handleEdit = async (saleId) => {
    try {
      const res = await Sales_Manage({ TypeId: 4, SaleId: saleId });

      const hData = res?.data?.header?.[0];
      const dData = res?.data?.details || [];

      if (!hData) return;

      setHeader({
        billNo:      hData.BillNo || "",
        billDate:    hData.BillDate
          ? hData.BillDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        customerId:  hData.CustomerId ? hData.CustomerId.toString() : "",
        gstAmount:   hData.GSTAmount  ? hData.GSTAmount.toString()  : "0",
        paidAmount:  hData.PaidAmount ? hData.PaidAmount.toString()  : "",
        paymentMode: hData.PaymentMode || "CASH",
        remarks:     hData.Remarks || "",
        isActive:    hData.IsActive ?? true,
      });

      setDetails(
        dData.length
          ? dData.map((d) => ({
              _id:             Date.now() + Math.random(),
              productId:       d.ProductId        ? d.ProductId.toString()        : "",
              quantity:        d.Quantity         ? d.Quantity.toString()         : "",
              grossWeight:     d.GrossWeight      ? d.GrossWeight.toString()      : "",
              netWeight:       d.NetWeight        ? d.NetWeight.toString()        : "",
              metalRate:       d.MetalRate        ? d.MetalRate.toString()        : "",
              makingCharge:    d.MakingCharge     ? d.MakingCharge.toString()     : "",
              makingChargeType:d.MakingChargeType || "FLAT",
              stoneCharge:     d.StoneCharge      ? d.StoneCharge.toString()      : "",
              gstRate:         d.GSTRate          ? d.GSTRate.toString()          : "3",
              amount:          d.Amount           ? d.Amount.toString()           : "",
            }))
          : [emptyRow()]
      );

      setEditId(saleId);
      setButtonName("Update");
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      console.error("Edit load error", err);
      Swal.fire({ icon: "error", title: "Error", text: "Could not load sale" });
    }
  };

  /* ============================================================
     DELETE
  ============================================================ */
  const handleDelete = async (saleId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text:  "Ye sale permanently delete ho jayega!",
      icon:  "warning",
      showCancelButton:  true,
      confirmButtonColor:"#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Haan, Delete Karo!",
      cancelButtonText:  "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const createdBy = sessionStorage.getItem("username") || "Admin";
      const res = await Sales_Manage({
        TypeId: 3, SaleId: saleId, CreatedBy: createdBy,
      });
      const res0 = res?.data?.[0];

      if (res0?.Status === 1) {
        await Swal.fire({
          icon: "success", title: "Deleted!",
          timer: 1200, showConfirmButton: false,
        });
        loadSalesList();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res0?.Message || "Delete failed" });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Delete failed" });
    }
  };

  /* ============================================================
     ACTIVATE / DEACTIVATE — TypeId = 5
  ============================================================ */
  const handleToggleActive = async (item) => {
    const isCurrentlyActive = item.IsActive;

    const result = await Swal.fire({
      title: isCurrentlyActive ? "Deactivate Karna Hai?" : "Activate Karna Hai?",
      text:  isCurrentlyActive
        ? `Bill No ${item.BillNo} deactivate ho jayega.`
        : `Bill No ${item.BillNo} activate ho jayega.`,
      icon:  "warning",
      showCancelButton:   true,
      confirmButtonColor: isCurrentlyActive ? "#f59e0b" : "#16a34a",
      cancelButtonColor:  "#6b7280",
      confirmButtonText:  isCurrentlyActive ? "Haan, Deactivate Karo!" : "Haan, Activate Karo!",
      cancelButtonText:   "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const createdBy = sessionStorage.getItem("username") || "Admin";
      const res = await Sales_Manage({
        TypeId:   5,
        SaleId:   item.SaleId,
        IsActive: !isCurrentlyActive,
        CreatedBy: createdBy,
      });
      const res0 = res?.data?.[0];

      if (res0?.Status === 1) {
        await Swal.fire({
          icon:  "success",
          title: isCurrentlyActive ? "Deactivated!" : "Activated!",
          text:  res0.Message,
          timer: 1200,
          showConfirmButton: false,
        });
        loadSalesList();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res0?.Message || "Failed" });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong" });
    }
  };

  /* ============================================================
     VIEW POPUP — TypeId = 4 with SaleId
  ============================================================ */
  const handleView = async (saleId) => {
    try {
      const res = await Sales_Manage({ TypeId: 4, SaleId: saleId });
      setViewHeader(res?.data?.header?.[0]);
      setViewDetails(res?.data?.details || []);
      setViewPopup(true);
    } catch (err) {
      console.error("View load error", err);
      Swal.fire({ icon: "error", title: "Error", text: "Could not load details" });
    }
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <ProtectedRoute>
      <div className="content-wrapper">

        {/* ===================== HEADER FORM ===================== */}
        <div className="form-card">
          <h2>Sales Entry</h2>
          <hr />

          {/* Row 1: Bill No | Bill Date */}
          <div className="form-row">
            <div className="form-group">
              <label>Bill No</label>
              <input
                placeholder="Bill No"
                value={header.billNo}
                onChange={(e) => {
                  const val = e.target.value;
                  const result = commonInputValidator(val, {
                    numeric: false, allowDecimal: false,
                    minLength: 1, maxLength: 20,
                  });
                  if (result === true) {
                    setHeader({ ...header, billNo: val.toUpperCase() });
                    setHeaderError((p) => ({ ...p, billNo: "" }));
                  } else {
                    setHeaderError((p) => ({ ...p, billNo: result }));
                  }
                }}
              />
              <p style={{ color: "red" }}>{headerError.billNo}</p>
            </div>

            <div className="form-group">
              <label>Bill Date</label>
              <input
                type="date"
                value={header.billDate}
                onChange={(e) => {
                  setHeader({ ...header, billDate: e.target.value });
                  setHeaderError((p) => ({ ...p, billDate: "" }));
                }}
              />
              <p style={{ color: "red" }}>{headerError.billDate}</p>
            </div>
          </div>

          {/* Row 2: Customer | Payment Mode */}
          <div className="form-row">
            <div className="form-group">
              <label>Customer</label>
              <select
                value={header.customerId}
                onChange={(e) => {
                  setHeader({ ...header, customerId: e.target.value });
                  setHeaderError((p) => ({ ...p, customerId: "" }));
                }}
              >
                <option value="">-- Select Customer --</option>
                {customerList.map((c) => (
                  <option key={c.CustomerId} value={c.CustomerId}>
                    {c.CustomerName} — {c.MobileNo}
                  </option>
                ))}
              </select>
              <p style={{ color: "red" }}>{headerError.customerId}</p>
            </div>

            <div className="form-group">
              <label>Payment Mode</label>
              <select
                value={header.paymentMode}
                onChange={(e) => {
                  setHeader({ ...header, paymentMode: e.target.value });
                  setHeaderError((p) => ({ ...p, paymentMode: "" }));
                }}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="MIXED">Mixed</option>
              </select>
              <p style={{ color: "red" }}>{headerError.paymentMode}</p>
            </div>
          </div>

          {/* Row 3: Paid Amount | IsActive */}
          <div className="form-row">
            <div className="form-group">
              <label>Paid Amount (₹)</label>
              <input
                placeholder="Paid Amount"
                value={header.paidAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  const result = commonInputValidator(val, {
                    numeric: true, allowDecimal: true,
                    minLength: 1, maxLength: 12,
                  });
                  if (result === true)
                    setHeader({ ...header, paidAmount: val });
                }}
              />
            </div>

            <div className="form-group">
              <label>Is Active</label>
              <select
                value={header.isActive ? "true" : "false"}
                onChange={(e) =>
                  setHeader({ ...header, isActive: e.target.value === "true" })
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Row 4: Remarks */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Remarks</label>
              <input
                placeholder="Remarks (optional)"
                value={header.remarks}
                onChange={(e) => setHeader({ ...header, remarks: e.target.value })}
              />
            </div>
            <div className="form-group"></div>
          </div>
        </div>

        {/* ===================== DETAIL TABLE ===================== */}
        <div className="form-card" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Sale Details</h3>
            <button className="btn-primary" onClick={addRow}>+ Add Row</button>
          </div>
          <hr />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Product</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Gross Wt (gm)</th>
                  <th style={th}>Net Wt (gm)</th>
                  <th style={th}>Metal Rate (₹)</th>
                  <th style={th}>Making Charge</th>
                  <th style={th}>Type</th>
                  <th style={th}>Stone (₹)</th>
                  <th style={th}>GST %</th>
                  <th style={th}>Amount (₹)</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {details.map((row, index) => (
                  <tr key={row._id}>
                    <td style={td}>{index + 1}</td>

                    {/* Product */}
                    <td style={td}>
                      <select
                        style={inputStyle}
                        value={row.productId}
                        onChange={(e) =>
                          handleDetailChange(index, "productId", e.target.value)
                        }
                      >
                        <option value="">-- Select --</option>
                        {productList.map((p) => (
                          <option key={p.ProductId} value={p.ProductId}>
                            {p.ProductName}
                          </option>
                        ))}
                      </select>
                      <p style={errStyle}>{detailError[index]?.productId}</p>
                    </td>

                    {/* Quantity */}
                    <td style={td}>
                      <input
                        style={inputStyle} placeholder="Qty" value={row.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: false, minLength: 1, maxLength: 6,
                          });
                          if (result === true) handleDetailChange(index, "quantity", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.quantity}</p>
                    </td>

                    {/* Gross Weight */}
                    <td style={td}>
                      <input
                        style={inputStyle} placeholder="Gross Wt" value={row.grossWeight}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true, minLength: 1, maxLength: 10,
                          });
                          if (result === true) handleDetailChange(index, "grossWeight", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.grossWeight}</p>
                    </td>

                    {/* Net Weight */}
                    <td style={td}>
                      <input
                        style={inputStyle} placeholder="Net Wt" value={row.netWeight}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true, minLength: 1, maxLength: 10,
                          });
                          if (result === true) handleDetailChange(index, "netWeight", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.netWeight}</p>
                    </td>

                    {/* Metal Rate */}
                    <td style={td}>
                      <input
                        style={inputStyle} placeholder="Metal Rate" value={row.metalRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true, minLength: 1, maxLength: 10,
                          });
                          if (result === true) handleDetailChange(index, "metalRate", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.metalRate}</p>
                    </td>

                    {/* Making Charge */}
                    <td style={td}>
                      <input
                        style={inputStyle} placeholder="Making" value={row.makingCharge}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true, minLength: 1, maxLength: 10,
                          });
                          if (result === true) handleDetailChange(index, "makingCharge", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.makingCharge}</p>
                    </td>

                    {/* Making Charge Type */}
                    <td style={td}>
                      <select
                        style={inputStyle}
                        value={row.makingChargeType}
                        onChange={(e) =>
                          handleDetailChange(index, "makingChargeType", e.target.value)
                        }
                      >
                        <option value="FLAT">FLAT (₹)</option>
                        <option value="PERCENT">PERCENT (%)</option>
                      </select>
                    </td>

                    {/* Stone Charge */}
                    <td style={td}>
                      <input
                        style={inputStyle} placeholder="Stone" value={row.stoneCharge}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true, minLength: 1, maxLength: 10,
                          });
                          if (result === true) handleDetailChange(index, "stoneCharge", val);
                        }}
                      />
                    </td>

                    {/* GST Rate */}
                    <td style={td}>
                      <input
                        style={inputStyle} placeholder="GST %" value={row.gstRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true, minLength: 1, maxLength: 5,
                          });
                          if (result === true) handleDetailChange(index, "gstRate", val);
                        }}
                      />
                    </td>

                    {/* Amount (read-only) */}
                    <td style={td}>
                      <input
                        style={{ ...inputStyle, backgroundColor: "#f5f5f5" }}
                        placeholder="Amount" value={row.amount} readOnly
                      />
                      <p style={errStyle}>{detailError[index]?.amount}</p>
                    </td>

                    {/* Remove Row */}
                    <td style={{ ...td, textAlign: "center" }}>
                      <button
                        className="btn-danger-grid"
                        onClick={() => removeRow(index)}
                        disabled={details.length === 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* TOTALS */}
              <tfoot>
                <tr>
                  <td colSpan={10} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    GST Amount:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#7c3aed" }}>
                    ₹ {totalGST}
                  </td>
                  <td style={td}></td>
                </tr>
                <tr>
                  <td colSpan={10} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Total Amount:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#2563eb" }}>
                    ₹ {totalAmount}
                  </td>
                  <td style={td}></td>
                </tr>
                <tr>
                  <td colSpan={10} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Paid Amount:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#16a34a" }}>
                    ₹ {parseFloat(header.paidAmount || 0).toFixed(2)}
                  </td>
                  <td style={td}></td>
                </tr>
                <tr>
                  <td colSpan={10} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Balance Due:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#dc2626" }}>
                    ₹ {(parseFloat(totalAmount) - parseFloat(header.paidAmount || 0)).toFixed(2)}
                  </td>
                  <td style={td}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="btn-group" style={{ marginTop: "16px" }}>
            <button className="btn-primary" onClick={handleSubmit}>{buttonName}</button>
            <button className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </div>

        {/* ===================== SALES LIST ===================== */}
        <div className="table-card" style={{ marginTop: "16px" }}>
          <h3>Sales List</h3>
          <table>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Bill No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Total Amount</th>
                <th>GST</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {salesList.map((item, index) => (
                <tr key={item.SaleId}>
                  <td>{index + 1}</td>
                  <td>{item.BillNo}</td>
                  <td>
                    {item.BillDate
                      ? new Date(item.BillDate).toLocaleDateString("en-IN")
                      : ""}
                  </td>
                  <td>{item.CustomerName}</td>
                  <td>{item.MobileNo}</td>
                  <td>₹ {item.TotalAmount}</td>
                  <td>₹ {item.GSTAmount}</td>
                  <td>₹ {item.PaidAmount}</td>
                  <td>₹ {item.BalanceDue}</td>
                  <td>{item.PaymentMode}</td>

                  {/* Status Badge */}
                  <td>
                    <span style={{
                      padding: "2px 10px", borderRadius: "12px",
                      fontSize: "12px", fontWeight: "bold",
                      backgroundColor: item.IsActive ? "#dcfce7" : "#fee2e2",
                      color: item.IsActive ? "#16a34a" : "#dc2626",
                    }}>
                      {item.IsActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    {/* View */}
                    <button
                      className="btn-primary"
                      style={{ marginRight: "6px", padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => handleView(item.SaleId)}
                    >
                      View
                    </button>

                    {/* Edit */}
                    <button
                      className="btn-edit-grid"
                      style={{ marginRight: "6px" }}
                      onClick={() => handleEdit(item.SaleId)}
                    >
                      Edit
                    </button>

                    {/* Activate / Deactivate */}
                    <button
                      style={{
                        marginRight: "6px", padding: "4px 10px",
                        fontSize: "12px", borderRadius: "4px",
                        border: "none", cursor: "pointer",
                        backgroundColor: item.IsActive ? "#f59e0b" : "#16a34a",
                        color: "#fff", fontWeight: "bold",
                      }}
                      onClick={() => handleToggleActive(item)}
                    >
                      {item.IsActive ? "Deactivate" : "Activate"}
                    </button>

                    {/* Delete */}
                    <button
                      className="btn-danger-grid"
                      onClick={() => handleDelete(item.SaleId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===================== VIEW POPUP ===================== */}
        {viewPopup && viewHeader && (
          <div style={overlayStyle}>
            <div style={popupStyle}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0 }}>Sale Details — {viewHeader.BillNo}</h3>
                <button
                  onClick={() => setViewPopup(false)}
                  style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}
                >
                  ✕
                </button>
              </div>
              <hr />

              {/* Header Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div><strong>Bill No:</strong> {viewHeader.BillNo}</div>
                <div><strong>Date:</strong> {viewHeader.BillDate ? new Date(viewHeader.BillDate).toLocaleDateString("en-IN") : ""}</div>
                <div><strong>Customer:</strong> {viewHeader.CustomerName}</div>
                <div><strong>Mobile:</strong> {viewHeader.MobileNo}</div>
                <div><strong>Payment Mode:</strong> {viewHeader.PaymentMode}</div>
                <div><strong>Total Amount:</strong> ₹ {viewHeader.TotalAmount}</div>
                <div><strong>GST Amount:</strong> ₹ {viewHeader.GSTAmount}</div>
                <div><strong>Paid Amount:</strong> ₹ {viewHeader.PaidAmount}</div>
                <div><strong>Balance Due:</strong> ₹ {viewHeader.BalanceDue}</div>
                <div>
                  <strong>Status: </strong>
                  <span style={{
                    padding: "2px 10px", borderRadius: "12px",
                    fontSize: "12px", fontWeight: "bold",
                    backgroundColor: viewHeader.IsActive ? "#dcfce7" : "#fee2e2",
                    color: viewHeader.IsActive ? "#16a34a" : "#dc2626",
                  }}>
                    {viewHeader.IsActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {viewHeader.Remarks && (
                  <div style={{ gridColumn: "span 2" }}><strong>Remarks:</strong> {viewHeader.Remarks}</div>
                )}
              </div>

              {/* Details Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th style={th}>#</th>
                      <th style={th}>Product</th>
                      <th style={th}>Qty</th>
                      <th style={th}>Gross Wt</th>
                      <th style={th}>Net Wt</th>
                      <th style={th}>Metal Rate</th>
                      <th style={th}>Making</th>
                      <th style={th}>Type</th>
                      <th style={th}>Stone</th>
                      <th style={th}>GST %</th>
                      <th style={th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetails.map((d, i) => (
                      <tr key={d.SaleDetailId}>
                        <td style={td}>{i + 1}</td>
                        <td style={td}>{d.ProductName}</td>
                        <td style={td}>{d.Quantity}</td>
                        <td style={td}>{d.GrossWeight}g</td>
                        <td style={td}>{d.NetWeight}g</td>
                        <td style={td}>₹ {d.MetalRate}</td>
                        <td style={td}>{d.MakingCharge}</td>
                        <td style={td}>{d.MakingChargeType}</td>
                        <td style={td}>₹ {d.StoneCharge}</td>
                        <td style={td}>{d.GSTRate}%</td>
                        <td style={td}>₹ {d.Amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ textAlign: "right", marginTop: "16px" }}>
                <button className="btn-secondary" onClick={() => setViewPopup(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

/* ---- inline styles ---- */
const th = {
  padding: "8px 10px", background: "#f1f5f9",
  border: "1px solid #e2e8f0", whiteSpace: "nowrap", textAlign: "left",
};
const td = {
  padding: "6px 8px", border: "1px solid #e2e8f0", verticalAlign: "top",
};
const inputStyle = {
  width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1",
  borderRadius: "4px", fontSize: "14px", boxSizing: "border-box",
};
const errStyle = { color: "red", fontSize: "11px", margin: "2px 0 0 0" };

const overlayStyle = {
  position: "fixed", top: 0, left: 0,
  width: "100vw", height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000,
};
const popupStyle = {
  backgroundColor: "#fff", borderRadius: "8px",
  padding: "24px", width: "90%", maxWidth: "1000px",
  maxHeight: "85vh", overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
};

export default SalesMaster;