import React, { useState, useEffect } from "react";
import { commonInputValidator } from "@/utils/inputValidation";
import {
  ProductMaster_Manage,
  SupplierMaster_Manage,
} from "@/lib/services/MasterService";
import { Purchase_Manage } from "@/lib/services/TransactionsService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ------------------------------------------------------------------ */
/*  Empty detail row template                                           */
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
  amount:          "",
});

/* ================================================================== */
const PurchaseMaster = () => {

  /* ---------------- HEADER STATES ---------------- */
  const [header, setHeader] = useState({
    purchaseNo:   "",
    purchaseDate: new Date().toISOString().split("T")[0],
    supplierId:   "",
    paidAmount:   "",
    remarks:      "",
  });

  const [editId,      setEditId]      = useState(null);
  const [buttonName,  setButtonName]  = useState("Save");
  const [headerError, setHeaderError] = useState({});

  /* ---------------- DETAIL ROWS STATES ---------------- */
  const [details,     setDetails]     = useState([emptyRow()]);
  const [detailError, setDetailError] = useState([]);

  /* ---------------- LIST STATE ---------------- */
  const [purchaseList, setPurchaseList] = useState([]);

  /* ---------------- DROPDOWN STATES ---------------- */
  const [supplierList, setSupplierList] = useState([]);
  const [productList,  setProductList]  = useState([]);

  /* ============================================================
     LOAD DROPDOWNS
  ============================================================ */
  const loadSupplierList = async () => {
    try {
      const res = await SupplierMaster_Manage({
        supplierId: 0, supplierName: "", phone: "",
        gstin: "", address: "", isActive: true, typeId: 5,
      });
      setSupplierList(res?.data || []);
    } catch (err) { console.error("Supplier load error", err); }
  };

  const loadProductList = async () => {
    try {
      const res = await ProductMaster_Manage({ TypeId: 1 });
      setProductList(res?.data || []);
    } catch (err) { console.error("Product load error", err); }
  };

  const loadPurchaseList = async () => {
    try {
      const res = await Purchase_Manage({ TypeId: 4 });
      setPurchaseList(res?.data?.header || res?.data || []);
    } catch (err) { console.error("Purchase list load error", err); }
  };

  useEffect(() => {
    loadSupplierList();
    loadProductList();
    loadPurchaseList();
  }, []);

  /* ============================================================
     AMOUNT AUTO CALCULATE
     Amount = (NetWeight × MetalRate) + MakingCharge + StoneCharge
     MakingChargeType = PERCENT → Making = NetWeight × MetalRate × (MakingCharge/100)
  ============================================================ */
  const calculateAmount = (row) => {
    const netWeight   = parseFloat(row.netWeight)    || 0;
    const metalRate   = parseFloat(row.metalRate)    || 0;
    const making      = parseFloat(row.makingCharge) || 0;
    const stone       = parseFloat(row.stoneCharge)  || 0;
    const metalAmount = netWeight * metalRate;

    const makingAmount =
      row.makingChargeType === "PERCENT"
        ? metalAmount * (making / 100)
        : making;

    return (metalAmount + makingAmount + stone).toFixed(2);
  };

  /* ============================================================
     DETAIL ROW HANDLERS
  ============================================================ */
  const handleDetailChange = (index, field, value) => {
    const updated = [...details];
    updated[index][field] = value;

    // Auto calculate amount when relevant fields change
    const amountFields = [
      "netWeight", "metalRate", "makingCharge", "makingChargeType", "stoneCharge"
    ];
    if (amountFields.includes(field)) {
      updated[index].amount = calculateAmount(updated[index]);
    }

    setDetails(updated);

    // Clear that cell's error
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

  /* Computed total */
  const totalAmount = details
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    .toFixed(2);

  /* ============================================================
     VALIDATION
  ============================================================ */
  const handleValidation = () => {
    let valid = true;
    const hErr = {};

    if (!header.purchaseNo)  { hErr.purchaseNo  = "Purchase No is required"; valid = false; }
    if (!header.purchaseDate){ hErr.purchaseDate = "Purchase Date is required"; valid = false; }
    if (!header.supplierId)  { hErr.supplierId   = "Supplier is required"; valid = false; }

    setHeaderError(hErr);

    const dErr = details.map((row) => {
      const rowErr = {};
      if (!row.productId)        { rowErr.productId    = "Required"; valid = false; }
      if (!row.quantity)         { rowErr.quantity      = "Required"; valid = false; }
      if (!row.grossWeight)      { rowErr.grossWeight   = "Required"; valid = false; }
      if (!row.netWeight)        { rowErr.netWeight     = "Required"; valid = false; }
      if (!row.metalRate)        { rowErr.metalRate     = "Required"; valid = false; }
      if (!row.makingCharge)     { rowErr.makingCharge  = "Required"; valid = false; }
      if (!row.amount)           { rowErr.amount        = "Required"; valid = false; }
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
      Amount:           parseFloat(r.amount),
    }));

    const payload = {
      TypeId:       editId ? 2 : 1,
      PurchaseId:   editId || 0,
      PurchaseNo:   header.purchaseNo,
      PurchaseDate: header.purchaseDate,
      SupplierId:   Number(header.supplierId),
      TotalAmount:  parseFloat(totalAmount),
      PaidAmount:   parseFloat(header.paidAmount || 0),
      Remarks:      header.remarks,
      CreatedBy:    createdBy,
      DetailsJson:  detailsArray,
    };

    try {
      const response = await Purchase_Manage(payload);
      const res0 = response?.data?.[0];

      if (res0?.Status === 1) {
        await Swal.fire({ icon: "success", title: "Saved!", text: res0.Message });
        loadPurchaseList();
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
      purchaseNo:   "",
      purchaseDate: new Date().toISOString().split("T")[0],
      supplierId:   "",
      paidAmount:   "",
      remarks:      "",
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
  const handleEdit = async (purchaseId) => {
    try {
      const res = await Purchase_Manage({ TypeId: 4, PurchaseId: purchaseId });
debugger
      const hData = res?.data?.header[0];
      const dData = res?.data?.details || res?.details || [];

      if (!hData) return;

      setHeader({
        purchaseNo:   hData.PurchaseNo || "",
        purchaseDate: hData.PurchaseDate
          ? hData.PurchaseDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        supplierId: hData.SupplierId ? hData.SupplierId.toString() : "",
        paidAmount: hData.PaidAmount ? hData.PaidAmount.toString() : "",
        remarks:    hData.Remarks || "",
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
              amount:          d.Amount           ? d.Amount.toString()           : "",
            }))
          : [emptyRow()]
      );

      setEditId(purchaseId);
      setButtonName("Update");
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      console.error("Edit load error", err);
      Swal.fire({ icon: "error", title: "Error", text: "Could not load purchase" });
    }
  };

  /* ============================================================
     DELETE
  ============================================================ */
  const handleDelete = async (purchaseId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const createdBy = sessionStorage.getItem("username") || "Admin";
      const res = await Purchase_Manage({
        TypeId: 3, PurchaseId: purchaseId, CreatedBy: createdBy,
      });
      const res0 = res?.data?.[0];

      if (res0?.Status === 1) {
        await Swal.fire({
          icon: "success", title: "Deleted!",
          timer: 1200, showConfirmButton: false,
        });
        loadPurchaseList();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res0?.Message || "Delete failed" });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Delete failed" });
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
          <h2>Purchase Entry</h2>
          <hr />

          {/* Row 1: Purchase No | Purchase Date */}
          <div className="form-row">
            <div className="form-group">
              <label>Purchase No</label>
              <input
                placeholder="Purchase No"
                value={header.purchaseNo}
                onChange={(e) => {
                  const val = e.target.value;
                  const result = commonInputValidator(val, {
                    numeric: false, allowDecimal: false,
                    minLength: 1, maxLength: 20,
                  });
                  if (result === true) {
                    setHeader({ ...header, purchaseNo: val.toUpperCase() });
                    setHeaderError((p) => ({ ...p, purchaseNo: "" }));
                  } else {
                    setHeaderError((p) => ({ ...p, purchaseNo: result }));
                  }
                }}
              />
              <p style={{ color: "red" }}>{headerError.purchaseNo}</p>
            </div>

            <div className="form-group">
              <label>Purchase Date</label>
              <input
                type="date"
                value={header.purchaseDate}
                onChange={(e) => {
                  setHeader({ ...header, purchaseDate: e.target.value });
                  setHeaderError((p) => ({ ...p, purchaseDate: "" }));
                }}
              />
              <p style={{ color: "red" }}>{headerError.purchaseDate}</p>
            </div>
          </div>

          {/* Row 2: Supplier | Paid Amount */}
          <div className="form-row">
            <div className="form-group">
              <label>Supplier</label>
              <select
                value={header.supplierId}
                onChange={(e) => {
                  setHeader({ ...header, supplierId: e.target.value });
                  setHeaderError((p) => ({ ...p, supplierId: "" }));
                }}
              >
                <option value="">-- Select Supplier --</option>
                {supplierList.map((s) => (
                  <option key={s.SupplierId} value={s.SupplierId}>
                    {s.SupplierName}
                  </option>
                ))}
              </select>
              <p style={{ color: "red" }}>{headerError.supplierId}</p>
            </div>

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
          </div>

          {/* Row 3: Remarks */}
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
            <h3 style={{ margin: 0 }}>Purchase Details</h3>
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
                  <th style={th}>Stone Charge (₹)</th>
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
                        style={inputStyle}
                        placeholder="Qty"
                        value={row.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: false,
                            minLength: 1, maxLength: 6,
                          });
                          if (result === true)
                            handleDetailChange(index, "quantity", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.quantity}</p>
                    </td>

                    {/* Gross Weight */}
                    <td style={td}>
                      <input
                        style={inputStyle}
                        placeholder="Gross Wt"
                        value={row.grossWeight}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true,
                            minLength: 1, maxLength: 10,
                          });
                          if (result === true)
                            handleDetailChange(index, "grossWeight", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.grossWeight}</p>
                    </td>

                    {/* Net Weight */}
                    <td style={td}>
                      <input
                        style={inputStyle}
                        placeholder="Net Wt"
                        value={row.netWeight}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true,
                            minLength: 1, maxLength: 10,
                          });
                          if (result === true)
                            handleDetailChange(index, "netWeight", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.netWeight}</p>
                    </td>

                    {/* Metal Rate */}
                    <td style={td}>
                      <input
                        style={inputStyle}
                        placeholder="Metal Rate"
                        value={row.metalRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true,
                            minLength: 1, maxLength: 10,
                          });
                          if (result === true)
                            handleDetailChange(index, "metalRate", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.metalRate}</p>
                    </td>

                    {/* Making Charge */}
                    <td style={td}>
                      <input
                        style={inputStyle}
                        placeholder="Making"
                        value={row.makingCharge}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true,
                            minLength: 1, maxLength: 10,
                          });
                          if (result === true)
                            handleDetailChange(index, "makingCharge", val);
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
                        style={inputStyle}
                        placeholder="Stone"
                        value={row.stoneCharge}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true,
                            minLength: 1, maxLength: 10,
                          });
                          if (result === true)
                            handleDetailChange(index, "stoneCharge", val);
                        }}
                      />
                    </td>

                    {/* Amount (read-only, auto calculated) */}
                    <td style={td}>
                      <input
                        style={{ ...inputStyle, backgroundColor: "#f5f5f5" }}
                        placeholder="Amount"
                        value={row.amount}
                        readOnly
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

              {/* TOTALS ROW */}
              <tfoot>
                <tr>
                  <td colSpan={9} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Total Amount:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#2563eb" }}>
                    ₹ {totalAmount}
                  </td>
                  <td style={td}></td>
                </tr>
                <tr>
                  <td colSpan={9} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Paid Amount:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#16a34a" }}>
                    ₹ {parseFloat(header.paidAmount || 0).toFixed(2)}
                  </td>
                  <td style={td}></td>
                </tr>
                <tr>
                  <td colSpan={9} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
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

          {/* FORM BUTTONS */}
          <div className="btn-group" style={{ marginTop: "16px" }}>
            <button className="btn-primary" onClick={handleSubmit}>
              {buttonName}
            </button>
            <button className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>

        {/* ===================== PURCHASE LIST ===================== */}
        <div className="table-card" style={{ marginTop: "16px" }}>
          <h3>Purchase List</h3>
          <table>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Purchase No</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchaseList.map((item, index) => (
                <tr key={item.PurchaseId}>
                  <td>{index + 1}</td>
                  <td>{item.PurchaseNo}</td>
                  <td>
                    {item.PurchaseDate
                      ? new Date(item.PurchaseDate).toLocaleDateString("en-IN")
                      : ""}
                  </td>
                  <td>{item.SupplierName}</td>
                  <td>₹ {item.TotalAmount}</td>
                  <td>₹ {item.PaidAmount}</td>
                  <td>₹ {item.DueAmount}</td>
                  <td>{item.Remarks}</td>
                  <td>
                    <button
                      className="btn-edit-grid"
                      onClick={() => handleEdit(item.PurchaseId)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger-grid"
                      style={{ marginLeft: "8px" }}
                      onClick={() => handleDelete(item.PurchaseId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </ProtectedRoute>
  );
};

/* ---- inline styles ---- */
const th = {
  padding: "8px 10px",
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
  textAlign: "left",
};
const td = {
  padding: "6px 8px",
  border: "1px solid #e2e8f0",
  verticalAlign: "top",
};
const inputStyle = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  fontSize: "14px",
  boxSizing: "border-box",
};
const errStyle = { color: "red", fontSize: "11px", margin: "2px 0 0 0" };

export default PurchaseMaster;