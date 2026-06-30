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
  touch:           "",   // HOLESALE only (CustomerType driven, header level)
  pureWeight:      "",   // HOLESALE only (auto-calc = netWeight * touch/100)
  metalRate:       "",
  makingCharge:    "",
  makingChargeType:"FLAT",
  stoneCharge:     "",
  gstRate:         "0",   // Default 3% Jewellery GST
  amount:          "",
});

/* Old Jewellery empty row — ab EntryType header ke CustomerType se aayega */
const emptyOldJewelRow = () => ({
  _id:             Date.now() + Math.random(),
  itemDescription: "",
  grossWeight:     "",
  touch:           "",     // HOLESALE only
  deductionWeight: "",     // HOLESALE only (auto-calc from touch)
  pureWeight:      "",     // HOLESALE only (auto-calc)
  metalRate:       "",
  amount:          "",     // auto-calc
});

/* ================================================================== */
const SalesMaster = () => {

  /* ---------------- HEADER STATES ---------------- */
  const [header, setHeader] = useState({
    billNo:      "",
    billDate:    new Date().toISOString().split("T")[0],
    customerId:  "",
    customerType:"FULKAR",   // FULKAR / HOLESALE — poori sale (new + old jewellery) ispe depend karegi
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

  /* ---------------- OLD JEWELLERY ROWS STATES ---------------- */
  const [oldJewelleryRows,  setOldJewelleryRows]  = useState([]);
  const [oldJewelleryError, setOldJewelleryError] = useState([]);

  /* ---------------- LIST STATE ---------------- */
  const [salesList, setSalesList] = useState([]);

  /* ---------------- DROPDOWN STATES ---------------- */
  const [customerList, setCustomerList] = useState([]);
  const [productList,  setProductList]  = useState([]);

  /* ---------------- VIEW POPUP STATES ---------------- */
  const [viewPopup,        setViewPopup]        = useState(false);
  const [viewHeader,       setViewHeader]       = useState(null);
  const [viewDetails,      setViewDetails]      = useState([]);
  const [viewOldJewellery, setViewOldJewellery]  = useState([]);

  /* ---------------- PRINT PREVIEW STATES ---------------- */
  const [printPopup,  setPrintPopup]  = useState(false);
  const [printData,   setPrintData]   = useState(null); // { header, details, oldJewellery }
  const [printLoading,setPrintLoading]= useState(false);

  const isHolesale = header.customerType === "HOLESALE";

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
     AMOUNT AUTO CALCULATE — SALE DETAILS
     FULKAR    : Amount = (NetWeight × MetalRate) + Making + Stone + GST
     HOLESALE  : PureWeight = NetWeight × Touch/100
                 Amount      = (PureWeight × MetalRate) + Making + Stone + GST
  ============================================================ */
  const calculateAmount = (row) => {
    const netWeight   = parseFloat(row.netWeight)    || 0;
    const pureWeight  = parseFloat(row.pureWeight)   || 0;
    const metalRate   = parseFloat(row.metalRate)    || 0;
    const making      = parseFloat(row.makingCharge) || 0;
    const stone       = parseFloat(row.stoneCharge)  || 0;
    const gstRate     = parseFloat(row.gstRate)      || 0;

    // Touch optional hai (FULKAR par bhi bhara ja sakta hai) — agar Touch bhara hai
    // to PureWeight use hoga, warna NetWeight se hi amount nikalega.
    const baseWeight = row.touch ? pureWeight : netWeight;

    const metalAmount = baseWeight * metalRate;

    const makingAmount =
      row.makingChargeType === "PERCENT"
        ? metalAmount * (making / 100)
        : making;

    const subTotal  = metalAmount + makingAmount + stone;
    const gstAmount = subTotal * (gstRate / 100);

    return (subTotal + gstAmount).toFixed(2);
  };

  /* Recalculate a single sale-detail row (pureWeight + amount). Touch is optional
     for both FULKAR and HOLESALE — jab bhi Touch bhara ho, PureWeight nikal ke
     usi se Amount calculate hoga. */
  const recalcDetailRow = (row) => {
    const netWeight = parseFloat(row.netWeight) || 0;
    const touch     = parseFloat(row.touch)      || 0;
    const updated = {
      ...row,
      pureWeight: row.touch && netWeight ? (netWeight * (touch / 100)).toFixed(3) : "",
    };
    updated.amount = calculateAmount(updated);
    return updated;
  };

  /* ============================================================
     OLD JEWELLERY CALCULATIONS
     FULKAR    : Amount = GrossWeight × MetalRate
     HOLESALE  : DeductionWeight = GrossWeight × (100 - Touch) / 100
                 PureWeight      = GrossWeight - DeductionWeight
                 Amount          = PureWeight × MetalRate
  ============================================================ */
  const calculateOldJewelRow = (row) => {
    const grossWeight = parseFloat(row.grossWeight) || 0;
    const metalRate   = parseFloat(row.metalRate)   || 0;

    // Touch optional hai (FULKAR par bhi bhara ja sakta hai) — bhara ho to
    // Deduction/PureWeight se Amount, warna seedha GrossWeight × MetalRate
    if (row.touch) {
      const touch = parseFloat(row.touch) || 0;
      const deductionWeight = grossWeight * (100 - touch) / 100;
      const pureWeight      = grossWeight - deductionWeight;
      const amount          = pureWeight * metalRate;

      return {
        ...row,
        deductionWeight: grossWeight && touch ? deductionWeight.toFixed(3) : "",
        pureWeight:       grossWeight && touch ? pureWeight.toFixed(3)      : "",
        amount:           grossWeight && touch ? amount.toFixed(2)          : "",
      };
    }

    const amount = grossWeight * metalRate;
    return {
      ...row,
      deductionWeight: "",
      pureWeight:      "",
      amount: grossWeight && metalRate ? amount.toFixed(2) : "",
    };
  };

  /* ============================================================
     HEADER — CUSTOMER TYPE CHANGE
     Poori sale (naya jewellery + old jewellery) CustomerType par depend karti hai,
     isliye type badalte hi sabhi rows recalc ho jate hain.
  ============================================================ */
  const handleCustomerTypeChange = (value) => {
    setHeader((prev) => ({ ...prev, customerType: value }));
    // Touch ab dono CustomerType par optional/available hai, isliye details rows
    // ko reset karne ki zaroorat nahi — sirf old jewellery rows ka calc refresh hoga
    setOldJewelleryRows((prev) =>
      prev.map((row) => calculateOldJewelRow(row))
    );
  };

  /* ============================================================
     DETAIL ROW HANDLERS — SALE DETAILS
  ============================================================ */
  const handleDetailChange = (index, field, value) => {
    const updated = [...details];
    updated[index][field] = value;

    const amountFields = ["netWeight", "touch", "metalRate", "makingCharge", "makingChargeType", "stoneCharge", "gstRate"];

    if (amountFields.includes(field)) {
      updated[index] = recalcDetailRow(updated[index]);
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
     OLD JEWELLERY ROW HANDLERS
  ============================================================ */
  const handleOldJewelChange = (index, field, value) => {
    const updated = [...oldJewelleryRows];
    updated[index][field] = value;

    const recalcFields = ["grossWeight", "touch", "metalRate"];
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
  const totalAmount = details
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    .toFixed(2);

  const totalGST = details.reduce((sum, r) => {
    const netWeight   = parseFloat(r.netWeight)    || 0;
    const pureWeight  = parseFloat(r.pureWeight)   || 0;
    const metalRate   = parseFloat(r.metalRate)    || 0;
    const making      = parseFloat(r.makingCharge) || 0;
    const stone       = parseFloat(r.stoneCharge)  || 0;
    const gstRate     = parseFloat(r.gstRate)      || 0;
    const baseWeight  = r.touch ? pureWeight : netWeight;
    const metalAmount = baseWeight * metalRate;
    const makingAmount = r.makingChargeType === "PERCENT"
      ? metalAmount * (making / 100) : making;
    const subTotal = metalAmount + makingAmount + stone;
    return sum + subTotal * (gstRate / 100);
  }, 0).toFixed(2);

  const totalOldJewelleryAmount = oldJewelleryRows
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    .toFixed(2);

  /* Net Paid Amount = jo user ne manually bhara + old jewellery ka adjustment */
  const netPaidAmount = (
    parseFloat(header.paidAmount || 0) + parseFloat(totalOldJewelleryAmount)
  ).toFixed(2);

  /* ============================================================
     VALIDATION
  ============================================================ */
  const handleValidation = () => {
    let valid = true;
    const hErr = {};

    if (!header.billNo)      { hErr.billNo      = "Bill No is required";    valid = false; }
    if (!header.billDate)    { hErr.billDate     = "Bill Date is required";  valid = false; }
    if (!header.customerId)  { hErr.customerId   = "Customer is required";   valid = false; }
    if (!header.customerType){ hErr.customerType = "Customer Type is required"; valid = false; }
    if (!header.paymentMode) { hErr.paymentMode  = "Payment Mode is required"; valid = false; }

    setHeaderError(hErr);

    const dErr = details.map((row) => {
      const rowErr = {};
      if (!row.productId)    { rowErr.productId   = "Required"; valid = false; }
      if (!row.quantity)     { rowErr.quantity     = "Required"; valid = false; }
      if (!row.grossWeight)  { rowErr.grossWeight  = "Required"; valid = false; }
      if (!row.netWeight)    { rowErr.netWeight    = "Required"; valid = false; }
      if (isHolesale && !row.touch) { rowErr.touch = "Required"; valid = false; }
      // FULKAR par Touch optional hai — bharne ki zaroorat nahi
      if (!row.metalRate)    { rowErr.metalRate    = "Required"; valid = false; }
      if (!row.makingCharge) { rowErr.makingCharge = "Required"; valid = false; }
      if (!row.amount)       { rowErr.amount       = "Required"; valid = false; }
      return rowErr;
    });
    setDetailError(dErr);

    // Old Jewellery validation
    const ojErr = oldJewelleryRows.map((row) => {
      const rowErr = {};
      if (!row.grossWeight) { rowErr.grossWeight = "Required"; valid = false; }
      if (!row.metalRate) { rowErr.metalRate = "Required"; valid = false; }
      if (isHolesale && !row.touch) {
        rowErr.touch = "Required"; valid = false;
      }
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
      Touch:            r.touch ? parseFloat(r.touch) : null,
      PureWeight:       r.touch ? parseFloat(r.pureWeight) : null,
      MetalRate:        parseFloat(r.metalRate),
      MakingCharge:     parseFloat(r.makingCharge),
      MakingChargeType: r.makingChargeType,
      StoneCharge:      parseFloat(r.stoneCharge || 0),
      GSTRate:          parseFloat(r.gstRate || 0),
      Amount:           parseFloat(r.amount),
    }));

    const oldJewelleryArray = oldJewelleryRows
      .filter((r) => r.grossWeight && r.metalRate) // sirf complete rows bhejni hain
      .map((r) => ({
        EntryType:       header.customerType,
        ItemDescription: r.itemDescription || null,
        GrossWeight:     parseFloat(r.grossWeight),
        Touch:           r.touch ? parseFloat(r.touch) : null,
        DeductionWeight: r.touch ? parseFloat(r.deductionWeight) : null,
        PureWeight:      r.touch ? parseFloat(r.pureWeight) : null,
        MetalRate:       parseFloat(r.metalRate),
        Amount:          parseFloat(r.amount),
      }));

    const payload = {
      TypeId:           editId ? 2 : 1,
      SaleId:            editId || 0,
      BillNo:            header.billNo,
      BillDate:          header.billDate,
      CustomerId:        Number(header.customerId),
      CustomerType:      header.customerType,
      TotalAmount:       parseFloat(totalAmount),
      GSTAmount:         parseFloat(totalGST),
      PaidAmount:        parseFloat(header.paidAmount || 0), // SP automatically isme old jewellery total add karega
      PaymentMode:       header.paymentMode,
      IsActive:          header.isActive,
      Remarks:           header.remarks,
      CreatedBy:         createdBy,
      DetailsJson:       detailsArray,
      OldJewelleryJson:  oldJewelleryArray.length ? oldJewelleryArray : null,
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
      customerType:"FULKAR",
      gstAmount:   "0",
      paidAmount:  "",
      paymentMode: "CASH",
      remarks:     "",
      isActive:    true,
    });
    setDetails([emptyRow()]);
    setOldJewelleryRows([]);
    setEditId(null);
    setButtonName("Save");
    setHeaderError({});
    setDetailError([]);
    setOldJewelleryError([]);
  };

  /* ============================================================
     EDIT
  ============================================================ */
  const handleEdit = async (saleId) => {
    try {
      const res = await Sales_Manage({ TypeId: 4, SaleId: saleId });

      const hData  = res?.data?.header?.[0];
      const dData  = res?.data?.details || [];
      const ojData = res?.data?.oldJewellery || [];

      if (!hData) return;

      const custType = hData.CustomerType || "FULKAR";

      setHeader({
        billNo:      hData.BillNo || "",
        billDate:    hData.BillDate
          ? hData.BillDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        customerId:  hData.CustomerId ? hData.CustomerId.toString() : "",
        customerType:custType,
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
              touch:           d.Touch            ? d.Touch.toString()            : "",
              pureWeight:      d.PureWeight       ? d.PureWeight.toString()       : "",
              metalRate:       d.MetalRate        ? d.MetalRate.toString()        : "",
              makingCharge:    d.MakingCharge     ? d.MakingCharge.toString()     : "",
              makingChargeType:d.MakingChargeType || "FLAT",
              stoneCharge:     d.StoneCharge      ? d.StoneCharge.toString()      : "",
              gstRate:         d.GSTRate          ? d.GSTRate.toString()          : "0",
              amount:          d.Amount           ? d.Amount.toString()           : "",
            }))
          : [emptyRow()]
      );

      setOldJewelleryRows(
        ojData.map((o) => ({
          _id:             Date.now() + Math.random(),
          itemDescription: o.ItemDescription || "",
          grossWeight:     o.GrossWeight      ? o.GrossWeight.toString()      : "",
          touch:           o.Touch            ? o.Touch.toString()            : "",
          deductionWeight: o.DeductionWeight  ? o.DeductionWeight.toString()  : "",
          pureWeight:      o.PureWeight       ? o.PureWeight.toString()       : "",
          metalRate:       o.MetalRate        ? o.MetalRate.toString()        : "",
          amount:          o.Amount           ? o.Amount.toString()           : "",
        }))
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
      setViewOldJewellery(res?.data?.oldJewellery || []);
      setViewPopup(true);
    } catch (err) {
      console.error("View load error", err);
      Swal.fire({ icon: "error", title: "Error", text: "Could not load details" });
    }
  };

  /* ============================================================
     PRINT — load bill data + open preview popup
  ============================================================ */
  const handlePrint = async (saleId) => {
    try {
      setPrintLoading(true);
      const res = await Sales_Manage({ TypeId: 6, SaleId: saleId });
      setPrintData({
        header:      res?.data?.header?.[0] || null,
        details:     res?.data?.details || [],
        oldJewellery:res?.data?.oldJewellery || [],
      });
      setPrintPopup(true);
    } catch (err) {
      console.error("Print load error", err);
      Swal.fire({ icon: "error", title: "Error", text: "Could not load bill for print" });
    } finally {
      setPrintLoading(false);
    }
  };

  /* Browser print (also lets user "Save as PDF" from the print dialog) */
  const handlePrintNow = () => {
    window.print();
  };

  /* Direct PDF download using html2canvas + jsPDF (loaded from CDN on demand) */
  const loadScriptOnce = (src, globalCheck) =>
    new Promise((resolve, reject) => {
      if (globalCheck()) return resolve();
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.body.appendChild(script);
    });

  const handleDownloadPdf = async () => {
    try {
      setPrintLoading(true);
      await loadScriptOnce(
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
        () => !!window.html2canvas
      );
      await loadScriptOnce(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        () => !!window.jspdf
      );

      const node = document.getElementById("print-bill-area");
      if (!node) return;

      const canvas = await window.html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth  = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position   = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Bill-${printData?.header?.BillNo || "Sale"}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF download error", err);
      Swal.fire({ icon: "error", title: "Error", text: "PDF download failed" });
    } finally {
      setPrintLoading(false);
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

          {/* Row 2: Customer | Customer Type | Payment Mode */}
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
              <label>Customer Type</label>
              <select
                value={header.customerType}
                onChange={(e) => {
                  handleCustomerTypeChange(e.target.value);
                  setHeaderError((p) => ({ ...p, customerType: "" }));
                }}
              >
                <option value="FULKAR">Retail (फुटकर)</option>
                <option value="HOLESALE">Wholesale (थोक)</option>
              </select>
              <p style={{ color: "red" }}>{headerError.customerType}</p>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0 0" }}>
                Ye poori sale (naya + old jewellery) par apply hoga
              </p>
            </div>

            
          </div>

          {/* Row 3: Paid Amount | IsActive */}
          <div className="form-row">
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
                <p style={{ fontSize: "11px", color: "#16a34a", margin: "2px 0 0 0" }}>
                  + ₹ {totalOldJewelleryAmount} Old Jewellery (auto-added) = ₹ {netPaidAmount} Net Paid
                </p>
              )}
            </div>

            
          </div>

          {/* Row 4: Remarks */}
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
                <option value="false">Inactive (Draft)</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
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
            <h3 style={{ margin: 0 }}>Sale Details</h3>
            <button className="btn-primary" onClick={addRow}>+ Add Row</button>
          </div>
          <hr />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1180px" }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={{ ...th, minWidth: "190px" }}>Product</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Gross Wt (gm)</th>
                  <th style={th}>Net Wt (gm)</th>
                  <th style={th}>Touch % (Optional)</th>
                  <th style={th}>Pure Wt (gm)</th>
                  <th style={th}>Metal Rate (₹)</th>
                  <th style={th}>Making Charge</th>
                  <th style={{ ...th, minWidth: "120px" }}>Type</th>
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
                    <td style={{ ...td, minWidth: "190px" }}>
                      <select
                        style={selectStyle}
                        value={row.productId}
                        onChange={(e) =>
                          handleDetailChange(index, "productId", e.target.value)
                        }
                      >
                        <option value="">-- Select Product --</option>
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

                    {/* Touch — optional, FULKAR par bhi bhara ja sakta hai */}
                    <td style={td}>
                      <input
                        style={inputStyle} placeholder="Optional" value={row.touch}
                        onChange={(e) => {
                          const val = e.target.value;
                          const result = commonInputValidator(val, {
                            numeric: true, allowDecimal: true, minLength: 1, maxLength: 5,
                          });
                          if (result === true) handleDetailChange(index, "touch", val);
                        }}
                      />
                      <p style={errStyle}>{detailError[index]?.touch}</p>
                    </td>

                    {/* Pure Weight — auto-calc, sirf jab Touch bhara ho */}
                    <td style={td}>
                      <input
                        style={{ ...inputStyle, backgroundColor: "#f5f5f5" }}
                        placeholder="Auto" value={row.pureWeight} readOnly
                      />
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
  style={inputStyle} placeholder="0" value={row.gstRate}
  onChange={(e) => {
    const val = e.target.value;
    const result = commonInputValidator(val, {
      numeric: true, allowDecimal: true, minLength: 0, maxLength: 5,
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
                  <td colSpan={12} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    GST Amount:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#7c3aed" }}>
                    ₹ {totalGST}
                  </td>
                  <td style={td}></td>
                </tr>
                <tr>
                  <td colSpan={12} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Total Amount:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#2563eb" }}>
                    ₹ {totalAmount}
                  </td>
                  <td style={td}></td>
                </tr>
                <tr>
                  <td colSpan={12} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Paid Amount (Cash/Card/etc):
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#16a34a" }}>
                    ₹ {parseFloat(header.paidAmount || 0).toFixed(2)}
                  </td>
                  <td style={td}></td>
                </tr>
                {oldJewelleryRows.length > 0 && (
                  <tr>
                    <td colSpan={12} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                      + Old Jewellery Amount:
                    </td>
                    <td style={{ ...td, fontWeight: "bold", color: "#16a34a" }}>
                      ₹ {totalOldJewelleryAmount}
                    </td>
                    <td style={td}></td>
                  </tr>
                )}
                <tr>
                  <td colSpan={12} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Total Paid (Net):
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#16a34a" }}>
                    ₹ {netPaidAmount}
                  </td>
                  <td style={td}></td>
                </tr>
                <tr>
                  <td colSpan={12} style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                    Balance Due:
                  </td>
                  <td style={{ ...td, fontWeight: "bold", color: "#dc2626" }}>
                    ₹ {(parseFloat(totalAmount) - parseFloat(netPaidAmount)).toFixed(2)}
                  </td>
                  <td style={td}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ===================== OLD JEWELLERY SECTION ===================== */}
        <div className="form-card" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>
              Old Jewellery Exchange (Optional) — <span style={{ fontWeight: "normal", fontSize: "13px", color: "#6b7280" }}>{header.customerType === "HOLESALE" ? "Wholesale (थोक)" : "Retail (फुटकर)"}</span>
            </h3>
            <button className="btn-primary" onClick={addOldJewelRow}>+ Add Old Jewellery</button>
          </div>
          <hr />

          {oldJewelleryRows.length === 0 && (
            <p style={{ color: "#6b7280", fontSize: "13px" }}>
              Agar customer purani jewellery exchange kar raha hai to "+ Add Old Jewellery" par click karein.
              Type header ke "Customer Type" se aayega.
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
                  <label>Metal Rate (₹)</label>
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

        {/* ===================== SAVE / CANCEL ===================== */}
        <div className="form-card" style={{ marginTop: "16px" }}>
          <div className="btn-group">
            <button className="btn-primary" onClick={handleSubmit}>{buttonName}</button>
            <button className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </div>

        {/* ===================== SALES LIST ===================== */}
        <div className="table-card" style={{ marginTop: "16px" }}>
          <h3>Sales List</h3>
          <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: "1100px" }}>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Bill No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Type</th>
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
                  <td>{item.CustomerType === "HOLESALE" ? "Wholesale" : "Retail"}</td>
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

                  <td style={{ whiteSpace: "nowrap" }}>
                    {/* View */}
                    <button
                      className="btn-primary"
                      style={{ marginRight: "6px", padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => handleView(item.SaleId)}
                    >
                      View
                    </button>

                    {/* Print */}
                    <button
                      style={{
                        marginRight: "6px", padding: "4px 10px",
                        fontSize: "12px", borderRadius: "4px",
                        border: "none", cursor: "pointer",
                        backgroundColor: "#0ea5e9", color: "#fff", fontWeight: "bold",
                      }}
                      onClick={() => handlePrint(item.SaleId)}
                    >
                      Print
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
                <div><strong>Customer Type:</strong> {viewHeader.CustomerType === "HOLESALE" ? "Wholesale (थोक)" : "Retail (फुटकर)"}</div>
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
                      <th style={th}>Touch %</th>
                      <th style={th}>Pure Wt</th>
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
                        <td style={td}>{d.Touch ? `${d.Touch}%` : "-"}</td>
                        <td style={td}>{d.PureWeight ? `${d.PureWeight}g` : "-"}</td>
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

              {/* Old Jewellery Table (agar koi entry hai) */}
              {viewOldJewellery.length > 0 && (
                <>
                  <h4 style={{ marginTop: "20px", marginBottom: "8px" }}>Old Jewellery Exchange</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th style={th}>#</th>
                          <th style={th}>Type</th>
                          <th style={th}>Description</th>
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
                            <td style={td}>{o.EntryType === "HOLESALE" ? "Wholesale" : "Retail"}</td>
                            <td style={td}>{o.ItemDescription || "-"}</td>
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

              <div style={{ textAlign: "right", marginTop: "16px" }}>
                <button className="btn-secondary" onClick={() => setViewPopup(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PRINT PREVIEW POPUP ===================== */}
        {printPopup && printData?.header && (
          <div style={overlayStyle} className="print-overlay">
            <div style={popupStyle} className="print-popup">

              {/* Toolbar — hidden while printing */}
              <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0 }}>Print Preview — {printData.header.BillNo}</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-primary" disabled={printLoading} onClick={handlePrintNow}>
                    🖨️ Print
                  </button>
                  <button className="btn-primary" disabled={printLoading} onClick={handleDownloadPdf}>
                    {printLoading ? "Preparing..." : "⬇️ Download PDF"}
                  </button>
                  <button className="btn-secondary" onClick={() => setPrintPopup(false)}>
                    Close
                  </button>
                </div>
              </div>
              <hr className="no-print" />

              {/* Printable Bill Area */}
              <div id="print-bill-area" style={{ padding: "12px", background: "#fff" }}>
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <h2 style={{ margin: "0 0 4px 0" }}>Sales Invoice</h2>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    {printData.header.CustomerType === "HOLESALE" ? "Wholesale (थोक)" : "Retail (फुटकर)"} Bill
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "14px", marginBottom: "16px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px" }}>
                  <div><strong>Bill No:</strong> {printData.header.BillNo}</div>
                  <div><strong>Date:</strong> {printData.header.BillDate ? new Date(printData.header.BillDate).toLocaleDateString("en-IN") : ""}</div>
                  <div><strong>Customer:</strong> {printData.header.CustomerName}</div>
                  <div><strong>Mobile:</strong> {printData.header.MobileNo}</div>
                  <div><strong>Payment Mode:</strong> {printData.header.PaymentMode}</div>
                  {printData.header.Remarks && (<div><strong>Remarks:</strong> {printData.header.Remarks}</div>)}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "16px" }}>
                  <thead>
                    <tr>
                      <th style={printTh}>#</th>
                      <th style={printTh}>Product</th>
                      <th style={printTh}>Qty</th>
                      <th style={printTh}>Gross Wt</th>
                      <th style={printTh}>Net Wt</th>
                      <th style={printTh}>Touch %</th>
                      <th style={printTh}>Pure Wt</th>
                      <th style={printTh}>Metal Rate</th>
                      <th style={printTh}>Making</th>
                      <th style={printTh}>Stone</th>
                      <th style={printTh}>GST %</th>
                      <th style={printTh}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printData.details.map((d, i) => (
                      <tr key={d.SaleDetailId || i}>
                        <td style={printTd}>{i + 1}</td>
                        <td style={printTd}>{d.ProductName}</td>
                        <td style={printTd}>{d.Quantity}</td>
                        <td style={printTd}>{d.GrossWeight}g</td>
                        <td style={printTd}>{d.NetWeight}g</td>
                        <td style={printTd}>{d.Touch ? `${d.Touch}%` : "-"}</td>
                        <td style={printTd}>{d.PureWeight ? `${d.PureWeight}g` : "-"}</td>
                        <td style={printTd}>₹ {d.MetalRate}</td>
                        <td style={printTd}>{d.MakingCharge}</td>
                        <td style={printTd}>₹ {d.StoneCharge}</td>
                        <td style={printTd}>{d.GSTRate}%</td>
                        <td style={printTd}>₹ {d.Amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {printData.oldJewellery.length > 0 && (
                  <>
                    <h4 style={{ marginBottom: "8px" }}>Old Jewellery Exchange</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "16px" }}>
                      <thead>
                        <tr>
                          <th style={printTh}>#</th>
                          <th style={printTh}>Description</th>
                          <th style={printTh}>Gross Wt</th>
                          <th style={printTh}>Touch %</th>
                          <th style={printTh}>Pure Wt</th>
                          <th style={printTh}>Metal Rate</th>
                          <th style={printTh}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printData.oldJewellery.map((o, i) => (
                          <tr key={o.OldJewelDetailId || i}>
                            <td style={printTd}>{i + 1}</td>
                            <td style={printTd}>{o.ItemDescription || "-"}</td>
                            <td style={printTd}>{o.GrossWeight}g</td>
                            <td style={printTd}>{o.Touch ? `${o.Touch}%` : "-"}</td>
                            <td style={printTd}>{o.PureWeight ? `${o.PureWeight}g` : "-"}</td>
                            <td style={printTd}>₹ {o.MetalRate}</td>
                            <td style={printTd}>₹ {o.Amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                <div style={{ marginLeft: "auto", width: "260px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>GST Amount:</span><strong>₹ {printData.header.GSTAmount}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Total Amount:</span><strong>₹ {printData.header.TotalAmount}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Paid Amount:</span><strong>₹ {printData.header.PaidAmount}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: "1px solid #e2e8f0" }}>
                    <span>Balance Due:</span><strong>₹ {printData.header.BalanceDue}</strong>
                  </div>
                </div>

                <div style={{ textAlign: "center", marginTop: "24px", fontSize: "11px", color: "#6b7280" }}>
                  Thank you for your business!
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Print-only CSS: jab print ho to sirf bill area dikhe, baki page hide ho */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-bill-area, #print-bill-area * { visibility: visible; }
          #print-bill-area { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
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
  width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1",
  borderRadius: "4px", fontSize: "14px", boxSizing: "border-box",
};
const selectStyle = {
  width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1",
  borderRadius: "4px", fontSize: "14px", boxSizing: "border-box",
  minHeight: "38px", minWidth: "170px", backgroundColor: "#fff",
};
const errStyle = { color: "red", fontSize: "11px", margin: "2px 0 0 0" };

const oldJewelGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  alignItems: "start",
};

const overlayStyle = {
  position: "fixed", top: 0, left: 0,
  width: "100vw", height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000,
  padding: "16px",
};
const popupStyle = {
  backgroundColor: "#fff", borderRadius: "8px",
  padding: "24px", width: "100%", maxWidth: "1000px",
  maxHeight: "90vh", overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
};

const printTh = {
  padding: "6px 8px", background: "#f1f5f9",
  border: "1px solid #cbd5e1", textAlign: "left",
};
const printTd = {
  padding: "5px 8px", border: "1px solid #e2e8f0",
};

export default SalesMaster;
