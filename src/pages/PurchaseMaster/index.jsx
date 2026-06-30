import React, { useState, useEffect } from "react";
import { commonInputValidator } from "@/utils/inputValidation";
import {
  ProductMaster_Manage,
  SupplierMaster_Manage,
} from "@/lib/services/MasterService";
import { Purchase_Manage } from "@/lib/services/TransactionsService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ------------------------------------------------------------------
   METAL RATE LOGIC
   GOLD   -> Rate diya jata hai 10 gm ke hisab se   (divisor = 10)
   SILVER -> Rate diya jata hai 1 kg (1000 gm) ke hisab se (divisor = 1000)
   Metal Amount = Weight * Rate / Divisor
------------------------------------------------------------------- */
const getMetalDivisor = (metalType) => (metalType === "SILVER" ? 1000 : 10);

/* ------------------------------------------------------------------ */
const emptyRow = () => ({
  _id:             Date.now() + Math.random(),
  productId:       "",
  quantity:        "",
  grossWeight:     "",
  netWeight:       "",
  metalType:       "GOLD",   // ✅ NAYA — GOLD / SILVER
  metalRate:       "",
  makingCharge:    "",
  makingChargeType:"FLAT",
  stoneCharge:     "",
  amount:          "",
});

/* ✅ NAYA — Old Jewellery empty row (Sales Master jaisa) */
const emptyOldJewelRow = () => ({
  _id:             Date.now() + Math.random(),
  itemDescription: "",
  grossWeight:     "",
  metalType:       "GOLD",   // GOLD / SILVER
  touch:           "",       // Optional — bhara ho to PureWeight se Amount nikalega
  deductionWeight: "",       // auto-calc (jab Touch bhara ho)
  pureWeight:      "",       // auto-calc (jab Touch bhara ho)
  metalRate:       "",
  amount:          "",       // auto-calc
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
    isActive:     true,
  });

  const [editId,      setEditId]      = useState(null);
  const [buttonName,  setButtonName]  = useState("Save");
  const [headerError, setHeaderError] = useState({});

  /* ---------------- DETAIL ROWS STATES ---------------- */
  const [details,     setDetails]     = useState([emptyRow()]);
  const [detailError, setDetailError] = useState([]);

  /* ---------------- OLD JEWELLERY ROWS STATES ---------------- ✅ NAYA */
  const [oldJewelleryRows,  setOldJewelleryRows]  = useState([]);
  const [oldJewelleryError, setOldJewelleryError] = useState([]);

  /* ---------------- LIST STATE ---------------- */
  const [purchaseList, setPurchaseList] = useState([]);

  /* ---------------- DROPDOWN STATES ---------------- */
  const [supplierList, setSupplierList] = useState([]);
  const [productList,  setProductList]  = useState([]);

  /* ---------------- VIEW POPUP STATES ---------------- */
  const [viewPopup,        setViewPopup]        = useState(false);
  const [viewHeader,       setViewHeader]       = useState(null);
  const [viewDetails,      setViewDetails]      = useState([]);
  const [viewOldJewellery, setViewOldJewellery] = useState([]);   // ✅ NAYA

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
     AMOUNT AUTO CALCULATE — PURCHASE DETAILS
     Metal Amount = NetWeight * MetalRate / Divisor (Gold=10, Silver=1000)
  ============================================================ */
  const calculateAmount = (row) => {
    const netWeight   = parseFloat(row.netWeight)    || 0;
    const metalRate   = parseFloat(row.metalRate)    || 0;
    const making      = parseFloat(row.makingCharge) || 0;
    const stone       = parseFloat(row.stoneCharge)  || 0;
    const divisor     = getMetalDivisor(row.metalType);

    const metalAmount = (netWeight * metalRate) / divisor;

    const makingAmount =
      row.makingChargeType === "PERCENT"
        ? metalAmount * (making / 100)
        : making;

    return (metalAmount + makingAmount + stone).toFixed(2);
  };

  /* ============================================================
     OLD JEWELLERY CALCULATIONS  ✅ NAYA
     Bina Touch  : Amount = GrossWeight * MetalRate / Divisor
     Touch hone par:
        DeductionWeight = GrossWeight * (100 - Touch) / 100
        PureWeight       = GrossWeight - DeductionWeight
        Amount           = PureWeight * MetalRate / Divisor
  ============================================================ */
  const calculateOldJewelRow = (row) => {
    const grossWeight = parseFloat(row.grossWeight) || 0;
    const metalRate   = parseFloat(row.metalRate)   || 0;
    const divisor     = getMetalDivisor(row.metalType);

    if (row.touch) {
      const touch = parseFloat(row.touch) || 0;
      const deductionWeight = grossWeight * (100 - touch) / 100;
      const pureWeight      = grossWeight - deductionWeight;
      const amount          = (pureWeight * metalRate) / divisor;

      return {
        ...row,
        deductionWeight: grossWeight && touch ? deductionWeight.toFixed(3) : "",
        pureWeight:       grossWeight && touch ? pureWeight.toFixed(3)      : "",
        amount:           grossWeight && touch ? amount.toFixed(2)          : "",
      };
    }

    const amount = (grossWeight * metalRate) / divisor;
    return {
      ...row,
      deductionWeight: "",
      pureWeight:      "",
      amount: grossWeight && metalRate ? amount.toFixed(2) : "",
    };
  };

  /* ============================================================
     DETAIL ROW HANDLERS — PURCHASE DETAILS
  ============================================================ */
  const handleDetailChange = (index, field, value) => {
    const updated = [...details];
    updated[index][field] = value;

    const amountFields = [
      "netWeight", "metalRate", "metalType", "makingCharge", "makingChargeType", "stoneCharge"
    ];
    if (amountFields.includes(field)) {
      updated[index].amount = calculateAmount(updated[index]);
    }

    setDetails(updated);

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

  /* ============================================================
     OLD JEWELLERY ROW HANDLERS  ✅ NAYA
  ============================================================ */
  const handleOldJewelChange = (index, field, value) => {
    const updated = [...oldJewelleryRows];
    updated[index][field] = value;

    const recalcFields = ["grossWeight", "touch", "metalRate", "metalType"];
    if (recalcFields.includes(field)) {
      updated[index] = calculateOldJewelRow(updated[index]);
    }

    setOldJewelleryRows(updated);

    const errCopy = [...oldJewelleryError];
    if (errCopy[index]) {
      errCopy[index][field] = "";
      setOldJewelleryError(errCopy);
    }
  };

  const addOldJewelRow = () =>
    setOldJewelleryRows([...oldJewelleryRows, emptyOldJewelRow()]);

  const removeOldJewelRow = (index) => {
    setOldJewelleryRows(oldJewelleryRows.filter((_, i) => i !== index));
    setOldJewelleryError(oldJewelleryError.filter((_, i) => i !== index));
  };

  /* Computed totals */
  const totalDetailsAmount = details
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    .toFixed(2);

  const totalOldJewelleryAmount = oldJewelleryRows
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    .toFixed(2);

  /* Grand Total Payable = New Items + Old Jewellery purchased */
  const totalAmount = (
    parseFloat(totalDetailsAmount) + parseFloat(totalOldJewelleryAmount)
  ).toFixed(2);

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

    /* Old Jewellery validation ✅ NAYA */
    const ojErr = oldJewelleryRows.map((row) => {
      const rowErr = {};
      if (!row.grossWeight) { rowErr.grossWeight = "Required"; valid = false; }
      if (!row.metalRate)   { rowErr.metalRate   = "Required"; valid = false; }
      return rowErr;
    });
    setOldJewelleryError(ojErr);

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
      MetalType:        r.metalType,
      MetalRate:        parseFloat(r.metalRate),
      MakingCharge:     parseFloat(r.makingCharge),
      MakingChargeType: r.makingChargeType,
      StoneCharge:      parseFloat(r.stoneCharge || 0),
      Amount:           parseFloat(r.amount),
    }));

    /* ✅ NAYA — Old Jewellery payload (sirf complete rows) */
    const oldJewelleryArray = oldJewelleryRows
      .filter((r) => r.grossWeight && r.metalRate)
      .map((r) => ({
        ItemDescription: r.itemDescription || null,
        GrossWeight:     parseFloat(r.grossWeight),
        MetalType:       r.metalType,
        Touch:           r.touch ? parseFloat(r.touch) : null,
        DeductionWeight: r.touch ? parseFloat(r.deductionWeight) : null,
        PureWeight:      r.touch ? parseFloat(r.pureWeight) : null,
        MetalRate:       parseFloat(r.metalRate),
        Amount:          parseFloat(r.amount),
      }));

    const payload = {
      TypeId:           editId ? 2 : 1,
      PurchaseId:       editId || 0,
      PurchaseNo:       header.purchaseNo,
      PurchaseDate:     header.purchaseDate,
      SupplierId:       Number(header.supplierId),
      TotalAmount:      parseFloat(totalAmount),
      PaidAmount:       parseFloat(header.paidAmount || 0),
      IsActive:         header.isActive,
      Remarks:          header.remarks,
      CreatedBy:        createdBy,
      DetailsJson:      detailsArray,
      OldJewelleryJson: oldJewelleryArray.length ? oldJewelleryArray : null,   // ✅ NAYA
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
      isActive:     true,
    });
    setDetails([emptyRow()]);
    setOldJewelleryRows([]);          // ✅ NAYA
    setEditId(null);
    setButtonName("Save");
    setHeaderError({});
    setDetailError([]);
    setOldJewelleryError([]);         // ✅ NAYA
  };

  /* ============================================================
     EDIT
  ============================================================ */
  const handleEdit = async (purchaseId) => {
    try {
      const res = await Purchase_Manage({ TypeId: 4, PurchaseId: purchaseId });

      const hData  = res?.data?.header?.[0];
      const dData  = res?.data?.details || [];
      const ojData = res?.data?.oldJewellery || [];   // ✅ NAYA

      if (!hData) return;

      setHeader({
        purchaseNo:   hData.PurchaseNo || "",
        purchaseDate: hData.PurchaseDate
          ? hData.PurchaseDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        supplierId: hData.SupplierId ? hData.SupplierId.toString() : "",
        paidAmount: hData.PaidAmount ? hData.PaidAmount.toString() : "",
        remarks:    hData.Remarks || "",
        isActive:   hData.IsActive ?? true,
      });

      setDetails(
        dData.length
          ? dData.map((d) => ({
              _id:             Date.now() + Math.random(),
              productId:       d.ProductId        ? d.ProductId.toString()        : "",
              quantity:        d.Quantity         ? d.Quantity.toString()         : "",
              grossWeight:     d.GrossWeight      ? d.GrossWeight.toString()      : "",
              netWeight:       d.NetWeight        ? d.NetWeight.toString()        : "",
              metalType:       d.MetalType        || "GOLD",
              metalRate:       d.MetalRate        ? d.MetalRate.toString()        : "",
              makingCharge:    d.MakingCharge     ? d.MakingCharge.toString()     : "",
              makingChargeType:d.MakingChargeType || "FLAT",
              stoneCharge:     d.StoneCharge      ? d.StoneCharge.toString()      : "",
              amount:          d.Amount           ? d.Amount.toString()           : "",
            }))
          : [emptyRow()]
      );

      /* ✅ NAYA */
      setOldJewelleryRows(
        ojData.map((o) => ({
          _id:             Date.now() + Math.random(),
          itemDescription: o.ItemDescription || "",
          grossWeight:     o.GrossWeight      ? o.GrossWeight.toString()      : "",
          metalType:       o.MetalType        || "GOLD",
          touch:           o.Touch            ? o.Touch.toString()            : "",
          deductionWeight: o.DeductionWeight  ? o.DeductionWeight.toString()  : "",
          pureWeight:      o.PureWeight       ? o.PureWeight.toString()       : "",
          metalRate:       o.MetalRate        ? o.MetalRate.toString()        : "",
          amount:          o.Amount           ? o.Amount.toString()           : "",
        }))
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
      text:  "Ye purchase permanently delete ho jayega!",
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
     ACTIVATE / DEACTIVATE — TypeId = 5
  ============================================================ */
  const handleToggleActive = async (item) => {
    const isCurrentlyActive = item.IsActive;

    const result = await Swal.fire({
      title: isCurrentlyActive ? "Deactivate Karna Hai?" : "Activate Karna Hai?",
      text:  isCurrentlyActive
        ? `Purchase No ${item.PurchaseNo} deactivate ho jayega.`
        : `Purchase No ${item.PurchaseNo} activate ho jayega.`,
      icon:  "warning",
      showCancelButton:  true,
      confirmButtonColor: isCurrentlyActive ? "#f59e0b" : "#16a34a",
      cancelButtonColor:  "#6b7280",
      confirmButtonText:  isCurrentlyActive ? "Haan, Deactivate Karo!" : "Haan, Activate Karo!",
      cancelButtonText:   "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const createdBy = sessionStorage.getItem("username") || "Admin";
      const res = await Purchase_Manage({
        TypeId:     5,
        PurchaseId: item.PurchaseId,
        IsActive:   !isCurrentlyActive,
        CreatedBy:  createdBy,
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
        loadPurchaseList();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res0?.Message || "Failed" });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong" });
    }
  };

  /* ============================================================
     VIEW POPUP — TypeId = 4 with PurchaseId
  ============================================================ */
  const handleView = async (purchaseId) => {
    try {
      const res = await Purchase_Manage({ TypeId: 4, PurchaseId: purchaseId });

      const hData  = res?.data?.header?.[0];
      const dData  = res?.data?.details || [];
      const ojData = res?.data?.oldJewellery || [];   // ✅ NAYA

      setViewHeader(hData);
      setViewDetails(dData);
      setViewOldJewellery(ojData);
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
              {oldJewelleryRows.length > 0 && (
                <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>
                  Old Jewellery (₹ {totalOldJewelleryAmount}) Total Amount me already add hai
                </p>
              )}
            </div>
          </div>

          {/* Row 3: IsActive | Remarks */}
          <div className="form-row">
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

            <div className="form-group">
              <label>Remarks</label>
              <input
                placeholder="Remarks (optional)"
                value={header.remarks}
                onChange={(e) => setHeader({ ...header, remarks: e.target.value })}
              />
            </div>
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
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={{ ...th, minWidth: "180px" }}>Product</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Gross Wt (gm)</th>
                  <th style={th}>Net Wt (gm)</th>
                  <th style={{ ...th, minWidth: "110px" }}>Metal</th>
                  <th style={th}>Metal Rate (₹)</th>
                  <th style={th}>Making Charge</th>
                  <th style={{ ...th, minWidth: "120px" }}>Type</th>
                  <th style={th}>Stone Charge (₹)</th>
                  <th style={th}>Amount (₹)</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {details.map((row, index) => (
                  <tr key={row._id}>
                    <td style={td}>{index + 1}</td>

                    <td style={{ ...td, minWidth: "180px" }}>
                      <select
                        style={selectStyle}
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

                    {/* Metal Type — Gold(10gm) / Silver(1kg) ✅ NAYA */}
                    <td style={{ ...td, minWidth: "110px" }}>
                      <select
                        style={selectStyle}
                        value={row.metalType}
                        onChange={(e) => handleDetailChange(index, "metalType", e.target.value)}
                      >
                        <option value="GOLD">Gold (/10gm)</option>
                        <option value="SILVER">Silver (/kg)</option>
                      </select>
                    </td>

                    <td style={td}>
                      <input
                        style={inputStyle}
                        placeholder={row.metalType === "SILVER" ? "Rate /kg" : "Rate /10gm"}
                        value={row.metalRate}
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

                    <td style={{ ...td, minWidth: "120px" }}>
                      <select
                        style={selectStyle}
                        value={row.makingChargeType}
                        onChange={(e) =>
                          handleDetailChange(index, "makingChargeType", e.target.value)
                        }
                      >
                        <option value="FLAT">FLAT (₹)</option>
                        <option value="PERCENT">PERCENT (%)</option>
                      </select>
                    </td>

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

                    <td style={td}>
                      <input
                        style={{ ...inputStyle, backgroundColor: "#f5f5f5" }}
                        placeholder="Amount" value={row.amount} readOnly
                      />
                      <p style={errStyle}>{detailError[index]?.amount}</p>
                    </td>

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

              <tfoot>
                <tr>
                  <td colSpan={10} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Items Sub Total:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#2563eb" }}>₹ {totalDetailsAmount}</td>
                  <td style={td}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ===================== OLD JEWELLERY SECTION ===================== ✅ NAYA */}
        <div className="form-card" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Old Jewellery Purchase (Optional)</h3>
            <button className="btn-primary" onClick={addOldJewelRow}>+ Add Old Jewellery</button>
          </div>
          <hr />

          {oldJewelleryRows.length === 0 && (
            <p style={{ color: "#6b7280", fontSize: "13px" }}>
              Agar supplier se ya kisi se purani jewellery bhi purchase ki ja rahi hai
              to "+ Add Old Jewellery" par click karein.
            </p>
          )}

          {oldJewelleryRows.map((row, index) => (
            <div
              key={row._id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
                backgroundColor: "#fafafa",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <strong>Old Jewellery #{index + 1}</strong>
                <button className="btn-danger-grid" onClick={() => removeOldJewelRow(index)}>
                  Remove
                </button>
              </div>

              <div style={oldJewelGrid}>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Item Description (Optional)</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. Old Gold Chain"
                    value={row.itemDescription}
                    onChange={(e) => handleOldJewelChange(index, "itemDescription", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Gross Weight (gm)</label>
                  <input
                    style={inputStyle}
                    placeholder="Gross Wt"
                    value={row.grossWeight}
                    onChange={(e) => {
                      const val = e.target.value;
                      const result = commonInputValidator(val, {
                        numeric: true, allowDecimal: true, minLength: 1, maxLength: 10,
                      });
                      if (result === true) handleOldJewelChange(index, "grossWeight", val);
                    }}
                  />
                  <p style={errStyle}>{oldJewelleryError[index]?.grossWeight}</p>
                </div>

                <div className="form-group">
                  <label>Metal</label>
                  <select
                    style={selectStyle}
                    value={row.metalType}
                    onChange={(e) => handleOldJewelChange(index, "metalType", e.target.value)}
                  >
                    <option value="GOLD">Gold (/10gm)</option>
                    <option value="SILVER">Silver (/kg)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Touch % (Optional)</label>
                  <input
                    style={inputStyle}
                    placeholder="Optional"
                    value={row.touch}
                    onChange={(e) => {
                      const val = e.target.value;
                      const result = commonInputValidator(val, {
                        numeric: true, allowDecimal: true, minLength: 1, maxLength: 5,
                      });
                      if (result === true) handleOldJewelChange(index, "touch", val);
                    }}
                  />
                  <p style={errStyle}>{oldJewelleryError[index]?.touch}</p>
                </div>

                <div className="form-group">
                  <label>Deduction Wt (gm)</label>
                  <input
                    style={{ ...inputStyle, backgroundColor: "#f5f5f5" }}
                    placeholder="Auto" value={row.deductionWeight} readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Pure Weight (gm)</label>
                  <input
                    style={{ ...inputStyle, backgroundColor: "#f5f5f5" }}
                    placeholder="Auto" value={row.pureWeight} readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Metal Rate (₹{row.metalType === "SILVER" ? "/kg" : "/10gm"})</label>
                  <input
                    style={inputStyle}
                    placeholder="Rate"
                    value={row.metalRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const result = commonInputValidator(val, {
                        numeric: true, allowDecimal: true, minLength: 1, maxLength: 10,
                      });
                      if (result === true) handleOldJewelChange(index, "metalRate", val);
                    }}
                  />
                  <p style={errStyle}>{oldJewelleryError[index]?.metalRate}</p>
                </div>

                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    style={{ ...inputStyle, backgroundColor: "#f5f5f5", fontWeight: "bold" }}
                    placeholder="Auto" value={row.amount} readOnly
                  />
                </div>
              </div>
            </div>
          ))}

          {oldJewelleryRows.length > 0 && (
            <div style={{ textAlign: "right", fontWeight: "bold", color: "#16a34a", marginTop: "8px" }}>
              Total Old Jewellery Amount: ₹ {totalOldJewelleryAmount}
            </div>
          )}
        </div>

        {/* ===================== GRAND TOTAL + SAVE/CANCEL ===================== */}
        <div className="form-card" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "320px", fontSize: "14px" }}>
              {oldJewelleryRows.length > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Items Sub Total:</span><strong>₹ {totalDetailsAmount}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>+ Old Jewellery:</span><strong>₹ {totalOldJewelleryAmount}</strong>
                  </div>
                </>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: "1px solid #e2e8f0", fontWeight: "bold" }}>
                <span>Total Amount:</span><span style={{ color: "#2563eb" }}>₹ {totalAmount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>Paid Amount:</span>
                <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                  ₹ {parseFloat(header.paidAmount || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontWeight: "bold" }}>
                <span>Balance Due:</span>
                <span style={{ color: "#dc2626" }}>
                  ₹ {(parseFloat(totalAmount) - parseFloat(header.paidAmount || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: "16px" }}>
            <button className="btn-primary" onClick={handleSubmit}>{buttonName}</button>
            <button className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </div>

        {/* ===================== PURCHASE LIST ===================== */}
        <div className="table-card" style={{ marginTop: "16px" }}>
          <h3>Purchase List</h3>
          <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: "900px" }}>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Purchase No</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Status</th>
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

                  <td>
                    <span style={{
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor: item.IsActive ? "#dcfce7" : "#fee2e2",
                      color: item.IsActive ? "#16a34a" : "#dc2626",
                    }}>
                      {item.IsActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>{item.Remarks}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="btn-primary"
                      style={{ marginRight: "6px", padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => handleView(item.PurchaseId)}
                    >
                      View
                    </button>

                    <button
                      className="btn-edit-grid"
                      style={{ marginRight: "6px" }}
                      onClick={() => handleEdit(item.PurchaseId)}
                    >
                      Edit
                    </button>

                    <button
                      style={{
                        marginRight: "6px",
                        padding: "4px 10px",
                        fontSize: "12px",
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: item.IsActive ? "#f59e0b" : "#16a34a",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                      onClick={() => handleToggleActive(item)}
                    >
                      {item.IsActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      className="btn-danger-grid"
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

        {/* ===================== VIEW POPUP ===================== */}
        {viewPopup && viewHeader && (
          <div style={overlayStyle}>
            <div style={popupStyle}>

              {/* Popup Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0 }}>Purchase Details — {viewHeader.PurchaseNo}</h3>
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
                <div><strong>Purchase No:</strong> {viewHeader.PurchaseNo}</div>
                <div><strong>Date:</strong> {viewHeader.PurchaseDate ? new Date(viewHeader.PurchaseDate).toLocaleDateString("en-IN") : ""}</div>
                <div><strong>Supplier:</strong> {viewHeader.SupplierName}</div>
                <div><strong>Total Amount:</strong> ₹ {viewHeader.TotalAmount}</div>
                <div><strong>Paid Amount:</strong> ₹ {viewHeader.PaidAmount}</div>
                <div><strong>Balance Due:</strong> ₹ {viewHeader.DueAmount}</div>
                <div>
                  <strong>Status: </strong>
                  <span style={{
                    padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold",
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
                      <th style={th}>Metal</th>
                      <th style={th}>Metal Rate</th>
                      <th style={th}>Making</th>
                      <th style={th}>Type</th>
                      <th style={th}>Stone</th>
                      <th style={th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetails.map((d, i) => (
                      <tr key={d.PurchaseDetailId}>
                        <td style={td}>{i + 1}</td>
                        <td style={td}>{d.ProductName}</td>
                        <td style={td}>{d.Quantity}</td>
                        <td style={td}>{d.GrossWeight}g</td>
                        <td style={td}>{d.NetWeight}g</td>
                        <td style={td}>{d.MetalType === "SILVER" ? "Silver" : "Gold"}</td>
                        <td style={td}>₹ {d.MetalRate}</td>
                        <td style={td}>{d.MakingCharge}</td>
                        <td style={td}>{d.MakingChargeType}</td>
                        <td style={td}>₹ {d.StoneCharge}</td>
                        <td style={td}>₹ {d.Amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Old Jewellery Table (agar koi entry hai) ✅ NAYA */}
              {viewOldJewellery.length > 0 && (
                <>
                  <h4 style={{ marginTop: "20px", marginBottom: "8px" }}>Old Jewellery Purchase</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th style={th}>#</th>
                          <th style={th}>Description</th>
                          <th style={th}>Metal</th>
                          <th style={th}>Gross Wt</th>
                          <th style={th}>Touch %</th>
                          <th style={th}>Deduction Wt</th>
                          <th style={th}>Pure Wt</th>
                          <th style={th}>Metal Rate</th>
                          <th style={th}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewOldJewellery.map((o, i) => (
                          <tr key={o.OldJewelDetailId}>
                            <td style={td}>{i + 1}</td>
                            <td style={td}>{o.ItemDescription || "-"}</td>
                            <td style={td}>{o.MetalType === "SILVER" ? "Silver" : "Gold"}</td>
                            <td style={td}>{o.GrossWeight}g</td>
                            <td style={td}>{o.Touch ? `${o.Touch}%` : "-"}</td>
                            <td style={td}>{o.DeductionWeight ? `${o.DeductionWeight}g` : "-"}</td>
                            <td style={td}>{o.PureWeight ? `${o.PureWeight}g` : "-"}</td>
                            <td style={td}>₹ {o.MetalRate}</td>
                            <td style={td}>₹ {o.Amount}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={8} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                            Total Old Jewellery Amount:
                          </td>
                          <td style={{ ...td, fontWeight: "bold", color: "#16a34a" }}>
                            ₹ {viewOldJewellery.reduce((s, o) => s + (parseFloat(o.Amount) || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}

              {/* Close Button */}
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
const selectStyle = {
  width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1",
  borderRadius: "4px", fontSize: "14px", boxSizing: "border-box",
  minHeight: "34px", backgroundColor: "#fff",
};
const errStyle  = { color: "red", fontSize: "11px", margin: "2px 0 0 0" };

/* ✅ NAYA — Old Jewellery grid */
const oldJewelGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  alignItems: "start",
};

const overlayStyle = {
  position:        "fixed",
  top:             0, left: 0,
  width:           "100vw",
  height:          "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display:         "flex",
  alignItems:      "center",
  justifyContent:  "center",
  zIndex:          1000,
  padding:         "16px",
};
const popupStyle = {
  backgroundColor: "#fff",
  borderRadius:    "8px",
  padding:         "24px",
  width:           "100%",
  maxWidth:        "1000px",
  maxHeight:       "90vh",
  overflowY:       "auto",
  boxShadow:       "0 20px 60px rgba(0,0,0,0.3)",
};

export default PurchaseMaster;
