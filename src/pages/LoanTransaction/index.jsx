"use client";

import React, { useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoanReport_Search } from "@/lib/services/ReportsService";
import {
  LoanEntry_Manage,
  LoanTransaction_Manage,
} from "@/lib/services/TransactionsService";
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

const transactionTypes = [
  "Receive Payment",
  "Make Payment",
  "Settlement",
  "Close Loan",
];

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
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [transactionType, setTransactionType] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(toInputDate(new Date()));
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loanId = getValue(selectedLoan, ["LoanId", "loanId", "LoanNo", "LoanNumber"]);
  const loanAmount = Number(getValue(selectedLoan, ["Amount", "LoanAmount"], 0)) || 0;

  const totalReceived = useMemo(
    () => sumByType(transactionHistory, ["Receive Payment", "Received", "Receipt"]),
    [transactionHistory]
  );

  const totalPaid = useMemo(
    () => sumByType(transactionHistory, ["Make Payment", "Paid", "Payment"]),
    [transactionHistory]
  );

  const outstandingAmount =
    Number(
      getValue(selectedLoan, [
        "OutstandingAmount",
        "Outstanding",
        "BalanceAmount",
        "PendingAmount",
      ])
    ) || Math.max(loanAmount - totalReceived + totalPaid, 0);

  const balanceAmount = Math.max(outstandingAmount - (Number(paymentAmount) || 0), 0);
  const showBalanceRow = ["Settlement", "Close Loan"].includes(transactionType);
  const showInterestRow = transactionType === "Make Payment";

  const loadLoans = async (searchLoanId = "") => {
    try {
      setLoading(true);

      const payload = {
        LoanId: searchLoanId ? Number(searchLoanId) : null,
        CustomerId: null,
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
    const id = getValue(loan, ["LoanId", "loanId", "LoanNo", "LoanNumber"]);

    if (!id) {
      setSelectedLoan(loan || emptyLoan);
      setTransactionHistory([]);
      return;
    }

    const details = await loadLoanDetails(id);
    const nextLoan = details || loan || emptyLoan;
    setSelectedLoan(nextLoan);
    setTransactionType("");
    setPaymentAmount("");
    setRemarks("");
    setPaymentDate(toInputDate(new Date()));
    setHistoryOpen(false);
    await loadTransactionHistory(nextLoan);
  };

  const loadLoanDetails = async (id) => {
    try {
      const formData = new FormData();
      formData.append("LoanId", id.toString());
      formData.append("TypeId", "5");

      const response = await LoanEntry_Manage(formData);
      return response?.data?.[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const loadTransactionHistory = async (loan) => {
    try {
      const customerCode = getValue(loan, ["CustomerCode", "CustomerId", "customerCode"]);

      if (!customerCode) {
        setTransactionHistory([]);
        return;
      }

      const formData = new FormData();
      formData.append("CustomerCode", customerCode.toString());
      formData.append("TypeId", "4");

      const response = await LoanEntry_Manage(formData);
      const data = response?.data || [];
      const id = getValue(loan, ["LoanId", "loanId", "LoanNo", "LoanNumber"]);

      setTransactionHistory(
        data.filter((item) => String(getValue(item, ["LoanId", "loanId"])) === String(id))
      );
    } catch (error) {
      console.error(error);
      setTransactionHistory([]);
    }
  };

  const handleSaveTransaction = async () => {
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

    if (!paymentAmount) {
      Swal.fire("Validation", "Transaction amount is required", "warning");
      return;
    }

    try {
      setSaving(true);

      const response = await LoanTransaction_Manage({
        LoanId: Number(loanId),
        TransactionType: transactionType,
        Amount: Number(paymentAmount),
        TransactionDate: paymentDate,
        Remarks: remarks,
        TypeId: 1,
      });

      if (response?.code === 1 || response?.data?.[0]?.Code === 1) {
        Swal.fire("Saved!", response?.data?.[0]?.Message || "Transaction saved", "success");
        resetTransactionForm();
        const latestLoan = await loadLoanDetails(loanId);
        setSelectedLoan(latestLoan || selectedLoan);
        await loadTransactionHistory(latestLoan || selectedLoan);
      } else {
        Swal.fire(
          "Error",
          response?.message || response?.data?.[0]?.Message || "Save failed",
          "error"
        );
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong", "error");
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

  const clearAll = () => {
    setCustomerSearch("");
    setLoanNumber("");
    setLoans([]);
    setSearched(false);
    setSelectedLoan(emptyLoan);
    setTransactionHistory([]);
    resetTransactionForm();
  };

  return (
    <ProtectedRoute>
      <div className="loanTxnPage">
        <div className="loanSearchCard">
          <div className="sectionTitle">
            <FaSearch />
            Search Loan
          </div>

          <div className="searchGrid">
            <div className="fieldGroup">
              <label>Customer Search</label>
              <input
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                placeholder="Name, Customer ID ya Mobile No."
                autoComplete="off"
              />
              <div className="searchHint">
                <span>Name</span>
                <span>Customer ID</span>
                <span>Mobile No.</span>
              </div>
            </div>

            <div className="orDivider">OR</div>

            <div className="fieldGroup">
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
              <span>Loan ID / Customer</span>
              <span>Loan Type</span>
              <span>Outstanding</span>
              <span>Status</span>
              <span />
            </div>

            <div className="loanList">
              {loans.length === 0 ? (
                <div className="emptyState">Koi loan nahi mila.</div>
              ) : (
                loans.map((loan, index) => {
                  const id = getValue(loan, ["LoanId", "loanId", "LoanNo", "LoanNumber"], index);
                  const isSelected = String(loanId) === String(id);
                  const status = getValue(loan, ["LoanStatus", "Status"], "Active");

                  return (
                    <div
                      key={id}
                      className={`loanItem ${isSelected ? "selected" : ""}`}
                      onClick={() => selectLoan(loan)}
                    >
                      <div>
                        <div className="lv">{id}</div>
                        <div className="ll">
                          {getValue(loan, ["CustomerName", "customerName"], "-")} | {getValue(loan, ["CustomerCode", "CustomerId"], "-")}
                        </div>
                      </div>

                      <div>
                        <div className="lv">{getValue(loan, ["LoanType", "LoanName"], "-")}</div>
                        <div className="ll">{getValue(loan, ["MobileNo", "Mobile"], "")}</div>
                      </div>

                      <div>
                        <div className="lv">
                          {formatCurrency(getValue(loan, ["OutstandingAmount", "Outstanding", "Amount"], 0))}
                        </div>
                        <div className="ll">Outstanding</div>
                      </div>

                      <div>
                        <span className={String(status).toLowerCase().includes("pending") ? "badgePending" : "badgeActive"}>
                          {status}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`selectBtn ${isSelected ? "active" : ""}`}
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
              <FaFileInvoice />
              <strong>{loanId}</strong>
              <span>|</span>
              <span>{getValue(selectedLoan, ["CustomerName", "customerName"], "-")}</span>
              <span>|</span>
              <span>Outstanding:</span>
              <strong>{formatCurrency(outstandingAmount)}</strong>
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
                  {transactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
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
                <input value={outstandingAmount} disabled />
              </div>

              {showBalanceRow && (
                <div className="fieldGroup">
                  <label>{transactionType === "Settlement" ? "Waiver Amount (Rs.)" : "Write-off Amount (Rs.)"}</label>
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

            <div className="historyHeader" onClick={() => setHistoryOpen(!historyOpen)}>
              <span>
                <FaHistory />
                Transaction History
              </span>
              <FaChevronDown className={historyOpen ? "chevronIcon open" : "chevronIcon"} />
            </div>

            {historyOpen && (
              <div className="loanTableWrap">
                <table className="historyTable">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionHistory.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="emptyCell">
                          Koi history nahi hai.
                        </td>
                      </tr>
                    ) : (
                      transactionHistory.map((item, index) => (
                        <tr key={index}>
                          <td>{formatDisplayDate(getValue(item, ["TransactionDate", "Date", "CreatedDate"]))}</td>
                          <td>{getValue(item, ["TransactionType", "Type"], "-")}</td>
                          <td>{formatCurrency(getValue(item, ["Amount", "TransactionAmount"], 0))}</td>
                          <td>{formatCurrency(getValue(item, ["OutstandingAmount", "Outstanding", "BalanceAmount"], 0))}</td>
                          <td>
                            <span className="badgeActive">{getValue(item, ["Status", "TransactionStatus"], "Completed")}</span>
                          </td>
                        </tr>
                      ))
                    )}
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

function sumByType(items, typeNames) {
  return items.reduce((sum, item) => {
    const type = String(getValue(item, ["TransactionType", "Type"], "")).toLowerCase();
    const isMatch = typeNames.some((name) => type.includes(String(name).toLowerCase()));
    return isMatch ? sum + (Number(getValue(item, ["Amount", "TransactionAmount"], 0)) || 0) : sum;
  }, 0);
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
