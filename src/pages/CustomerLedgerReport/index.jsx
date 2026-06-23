"use client";
import React, { useState, useEffect, useRef } from "react";
import { CustomerLedger_Report } from "@/lib/services/ReportsService";
import { CustomerMaster_Manage } from "@/lib/services/MasterService";
import { CustomerLedger_Manage } from "@/lib/services/TransactionsService";
import Select from "react-select";
import ProtectedRoute from "@/components/ProtectedRoute";

const CustomerLedgerReport = () => {

  // ── Filter States ──────────────────────────────────────────────────────────
  const [customerList, setCustomerList]               = useState([]);
  const [CustomerCode, setCustomerCode]               = useState("");
  const [fromDate, setFromDate]                       = useState("");
  const [toDate, setToDate]                           = useState("");
  const [transactionType, setTransactionType]         = useState("");
  const [reportType, setReportType]                   = useState("1");   // 1=Detail, 2=Summary
  const [transactionTypeList, setTransactionTypeList] = useState([]);

  // ── Report Data ────────────────────────────────────────────────────────────
  const [reportData, setReportData]   = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [searched, setSearched]       = useState(false);

  const printRef = useRef(null);

  // ── Load Masters ───────────────────────────────────────────────────────────
  const loadCustomerList = async () => {
    try {
      const payload = {
        CustomerCode: "", customerName: "", mobileNo: "",
        email: "", address: "", city: "", pincode: 0, typeId: 4,
      };
      const res = await CustomerMaster_Manage(payload);
      setCustomerList(res?.data || []);
    } catch (err) {
      console.error("Error loading customers", err);
    }
  };

  const loadTransactionTypeList = async () => {
    try {
      const response = await CustomerLedger_Manage({ TypeId: 6 });
      setTransactionTypeList(response?.data || []);
    } catch (error) {
      console.error("Error loading transaction types", error);
    }
  };

  useEffect(() => {
    loadCustomerList();
    loadTransactionTypeList();
  }, []);

  // ── Search / Generate Report ───────────────────────────────────────────────
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setReportData([]);

      const payload = {
        CustomerCode:    CustomerCode || null,
        FromDate:        fromDate     || null,
        ToDate:          toDate       || null,
        TransactionType: transactionType ? Number(transactionType) : null,
        TypeId:          Number(reportType),
      };
debugger
      const response = await CustomerLedger_Report(payload);
      setReportData(response?.data || []);
      setSearched(true);
    } catch (error) {
      console.error("Report error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reset Filters ──────────────────────────────────────────────────────────
  const handleReset = () => {
    setCustomerCode("");
    setFromDate("");
    setToDate("");
    setTransactionType("");
    setReportType("1");
    setReportData([]);
    setSearched(false);
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Customer Ledger Report</title>
          <style>
            body        { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
            h2          { text-align: center; margin-bottom: 4px; }
            .sub-title  { text-align: center; color: #555; margin-bottom: 16px; font-size: 11px; }
            table       { width: 100%; border-collapse: collapse; }
            th, td      { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            th          { background: #f0f0f0; font-weight: bold; }
            .cr         { color: green; font-weight: 600; }
            .dr         { color: red;   font-weight: 600; }
            .bal-pos    { color: green; font-weight: 700; }
            .bal-neg    { color: red;   font-weight: 700; }
            .summary-row td { font-weight: bold; background: #fafafa; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  // ── Summary Totals ─────────────────────────────────────────────────────────
  const totalCR      = reportData.reduce((s, r) => s + (parseFloat(r.CRAmount      || r.TotalCRAmount)      || 0), 0);
  const totalDR      = reportData.reduce((s, r) => s + (parseFloat(r.DRAmount      || r.TotalDRAmount)      || 0), 0);
  const closingTotal = reportData.reduce((s, r) => s + (parseFloat(r.RunningBalance || r.ClosingBalance)    || 0), 0);

  // ── Selected customer label ────────────────────────────────────────────────
  const selectedCustomerLabel = customerList.find((c) => c.CustomerCode === CustomerCode);

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div className="content-wrapper">

        {/* ── Filter Card ── */}
        <div className="form-card">
          <h2>Customer Ledger Report</h2>
          <hr />

          {/* Row 1: Customer | Report Type */}
          <div className="form-row">
            <div className="form-group">
              <label>Customer</label>
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
                onChange={(selected) => setCustomerCode(selected?.value || "")}
                placeholder="All Customers"
                isClearable
              />
            </div>

            <div className="form-group">
              <label>Report Type</label>
              <select
                className="dropdown-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="1">Detail Report</option>
                <option value="2">Summary Report</option>
              </select>
            </div>
          </div>

          {/* Row 2: From Date | To Date */}
          <div className="form-row">
            <div className="form-group">
              <label>From Date</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>To Date</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Transaction Type */}
          <div className="form-row">
            <div className="form-group">
              <label>Transaction Type</label>
              <select
                className="dropdown-select"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
              >
                <option value="">All Types</option>
                {transactionTypeList.map((item) => (
                  <option key={item.TransactionTypeId} value={item.TransactionTypeId}>
                    {item.TransactionType}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" />
          </div>

          {/* Buttons */}
          <div className="btn-group">
            <button className="btn-primary" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Loading..." : "Search"}
            </button>
            {reportData.length > 0 && (
              <button className="btn-primary" onClick={handlePrint}>
                🖨️ Print
              </button>
            )}
            <button className="btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        {/* ── Report Table ── */}
        {searched && (
          <div className="table-card" style={{ marginTop: "20px" }}>

            {/* Printable area */}
            <div ref={printRef}>

              <h2 style={{ textAlign: "center", marginBottom: "4px" }}>
                Jewellery — Customer Ledger Report
              </h2>
              <p className="sub-title" style={{ textAlign: "center", color: "#555", fontSize: "12px", marginBottom: "12px" }}>
                {selectedCustomerLabel
                  ? `Customer: ${selectedCustomerLabel.CustomerName} | ${selectedCustomerLabel.MobileNo}`
                  : "All Customers"}
                {fromDate ? ` | From: ${fromDate}` : ""}
                {toDate   ? ` | To: ${toDate}`     : ""}
                {` | Type: ${reportType === "1" ? "Detail" : "Summary"}`}
              </p>

              {reportData.length === 0 ? (
                <p style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                  No records found for selected filters.
                </p>
              ) : reportType === "1" ? (
                /* ── Detail Table ── */
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: "950px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ whiteSpace: "nowrap" }}>Sr No</th>
                        <th style={{ whiteSpace: "nowrap" }}>Trans ID</th>
                        <th style={{ whiteSpace: "nowrap" }}>Customer</th>
                        <th style={{ whiteSpace: "nowrap" }}>Mobile</th>
                        <th style={{ whiteSpace: "nowrap" }}>Date</th>
                        <th style={{ whiteSpace: "nowrap" }}>Trans Type</th>
                        <th style={{ whiteSpace: "nowrap" }}>CR Amount (₹)</th>
                        <th style={{ whiteSpace: "nowrap" }}>DR Amount (₹)</th>
                        <th style={{ whiteSpace: "nowrap" }}>Running Balance (₹)</th>
                        <th style={{ minWidth: "160px" }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((item, index) => (
                        <tr key={item.TransId || index}>
                          <td style={{ whiteSpace: "nowrap" }}>{item.SrNo || index + 1}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{item.TransId}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{item.CustomerName}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{item.MobileNo}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{item.TransactionDate?.split("T")[0]}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{item.TransactionTypeName}</td>
                          <td style={{ whiteSpace: "nowrap", color: "green", fontWeight: "600" }}>
                            {parseFloat(item.CRAmount || 0).toFixed(2)}
                          </td>
                          <td style={{ whiteSpace: "nowrap", color: "red", fontWeight: "600" }}>
                            {parseFloat(item.DRAmount || 0).toFixed(2)}
                          </td>
                          <td style={{
                            whiteSpace: "nowrap",
                            fontWeight: "700",
                            color: parseFloat(item.RunningBalance) < 0 ? "red" : "green"
                          }}>
                            {parseFloat(item.RunningBalance || 0).toFixed(2)}
                          </td>
                          <td>{item.Description}</td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Footer Totals */}
                    <tfoot>
                      <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                        <td colSpan="6" style={{ textAlign: "right", padding: "8px" }}>Total</td>
                        <td style={{ color: "green" }}>₹ {totalCR.toFixed(2)}</td>
                        <td style={{ color: "red"   }}>₹ {totalDR.toFixed(2)}</td>
                        <td style={{ color: closingTotal < 0 ? "red" : "green" }}>
                          ₹ {closingTotal.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                /* ── Summary Table ── */
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ whiteSpace: "nowrap" }}>Sr No</th>
                        <th style={{ whiteSpace: "nowrap" }}>Customer Code</th>
                        <th style={{ whiteSpace: "nowrap" }}>Customer Name</th>
                        <th style={{ whiteSpace: "nowrap" }}>Mobile</th>
                        <th style={{ whiteSpace: "nowrap" }}>Total Trans</th>
                        <th style={{ whiteSpace: "nowrap" }}>Total CR (₹)</th>
                        <th style={{ whiteSpace: "nowrap" }}>Total DR (₹)</th>
                        <th style={{ whiteSpace: "nowrap" }}>Closing Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((item, index) => (
                        <tr key={item.CustomerCode || index}>
                          <td>{item.SrNo || index + 1}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{item.CustomerCode}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{item.CustomerName}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{item.MobileNo}</td>
                          <td style={{ whiteSpace: "nowrap", textAlign: "center" }}>{item.TotalTransactions}</td>
                          <td style={{ whiteSpace: "nowrap", color: "green", fontWeight: "600" }}>
                            {parseFloat(item.TotalCRAmount || 0).toFixed(2)}
                          </td>
                          <td style={{ whiteSpace: "nowrap", color: "red", fontWeight: "600" }}>
                            {parseFloat(item.TotalDRAmount || 0).toFixed(2)}
                          </td>
                          <td style={{
                            whiteSpace: "nowrap",
                            fontWeight: "700",
                            color: parseFloat(item.ClosingBalance) < 0 ? "red" : "green"
                          }}>
                            {parseFloat(item.ClosingBalance || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Footer Totals */}
                    <tfoot>
                      <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                        <td colSpan="5" style={{ textAlign: "right", padding: "8px" }}>Total</td>
                        <td style={{ color: "green" }}>₹ {totalCR.toFixed(2)}</td>
                        <td style={{ color: "red"   }}>₹ {totalDR.toFixed(2)}</td>
                        <td style={{ color: closingTotal < 0 ? "red" : "green" }}>
                          ₹ {closingTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            {/* /printRef */}

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

export default CustomerLedgerReport;
