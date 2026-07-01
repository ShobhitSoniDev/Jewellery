import React, { useState, useEffect } from "react";
import {
  ProductMaster_Manage,
  CategoryMaster_Manage,
  MetalMaster_Manage,
} from "@/lib/services/MasterService";
import { GetStock_Report } from "@/lib/services/ReportsService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ================================================================== */
const StockReport = () => {

  /* ---------------- FILTER STATES ---------------- */
  const [filters, setFilters] = useState({
    asOnDate:    "",
    productId:   "",
    categoryId:  "",
    metalId:     "",
    metalType:   "",
    stockStatus: "",
    lowStockQty: "",
    isActive:    "",
  });

  /* ---------------- DROPDOWN STATES ---------------- */
  const [productList,  setProductList]  = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [metalList,    setMetalList]    = useState([]);

  /* ---------------- RESULT STATES (5 result sets from SP) ---------------- */
  const [detailRows,      setDetailRows]      = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [metalSummary,    setMetalSummary]    = useState([]);
  const [summary,         setSummary]         = useState(null);
  const [lowStockAlerts,  setLowStockAlerts]  = useState([]);

  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  /* ---------------- ACTIVE TAB ---------------- */
  const [activeTab, setActiveTab] = useState("details"); // details | category | metal | alerts

  /* ---------------- PRINT POPUP ---------------- */
  const [printPopup, setPrintPopup] = useState(false);

  /* ============================================================
     LOAD DROPDOWNS
  ============================================================ */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await ProductMaster_Manage({ TypeId: 1 });
        setProductList(res?.data || []);
      } catch (err) { console.error("Product load error", err); }
    };

    const loadCategories = async () => {
      try {
        const res = await CategoryMaster_Manage({ CategoryId: 0, TypeId:4 });
        setCategoryList(res?.data || []);
      } catch (err) { console.error("Category load error", err); }
    };

    const loadMetals = async () => {
      try {
        const res = await MetalMaster_Manage({ MetalId: 0,TypeId:4 });
        setMetalList(res?.data || []);
      } catch (err) { console.error("Metal load error", err); }
    };

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
        AsOnDate:    filters.asOnDate    || null,
        ProductId:   filters.productId   ? Number(filters.productId)   : null,
        CategoryId:  filters.categoryId  ? Number(filters.categoryId)  : null,
        MetalId:     filters.metalId     ? Number(filters.metalId)     : null,
        MetalType:   filters.metalType   || null,
        StockStatus: filters.stockStatus || null,
        LowStockQty: filters.lowStockQty ? Number(filters.lowStockQty) : null,
        IsActive:    filters.isActive === "" ? null : filters.isActive === "true",
      };

      const res = await GetStock_Report(payload);

      /* SP returns 5 result sets — map as per your API service response shape */
      setDetailRows(     res?.data?.details          || res?.data?.[0] || []);
      setCategorySummary(res?.data?.categorySummary   || res?.data?.[1] || []);
      setMetalSummary(   res?.data?.metalSummary      || res?.data?.[2] || []);
      setSummary(       (res?.data?.summary           || res?.data?.[3] || [null])[0] || null);
      setLowStockAlerts( res?.data?.lowStockAlerts    || res?.data?.[4] || []);

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
      asOnDate: "", productId: "", categoryId: "", metalId: "",
      metalType: "", stockStatus: "", lowStockQty: "", isActive: "",
    });
    setDetailRows([]);
    setCategorySummary([]);
    setMetalSummary([]);
    setSummary(null);
    setLowStockAlerts([]);
    setSearched(false);
  };

  const handlePrint = () => setPrintPopup(true);
  const handlePrintNow = () => window.print();

  /* ============================================================
     STOCK STATUS BADGE
  ============================================================ */
  const stockBadge = (status) => {
    const map = {
      IN_STOCK:     { bg: "#dcfce7", color: "#16a34a", label: "In Stock" },
      LOW_STOCK:    { bg: "#fef9c3", color: "#ca8a04", label: "Low Stock" },
      OUT_OF_STOCK: { bg: "#fee2e2", color: "#dc2626", label: "Out of Stock" },
    };
    const s = map[status] || { bg: "#f1f5f9", color: "#475569", label: status || "-" };
    return (
      <span style={{
        padding: "2px 10px", borderRadius: "12px",
        fontSize: "12px", fontWeight: "bold",
        backgroundColor: s.bg, color: s.color,
      }}>
        {s.label}
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

  const metalBadge = (type) => (
    <span style={{
      padding: "2px 8px", borderRadius: "10px", fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: type === "SILVER" ? "#e0e7ff" : "#fef9c3",
      color: type === "SILVER" ? "#4338ca" : "#92400e",
    }}>
      {type === "SILVER" ? "Silver" : "Gold"}
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
          <h2>Stock Report</h2>
          <hr />

          <div className="form-row">
            <div className="form-group">
              <label>As On Date</label>
              <input
                type="date"
                value={filters.asOnDate}
                onChange={e => setFilters(p => ({ ...p, asOnDate: e.target.value }))}
              />
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
            <div className="form-group">
              <label>Metal</label>
              <select
                value={filters.metalId}
                onChange={e => setFilters(p => ({ ...p, metalId: e.target.value }))}
              >
                <option value="">-- All Metals --</option>
                {metalList.map(m => (
                  <option key={m.MetalId} value={m.MetalId}>{m.MetalDesc}</option>
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
                <option value="">-- All --</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
              </select>
            </div>
            <div className="form-group">
              <label>Stock Status</label>
              <select
                value={filters.stockStatus}
                onChange={e => setFilters(p => ({ ...p, stockStatus: e.target.value }))}
              >
                <option value="">-- All --</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                placeholder="Default: 5"
                value={filters.lowStockQty}
                onChange={e => setFilters(p => ({ ...p, lowStockQty: e.target.value }))}
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
                onClick={handlePrint}
              >
                🖨️ Print
              </button>
            )}
          </div>
        </div>

        {/* ===================== SUMMARY CARDS ===================== */}
        {searched && summary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "16px" }}>
            {[
              { label: "Total Products",       value: summary.TotalProducts,               color: "#2563eb" },
              { label: "In Stock",             value: summary.TotalInStockProducts,         color: "#16a34a" },
              { label: "Low Stock",            value: summary.TotalLowStockProducts,        color: "#ca8a04" },
              { label: "Out of Stock",         value: summary.TotalOutOfStockProducts,      color: "#dc2626" },
              { label: "Purchased Qty",        value: summary.TotalPurchasedQty,            color: "#7c3aed" },
              { label: "Sold Qty",             value: summary.TotalSoldQty,                 color: "#0891b2" },
              { label: "Current Stock Qty",    value: summary.TotalCurrentStockQty,          color: "#2563eb" },
              { label: "Current Stock Net Wt", value: `${summary.TotalCurrentStockNetWeight}g`, color: "#ca8a04" },
              { label: "Current Stock Value",  value: `₹ ${summary.TotalCurrentStockValue}`, color: "#16a34a" },
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
                { key: "details",  label: `Product-wise Stock (${detailRows.length})` },
                { key: "category", label: `Category-wise (${categorySummary.length})` },
                { key: "metal",    label: `Metal-wise (${metalSummary.length})` },
                { key: "alerts",   label: `Low / Out of Stock (${lowStockAlerts.length})` },
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

            {/* ---- TAB 1: PRODUCT-WISE STOCK DETAIL ---- */}
            {activeTab === "details" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ minWidth: "1300px" }}>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Product Code</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Metal</th>
                        <th>Purchased Qty</th>
                        <th>Sold Qty</th>
                        <th>Current Stock Qty</th>
                        <th>Current Stock Net Wt</th>
                        <th>Avg Rate/gm</th>
                        <th>Stock Value</th>
                        <th>Status</th>
                        <th>Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRows.length === 0 ? (
                        <tr><td colSpan={13} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No records found</td></tr>
                      ) : detailRows.map((d, i) => (
                        <tr key={d.ProductId}>
                          <td>{i + 1}</td>
                          <td>{d.ProductCode}</td>
                          <td>{d.ProductName}</td>
                          <td>{d.CategoryName}</td>
                          <td>{metalBadge(d.MetalName)}</td>
                          <td>{d.PurchasedQty}</td>
                          <td>{d.SoldQty}</td>
                          <td style={{ fontWeight: "bold" }}>{d.CurrentStockQty}</td>
                          <td>{d.CurrentStockNetWeight}g</td>
                          <td>₹ {Number(d.AvgPurchaseRatePerGram || 0).toFixed(2)}</td>
                          <td style={{ fontWeight: "bold", color: "#2563eb" }}>₹ {Number(d.CurrentStockValue || 0).toFixed(2)}</td>
                          <td>{stockBadge(d.StockStatus)}</td>
                          <td>{activeBadge(d.IsActive)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {detailRows.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={10} style={{ ...tdS, textAlign: "right", fontWeight: "bold" }}>Total Stock Value:</td>
                          <td style={{ ...tdS, fontWeight: "bold", color: "#2563eb" }}>
                            ₹ {detailRows.reduce((s, r) => s + (parseFloat(r.CurrentStockValue) || 0), 0).toFixed(2)}
                          </td>
                          <td colSpan={2} style={tdS}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* ---- TAB 2: CATEGORY-WISE SUMMARY ---- */}
            {activeTab === "category" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Category</th>
                        <th>Total Products</th>
                        <th>Purchased Qty</th>
                        <th>Sold Qty</th>
                        <th>Current Stock Qty</th>
                        <th>Current Stock Net Wt</th>
                        <th>Stock Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorySummary.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No data</td></tr>
                      ) : categorySummary.map((c, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: "600" }}>{c.CategoryName}</td>
                          <td>{c.TotalProducts}</td>
                          <td>{c.TotalPurchasedQty}</td>
                          <td>{c.TotalSoldQty}</td>
                          <td>{c.TotalCurrentStockQty}</td>
                          <td>{c.TotalCurrentStockNetWeight}g</td>
                          <td style={{ color: "#2563eb", fontWeight: "bold" }}>₹ {c.TotalCurrentStockValue}</td>
                        </tr>
                      ))}
                    </tbody>
                    {categorySummary.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={7} style={{ ...tdS, textAlign: "right", fontWeight: "bold" }}>Grand Total:</td>
                          <td style={{ ...tdS, fontWeight: "bold", color: "#2563eb" }}>
                            ₹ {categorySummary.reduce((s, r) => s + (parseFloat(r.TotalCurrentStockValue) || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* ---- TAB 3: METAL-WISE SUMMARY ---- */}
            {activeTab === "metal" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Metal</th>
                        <th>Total Products</th>
                        <th>Purchased Qty</th>
                        <th>Sold Qty</th>
                        <th>Current Stock Qty</th>
                        <th>Current Stock Gross Wt</th>
                        <th>Current Stock Net Wt</th>
                        <th>Stock Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metalSummary.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No data</td></tr>
                      ) : metalSummary.map((m, i) => (
                        <tr key={i}>
                          <td>{metalBadge(m.MetalName)}</td>
                          <td>{m.TotalProducts}</td>
                          <td>{m.TotalPurchasedQty}</td>
                          <td>{m.TotalSoldQty}</td>
                          <td style={{ fontWeight: "bold" }}>{m.TotalCurrentStockQty}</td>
                          <td>{m.TotalCurrentStockGrossWeight}g</td>
                          <td>{m.TotalCurrentStockNetWeight}g</td>
                          <td style={{ fontWeight: "bold", color: "#2563eb" }}>₹ {m.TotalCurrentStockValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ---- TAB 4: LOW / OUT OF STOCK ALERTS ---- */}
            {activeTab === "alerts" && (
              <div className="table-card" style={{ borderRadius: "0 8px 8px 8px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Product Code</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Metal</th>
                        <th>Current Stock Qty</th>
                        <th>Current Stock Net Wt</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockAlerts.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>No low or out-of-stock products 🎉</td></tr>
                      ) : lowStockAlerts.map((a, i) => (
                        <tr key={a.ProductId}>
                          <td>{i + 1}</td>
                          <td>{a.ProductCode}</td>
                          <td>{a.ProductName}</td>
                          <td>{a.CategoryName}</td>
                          <td>{metalBadge(a.MetalName)}</td>
                          <td style={{ fontWeight: "bold", color: a.StockStatus === "OUT_OF_STOCK" ? "#dc2626" : "#ca8a04" }}>
                            {a.CurrentStockQty}
                          </td>
                          <td>{a.CurrentStockNetWeight}g</td>
                          <td>{stockBadge(a.StockStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== PRINT POPUP ===================== */}
        {printPopup && (
          <div style={overlayStyle} className="print-overlay">
            <div style={popupStyle} className="print-popup">
              <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0 }}>Print Preview — Stock Report</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-primary" onClick={handlePrintNow}>🖨️ Print</button>
                  <button className="btn-secondary" onClick={() => setPrintPopup(false)}>Close</button>
                </div>
              </div>
              <hr className="no-print" />

              {/* Printable Area */}
              <div id="print-report-area" style={{ padding: "12px", background: "#fff" }}>
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <h2 style={{ margin: "0 0 4px 0" }}>Stock Report</h2>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    As on {filters.asOnDate ? new Date(filters.asOnDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}
                    {filters.categoryId ? ` | Category: ${categoryList.find(c => c.CategoryId == filters.categoryId)?.CategoryName || ""}` : ""}
                  </div>
                </div>

                {/* Summary Box */}
                {summary && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "16px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px", fontSize: "12px" }}>
                    <div><strong>Total Products:</strong> {summary.TotalProducts}</div>
                    <div><strong>In Stock:</strong> {summary.TotalInStockProducts}</div>
                    <div><strong>Low Stock:</strong> {summary.TotalLowStockProducts}</div>
                    <div><strong>Out of Stock:</strong> {summary.TotalOutOfStockProducts}</div>
                    <div><strong>Current Stock Qty:</strong> {summary.TotalCurrentStockQty}</div>
                    <div><strong>Current Stock Net Wt:</strong> {summary.TotalCurrentStockNetWeight}g</div>
                    <div><strong>Total Stock Value:</strong> ₹ {summary.TotalCurrentStockValue}</div>
                  </div>
                )}

                {/* Stock Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr>
                      <th style={pTh}>#</th>
                      <th style={pTh}>Code</th>
                      <th style={pTh}>Product</th>
                      <th style={pTh}>Category</th>
                      <th style={pTh}>Metal</th>
                      <th style={pTh}>Purchased</th>
                      <th style={pTh}>Sold</th>
                      <th style={pTh}>Stock Qty</th>
                      <th style={pTh}>Stock Wt</th>
                      <th style={pTh}>Value</th>
                      <th style={pTh}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.map((d, i) => (
                      <tr key={d.ProductId}>
                        <td style={pTd}>{i + 1}</td>
                        <td style={pTd}>{d.ProductCode}</td>
                        <td style={pTd}>{d.ProductName}</td>
                        <td style={pTd}>{d.CategoryName}</td>
                        <td style={pTd}>{d.MetalName}</td>
                        <td style={pTd}>{d.PurchasedQty}</td>
                        <td style={pTd}>{d.SoldQty}</td>
                        <td style={{ ...pTd, fontWeight: "bold" }}>{d.CurrentStockQty}</td>
                        <td style={pTd}>{d.CurrentStockNetWeight}g</td>
                        <td style={{ ...pTd, fontWeight: "bold" }}>₹{Number(d.CurrentStockValue || 0).toFixed(2)}</td>
                        <td style={pTd}>{d.StockStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

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

export default StockReport;
