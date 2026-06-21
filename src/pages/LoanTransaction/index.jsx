"use client";

import React, { useMemo, useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoanReport_Search,LoanOutstandingCalculate } from "@/lib/services/ReportsService";
import { CustomerMaster_Manage, GetLoan_Masters } from "@/lib/services/MasterService";
import { LoanTransaction_Manage } from "@/lib/services/TransactionsService";
import Select from "react-select";
import Swal from "sweetalert2";
import {
  FaCheck,
  FaChevronDown,
  FaExchangeAlt,
  FaFileInvoice,
  FaHistory,
  FaList,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

const emptyLoan = {
  LoanId: "",
  CustomerName: "",
  LoanStatus: "",
  LoanType: "",
  MetalType: "",
  Amount: "",
  OutstandingAmount: "",
  StartDate: "",
  EndDate: "",
};

export default function LoanTransaction() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [loanNumber, setLoanNumber] = useState("");
  const [loans, setLoans] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(emptyLoan);
  const [transactionType, setTransactionType] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(toInputDate(new Date()));
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [customerList, setCustomerList] = useState([]);
  const [CustomerId, setCustomerId] = useState("");
  const loanId = getValue(selectedLoan, ["LoanId", "loanId", "LoanNo", "LoanNumber"]);
  const loanAmount = Number(getValue(selectedLoan, ["Amount", "LoanAmount"], 0)) || 0;

  const [loanOutstanding, setLoanOutstanding] = useState(null);
  const [loanSummary, setLoanSummary] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
const [summaryOpen, setSummaryOpen] = useState(false);
  const [masterData, setMasterData] = useState({
    loanTransactionType: [],
  });

  const outstandingAmount = Number(loanOutstanding?.TotalOutstandingPrincipal) || 0;
  const balanceAmount = Math.max(outstandingAmount - (Number(paymentAmount) || 0), 0);
  const showBalanceRow = ["Settlement", "Close Loan"].includes(transactionType);
  const showInterestRow = transactionType === "Make Payment";

  const loadLoans = async (searchLoanId = "") => {
    try {
      setLoading(true);
      const payload = {
        LoanId: searchLoanId ? Number(searchLoanId) : null,
        CustomerId: CustomerId ? Number(CustomerId) : null,
        LoanType: null,
        LoanStatus: null,
        MetalType: null,
        FromDate: null,
        ToDate: null,
        AmountFrom: null,
        AmountTo: null,
        PageNo: 1,
        PageSize: searchLoanId ? 1 : 50,
      };

      const response = await LoanReport_Search(payload);
      const data = response?.data || [];
      setLoans(data);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const customerText = customerSearch.trim().toLowerCase();
    const loanText = loanNumber.trim();

    if (loanText && Number.isNaN(Number(loanText))) {
      Swal.fire("Validation", "Please enter valid Loan ID", "warning");
      return;
    }
debugger
    if (!customerText && !loanText) {
      const data = await loadLoans();
      setLoans(data);
      setSearched(true);
      setSelectedLoan(emptyLoan);
      setTransactionHistory([]);
      return;
    }

    const data = await loadLoans(loanText);
    const filtered = customerText
      ? data.filter((item) => {
          const name = String(getValue(item, ["CustomerName", "customerName"], "")).toLowerCase();
          const customerId = String(getValue(item, ["CustomerCode", "CustomerId", "customerCode"], "")).toLowerCase();
          const mobile = String(getValue(item, ["MobileNo", "Mobile", "mobileNo"], "")).toLowerCase();
          return name.includes(customerText) || customerId.includes(customerText) || mobile.includes(customerText);
        })
      : data;

    setLoans(filtered);
    setSearched(true);
    setSelectedLoan(emptyLoan);
    setTransactionHistory([]);

    if (filtered.length === 0) {
      Swal.fire("Not Found", "Koi loan nahi mila", "warning");
    }
  };

  const selectLoan = async (loan) => {
  const id = getValue(loan, [
    "LoanId",
    "loanId",
    "LoanNo",
    "LoanNumber",
  ]);
debugger
  if (!id) {
    setSelectedLoan(loan || emptyLoan);
    setLoanOutstanding(null);
    setLoanSummary([]);
    setTransactionHistory([]);
    return;
  }

  const nextLoan = loan || emptyLoan;

  setSelectedLoan(nextLoan);
  setTransactionType("");
  setPaymentAmount("");
  setRemarks("");
  setPaymentDate(toInputDate(new Date()));
  setHistoryOpen(false);

  await loadLoanOutstanding(nextLoan);
};

  // ✅ FIX: was calling an undefined function (LoanTransactionsDetail_Manage)
  // Now correctly calls LoanOutstandingCalculate and binds all 3 pieces of data
  const loadTransactionHistory = async (loan) => {
    try {
      const id = getValue(loan, ["LoanId", "loanId", "LoanNo", "LoanNumber"]);

      if (!id) {
        setLoanOutstanding(null);
        setLoanSummary([]);
        setTransactionHistory([]);
        return;
      }
debugger
      const response = await LoanOutstandingCalculate({
        LoanId: Number(id),
      });

      const data = response?.data;

      setLoanOutstanding(data?.loanOutStanding || null);
      setLoanSummary(data?.loanSummary || []);
      setTransactionHistory(data?.loanTransaction || []);
    } catch (error) {
      console.error(error);
      setLoanOutstanding(null);
      setLoanSummary([]);
      setTransactionHistory([]);
    }
  };

  const handleSaveTransaction = async () => {
    debugger
    if (!loanId) {
      Swal.fire("Validation", "Please search and select a loan first", "warning");
      return;
    }

    if (!transactionType) {
      Swal.fire("Validation", "Transaction type is required", "warning");
      return;
    }

    if (!paymentDate) {
      Swal.fire("Validation", "Transaction date is required", "warning");
      return;
    }

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      Swal.fire("Validation", "Transaction amount is required", "warning");
      return;
    }

    try {
      setSaving(true);
debugger
      const response = await LoanTransaction_Manage({
        LoanId: Number(loanId),
        TransactionTypeId: Number(transactionType),
        InterestRate: 5,
        TransactionDate: paymentDate,
        Amount: Number(paymentAmount),
        Description: remarks,
        TypeId: "1",
      });

      if (response?.code === 1 || response?.data?.[0]?.Code === 1) {
        Swal.fire(
          "Saved!",
          response?.data?.[0]?.Message || "Transaction saved successfully.",
          "success"
        );

        resetTransactionForm();

        // ✅ FIX: refresh outstanding/summary/history from the same API after save
        await loadTransactionHistory(selectedLoan);
      } else {
        Swal.fire(
          "Error",
          response?.message || response?.data?.[0]?.Message || "Save failed",
          "error"
        );
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong while saving transaction.", "error");
    } finally {
      setSaving(false);
    }
  };

  const resetTransactionForm = () => {
    setTransactionType("");
    setPaymentAmount("");
    setPaymentDate(toInputDate(new Date()));
    setRemarks("");
  };

  const loadLoanOutstanding = async (loan) => {
  try {
    const loanId = getValue(loan, [
      "LoanId",
      "loanId",
      "LoanNo",
      "LoanNumber",
    ]);

    if (!loanId) {
      setLoanOutstanding(null);
      setLoanSummary([]);
      setTransactionHistory([]);
      return;
    }

    const response = await LoanOutstandingCalculate({
      loanId: Number(loanId),
      closerDate: "2026-12-31T00:00:00" // ya selected date
    });

    if (response?.code === 1 && response?.data) {
      setLoanOutstanding(response.data.loanOutStanding || null);
      setLoanSummary(response.data.loanSummary || []);
      setTransactionHistory(response.data.loanTransaction || []);
    } else {
      setLoanOutstanding(null);
      setLoanSummary([]);
      setTransactionHistory([]);
    }
  } catch (error) {
    console.error(error);

    setLoanOutstanding(null);
    setLoanSummary([]);
    setTransactionHistory([]);
  }
};

  const clearAll = () => {
    setCustomerSearch("");
    setLoanNumber("");
    setLoans([]);
    setSearched(false);
    setSelectedLoan(emptyLoan);
    setTransactionHistory([]);
    setLoanOutstanding(null);
    setLoanSummary([]);
    resetTransactionForm();
  };

  const loadCustomerList = async () => {
    try {
      const payload = {
        CustomerCode: "",
        customerName: "",
        mobileNo: "",
        email: "",
        address: "",
        city: "",
        pincode: 0,
        typeId: 4,
      };
      const res = await CustomerMaster_Manage(payload);
      return res?.data || [];
    } catch (err) {
      console.error("Error loading customers", err);
      return [];
    }
  };

  const loadMasters = async () => {
    try {
      const response = await GetLoan_Masters();
      if (response?.code === 1) {
        setMasterData({
          loanTransactionType: response.data.loanTransactionType || [],
        });
      }
    } catch (error) {
      console.error("Master API Error:", error);
    }
  };

  useEffect(() => {
    (async () => {
      const list = await loadCustomerList();
      setCustomerList(list);
      loadMasters();
    })();
  }, []);

  return (
    <ProtectedRoute>
      <div className="loanTxnPage">
        <div className="loanSearchCard">
          <div className="sectionTitle">
            <FaSearch />
            Search Loan
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Customer Search</label>
              <Select
                options={customerList.map((item) => ({
                  value: item.CustomerId,
                  label: `${item.CustomerName} | ${item.MobileNo} | ${item.CustomerCode}`,
                }))}
                value={
                  customerList
                    .map((item) => ({
                      value: item.CustomerId,
                      label: `${item.CustomerName} (${item.MobileNo})`,
                    }))
                    .find((c) => c.value === CustomerId) || null
                }
                onChange={(selected) => {
                  setCustomerId(selected?.value || "");
                }}
                placeholder="Search Customer..."
                isClearable
              />
              <div className="searchHint">
                <span>Name</span>
                <span>Customer ID</span>
                <span>Mobile No.</span>
              </div>
            </div>

            <div className="orDivider">OR</div>

            <div className="form-group">
              <label>Loan ID</label>
              <input
                value={loanNumber}
                onChange={(event) => setLoanNumber(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                placeholder="Enter Loan ID"
                autoComplete="off"
              />
              <div className="searchHint">
                <span>Loan ID</span>
              </div>
            </div>
          </div>

          <div className="actionRow">
            <button className="btnSearch" onClick={handleSearch} disabled={loading}>
              <FaSearch />
              {loading ? "Searching..." : "Search"}
            </button>
            <button className="btnClear" onClick={clearAll}>
              Clear
            </button>
          </div>
        </div>

        {searched && (
  <div className="loanResultCard">
    <div className="sectionTitle sectionTitleInline">
      <span>
        <FaList />
        Loan Results
      </span>
      <small>({loans.length} found)</small>
    </div>

    <div className="listHeader">
      <span>Loan / Customer</span>
      <span>Loan Type / Mobile</span>
      <span>Loan Amount</span>
      <span>Paid Amount</span>
      <span>Status</span>
      <span>Action</span>
    </div>

    <div className="loanList">
      {loans.length === 0 ? (
        <div className="emptyState">Koi loan nahi mila.</div>
      ) : (
        loans.map((loan, index) => {
          const id = getValue(
            loan,
            ["LoanId", "loanId", "LoanNo", "LoanNumber"],
            index
          );

          const isSelected = String(loanId) === String(id);

          const status = getValue(
            loan,
            ["LoanStatus", "Status"],
            "Active"
          );

          return (
            <div
              key={id}
              className={`loanItem ${isSelected ? "selected" : ""}`}
              onClick={() => selectLoan(loan)}
            >
              <div className="lv">
                {id} |{" "}
                {getValue(
                  loan,
                  ["CustomerName", "customerName"],
                  "-"
                )}{" "}
                |{" "}
                {getValue(
                  loan,
                  ["CustomerCode", "CustomerId"],
                  "-"
                )}
              </div>

              <div className="lv">
                {getValue(
                  loan,
                  ["LoanType", "LoanName"],
                  "-"
                )}{" "}
                |{" "}
                {getValue(
                  loan,
                  ["MobileNo", "Mobile"],
                  "-"
                )}
              </div>

              <div className="lv">
                {formatCurrency(
                  getValue(loan, ["TotalLoanAmt"], 0)
                )}
              </div>

              <div className="lv">
                {formatCurrency(
                  getValue(loan, ["TotalAmtPaid"], 0)
                )}
              </div>

              <div>
                <span
                  className={
                    String(status)
                      .toLowerCase()
                      .includes("pending")
                      ? "badgePending"
                      : "badgeActive"
                  }
                >
                  {status}
                </span>
              </div>

              <button
                type="button"
                className={`selectBtn ${
                  isSelected ? "active" : ""
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  selectLoan(loan);
                }}
              >
                {isSelected ? "Selected" : "Select"}
              </button>
            </div>
          );
        })
      )}
    </div>
  </div>
)}

        {loanId && (
          <div className="loanPanel">
            <div className="selectedLoanBar">
              <span>Outstanding Principal:</span>
              <strong>{loanOutstanding?.TotalOutstandingPrincipal ?? 0}</strong>

              <span>Interest:</span>
              <strong>{loanOutstanding?.TotalInterestDue ?? 0}</strong>

              <span>Total Payable:</span>
              <strong>{loanOutstanding?.TotalNetPayable ?? 0}</strong>
            </div>

            <div className="sectionTitle">
              <FaExchangeAlt />
              New Transaction
            </div>

            <div className="formGrid">
              <div className="fieldGroup">
                <label>Transaction Type *</label>
                <select
                  value={transactionType}
                  onChange={(event) => setTransactionType(event.target.value)}
                >
                  <option value="">-- Select Type --</option>
                  {masterData.loanTransactionType.map((item) => (
                    <option key={item.TransactionTypeId} value={item.TransactionTypeId}>
                      {item.TransactionTypeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fieldGroup">
                <label>Transaction Date *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </div>

              <div className="fieldGroup">
                <label>Transaction Amount (Rs.) *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div className="fieldGroup">
                <label>Outstanding Amount (Rs.)</label>
                <input value={loanOutstanding?.TotalNetPayable || 0} disabled />
              </div>

              {showBalanceRow && (
                <div className="fieldGroup">
                  <label>
                    {transactionType === "Settlement" ? "Waiver Amount (Rs.)" : "Write-off Amount (Rs.)"}
                  </label>
                  <input value={balanceAmount} disabled />
                </div>
              )}

              {showInterestRow && (
                <div className="fieldGroup">
                  <label>Interest Rate (% p.a.)</label>
                  <input value={getValue(selectedLoan, ["InterestRate", "Rate"], "")} disabled />
                  <span className="subNote">Loan ke time ki rate</span>
                </div>
              )}

              <div className="fieldGroup fullField">
                <label>Remarks</label>
                <input
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Optional remarks"
                />
              </div>
            </div>

            <div className="loanActions">
              <button className="loanPrimaryBtn" onClick={handleSaveTransaction} disabled={saving}>
                <FaCheck />
                {saving ? "Submitting..." : "Submit"}
              </button>
              <button className="loanSecondaryBtn" onClick={resetTransactionForm}>
                <FaTimes />
                Cancel
              </button>
            </div>

            <hr className="loanDivider" />

            {/* ✅ Loan Summary (tranche-wise interest segments) */}
            {/* Loan Summary */}
{loanSummary.length > 0 && (
  <>
    <div
      className="historyHeader"
      onClick={() => setSummaryOpen(!summaryOpen)}
    >
      <span>
        <FaFileInvoice />
        Loan Summary
      </span>

      <FaChevronDown
        className={summaryOpen ? "chevronIcon open" : "chevronIcon"}
      />
    </div>

    {summaryOpen && (
      <div className="loanTableWrap">
        <table className="historyTable">
          <thead>
            <tr>
              <th>Tranche</th>
              <th>Interest Type</th>
              <th>Rate (%)</th>
              <th>Segment Start</th>
              <th>Segment End</th>
              <th>Outstanding Principal</th>
              <th>Months</th>
              <th>Interest Amount</th>
            </tr>
          </thead>

          <tbody>
            {loanSummary.length === 0 ? (
              <tr>
                <td colSpan="8" className="emptyCell">
                  No summary available
                </td>
              </tr>
            ) : (
              loanSummary.map((item, index) => (
                <tr key={index}>
                  <td>{item.TrancheId}</td>
                  <td>{item.InterestType}</td>
                  <td>{item.InterestRate}%</td>
                  <td>{formatDisplayDate(item.SegmentStartDate)}</td>
                  <td>{formatDisplayDate(item.SegmentEndDate)}</td>
                  <td>
                    {formatCurrency(item.OutstandingPrincipal)}
                  </td>
                  <td>{item.EffectiveMonths ?? "-"}</td>
                  <td>
                    {formatCurrency(item.InterestAmount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )}
  </>
)}

            <div className="historyHeader" onClick={() => setHistoryOpen(!historyOpen)}>
              <span>
                <FaHistory />
                Transaction History
              </span>
              <FaChevronDown className={historyOpen ? "chevronIcon open" : "chevronIcon"} />
            </div>

            {historyOpen && (
              <div className="loanTableWrap">
                {/* ✅ FIX: thead/tbody columns now match (Tranche, Date, Interest Type, Rate, Original Principal, Outstanding, Total Interest) */}
                <table className="historyTable">
                  <thead>
                    <tr>
                      <th>Tranche</th>
                      <th>Start Date</th>
                      <th>Interest Type</th>
                      <th>Rate (%)</th>
                      <th>Original Principal</th>
                      <th>Outstanding Principal</th>
                      <th>Total Interest</th>
                    </tr>
                  </thead>
                  <tbody>
  {transactionHistory.map((item, index) => (
    <tr key={index}>
      <td>{item.TrancheId}</td>
      <td>{formatDisplayDate(item.StartDate)}</td>
      <td>{item.InterestType}</td>
      <td>{item.InterestRate}%</td>
      <td>{item.OriginalPrincipal}</td>
      <td>{item.FinalOutstandingPrincipal}</td>
      <td>{item.TrancheTotalInterest}</td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function getValue(source, keys, fallback = "") {
  if (!source) return fallback;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  return fallback;
}

function toInputDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function formatDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN");
}
