"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Swal from "sweetalert2";
import { Dashboard_GetData } from "@/lib/services/ReportsService";

const emptyDashboard = {
  summaryCards: [],
  metalSummary: [],
  lowStockItems: [],
  recentTransactions: [],
  girviSummary: [],
  stockOverview: [],
};

const getValue = (obj, smallKey, capitalKey) => obj?.[smallKey] ?? obj?.[capitalKey] ?? "";

/* Small icon per summary-card tone, purely visual — matches the `Tone`
   column returned by Jewellery.Dashboard_GetData (Result Set 1) */
const TONE_ICON = {
  gold:   "💰",
  blue:   "📦",
  green:  "✅",
  orange: "⚠️",
  red:    "🔻",
  purple: "🏷️",
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(emptyDashboard);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  /* Dashboard_GetData SP returns 6 ordered result sets:
     1) Summary Cards   2) Metal Wise Stock   3) Low Stock Items
     4) Recent Transactions   5) Girvi/Loan Summary   6) Stock Overview
     ReportsService should map these (by position or by name) into the
     keys below — this page accepts either camelCase or PascalCase keys
     so it works whether the API wraps recordsets as named properties or
     forwards SQL Server's recordset array directly. */
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const res = await Dashboard_GetData();
      const data = res?.data;

      // Supports either { summaryCards: [...], ... } shape (object)
      // or a raw array-of-recordsets shape [ [...], [...], ... ] (fallback).
      const isArrayShape = Array.isArray(data);

      setDashboardData({
        summaryCards: (isArrayShape ? data?.[0] : data?.summaryCards || data?.SummaryCards) || [],
        metalSummary: (isArrayShape ? data?.[1] : data?.metalSummary || data?.MetalSummary) || [],
        lowStockItems: (isArrayShape ? data?.[2] : data?.lowStockItems || data?.LowStockItems) || [],
        recentTransactions: (isArrayShape ? data?.[3] : data?.recentTransactions || data?.RecentTransactions) || [],
        girviSummary: (isArrayShape ? data?.[4] : data?.girviSummary || data?.GirviSummary) || [],
        stockOverview: (isArrayShape ? data?.[5] : data?.stockOverview || data?.StockOverview) || [],
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasOldGirviReview = dashboardData.summaryCards.some(
    (item) => getValue(item, "title", "Title") === "Old Girvi Review" && Number(getValue(item, "value", "Value")) > 0
  );

  return (
    <ProtectedRoute>
      <div className="jd-page">
        <div className="jd-header">
          <div>
            <h2>Jewellery Dashboard</h2>
            <p>Stock, sale, girvi/loan aur low stock ka quick overview</p>
          </div>

          <div className="jd-actions">
            <button className="jd-btn" onClick={loadDashboardData} disabled={loading}>
              {loading ? "Refreshing..." : "⟳ Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="jd-panel jd-loading">
            <span className="jd-spinner" />
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* ===================== SUMMARY CARDS ===================== */}
            <div className="jd-stats">
              {dashboardData.summaryCards.length > 0 ? (
                dashboardData.summaryCards.map((item, index) => {
                  const title = getValue(item, "title", "Title");
                  const value = getValue(item, "value", "Value");
                  const tone = getValue(item, "tone", "Tone") || "blue";

                  return (
                    <div className={`jd-stat ${tone}`} key={`${title}-${index}`}>
                      <span className="jd-stat-icon" aria-hidden="true">{TONE_ICON[tone] || "📊"}</span>
                      <span>{title}</span>
                      <h3>{value}</h3>
                    </div>
                  );
                })
              ) : (
                <div className="jd-panel jd-empty">No summary data found</div>
              )}
            </div>

            <div className="jd-grid">
              {/* ===================== METAL WISE STOCK ===================== */}
              <div className="jd-panel">
                <div className="jd-panel-head">
                  <h3>Metal Wise Stock</h3>
                </div>

                <div className="jd-list">
                  {dashboardData.metalSummary.length > 0 ? (
                    dashboardData.metalSummary.map((item, index) => (
                      <div className="jd-row" key={index}>
                        <div>
                          <strong>{getValue(item, "metal", "Metal")}</strong>
                          <small>
                            {getValue(item, "items", "Items")} items • {getValue(item, "weight", "Weight")}
                          </small>
                        </div>
                        <b>{getValue(item, "value", "Value")}</b>
                      </div>
                    ))
                  ) : (
                    <div className="jd-empty">No stock data found</div>
                  )}
                </div>
              </div>

              {/* ===================== GIRVI / LOAN SUMMARY ===================== */}
              <div className="jd-panel">
                <div className="jd-panel-head">
                  <h3>Girvi / Loan Summary</h3>
                </div>

                <div className="jd-mini-grid">
                  {dashboardData.girviSummary.length > 0 ? (
                    dashboardData.girviSummary.map((item, index) => (
                      <div className="jd-mini" key={index}>
                        <span>{getValue(item, "title", "Title")}</span>
                        <b>{getValue(item, "value", "Value")}</b>
                      </div>
                    ))
                  ) : (
                    <div className="jd-empty">No loan data found</div>
                  )}
                </div>

                {hasOldGirviReview && (
                  <div className="jd-old-loan">
                    <div>
                      <strong>Old Girvi Review</strong>
                      <p>8-10 saal se inactive loans ko settlement, write-off ya dormant review me process karein.</p>
                    </div>
                    <button className="jd-btn jd-danger">Review</button>
                  </div>
                )}
              </div>
            </div>

            <div className="jd-grid">
              {/* ===================== LOW STOCK ALERTS ===================== */}
              <div className="jd-panel">
                <div className="jd-panel-head">
                  <h3>Low Stock Alerts</h3>
                  <span className="jd-tag orange">Action Required</span>
                </div>

                <div className="jd-table-wrap">
                  <table className="jd-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Min Qty</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.lowStockItems.length > 0 ? (
                        dashboardData.lowStockItems.map((item, index) => {
                          const status = getValue(item, "status", "Status");

                          return (
                            <tr key={index}>
                              <td>{getValue(item, "item", "Item")}</td>
                              <td>{getValue(item, "category", "Category")}</td>
                              <td>{getValue(item, "qty", "Qty")}</td>
                              <td>{getValue(item, "minQty", "MinQty")}</td>
                              <td>
                                <span className={`jd-badge ${status === "Critical" ? "red" : "orange"}`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="jd-empty">No low stock found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ===================== RECENT TRANSACTIONS ===================== */}
              <div className="jd-panel">
                <div className="jd-panel-head">
                  <h3>Recent Transactions</h3>
                </div>

                <div className="jd-list">
                  {dashboardData.recentTransactions.length > 0 ? (
                    dashboardData.recentTransactions.map((item, index) => (
                      <div className="jd-row" key={index}>
                        <div>
                          <span className="jd-type">{getValue(item, "type", "Type")}</span>
                          <strong>{getValue(item, "detail", "Detail")}</strong>
                          <small>{getValue(item, "date", "Date")}</small>
                        </div>
                        <b>{getValue(item, "amount", "Amount")}</b>
                      </div>
                    ))
                  ) : (
                    <div className="jd-empty">No recent transactions found</div>
                  )}
                </div>
              </div>
            </div>

            {/* ===================== STOCK OVERVIEW ===================== */}
            <div className="jd-panel">
              <div className="jd-panel-head">
                <h3>Stock Overview</h3>
                <span className="jd-tag">Latest Items</span>
              </div>

              <div className="jd-table-wrap">
                <table className="jd-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Weight</th>
                      <th>Stock Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.stockOverview.length > 0 ? (
                      dashboardData.stockOverview.map((item, index) => {
                        const status = getValue(item, "status", "Status");

                        return (
                          <tr key={index}>
                            <td>{getValue(item, "item", "Item")}</td>
                            <td>{getValue(item, "category", "Category")}</td>
                            <td>{getValue(item, "qty", "Qty")}</td>
                            <td>{getValue(item, "weight", "Weight")}</td>
                            <td>{getValue(item, "value", "Value")}</td>
                            <td>
                              <span
                                className={`jd-badge ${
                                  status === "Low" ? "orange" : status === "Sold" ? "red" : "green"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="jd-empty">No stock items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .jd-page {
          width: 100%;
          padding: 24px;
          background: #f4f5f7;
          min-height: calc(100vh - 80px);
          color: #111827;
        }

        .jd-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .jd-header h2 {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
        }

        .jd-header p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .jd-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .jd-btn {
          border: 0;
          min-height: 42px;
          border-radius: 8px;
          padding: 10px 16px;
          background: #ffffff;
          color: #111827;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 1px 5px rgba(15, 23, 42, 0.1);
          white-space: nowrap;
        }

        .jd-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .jd-primary {
          background: #d99a2b;
          color: #ffffff;
        }

        .jd-danger {
          background: #ef4444;
          color: #ffffff;
        }

        /* Auto-fit so cards reflow naturally on any screen width,
           media queries below just tighten things further on small screens */
        .jd-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .jd-stat {
          position: relative;
          background: #ffffff;
          border-radius: 10px;
          padding: 18px;
          padding-right: 44px;
          min-height: 108px;
          border-left: 5px solid #64748b;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }

        .jd-stat-icon {
          position: absolute;
          top: 14px;
          right: 14px;
          font-size: 18px;
          opacity: 0.85;
        }

        .jd-stat span:not(.jd-stat-icon) {
          color: #6b7280;
          font-size: 14px;
          font-weight: 700;
        }

        .jd-stat h3 {
          margin: 12px 0 0;
          font-size: 22px;
          line-height: 1.2;
          word-break: break-word;
        }

        .jd-stat.gold { border-color: #d99a2b; }
        .jd-stat.blue { border-color: #2563eb; }
        .jd-stat.green { border-color: #16a34a; }
        .jd-stat.orange { border-color: #f59e0b; }
        .jd-stat.red { border-color: #ef4444; }
        .jd-stat.purple { border-color: #7c3aed; }

        .jd-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .jd-panel {
          background: #ffffff;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          overflow: hidden;
        }

        .jd-loading {
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-weight: 700;
          color: #6b7280;
        }

        .jd-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #e5e7eb;
          border-top-color: #d99a2b;
          border-radius: 50%;
          animation: jd-spin 0.8s linear infinite;
        }

        @keyframes jd-spin {
          to { transform: rotate(360deg); }
        }

        .jd-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .jd-panel-head h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }

        .jd-list {
          display: grid;
          gap: 10px;
        }

        .jd-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
        }

        .jd-row strong {
          display: block;
          margin-bottom: 4px;
          word-break: break-word;
        }

        .jd-row small {
          display: block;
          color: #6b7280;
          font-size: 13px;
        }

        .jd-row b {
          white-space: nowrap;
        }

        .jd-mini-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .jd-mini {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 14px;
        }

        .jd-mini span {
          display: block;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .jd-mini b {
          font-size: 20px;
          word-break: break-word;
        }

        .jd-old-loan {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 10px;
          padding: 14px;
        }

        .jd-old-loan p {
          margin: 5px 0 0;
          color: #9a3412;
          font-size: 14px;
          line-height: 1.4;
        }

        .jd-tag {
          border-radius: 999px;
          padding: 6px 10px;
          background: #eef2ff;
          color: #3730a3;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .jd-tag.orange {
          background: #fff7ed;
          color: #c2410c;
        }

        .jd-type {
          display: inline-block;
          margin-bottom: 4px;
          color: #d99a2b;
          font-size: 12px;
          font-weight: 800;
        }

        .jd-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .jd-table {
          width: 100%;
          min-width: 620px;
          border-collapse: collapse;
        }

        .jd-table th,
        .jd-table td {
          padding: 14px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          white-space: nowrap;
        }

        .jd-table th {
          background: #f3f4f6;
          font-weight: 800;
        }

        .jd-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 72px;
          border-radius: 999px;
          padding: 7px 11px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
        }

        .jd-badge.green { background: #22a85a; }
        .jd-badge.orange { background: #f59e0b; }
        .jd-badge.red { background: #ef4444; }

        .jd-empty {
          text-align: center !important;
          color: #6b7280;
          padding: 20px;
        }

        @media (max-width: 1100px) {
          .jd-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .jd-page {
            padding: 14px;
          }

          .jd-header,
          .jd-old-loan {
            align-items: stretch;
            flex-direction: column;
          }

          .jd-actions,
          .jd-actions .jd-btn,
          .jd-old-loan .jd-btn {
            width: 100%;
          }

          .jd-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .jd-stat {
            padding: 14px;
            padding-right: 36px;
            min-height: 92px;
          }

          .jd-stat h3 {
            font-size: 18px;
          }

          .jd-mini-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .jd-panel {
            padding: 14px;
          }
        }

        @media (max-width: 380px) {
          .jd-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
