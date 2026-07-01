import React, { useState, useEffect, useRef } from "react";
import { SupplierMaster_Manage, ProductMaster_Manage } from "@/lib/services/MasterService";
import { GetPurchase_Report } from "@/lib/services/ReportsService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ================================================================== */
const PurchaseReport = () => {

  /* ---------------- FILTER STATES ---------------- */
  const [filters, setFilters] = useState({
    fromDate:      "",
    toDate:        "",
    supplierId:    "",
    productId:     "",
    metalType:     "",
    purchaseNo:    "",
    paymentStatus: "",
    isActive:      "",
  });

  /* ---------------- DROPDOWN STATES ---------------- */
  const [supplierList, setSupplierList] = useState([]);
  const [productList,  setProductList]  = useState([]);

  /* ---------------- RESULT STATES (5 result sets from SP) ---------------- */
  const [detailRows,       setDetailRows]       = useState([]);
  const [oldJewelleryRows, setOldJewelleryRows] = useState([]);
  const [summary,          setSummary]          = useState(null);
  const [supplierSummary,  setSupplierSummary]  = useState([]);
  const [metalSummary,     setMetalSummary]     = useState([]);

  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);

  /* ---------------- ACTIVE TAB ---------------- */
  const [activeTab, setActiveTab] = useState("details"); // details | oldJewellery | supplier | metal

  /* ---------------- VIEW POPUP ---------------- */
  const [viewPopup,     setViewPopup]     = useState(false);
  const [viewPurchaseId,setViewPurchaseId]= useState(null);

  /* ---------------- PRINT POPUP ---------------- */
  const [printPopup,  setPrintPopup]  = useState(false);
  const [printTarget, setPrintTarget] = useState(null);  // "all" | purchaseId

  const printRef = useRef();

  /* ============================================================
     LOAD DROPDOWNS
  ============================================================ */
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const res = await SupplierMaster_Manage({
          supplierId: 0, supplierName: "", phone: "",
          gstin: "", address: "", isActive: true, typeId: 5,
        });
        setSupplierList(res?.data || []);
      } catch (err) { console.error("Supplier load error", err); }
    };

    const loadProducts = async () => {
      try {
        const res = await ProductMaster_Manage({ TypeId: 1 });
        setProductList(res?.data || []);
      } catch (err) { console.error("Product load error", err); }
    };

    loadSuppliers();
    loadProducts();
  }, []);

  /* ============================================================
     FETCH REPORT
  ============================================================ */
  const handleSearch = async () => {
    setLoading(true);
    setSearched(false);
    try {
      const payload = {
        FromDate:      filters.fromDate      || null,
        ToDate:        filters.toDate        || null,
        SupplierId:    filters.supplierId    ? Number(filters.supplierId)  : null,
        ProductId:     filters.productId     ? Number(filters.productId)   : null,
        MetalType:     filters.metalType     || null,
        PurchaseNo:    filters.purchaseNo    || null,
        PaymentStatus: filters.paymentStatus || null,
        IsActive:      filters.isActive === "" ? null : filters.isActive === "true",
      };

      const res = await GetPurchase_Report(payload);

      /* SP returns 5 result sets — map as per your API service response shape */
      setDetailRows(      res?.data?.details          || res?.data?.[0] || []);
      setOldJewelleryRows(res?.data?.oldJewellery     || res?.data?.[1] || []);
      setSummary(        (res?.data?.summary          || res?.data?.[2] || [null])[0] || null);
      setSupplierSummary( res?.data?.supplierSummary  || res?.data?.[3] || []);
      setMetalSummary(    res?.data?.metalTypeSummary     || res?.data?.[4] || []);

      setSearched(true);
      setActiveTab("details");
    } catch (err) {
      console.error("Report fetch error", err);
      Swal.fire({ icon: "error", title: "Error", text: "Report load failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      fromDate: "", toDate: "", supplierId: "", productId: "",
      metalType: "", purchaseNo: "", paymentStatus: "", isActive: "",
    });
    setDetailRows([]);
    setOldJewelleryRows([]);
    setSummary(null);
    setSupplierSummary([]);
    setMetalSummary([]);
    setSearched(false);
  };

  /* ============================================================
     VIEW POPUP — filter rows for a specific PurchaseId
  ============================================================ */
  const handleView = (purchaseId) => {
    setViewPurchaseId(purchaseId);
    setViewPopup(true);
  };

  /* get unique purchases for view popup */
  const viewDetailRows   = detailRows.filter(r => r.PurchaseId === viewPurchaseId);
  const viewOJRows       = oldJewelleryRows.filter(r => r.PurchaseId === viewPurchaseId);
  const viewHeader       = viewDetailRows[0] || null;

  /* ============================================================
     PRINT HELPERS
  ============================================================ */
  const handlePrintAll = () => {
    setPrintTarget("all");
    setPrintPopup(true);
  };

  const handlePrintSingle = (purchaseId) => {
    setPrintTarget(purchaseId);
    setPrintPopup(true);
  };

  const handlePrintNow = () => window.print();

  /* rows to print */
  const printDetailRows = printTarget === "all"
    ? detailRows
    : detailRows.filter(r => r.PurchaseId === printTarget);

  const printOJRows = printTarget === "all"
    ? oldJewelleryRows
    : oldJewelleryRows.filter(r => r.PurchaseId === printTarget);

  /* ============================================================
     UNIQUE PURCHASE IDs for list grid (one row per purchase)
  ============================================================ */
  const uniquePurchases = React.useMemo(() => {
    const seen = new Set();
    return detailRows.filter(r => {
      if (seen.has(r.PurchaseId)) return false;
      seen.add(r.PurchaseId);
      return true;
    });
  }, [detailRows]);

  /* ============================================================
     PAYMENT STATUS BADGE
  ============================================================ */
  const paymentBadge = (status) => {
    const map = {
      PAID:    { bg: "#dcfce7", color: "#16a34a" },
      PARTIAL: { bg: "#fef9c3", color: "#ca8a04" },
      UNPAID:  { bg: "#fee2e2", color: "#dc2626" },
    };
    const s = map[status] || { bg: "#f1f5f9", color: "#475569" };
    return (
      <span style={{
        padding: "2px 10px", borderRadius: "12px",
        fontSize: "12px", fontWeight: "bold",
        backgroundColor: s.bg, color: s.color,
      }}>
        {status || "-"}
      </span>
    );
  };

  const activeBadge = (isActive) => (
    <span style={{
      padding: "2px 10px", borderRadius: "12px",
      fontSize: "12px", fontWeight: "bold",
      backgroundColor: isActive ? "#dcfce7" : "#fee2e2",
      color: isActive ? "#16a34a" : "#dc2626",
    }}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  /* ============================================================
     UI
  ============================================================ */
  return (
    <ProtectedRoute>
      <div className="content-wrapper">

        {/* ===================== FILTER CARD ===================== */}
        <div className="form-card">
          <h2>Purchase Report</h2>
          <hr />

          <div className="form-row">
            <div className="form-group">
              <label>From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={e => setFilters(p => ({ ...p, fromDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={e => setFilters(p => ({ ...p, toDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Supplier</label>
              <select
                value={filters.supplierId}
                onChange={e => setFilters(p => ({ ...p, supplierId: e.target.value }))}
              >
                <option value="">-- All Suppliers --</option>
                {supplierList.map(s => (
                  <option key={s.SupplierId} value={s.SupplierId}>{s.SupplierName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Product</label>
              <select
                value={filters.productId}
                onChange={e => setFilters(p => ({ ...p, productId: e.target.value }))}
              >
                <option value="">-- All Products --</option>
                {productList.map(p => (
                  <option key={p.ProductId} value={p.ProductId}>{p.ProductName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Metal Type</label>
              <select
                value={filters.metalType}
                onChange={e => setFilters(p => ({ ...p, metalType: e.target.value }))}
              >
                <option value="">-- All Metals --</option>
                <option value="GOLD">Gold (/10gm)</option>
                <option value="SILVER">Silver (/kg)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={e => setFilters(p => ({ ...p, paymentStatus: e.target.value }))}
              >
                <option value="">-- All --</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Purchase No</label>
              <input
                placeholder="Search Purchase No..."
                value={filters.purchaseNo}
                onChange={e => setFilters(p => ({ ...p, purchaseNo: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={filters.isActive}
                onChange={e => setFilters(p => ({ ...p, isActive: e.target.value }))}
              >
                <option value="">-- All --</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: "8px" }}>
            <button className="btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? "Loading..." : "🔍 Search"}
            </button>
            <button className="btn-secondary" onClick={handleReset}>Reset</button>
            {searched && detailRows.length > 0 && (
              <button
                style={{
                  padding: "8px 16px", fontSize: "13px", borderRadius: "4px",
                  border: "none", cursor: "pointer",
                  backgroundColor: "#0ea5e9", color: "#fff", fontWeight: "bold",
                }}
                onClick={handlePrintAll}
              >
                🖨️ Print All
              </button>
            )}
          </div>
        </div>

        {/* ===================== SUMMARY CARDS ===================== */}
        {searched && summary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "16px" }}>
            {[
              { label: "Total Purchases",          value: summary.TotalPurchases,         color: "#2563eb" },
              { label: "Total Items",               value: summary.TotalLineItems,         color: "#7c3aed" },
              { label: "Total Qty",                 value: summary.TotalQuantity,          color: "#0891b2" },
              { label: "Total Gross Wt (gm)",       value: `${summary.TotalGrossWeight}g`, color: "#ca8a04" },
              { label: "Items Sub Total",           value: `₹ ${summary.TotalDetailsAmount}`, color: "#2563eb" },
              { label: "Old Jewellery Total",       value: `₹ ${summary.TotalOldJewelleryAmount}`, color: "#16a34a" },
              { label: "Grand Total Amount",        value: `₹ ${summary.TotalAmount}`,    color: "#2563eb" },
              { label: "Total Paid",                value: `₹ ${summary.TotalPaidAmount}`, color: "#16a34a" },
              { label: "Total Due",                 value: `₹ ${summary.TotalDueAmount}`, color: "#dc2626" },
            ].map((card, i) => (
              <div key={i} style={{
                background: "#fff", border: "1px solid #e2e8f0",
                borderRadius: "8px", padding: "14px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>{card.label}</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ===================== TABS ===================== */}
        {searched && (
          <div style={{ marginTop: "16px" }}>
            {/* Tab Buttons */}
            <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid #e2e8f0", marginBottom: "0" }}>
              {[
                { key: "details",      label: `Purchase List (${uniquePurchases.length})` },
                { key: "allDetails",   label: `All Items (${detailRows.length})` },
                { key: "oldJewellery", label: `Old Jewellery (${oldJewelleryRows.length})` },
                { key: "supplier",     label: `Supplier-wise (${supplierSummary.length})` },
                { key: "metal",        label: `Metal-wise (${metalSummary.length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "8px 16px", fontSize: "13px", fontWeight: "600",
                    border: "none", cursor: "pointer", borderRadius: "4px 4px 0 0",
                    backgroundColor: activeTab === tab.key ? "#2563eb" : "#f1f5f9",
                    color: activeTab === tab.key ? "#fff" : "#374151",
                    borderBottom: activeTab === tab.key ? "2px solid #2563eb" : "none",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ---- TAB 1: PURCHASE LIST (one row per purchase) ---- */}
            {activeTab === "details" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
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
                        <th>Due Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniquePurchases.length === 0 ? (
                        <tr><td colSpan={11} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No records found</td></tr>
                      ) : uniquePurchases.map((item, i) => (
                        <tr key={item.PurchaseId}>
                          <td>{i + 1}</td>
                          <td>{item.PurchaseNo}</td>
                          <td>{item.PurchaseDate ? new Date(item.PurchaseDate).toLocaleDateString("en-IN") : ""}</td>
                          <td>{item.SupplierName}</td>
                          <td>₹ {item.PurchaseTotalAmount}</td>
                          <td>₹ {item.PurchasePaidAmount}</td>
                          <td style={{ color: "#dc2626", fontWeight: "bold" }}>₹ {item.PurchaseDueAmount}</td>
                          <td>{paymentBadge(item.PaymentStatus)}</td>
                          <td>{activeBadge(item.IsActive)}</td>
                          <td>{item.Remarks || "-"}</td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <button
                              className="btn-primary"
                              style={{ marginRight: "6px", padding: "4px 10px", fontSize: "12px" }}
                              onClick={() => handleView(item.PurchaseId)}
                            >
                              View
                            </button>
                            <button
                              style={{
                                padding: "4px 10px", fontSize: "12px",
                                borderRadius: "4px", border: "none", cursor: "pointer",
                                backgroundColor: "#0ea5e9", color: "#fff", fontWeight: "bold",
                              }}
                              onClick={() => handlePrintSingle(item.PurchaseId)}
                            >
                              Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ---- TAB 2: ALL DETAIL ITEMS ---- */}
            {activeTab === "allDetails" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ minWidth: "1200px" }}>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Purchase No</th>
                        <th>Date</th>
                        <th>Supplier</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Metal</th>
                        <th>Metal Type</th>
                        <th>Qty</th>
                        <th>Gross Wt</th>
                        <th>Net Wt</th>
                        <th>Metal Rate</th>
                        <th>Making</th>
                        <th>Type</th>
                        <th>Stone</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRows.length === 0 ? (
                        <tr><td colSpan={18} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No records found</td></tr>
                      ) : detailRows.map((d, i) => (
                        <tr key={d.PurchaseDetailId}>
                          <td>{i + 1}</td>
                          <td>{d.PurchaseNo}</td>
                          <td>{d.PurchaseDate ? new Date(d.PurchaseDate).toLocaleDateString("en-IN") : ""}</td>
                          <td>{d.SupplierName}</td>
                          <td>{d.ProductName}</td>
                          <td>{d.CategoryName}</td>
                          <td>{d.MetalName}</td>
                          <td>
                            <span style={{
                              padding: "2px 8px", borderRadius: "10px", fontSize: "11px",
                              fontWeight: "bold",
                              backgroundColor: d.MetalType === "SILVER" ? "#e0e7ff" : "#fef9c3",
                              color: d.MetalType === "SILVER" ? "#4338ca" : "#92400e",
                            }}>
                              {d.MetalType === "SILVER" ? "Silver" : "Gold"}
                            </span>
                          </td>
                          <td>{d.Quantity}</td>
                          <td>{d.GrossWeight}g</td>
                          <td>{d.NetWeight}g</td>
                          <td>₹ {d.MetalRate}</td>
                          <td>{d.MakingCharge}</td>
                          <td>{d.MakingChargeType}</td>
                          <td>₹ {d.StoneCharge}</td>
                          <td style={{ fontWeight: "bold", color: "#2563eb" }}>₹ {d.Amount}</td>
                          <td>{paymentBadge(d.PaymentStatus)}</td>
                          <td>{activeBadge(d.IsActive)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ---- TAB 3: OLD JEWELLERY ---- */}
            {activeTab === "oldJewellery" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ minWidth: "900px" }}>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Purchase No</th>
                        <th>Date</th>
                        <th>Supplier</th>
                        <th>Description</th>
                        <th>Metal Type</th>
                        <th>Gross Wt (gm)</th>
                        <th>Touch %</th>
                        <th>Deduction Wt</th>
                        <th>Pure Wt</th>
                        <th>Metal Rate</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oldJewelleryRows.length === 0 ? (
                        <tr><td colSpan={13} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No old jewellery records found</td></tr>
                      ) : oldJewelleryRows.map((o, i) => (
                        <tr key={o.OldJewelDetailId}>
                          <td>{i + 1}</td>
                          <td>{o.PurchaseNo}</td>
                          <td>{o.PurchaseDate ? new Date(o.PurchaseDate).toLocaleDateString("en-IN") : ""}</td>
                          <td>{o.SupplierName}</td>
                          <td>{o.ItemDescription || "-"}</td>
                          <td>
                            <span style={{
                              padding: "2px 8px", borderRadius: "10px", fontSize: "11px",
                              fontWeight: "bold",
                              backgroundColor: o.MetalType === "SILVER" ? "#e0e7ff" : "#fef9c3",
                              color: o.MetalType === "SILVER" ? "#4338ca" : "#92400e",
                            }}>
                              {o.MetalType === "SILVER" ? "Silver" : "Gold"}
                            </span>
                          </td>
                          <td>{o.GrossWeight}g</td>
                          <td>{o.Touch ? `${o.Touch}%` : "-"}</td>
                          <td>{o.DeductionWeight ? `${o.DeductionWeight}g` : "-"}</td>
                          <td>{o.PureWeight ? `${o.PureWeight}g` : "-"}</td>
                          <td>₹ {o.MetalRate}</td>
                          <td style={{ fontWeight: "bold", color: "#16a34a" }}>₹ {o.Amount}</td>
                          <td>{activeBadge(o.IsActive)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {oldJewelleryRows.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={11} style={{ ...tdS, textAlign: "right", fontWeight: "bold" }}>Total Old Jewellery Amount:</td>
                          <td style={{ ...tdS, fontWeight: "bold", color: "#16a34a" }}>
                            ₹ {oldJewelleryRows.reduce((s, r) => s + (parseFloat(r.Amount) || 0), 0).toFixed(2)}
                          </td>
                          <td style={tdS}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* ---- TAB 4: SUPPLIER SUMMARY ---- */}
            {activeTab === "supplier" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Supplier</th>
                        <th>Purchases</th>
                        <th>Total Qty</th>
                        <th>Total Net Wt (gm)</th>
                        <th>Items Sub Total</th>
                        <th>Old Jewellery Total</th>
                        <th>Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierSummary.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No data</td></tr>
                      ) : supplierSummary.map((s, i) => (
                        <tr key={s.SupplierId}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: "600" }}>{s.SupplierName}</td>
                          <td>{s.PurchaseCount}</td>
                          <td>{s.TotalQuantity}</td>
                          <td>{s.TotalNetWeight}g</td>
                          <td>₹ {s.TotalDetailsAmount}</td>
                          <td style={{ color: "#16a34a", fontWeight: "bold" }}>₹ {s.TotalOldJewelleryAmount}</td>
                          <td style={{ color: "#2563eb", fontWeight: "bold" }}>₹ {s.TotalAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                    {supplierSummary.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={7} style={{ ...tdS, textAlign: "right", fontWeight: "bold" }}>Grand Total:</td>
                          <td style={{ ...tdS, fontWeight: "bold", color: "#2563eb" }}>
                            ₹ {supplierSummary.reduce((s, r) => s + (parseFloat(r.TotalAmount) || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* ---- TAB 5: METAL-WISE SUMMARY ---- */}
            {activeTab === "metal" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Metal Type</th>
                        <th>Total Rows</th>
                        <th>Total Weight (gm)</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metalSummary.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No data</td></tr>
                      ) : metalSummary.map((m, i) => (
                        <tr key={i}>
                          <td>
                            <span style={{
                              padding: "3px 12px", borderRadius: "12px", fontSize: "13px",
                              fontWeight: "bold",
                              backgroundColor: m.MetalType === "SILVER" ? "#e0e7ff" : "#fef9c3",
                              color: m.MetalType === "SILVER" ? "#4338ca" : "#92400e",
                            }}>
                              {m.MetalType === "SILVER" ? "🥈 Silver (/kg)" : "🥇 Gold (/10gm)"}
                            </span>
                          </td>
                          <td>{m.TotalRows}</td>
                          <td>{m.TotalWeight}g</td>
                          <td style={{ fontWeight: "bold", color: "#2563eb" }}>₹ {m.TotalAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW POPUP ===================== */}
        {viewPopup && viewHeader && (
          <div style={overlayStyle}>
            <div style={popupStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0 }}>Purchase Details — {viewHeader.PurchaseNo}</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={{
                      padding: "6px 14px", fontSize: "12px", borderRadius: "4px",
                      border: "none", cursor: "pointer",
                      backgroundColor: "#0ea5e9", color: "#fff", fontWeight: "bold",
                    }}
                    onClick={() => { setViewPopup(false); handlePrintSingle(viewPurchaseId); }}
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => setViewPopup(false)}
                    style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <hr />

              {/* Header Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div><strong>Purchase No:</strong> {viewHeader.PurchaseNo}</div>
                <div><strong>Date:</strong> {viewHeader.PurchaseDate ? new Date(viewHeader.PurchaseDate).toLocaleDateString("en-IN") : ""}</div>
                <div><strong>Supplier:</strong> {viewHeader.SupplierName}</div>
                <div><strong>Phone:</strong> {viewHeader.SupplierPhone || "-"}</div>
                <div><strong>GSTIN:</strong> {viewHeader.SupplierGSTIN || "-"}</div>
                <div><strong>Remarks:</strong> {viewHeader.Remarks || "-"}</div>
                <div><strong>Total Amount:</strong> <span style={{ color: "#2563eb", fontWeight: "bold" }}>₹ {viewHeader.PurchaseTotalAmount}</span></div>
                <div><strong>Paid Amount:</strong> <span style={{ color: "#16a34a", fontWeight: "bold" }}>₹ {viewHeader.PurchasePaidAmount}</span></div>
                <div><strong>Due Amount:</strong> <span style={{ color: "#dc2626", fontWeight: "bold" }}>₹ {viewHeader.PurchaseDueAmount}</span></div>
                <div><strong>Payment:</strong> {paymentBadge(viewHeader.PaymentStatus)}</div>
                <div><strong>Status:</strong> {activeBadge(viewHeader.IsActive)}</div>
              </div>

              {/* Detail Items */}
              <h4 style={{ marginBottom: "8px" }}>Purchase Items</h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th style={thS}>#</th>
                      <th style={thS}>Product</th>
                      <th style={thS}>Category</th>
                      <th style={thS}>Metal</th>
                      <th style={thS}>Metal Type</th>
                      <th style={thS}>Qty</th>
                      <th style={thS}>Gross Wt</th>
                      <th style={thS}>Net Wt</th>
                      <th style={thS}>Metal Rate</th>
                      <th style={thS}>Making</th>
                      <th style={thS}>Type</th>
                      <th style={thS}>Stone</th>
                      <th style={thS}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetailRows.map((d, i) => (
                      <tr key={d.PurchaseDetailId}>
                        <td style={tdS}>{i + 1}</td>
                        <td style={tdS}>{d.ProductName}</td>
                        <td style={tdS}>{d.CategoryName}</td>
                        <td style={tdS}>{d.MetalName}</td>
                        <td style={tdS}>{d.MetalType === "SILVER" ? "Silver" : "Gold"}</td>
                        <td style={tdS}>{d.Quantity}</td>
                        <td style={tdS}>{d.GrossWeight}g</td>
                        <td style={tdS}>{d.NetWeight}g</td>
                        <td style={tdS}>₹ {d.MetalRate}</td>
                        <td style={tdS}>{d.MakingCharge}</td>
                        <td style={tdS}>{d.MakingChargeType}</td>
                        <td style={tdS}>₹ {d.StoneCharge}</td>
                        <td style={{ ...tdS, fontWeight: "bold", color: "#2563eb" }}>₹ {d.Amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={12} style={{ ...tdS, textAlign: "right", fontWeight: "bold" }}>Items Sub Total:</td>
                      <td style={{ ...tdS, fontWeight: "bold", color: "#2563eb" }}>
                        ₹ {viewDetailRows.reduce((s, r) => s + (parseFloat(r.Amount) || 0), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Old Jewellery Items */}
              {viewOJRows.length > 0 && (
                <>
                  <h4 style={{ marginTop: "20px", marginBottom: "8px" }}>Old Jewellery Purchase</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th style={thS}>#</th>
                          <th style={thS}>Description</th>
                          <th style={thS}>Metal Type</th>
                          <th style={thS}>Gross Wt</th>
                          <th style={thS}>Touch %</th>
                          <th style={thS}>Deduction Wt</th>
                          <th style={thS}>Pure Wt</th>
                          <th style={thS}>Metal Rate</th>
                          <th style={thS}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewOJRows.map((o, i) => (
                          <tr key={o.OldJewelDetailId}>
                            <td style={tdS}>{i + 1}</td>
                            <td style={tdS}>{o.ItemDescription || "-"}</td>
                            <td style={tdS}>{o.MetalType === "SILVER" ? "Silver" : "Gold"}</td>
                            <td style={tdS}>{o.GrossWeight}g</td>
                            <td style={tdS}>{o.Touch ? `${o.Touch}%` : "-"}</td>
                            <td style={tdS}>{o.DeductionWeight ? `${o.DeductionWeight}g` : "-"}</td>
                            <td style={tdS}>{o.PureWeight ? `${o.PureWeight}g` : "-"}</td>
                            <td style={tdS}>₹ {o.MetalRate}</td>
                            <td style={{ ...tdS, fontWeight: "bold", color: "#16a34a" }}>₹ {o.Amount}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={8} style={{ ...tdS, textAlign: "right", fontWeight: "bold" }}>Total Old Jewellery:</td>
                          <td style={{ ...tdS, fontWeight: "bold", color: "#16a34a" }}>
                            ₹ {viewOJRows.reduce((s, o) => s + (parseFloat(o.Amount) || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}

              <div style={{ textAlign: "right", marginTop: "16px" }}>
                <button className="btn-secondary" onClick={() => setViewPopup(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PRINT POPUP ===================== */}
        {printPopup && (
          <div style={overlayStyle} className="print-overlay">
            <div style={popupStyle} className="print-popup">
              <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0 }}>
                  Print Preview — {printTarget === "all" ? "All Purchases" : `Purchase #${printTarget}`}
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-primary" onClick={handlePrintNow}>🖨️ Print</button>
                  <button className="btn-secondary" onClick={() => setPrintPopup(false)}>Close</button>
                </div>
              </div>
              <hr className="no-print" />

              {/* Printable Area */}
              <div id="print-report-area" ref={printRef} style={{ padding: "12px", background: "#fff" }}>
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <h2 style={{ margin: "0 0 4px 0" }}>Purchase Report</h2>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {filters.fromDate && filters.toDate
                      ? `Period: ${new Date(filters.fromDate).toLocaleDateString("en-IN")} to ${new Date(filters.toDate).toLocaleDateString("en-IN")}`
                      : "All Periods"}
                    {filters.supplierId ? ` | Supplier: ${supplierList.find(s => s.SupplierId == filters.supplierId)?.SupplierName || ""}` : ""}
                  </div>
                </div>

                {/* Summary Box */}
                {summary && printTarget === "all" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "16px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px", fontSize: "12px" }}>
                    <div><strong>Total Purchases:</strong> {summary.TotalPurchases}</div>
                    <div><strong>Total Items:</strong> {summary.TotalLineItems}</div>
                    <div><strong>Total Qty:</strong> {summary.TotalQuantity}</div>
                    <div><strong>Total Gross Wt:</strong> {summary.TotalGrossWeight}g</div>
                    <div><strong>Items Total:</strong> ₹ {summary.TotalDetailsAmount}</div>
                    <div><strong>Old Jewellery:</strong> ₹ {summary.TotalOldJewelleryAmount}</div>
                    <div><strong>Grand Total:</strong> ₹ {summary.TotalAmount}</div>
                    <div><strong>Total Due:</strong> ₹ {summary.TotalDueAmount}</div>
                  </div>
                )}

                {/* Items Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "16px" }}>
                  <thead>
                    <tr>
                      <th style={pTh}>#</th>
                      <th style={pTh}>Purchase No</th>
                      <th style={pTh}>Date</th>
                      <th style={pTh}>Supplier</th>
                      <th style={pTh}>Product</th>
                      <th style={pTh}>Metal</th>
                      <th style={pTh}>Qty</th>
                      <th style={pTh}>Gross Wt</th>
                      <th style={pTh}>Net Wt</th>
                      <th style={pTh}>Rate</th>
                      <th style={pTh}>Making</th>
                      <th style={pTh}>Stone</th>
                      <th style={pTh}>Amount</th>
                      <th style={pTh}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printDetailRows.map((d, i) => (
                      <tr key={d.PurchaseDetailId}>
                        <td style={pTd}>{i + 1}</td>
                        <td style={pTd}>{d.PurchaseNo}</td>
                        <td style={pTd}>{d.PurchaseDate ? new Date(d.PurchaseDate).toLocaleDateString("en-IN") : ""}</td>
                        <td style={pTd}>{d.SupplierName}</td>
                        <td style={pTd}>{d.ProductName}</td>
                        <td style={pTd}>{d.MetalType === "SILVER" ? "Silver" : "Gold"}</td>
                        <td style={pTd}>{d.Quantity}</td>
                        <td style={pTd}>{d.GrossWeight}g</td>
                        <td style={pTd}>{d.NetWeight}g</td>
                        <td style={pTd}>₹{d.MetalRate}</td>
                        <td style={pTd}>{d.MakingCharge}</td>
                        <td style={pTd}>₹{d.StoneCharge}</td>
                        <td style={{ ...pTd, fontWeight: "bold" }}>₹{d.Amount}</td>
                        <td style={pTd}>{d.PaymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Old Jewellery Table */}
                {printOJRows.length > 0 && (
                  <>
                    <h4 style={{ marginBottom: "8px" }}>Old Jewellery Purchase</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "16px" }}>
                      <thead>
                        <tr>
                          <th style={pTh}>#</th>
                          <th style={pTh}>Purchase No</th>
                          <th style={pTh}>Supplier</th>
                          <th style={pTh}>Description</th>
                          <th style={pTh}>Metal</th>
                          <th style={pTh}>Gross Wt</th>
                          <th style={pTh}>Touch %</th>
                          <th style={pTh}>Pure Wt</th>
                          <th style={pTh}>Rate</th>
                          <th style={pTh}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printOJRows.map((o, i) => (
                          <tr key={o.OldJewelDetailId}>
                            <td style={pTd}>{i + 1}</td>
                            <td style={pTd}>{o.PurchaseNo}</td>
                            <td style={pTd}>{o.SupplierName}</td>
                            <td style={pTd}>{o.ItemDescription || "-"}</td>
                            <td style={pTd}>{o.MetalType === "SILVER" ? "Silver" : "Gold"}</td>
                            <td style={pTd}>{o.GrossWeight}g</td>
                            <td style={pTd}>{o.Touch ? `${o.Touch}%` : "-"}</td>
                            <td style={pTd}>{o.PureWeight ? `${o.PureWeight}g` : "-"}</td>
                            <td style={pTd}>₹{o.MetalRate}</td>
                            <td style={{ ...pTd, fontWeight: "bold" }}>₹{o.Amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                <div style={{ textAlign: "center", marginTop: "20px", fontSize: "10px", color: "#6b7280" }}>
                  Report generated on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-report-area, #print-report-area * { visibility: visible; }
          #print-report-area { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </ProtectedRoute>
  );
};

/* ---- inline styles ---- */
const thS = {
  padding: "7px 9px", background: "#f1f5f9",
  border: "1px solid #e2e8f0", whiteSpace: "nowrap", textAlign: "left", fontSize: "12px",
};
const tdS = {
  padding: "5px 8px", border: "1px solid #e2e8f0", verticalAlign: "top", fontSize: "12px",
};
const pTh = {
  padding: "5px 7px", background: "#f1f5f9",
  border: "1px solid #cbd5e1", textAlign: "left",
};
const pTd = {
  padding: "4px 7px", border: "1px solid #e2e8f0",
};
const overlayStyle = {
  position: "fixed", top: 0, left: 0,
  width: "100vw", height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: "16px",
};
const popupStyle = {
  backgroundColor: "#fff", borderRadius: "8px",
  padding: "24px", width: "100%", maxWidth: "1100px",
  maxHeight: "90vh", overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
};

export default PurchaseReport;
