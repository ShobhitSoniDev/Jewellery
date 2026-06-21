"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoanReport_Search, LoanOutstandingCalculate } from "@/lib/services/ReportsService";
import { CustomerMaster_Manage, GetLoan_Masters } from "@/lib/services/MasterService";
import { LoanTransaction_Manage, LoanEntry_Manage } from "@/lib/services/TransactionsService";
import LoanDetailViewModal from "@/components/CommonView/LoanDetailView";
import Select from "react-select";
import Swal from "sweetalert2";
import {
  FaChevronDown,
  FaFileInvoice,
  FaHistory,
  FaList,
  FaSearch,
  FaMoneyBill,
} from "react-icons/fa";

// Transaction Type IDs (from master)
const TXN_TYPE_MAKE_PAYMENT = 2;
const TXN_TYPE_SETTLEMENT = 3;
const TXN_TYPE_CLOSE_LOAN = 4;

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
  const [editingTransactionId, setEditingTransactionId] = useState(0);
  const [loanOutstanding, setLoanOutstanding] = useState(null);
  const [loanSummary, setLoanSummary] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [loanResultsOpen, setLoanResultsOpen] = useState(true);
  const [interestRate, setInterestRate] = useState("");
  const [transactionMinDate, setTransactionMinDate] = useState("");

  // ✅ FIX: separate state for the "View" modal so it never overwrites the
  // actively selected loan (selectedLoan) used to drive the whole page.
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLoanData, setViewLoanData] = useState(null);

  const [masterData, setMasterData] = useState({
    loanTransactionType: [],
  });

  const loanId = getValue(selectedLoan, ["LoanId", "loanId", "LoanNo", "LoanNumber"]);

  const outstandingAmount = Number(loanOutstanding?.TotalNetPayable) || 0;
  const balanceAmount = Math.max(outstandingAmount - (Number(paymentAmount) || 0), 0);

  const showInterestRow = Number(transactionType) === TXN_TYPE_MAKE_PAYMENT;
  const showBalanceRow =
    Number(transactionType) === TXN_TYPE_SETTLEMENT ||
    Number(transactionType) === TXN_TYPE_CLOSE_LOAN;

  // ✅ Auto-bind current interest rate (from loanOutStanding table) when "Make Payment" is selected
  useEffect(() => {
    if (showInterestRow && editingTransactionId === 0) {
      setInterestRate(getValue(loanOutstanding || {}, ["InterestRate"], ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInterestRow, loanOutstanding]);

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

    const nextLoan = loan || emptyLoan;

    setSelectedLoan(nextLoan);
    setLoanResultsOpen(false);
    setTransactionType("");
    setPaymentAmount("");
    setRemarks("");
    setInterestRate("");
    setEditingTransactionId(0);
    setPaymentDate(toInputDate(new Date()));
    setHistoryOpen(false);

    await loadLoanOutstanding(nextLoan);
  };

  // Single source of truth for Outstanding + Summary + History
  const loadLoanOutstanding = async (loan) => {
    try {
      const id = getValue(loan, ["LoanId", "loanId", "LoanNo", "LoanNumber"]);

      if (!id) {
        setLoanOutstanding(null);
        setLoanSummary([]);
        setTransactionHistory([]);
        return;
      }

      const response = await LoanOutstandingCalculate({
        LoanId: Number(id),
        CloserDate: new Date().toISOString().split("T")[0],
      });

      if (response?.code === 1 && response?.data) {
        setLoanOutstanding(response.data.loanOutStanding || null);
        setLoanSummary(response.data.loanSummary || []);
        setTransactionHistory(response.data.loanTransaction || []);

        setTransactionMinDate(
          response.data.loanOutStanding?.TransactionMinDate
            ? response.data.loanOutStanding.TransactionMinDate.split("T")[0]
            : ""
        );
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

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      Swal.fire("Validation", "Transaction amount is required", "warning");
      return;
    }

    try {
      setSaving(true);

      const response = await LoanTransaction_Manage({
        LoanTransactionId: editingTransactionId || 0,
        LoanId: Number(loanId),
        TransactionTypeId: Number(transactionType),
        InterestRate: interestRate ? Number(interestRate) : null,
        TransactionDate: paymentDate,
        Amount: Number(paymentAmount),
        Description: remarks,
        TypeId: editingTransactionId > 0 ? "2" : "1", // 1 = Insert, 2 = Update
      });

      if (response?.code === 1 || response?.data?.[0]?.Code === 1) {
        Swal.fire(
          "Success",
          response?.data?.[0]?.Message ||
            (editingTransactionId > 0
              ? "Transaction updated successfully."
              : "Transaction saved successfully."),
          "success"
        );

        setEditingTransactionId(0);
        resetTransactionForm();

        await loadLoanOutstanding(selectedLoan);
      } else {
        Swal.fire(
          "Error",
          response?.message || response?.data?.[0]?.Message || "Operation failed",
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
    setInterestRate("");
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
    setEditingTransactionId(0);
    resetTransactionForm();
  };

  // ✅ FIX: uses its own viewLoanData state, never touches selectedLoan.
  // ✅ FIX: removed stray `debugger` statement.
  const handleView = async (targetLoanId) => {
    try {
      const formData = new FormData();
      formData.append("LoanId", String(targetLoanId));
      formData.append("TypeId", "5");

      const res = await LoanEntry_Manage(formData);

      if (res?.data?.length > 0) {
        setViewLoanData(res.data[0]);
        setShowViewModal(true);
      } else {
        Swal.fire({
          icon: "warning",
          title: "Not Found",
          text: "Loan details not available.",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to load loan details",
      });
    }
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

  const handleEditTransaction = (item) => {
    setEditingTransactionId(item.LoanTransactionId);
    setTransactionType(String(item.TransactionTypeId || ""));
    setPaymentAmount(item.Amount || item.CRAmount || item.DRAmount || item.OriginalPrincipal || "");
    setRemarks(item.Description || "");
    setInterestRate(item.InterestRate || "");
    setPaymentDate(
      item.TransactionDate
        ? item.TransactionDate.split("T")[0]
        : item.StartDate
        ? item.StartDate.split("T")[0]
        : ""
    );
  };

  const handleDeleteTransaction = async (item) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this transaction?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await LoanTransaction_Manage({
        LoanTransactionId: item.LoanTransactionId,
        LoanId: Number(loanId),
        TypeId: "3", // Delete
      });

      if (response?.code === 1) {
        Swal.fire("Deleted!", "Transaction deleted successfully.", "success");
        await loadLoanOutstanding(selectedLoan);
      } else {
        Swal.fire("Error", response?.message || "Delete failed", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

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
                onChange={(selected) => setCustomerId(selected?.value || "")}
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
            <div className="historyHeader" onClick={() => setLoanResultsOpen(!loanResultsOpen)}>
              <span>
                <FaList />
                Loan Results ({loans.length} found)
              </span>
              <FaChevronDown className={loanResultsOpen ? "chevronIcon open" : "chevronIcon"} />
            </div>

            {loanResultsOpen && (
              <>
                <div className="listHeader">
                  <span>Loan / Customer</span>
                  <span>Loan Type / Mobile</span>
                  <span>Loan Amount</span>
                  <span>Paid Amount</span>
                  <span>Start Date</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>

                <div className="loanList">
                  {loans.length === 0 ? (
                    <div className="emptyState">Koi loan nahi mila.</div>
                  ) : (
                    loans.map((loan, index) => {
                      const id = getValue(loan, ["LoanId", "loanId", "LoanNo", "LoanNumber"], index);
                      const isSelected = String(loanId) === String(id);

                      return (
                        <div
                          key={id}
                          className={`loanItem ${isSelected ? "selected" : ""}`}
                          onClick={() => selectLoan(loan)}
                        >
                          <div className="lv">
                            {id} | {getValue(loan, ["CustomerName"], "-")} | {getValue(loan, ["CustomerCode"], "-")}
                          </div>

                          <div className="lv">
                            {getValue(loan, ["LoanType"], "-")} | {getValue(loan, ["MobileNo"], "-")}
                          </div>

                          <div className="lv">{formatCurrency(getValue(loan, ["TotalLoanAmt"], 0))}</div>
                          <div className="lv">{formatCurrency(getValue(loan, ["TotalAmtPaid"], 0))}</div>
                          <div className="lv">{formatDisplayDate(getValue(loan, ["StartDate", "LoanStartDate"], ""))}</div>

                          <div>
                            <span
                              className={
                                String(getValue(loan, ["LoanStatus", "Status"], "Active"))
                                  .toLowerCase()
                                  .includes("pending")
                                  ? "badgePending"
                                  : "badgeActive"
                              }
                            >
                              {getValue(loan, ["LoanStatus", "Status"], "Active")}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`selectBtn ${isSelected ? "active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
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
              </>
            )}
          </div>
        )}

        {loanId && (
          <div className="loanPanel">
            <div className="selectedLoanBar">
              <span>Loan / Customer:</span>
              <strong>
                {getValue(selectedLoan, ["LoanId", "loanId", "LoanNo", "LoanNumber"], "-")} |{" "}
                {getValue(selectedLoan, ["CustomerName", "customerName"], "-")} |{" "}
                {getValue(selectedLoan, ["CustomerCode", "CustomerId"], "-")}
              </strong>

              <span>Outstanding Principal:</span>
              <strong>{formatCurrency(loanOutstanding?.TotalOutstandingPrincipal ?? 0)}</strong>

              <span>Interest:</span>
              <strong>{formatCurrency(loanOutstanding?.TotalInterestDue ?? 0)}</strong>

              <span>Total Payable:</span>
              <strong>{formatCurrency(loanOutstanding?.TotalNetPayable ?? 0)}</strong>
            </div>

            <div className="sectionTitle">
              <FaMoneyBill />
              {editingTransactionId > 0 ? "Update Transaction" : "New Transaction"}
            </div>

            <div className="formGrid">
              <div className="fieldGroup">
                <label>Transaction Type *</label>
                <select value={String(transactionType || "")} onChange={(event) => setTransactionType(event.target.value)}>
                  <option value="">-- Select Type --</option>
                  {masterData.loanTransactionType.map((item) => (
                    <option key={item.TransactionTypeId} value={String(item.TransactionTypeId)}>
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
                  min={transactionMinDate}
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
                    {Number(transactionType) === TXN_TYPE_SETTLEMENT ? "Waiver Amount (Rs.)" : "Write-off Amount (Rs.)"}
                  </label>
                  <input value={balanceAmount} disabled />
                </div>
              )}

              {showInterestRow && (
                <div className="fieldGroup">
                  <label>Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(event) => setInterestRate(event.target.value)}
                  />
                  <span className="subNote">
                    {getValue(loanOutstanding || {}, ["InterestType"], "-")}
                  </span>
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
              <button type="button" className="loanPrimaryBtn" onClick={handleSaveTransaction} disabled={saving}>
                {saving ? "Saving..." : editingTransactionId > 0 ? "Update" : "Submit"}
              </button>

              {editingTransactionId > 0 && (
                <button
                  type="button"
                  className="loanSecondaryBtn"
                  onClick={() => {
                    setEditingTransactionId(0);
                    resetTransactionForm();
                  }}
                >
                  Cancel Update
                </button>
              )}
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
                      <th>Sr No</th>
                      <th>Transaction Date</th>
                      <th>Interest Type</th>
                      <th>Rate (%)</th>
                      <th>Transaction Type</th>
                      <th>Amount</th>
                      <th style={{ minWidth: "150px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionHistory.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="emptyCell">
                          Koi history nahi hai.
                        </td>
                      </tr>
                    ) : (
                      transactionHistory.map((item, index) => {
                        const isLoanCreatedRow = index === transactionHistory.length - 1;

                        return (
                          <tr key={index} className={isLoanCreatedRow ? "loanCreatedRow" : ""}>
                            <td>{item.SrNo}</td>
                            <td>{formatDisplayDate(item.TransactionDate)}</td>
                            <td>{item.InterestType}</td>
                            <td>{item.InterestRate}%</td>
                            <td>{item.TransactionTypeName}</td>
                            <td>{formatCurrency(item.Amount)}</td>
                            <td>
                              {isLoanCreatedRow ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // ✅ FIX: use the loan's own id, not item.LoanId
                                      // (the transaction row may not carry a LoanId field)
                                      handleView(loanId);
                                    }}
                                    style={{
                                      padding: "6px 6px",
                                      borderRadius: "6px",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      border: "none",
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                      flexShrink: 0,
                                      background: "#f5a623",
                                      color: "#fff",
                                    }}
                                  >
                                    View
                                  </button>
                                  <span className="loanCreatedBadge">Opening</span>
                                </div>
                              ) : (
                                <div className="actionBtns">
                                  <button
                                    type="button"
                                    className="editBtn"
                                    onClick={() => handleEditTransaction(item)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="deleteBtn"
                                    onClick={() => handleDeleteTransaction(item)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {loanSummary.length > 0 && (
              <>
                <div className="historyHeader" onClick={() => setSummaryOpen(!summaryOpen)}>
                  <span>
                    <FaFileInvoice />
                    Loan Summary
                  </span>
                  <FaChevronDown className={summaryOpen ? "chevronIcon open" : "chevronIcon"} />
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
                        {loanSummary.map((item, index) => (
                          <tr key={index}>
                            <td>{item.TrancheId}</td>
                            <td>{item.InterestType}</td>
                            <td>{item.InterestRate}%</td>
                            <td>{formatDisplayDate(item.SegmentStartDate)}</td>
                            <td>{formatDisplayDate(item.SegmentEndDate)}</td>
                            <td>{formatCurrency(item.OutstandingPrincipal)}</td>
                            <td>{item.EffectiveMonths ?? "-"}</td>
                            <td>{formatCurrency(item.InterestAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ✅ FIX: modal now driven by its own viewLoanData state */}
      <LoanDetailViewModal
        open={showViewModal}
        data={viewLoanData}
        onClose={() => {
          setShowViewModal(false);
          setViewLoanData(null);
        }}
      />
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
