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

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(emptyDashboard);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const res = await Dashboard_GetData();

      setDashboardData({
        summaryCards: res?.data.summaryCards || res?.data.SummaryCards || [],
        metalSummary: res?.data.metalSummary || res?.data.MetalSummary || [],
        lowStockItems: res?.data.lowStockItems || res?.data.LowStockItems || [],
        recentTransactions: res?.data.recentTransactions || res?.data.RecentTransactions || [],
        girviSummary: res?.data.girviSummary || res?.data.GirviSummary || [],
        stockOverview: res?.data.stockOverview || res?.data.StockOverview || [],
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

  return (
    <ProtectedRoute>
      <div className="jd-page">
        <div className="jd-header">
          <div>
            <h2>Jewellery Dashboard</h2>
            <p>Stock, sale, girvi/loan aur low stock ka quick overview</p>
          </div>

          <div className="jd-actions">
            <button className="jd-btn jd-primary">+ Add New Item</button>
            <button className="jd-btn" onClick={loadDashboardData}>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="jd-panel jd-loading">Loading dashboard...</div>
        ) : (
          <>
            <div className="jd-stats">
              {dashboardData.summaryCards.map((item, index) => {
                const title = getValue(item, "title", "Title");
                const value = getValue(item, "value", "Value");
                const tone = getValue(item, "tone", "Tone");

                return (
                  <div className={`jd-stat ${tone}`} key={`${title}-${index}`}>
                    <span>{title}</span>
                    <h3>{value}</h3>
                  </div>
                );
              })}
            </div>

            <div className="jd-grid">
              <div className="jd-panel">
                <div className="jd-panel-head">
                  <h3>Metal Wise Stock</h3>
                </div>

                <div className="jd-list">
                  {dashboardData.metalSummary.map((item, index) => (
                    <div className="jd-row" key={index}>
                      <div>
                        <strong>{getValue(item, "metal", "Metal")}</strong>
                        <small>
                          {getValue(item, "items", "Items")} items • {getValue(item, "weight", "Weight")}
                        </small>
                      </div>
                      <b>{getValue(item, "value", "Value")}</b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="jd-panel">
                <div className="jd-panel-head">
                  <h3>Girvi / Loan Summary</h3>
                </div>

                <div className="jd-mini-grid">
                  {dashboardData.girviSummary.map((item, index) => (
                    <div className="jd-mini" key={index}>
                      <span>{getValue(item, "title", "Title")}</span>
                      <b>{getValue(item, "value", "Value")}</b>
                    </div>
                  ))}
                </div>

                <div className="jd-old-loan">
                  <div>
                    <strong>Old Girvi Review</strong>
                    <p>8-10 saal se inactive loans ko settlement, write-off ya dormant review me process karein.</p>
                  </div>
                  <button className="jd-btn jd-danger">Review</button>
                </div>
              </div>
            </div>

            <div className="jd-grid">
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

              <div className="jd-panel">
                <div className="jd-panel-head">
                  <h3>Recent Transactions</h3>
                </div>

                <div className="jd-list">
                  {dashboardData.recentTransactions.map((item, index) => (
                    <div className="jd-row" key={index}>
                      <div>
                        <span className="jd-type">{getValue(item, "type", "Type")}</span>
                        <strong>{getValue(item, "detail", "Detail")}</strong>
                        <small>{getValue(item, "date", "Date")}</small>
                      </div>
                      <b>{getValue(item, "amount", "Amount")}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
                    {dashboardData.stockOverview.map((item, index) => {
                      const status = getValue(item, "status", "Status");

                      return (
                        <tr key={index}>
                          <td>{getValue(item, "item", "Item")}</td>
                          <td>{getValue(item, "category", "Category")}</td>
                          <td>{getValue(item, "qty", "Qty")}</td>
                          <td>{getValue(item, "weight", "Weight")}</td>
                          <td>{getValue(item, "value", "Value")}</td>
                          <td>
                            <span className={`jd-badge ${status === "Low" ? "red" : status === "Sale" ? "orange" : "green"}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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

        .jd-primary {
          background: #d99a2b;
          color: #ffffff;
        }

        .jd-danger {
          background: #ef4444;
          color: #ffffff;
        }

        .jd-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .jd-stat {
          background: #ffffff;
          border-radius: 10px;
          padding: 18px;
          min-height: 108px;
          border-left: 5px solid #64748b;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }

        .jd-stat span {
          color: #6b7280;
          font-size: 14px;
          font-weight: 700;
        }

        .jd-stat h3 {
          margin: 12px 0 0;
          font-size: 25px;
          line-height: 1.1;
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
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .jd-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
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
          grid-template-columns: repeat(2, 1fr);
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
        }

        .jd-table {
          width: 100%;
          min-width: 720px;
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
        }

        @media (max-width: 1100px) {
          .jd-stats {
            grid-template-columns: repeat(2, minmax(160px, 1fr));
          }

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

          .jd-stats,
          .jd-mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}