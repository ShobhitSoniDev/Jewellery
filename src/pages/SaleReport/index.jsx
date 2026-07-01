import React, { useState, useEffect, useRef } from "react";
import {
  CustomerMaster_Manage,
  ProductMaster_Manage,
  CategoryMaster_Manage,
  MetalMaster_Manage,
} from "@/lib/services/MasterService";
import { GetSales_Report } from "@/lib/services/ReportsService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ================================================================== */
const SalesReport = () => {

  /* ---------------- FILTER STATES ---------------- */
  const [filters, setFilters] = useState({
    fromDate:      "",
    toDate:        "",
    customerId:    "",
    customerType:  "",
    productId:     "",
    categoryId:    "",
    metalId:       "",
    metalType:     "",
    billNo:        "",
    paymentMode:   "",
    paymentStatus: "",
    isActive:      "",
  });

  /* ---------------- DROPDOWN STATES ---------------- */
  const [customerList, setCustomerList] = useState([]);
  const [productList,  setProductList]  = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [metalList,    setMetalList]    = useState([]);

  /* ---------------- RESULT STATES (5 result sets from SP) ---------------- */
  const [detailRows,       setDetailRows]       = useState([]);
  const [oldJewelleryRows, setOldJewelleryRows] = useState([]);
  const [summary,          setSummary]          = useState(null);
  const [customerSummary,  setCustomerSummary]  = useState([]);
  const [metalSummary,     setMetalSummary]     = useState([]);

  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  /* ---------------- ACTIVE TAB ---------------- */
  const [activeTab, setActiveTab] = useState("details"); // details | allDetails | oldJewellery | customer | metal

  /* ---------------- VIEW POPUP ---------------- */
  const [viewPopup, setViewPopup] = useState(false);
  const [viewSaleId, setViewSaleId] = useState(null);

  /* ---------------- PRINT POPUP ---------------- */
  const [printPopup,  setPrintPopup]  = useState(false);
  const [printTarget, setPrintTarget] = useState(null);  // "all" | saleId

  const printRef = useRef();

  /* ============================================================
     LOAD DROPDOWNS
  ============================================================ */
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await CustomerMaster_Manage({
          customerId: 0, customerName: "", mobileNo: "",
          address: "", isActive: true,
        });
        setCustomerList(res?.data || []);
      } catch (err) { console.error("Customer load error", err); }
    };

    const loadProducts = async () => {
      try {
        const res = await ProductMaster_Manage({ TypeId: 1 });
        setProductList(res?.data || []);
      } catch (err) { console.error("Product load error", err); }
    };

    const loadCategories = async () => {
      try {
        const res = await CategoryMaster_Manage({ CategoryId: 0 });
        setCategoryList(res?.data || []);
      } catch (err) { console.error("Category load error", err); }
    };

    const loadMetals = async () => {
      try {
        const res = await MetalMaster_Manage({ MetalId: 0 });
        setMetalList(res?.data || []);
      } catch (err) { console.error("Metal load error", err); }
    };

    loadCustomers();
    loadProducts();
    loadCategories();
    loadMetals();
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
        CustomerId:    filters.customerId    ? Number(filters.customerId)   : null,
        CustomerType:  filters.customerType  || null,
        ProductId:     filters.productId     ? Number(filters.productId)    : null,
        CategoryId:    filters.categoryId    ? Number(filters.categoryId)   : null,
        MetalId:       filters.metalId       ? Number(filters.metalId)      : null,
        MetalType:     filters.metalType     || null,
        BillNo:        filters.billNo        || null,
        PaymentMode:   filters.paymentMode   || null,
        PaymentStatus: filters.paymentStatus || null,
        IsActive:      filters.isActive === "" ? null : filters.isActive === "true",
      };

      const res = await GetSales_Report(payload);

      /* SP returns 5 result sets — map as per your API service response shape */
      setDetailRows(      res?.data?.details          || res?.data?.[0] || []);
      setOldJewelleryRows(res?.data?.oldJewellery      || res?.data?.[1] || []);
      setSummary(        (res?.data?.summary           || res?.data?.[2] || [null])[0] || null);
      setCustomerSummary( res?.data?.customerSummary   || res?.data?.[3] || []);
      setMetalSummary(    res?.data?.metalSummary      || res?.data?.[4] || []);

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
      fromDate: "", toDate: "", customerId: "", customerType: "",
      productId: "", categoryId: "", metalId: "", metalType: "",
      billNo: "", paymentMode: "", paymentStatus: "", isActive: "",
    });
    setDetailRows([]);
    setOldJewelleryRows([]);
    setSummary(null);
    setCustomerSummary([]);
    setMetalSummary([]);
    setSearched(false);
  };

  /* ============================================================
     VIEW POPUP — filter rows for a specific SaleId
  ============================================================ */
  const handleView = (saleId) => {
    setViewSaleId(saleId);
    setViewPopup(true);
  };

  /* get unique bill rows for view popup */
  const viewDetailRows = detailRows.filter(r => r.SaleId === viewSaleId);
  const viewOJRows      = oldJewelleryRows.filter(r => r.SaleId === viewSaleId);
  const viewHeader      = viewDetailRows[0] || null;

  /* ============================================================
     PRINT HELPERS
  ============================================================ */
  const handlePrintAll = () => {
    setPrintTarget("all");
    setPrintPopup(true);
  };

  const handlePrintSingle = (saleId) => {
    setPrintTarget(saleId);
    setPrintPopup(true);
  };

  const handlePrintNow = () => window.print();

  /* rows to print */
  const printDetailRows = printTarget === "all"
    ? detailRows
    : detailRows.filter(r => r.SaleId === printTarget);

  const printOJRows = printTarget === "all"
    ? oldJewelleryRows
    : oldJewelleryRows.filter(r => r.SaleId === printTarget);

  /* ============================================================
     UNIQUE BILLS for list grid (one row per sale)
  ============================================================ */
  const uniqueBills = React.useMemo(() => {
    const seen = new Set();
    return detailRows.filter(r => {
      if (seen.has(r.SaleId)) return false;
      seen.add(r.SaleId);
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

  const customerTypeBadge = (type) => (
    <span style={{
      padding: "2px 8px", borderRadius: "10px", fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: type === "HOLESALE" ? "#e0e7ff" : "#fef9c3",
      color: type === "HOLESALE" ? "#4338ca" : "#92400e",
    }}>
      {type === "HOLESALE" ? "Wholesale" : "Fulkar / Retail"}
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
          <h2>Sales Report</h2>
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
              <label>Customer</label>
              <select
                value={filters.customerId}
                onChange={e => setFilters(p => ({ ...p, customerId: e.target.value }))}
              >
                <option value="">-- All Customers --</option>
                {customerList.map(c => (
                  <option key={c.CustomerId} value={c.CustomerId}>{c.CustomerName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Customer Type</label>
              <select
                value={filters.customerType}
                onChange={e => setFilters(p => ({ ...p, customerType: e.target.value }))}
              >
                <option value="">-- All --</option>
                <option value="FULKAR">Fulkar / Retail</option>
                <option value="HOLESALE">Wholesale</option>
              </select>
            </div>
          </div>

          <div className="form-row">
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
            <div className="form-group">
              <label>Category</label>
              <select
                value={filters.categoryId}
                onChange={e => setFilters(p => ({ ...p, categoryId: e.target.value }))}
              >
                <option value="">-- All Categories --</option>
                {categoryList.map(c => (
                  <option key={c.CategoryId} value={c.CategoryId}>{c.CategoryName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Metal</label>
              <select
                value={filters.metalId}
                onChange={e => setFilters(p => ({ ...p, metalId: e.target.value }))}
              >
                <option value="">-- All Metals --</option>
                {metalList.map(m => (
                  <option key={m.MetalId} value={m.MetalId}>{m.MetalName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Metal Type</label>
              <select
                value={filters.metalType}
                onChange={e => setFilters(p => ({ ...p, metalType: e.target.value }))}
              >
                <option value="">-- All --</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Bill No</label>
              <input
                placeholder="Search Bill No..."
                value={filters.billNo}
                onChange={e => setFilters(p => ({ ...p, billNo: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Payment Mode</label>
              <select
                value={filters.paymentMode}
                onChange={e => setFilters(p => ({ ...p, paymentMode: e.target.value }))}
              >
                <option value="">-- All --</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>
          </div>

          <div className="form-row">
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
              { label: "Total Bills",               value: summary.TotalBills,              color: "#2563eb" },
              { label: "Total Items",                value: summary.TotalLineItems,          color: "#7c3aed" },
              { label: "Total Qty",                  value: summary.TotalQuantity,           color: "#0891b2" },
              { label: "Total Net Wt (gm)",          value: `${summary.TotalNetWeight}g`,    color: "#ca8a04" },
              { label: "GST Amount",                 value: `₹ ${summary.TotalGSTAmount}`,   color: "#7c3aed" },
              { label: "Items Sub Total",            value: `₹ ${summary.TotalDetailsAmount}`, color: "#2563eb" },
              { label: "Old Jewellery Total",        value: `₹ ${summary.TotalOldJewelleryAmount}`, color: "#16a34a" },
              { label: "Grand Total Amount",         value: `₹ ${summary.TotalAmount}`,      color: "#2563eb" },
              { label: "Total Paid",                 value: `₹ ${summary.TotalPaidAmount}`,  color: "#16a34a" },
              { label: "Total Balance Due",          value: `₹ ${summary.TotalBalanceDue}`,  color: "#dc2626" },
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
            <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid #e2e8f0", marginBottom: "0", flexWrap: "wrap" }}>
              {[
                { key: "details",      label: `Bill List (${uniqueBills.length})` },
                { key: "allDetails",   label: `All Items (${detailRows.length})` },
                { key: "oldJewellery", label: `Old Jewellery (${oldJewelleryRows.length})` },
                { key: "customer",     label: `Customer-wise (${customerSummary.length})` },
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

            {/* ---- TAB 1: BILL LIST (one row per sale) ---- */}
            {activeTab === "details" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ minWidth: "1000px" }}>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Bill No</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Total Amount</th>
                        <th>Paid Amount</th>
                        <th>Balance Due</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueBills.length === 0 ? (
                        <tr><td colSpan={12} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No records found</td></tr>
                      ) : uniqueBills.map((item, i) => (
                        <tr key={item.SaleId}>
                          <td>{i + 1}</td>
                          <td>{item.BillNo}</td>
                          <td>{item.BillDate ? new Date(item.BillDate).toLocaleDateString("en-IN") : ""}</td>
                          <td>{item.CustomerName}</td>
                          <td>{customerTypeBadge(item.CustomerType)}</td>
                          <td>₹ {item.SaleTotalAmount}</td>
                          <td>₹ {item.SalePaidAmount}</td>
                          <td style={{ color: "#dc2626", fontWeight: "bold" }}>₹ {item.SaleBalanceDue}</td>
                          <td>{paymentBadge(item.PaymentStatus)}</td>
                          <td>{activeBadge(item.IsActive)}</td>
                          <td>{item.Remarks || "-"}</td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <button
                              className="btn-primary"
                              style={{ marginRight: "6px", padding: "4px 10px", fontSize: "12px" }}
                              onClick={() => handleView(item.SaleId)}
                            >
                              View
                            </button>
                            <button
                              style={{
                                padding: "4px 10px", fontSize: "12px",
                                borderRadius: "4px", border: "none", cursor: "pointer",
                                backgroundColor: "#0ea5e9", color: "#fff", fontWeight: "bold",
                              }}
                              onClick={() => handlePrintSingle(item.SaleId)}
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
                  <table style={{ minWidth: "1300px" }}>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Bill No</th>
                        <th>Date</th>
                        <th>Customer</th>
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
                        <th>GST %</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRows.length === 0 ? (
                        <tr><td colSpan={19} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No records found</td></tr>
                      ) : detailRows.map((d, i) => (
                        <tr key={d.SaleDetailId}>
                          <td>{i + 1}</td>
                          <td>{d.BillNo}</td>
                          <td>{d.BillDate ? new Date(d.BillDate).toLocaleDateString("en-IN") : ""}</td>
                          <td>{d.CustomerName}</td>
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
                          <td>{d.GSTRate}%</td>
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
                        <th>Bill No</th>
                        <th>Date</th>
                        <th>Customer</th>
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
                          <td>{o.BillNo}</td>
                          <td>{o.BillDate ? new Date(o.BillDate).toLocaleDateString("en-IN") : ""}</td>
                          <td>{o.CustomerName}</td>
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

            {/* ---- TAB 4: CUSTOMER-WISE SUMMARY ---- */}
            {activeTab === "customer" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Customer</th>
                        <th>Mobile</th>
                        <th>Bills</th>
                        <th>Total Qty</th>
                        <th>Total Net Wt (gm)</th>
                        <th>Items Sub Total</th>
                        <th>Old Jewellery Total</th>
                        <th>Grand Total</th>
                        <th>Paid</th>
                        <th>Balance Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerSummary.length === 0 ? (
                        <tr><td colSpan={11} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No data</td></tr>
                      ) : customerSummary.map((c, i) => (
                        <tr key={c.CustomerId}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: "600" }}>{c.CustomerName}</td>
                          <td>{c.CustomerMobile || "-"}</td>
                          <td>{c.BillCount}</td>
                          <td>{c.TotalQuantity}</td>
                          <td>{c.TotalNetWeight}g</td>
                          <td>₹ {c.TotalDetailsAmount}</td>
                          <td style={{ color: "#16a34a", fontWeight: "bold" }}>₹ {c.TotalOldJewelleryAmount}</td>
                          <td style={{ color: "#2563eb", fontWeight: "bold" }}>₹ {c.TotalAmount}</td>
                          <td style={{ color: "#16a34a" }}>₹ {c.TotalPaidAmount}</td>
                          <td style={{ color: "#dc2626", fontWeight: "bold" }}>₹ {c.TotalBalanceDue}</td>
                        </tr>
                      ))}
                    </tbody>
                    {customerSummary.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={8} style={{ ...tdS, textAlign: "right", fontWeight: "bold" }}>Grand Total:</td>
                          <td style={{ ...tdS, fontWeight: "bold", color: "#2563eb" }}>
                            ₹ {customerSummary.reduce((s, r) => s + (parseFloat(r.TotalAmount) || 0), 0).toFixed(2)}
                          </td>
                          <td colSpan={2} style={tdS}></td>
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
                              {m.MetalType === "SILVER" ? "🥈 Silver" : "🥇 Gold"}
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
                <h3 style={{ margin: 0 }}>Bill Details — {viewHeader.BillNo}</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={{
                      padding: "6px 14px", fontSize: "12px", borderRadius: "4px",
                      border: "none", cursor: "pointer",
                      backgroundColor: "#0ea5e9", color: "#fff", fontWeight: "bold",
                    }}
                    onClick={() => { setViewPopup(false); handlePrintSingle(viewSaleId); }}
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
                <div><strong>Bill No:</strong> {viewHeader.BillNo}</div>
                <div><strong>Date:</strong> {viewHeader.BillDate ? new Date(viewHeader.BillDate).toLocaleDateString("en-IN") : ""}</div>
                <div><strong>Customer:</strong> {viewHeader.CustomerName}</div>
                <div><strong>Mobile:</strong> {viewHeader.CustomerMobile || "-"}</div>
                <div><strong>Address:</strong> {viewHeader.CustomerAddress || "-"}</div>
                <div><strong>Type:</strong> {customerTypeBadge(viewHeader.CustomerType)}</div>
                <div><strong>Remarks:</strong> {viewHeader.Remarks || "-"}</div>
                <div><strong>Total Amount:</strong> <span style={{ color: "#2563eb", fontWeight: "bold" }}>₹ {viewHeader.SaleTotalAmount}</span></div>
                <div><strong>Paid Amount:</strong> <span style={{ color: "#16a34a", fontWeight: "bold" }}>₹ {viewHeader.SalePaidAmount}</span></div>
                <div><strong>Balance Due:</strong> <span style={{ color: "#dc2626", fontWeight: "bold" }}>₹ {viewHeader.SaleBalanceDue}</span></div>
                <div><strong>Payment:</strong> {paymentBadge(viewHeader.PaymentStatus)}</div>
                <div><strong>Status:</strong> {activeBadge(viewHeader.IsActive)}</div>
              </div>

              {/* Detail Items */}
              <h4 style={{ marginBottom: "8px" }}>Sale Items</h4>
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
                      <th style={thS}>GST %</th>
                      <th style={thS}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetailRows.map((d, i) => (
                      <tr key={d.SaleDetailId}>
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
                        <td style={tdS}>{d.GSTRate}%</td>
                        <td style={{ ...tdS, fontWeight: "bold", color: "#2563eb" }}>₹ {d.Amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={13} style={{ ...tdS, textAlign: "right", fontWeight: "bold" }}>Items Sub Total:</td>
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
                  <h4 style={{ marginTop: "20px", marginBottom: "8px" }}>Old Jewellery Exchanged</h4>
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
                  Print Preview — {printTarget === "all" ? "All Bills" : `Bill #${printTarget}`}
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
                  <h2 style={{ margin: "0 0 4px 0" }}>Sales Report</h2>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {filters.fromDate && filters.toDate
                      ? `Period: ${new Date(filters.fromDate).toLocaleDateString("en-IN")} to ${new Date(filters.toDate).toLocaleDateString("en-IN")}`
                      : "All Periods"}
                    {filters.customerId ? ` | Customer: ${customerList.find(c => c.CustomerId == filters.customerId)?.CustomerName || ""}` : ""}
                  </div>
                </div>

                {/* Summary Box */}
                {summary && printTarget === "all" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "16px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px", fontSize: "12px" }}>
                    <div><strong>Total Bills:</strong> {summary.TotalBills}</div>
                    <div><strong>Total Items:</strong> {summary.TotalLineItems}</div>
                    <div><strong>Total Qty:</strong> {summary.TotalQuantity}</div>
                    <div><strong>Total Net Wt:</strong> {summary.TotalNetWeight}g</div>
                    <div><strong>Items Total:</strong> ₹ {summary.TotalDetailsAmount}</div>
                    <div><strong>Old Jewellery:</strong> ₹ {summary.TotalOldJewelleryAmount}</div>
                    <div><strong>Grand Total:</strong> ₹ {summary.TotalAmount}</div>
                    <div><strong>Total Balance Due:</strong> ₹ {summary.TotalBalanceDue}</div>
                  </div>
                )}

                {/* Items Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "16px" }}>
                  <thead>
                    <tr>
                      <th style={pTh}>#</th>
                      <th style={pTh}>Bill No</th>
                      <th style={pTh}>Date</th>
                      <th style={pTh}>Customer</th>
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
                      <tr key={d.SaleDetailId}>
                        <td style={pTd}>{i + 1}</td>
                        <td style={pTd}>{d.BillNo}</td>
                        <td style={pTd}>{d.BillDate ? new Date(d.BillDate).toLocaleDateString("en-IN") : ""}</td>
                        <td style={pTd}>{d.CustomerName}</td>
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
                    <h4 style={{ marginBottom: "8px" }}>Old Jewellery Exchanged</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "16px" }}>
                      <thead>
                        <tr>
                          <th style={pTh}>#</th>
                          <th style={pTh}>Bill No</th>
                          <th style={pTh}>Customer</th>
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
                            <td style={pTd}>{o.BillNo}</td>
                            <td style={pTd}>{o.CustomerName}</td>
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

export default SalesReport;
