import React, { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoanReport_Search } from "@/lib/services/ReportsService";
import {
  LoanEntry_Manage,
  LoanTransaction_Manage,
} from "@/lib/services/TransactionsService";
import Swal from "sweetalert2";
import {
  FaCalendarAlt,
  FaEye,
  FaMoneyBillWave,
  FaRedo,
  FaRegCalendarCheck,
  FaRupeeSign,
  FaSave,
  FaSearch,
  FaTimes,
  FaWallet,
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
  MetalType: "",
  Amount: "",
  OutstandingAmount: "",
  StartDate: "",
  EndDate: "",
};

export default function LoanTransaction() {
  const [loanNumber, setLoanNumber] = useState("");
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(emptyLoan);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [transactionType, setTransactionType] = useState("Receive Payment");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(toInputDate(new Date()));
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const summaryItems = [
    {
      icon: FaWallet,
      label: "Loan Amount",
      value: formatCurrency(loanAmount),
      color: "blue",
    },
    {
      icon: FaMoneyBillWave,
      label: "Total Received",
      value: formatCurrency(totalReceived),
      color: "orange",
    },
    {
      icon: FaRupeeSign,
      label: "Total Paid",
      value: formatCurrency(totalPaid),
      color: "red",
    },
    {
      icon: FaWallet,
      label: "Outstanding Amount",
      value: formatCurrency(outstandingAmount),
      color: "purple",
    },
    {
      icon: FaRegCalendarCheck,
      label: "Next Due Date",
      value: formatDisplayDate(getValue(selectedLoan, ["EndDate", "DueDate", "NextDueDate"])),
      color: "teal",
    },
  ];

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
        PageSize: searchLoanId ? 1 : 20,
      };

      const response = await LoanReport_Search(payload);
      const data = response?.data || [];

      setLoans(data);

      if (searchLoanId) {
        if (data.length === 0) {
          setSelectedLoan(emptyLoan);
          setTransactionHistory([]);
          Swal.fire("Not Found", "Loan number not found", "warning");
          return;
        }

        await selectLoan(data[0]);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load loan data", "error");
    } finally {
      setLoading(false);
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
    setSelectedLoan(details || loan || emptyLoan);
    await loadTransactionHistory(details || loan);
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

  const handleSearchLoan = () => {
    if (!loanNumber.trim()) {
      Swal.fire("Validation", "Please enter loan number", "warning");
      return;
    }

    loadLoans(loanNumber.trim());
  };

  const handleSaveTransaction = async () => {
    if (!loanId) {
      Swal.fire("Validation", "Please search and select a loan first", "warning");
      return;
    }

    if (!["Settlement", "Close Loan"].includes(transactionType) && !paymentAmount) {
      Swal.fire("Validation", "Payment amount is required", "warning");
      return;
    }

    try {
      setSaving(true);

      const response = await LoanTransaction_Manage({
        LoanId: Number(loanId),
        TransactionType: transactionType,
        Amount: paymentAmount ? Number(paymentAmount) : 0,
        TransactionDate: paymentDate,
        Remarks: remarks,
        TypeId: 1,
      });

      if (response?.code === 1 || response?.data?.[0]?.Code === 1) {
        Swal.fire("Saved!", response?.data?.[0]?.Message || "Transaction saved", "success");
        setPaymentAmount("");
        setRemarks("");
        const latestLoan = await loadLoanDetails(loanId);
        setSelectedLoan(latestLoan || selectedLoan);
        await loadTransactionHistory(latestLoan || selectedLoan);
      } else {
        Swal.fire("Error", response?.message || response?.data?.[0]?.Message || "Save failed", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTransactionType("Receive Payment");
    setPaymentAmount("");
    setPaymentDate(toInputDate(new Date()));
    setRemarks("");
  };

  return (
    <ProtectedRoute>
      <div className="loanTransactionPage">
        <div className="loanPageHeader">
          <div>
            <h1>Loan Transaction</h1>
            <p>Home &gt; Loan Transaction</p>
          </div>
        </div>

        <section className="loanPanel">
          <h2>1. Loan Details</h2>

          <div className="loanGrid loanGridFour">
            <div className="loanField">
              <label>Loan Number *</label>
              <div className="loanInputWrap">
                <input
                  type="text"
                  placeholder="Search Loan Number..."
                  value={loanNumber}
                  onChange={(e) => setLoanNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchLoan()}
                />
                <button
                  className="loanIconButton"
                  type="button"
                  onClick={handleSearchLoan}
                  aria-label="Search loan"
                  disabled={loading}
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            <FormField label="Customer Name" value={getValue(selectedLoan, ["CustomerName"])} readOnly />

            <div className="loanField">
              <label>Loan Status</label>
              <span className="loanStatusBadge">
                {getValue(selectedLoan, ["LoanStatus", "StatusName"], "-")}
              </span>
            </div>

            <FormField label="Metal Type" value={getValue(selectedLoan, ["MetalType", "LoanMetalType"])} readOnly />
            <FormField label="Loan Amount" value={formatCurrency(loanAmount)} muted readOnly />
            <FormField label="Outstanding Amount" value={formatCurrency(outstandingAmount)} danger readOnly />
            <FormField
              label="Loan Date"
              value={formatDisplayDate(getValue(selectedLoan, ["StartDate", "LoanDate"]))}
              icon={<FaCalendarAlt />}
              readOnly
            />
            <FormField
              label="End Date"
              value={formatDisplayDate(getValue(selectedLoan, ["EndDate", "DueDate"]))}
              icon={<FaCalendarAlt />}
              readOnly
            />
          </div>

          {loans.length > 0 && (
            <div className="loanQuickList">
              {loans.slice(0, 6).map((loan) => (
                <button
                  key={getValue(loan, ["LoanId", "LoanNo", "LoanNumber"])}
                  type="button"
                  onClick={() => selectLoan(loan)}
                >
                  #{getValue(loan, ["LoanId", "LoanNo", "LoanNumber"])} - {getValue(loan, ["CustomerName"], "Customer")}
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="loanMiddleGrid">
          <div>
            <section className="loanPanel">
              <h2>2. Transaction Type</h2>

              <div className="loanRadioBox">
                {transactionTypes.map((item) => (
                  <label className="loanRadio" key={item}>
                    <input
                      type="radio"
                      name="transactionType"
                      checked={transactionType === item}
                      onChange={() => setTransactionType(item)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="loanPanel">
              <h2>3. Transaction Details</h2>

              <div className="loanGrid loanGridTwo">
                <FormField
                  label="Payment Amount *"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={setPaymentAmount}
                  suffix="₹"
                />
                <FormField
                  label="Payment Date *"
                  type="date"
                  value={paymentDate}
                  onChange={setPaymentDate}
                />
              </div>

              <div className="loanField loanRemarksField">
                <label>Remarks</label>
                <textarea
                  placeholder="Enter remarks (optional)"
                  maxLength={500}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <small>{remarks.length} / 500</small>
              </div>

              <div className="loanActions">
                <button
                  className="loanPrimaryBtn"
                  type="button"
                  onClick={handleSaveTransaction}
                  disabled={saving}
                >
                  <FaSave />
                  {saving ? "Saving..." : "Save Transaction"}
                </button>
                <button className="loanSecondaryBtn" type="button" onClick={resetForm}>
                  <FaRedo />
                  Reset
                </button>
                <button className="loanSecondaryBtn" type="button" onClick={resetForm}>
                  <FaTimes />
                  Cancel
                </button>
              </div>
            </section>
          </div>

          <section className="loanPanel">
            <h2>4. Transaction History</h2>

            <div className="loanTableWrap">
              <table className="loanHistoryTable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount (₹)</th>
                    <th>Remarks</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="loanEmptyCell">
                        No transaction found
                      </td>
                    </tr>
                  ) : (
                    transactionHistory.map((item, index) => {
                      const type = getValue(item, ["TransactionType", "Type", "LoanStatus"], "Loan Created");
                      return (
                        <tr key={`${getValue(item, ["LoanId"], index)}-${index}`}>
                          <td>{formatDisplayDate(getValue(item, ["TransactionDate", "StartDate", "Date"]))}</td>
                          <td>
                            <span className={`loanTypePill ${getTypeClass(type)}`}>{type}</span>
                          </td>
                          <td className={getAmountClass(type)}>
                            {formatAmount(getValue(item, ["Amount", "TransactionAmount", "PaidAmount"], 0))}
                          </td>
                          <td>{getValue(item, ["Remarks", "Description"], "-")}</td>
                          <td>{getValue(item, ["UserName", "CreatedBy", "User"], "Admin")}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <button className="loanViewHistoryBtn" type="button" onClick={() => loanId && loadTransactionHistory(selectedLoan)}>
              <FaEye />
              View All History
            </button>
          </section>
        </div>

        <section className="loanPanel loanSummaryPanel">
          <h2>Loan Summary</h2>

          <div className="loanSummaryGrid">
            {summaryItems.map((item) => {
              const Icon = item.icon;

              return (
                <div className="loanSummaryItem" key={item.label}>
                  <div className={`loanSummaryIcon ${item.color}`}>
                    <Icon />
                  </div>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}

function FormField({
  label,
  placeholder,
  value,
  icon,
  suffix,
  muted,
  danger,
  readOnly,
  onChange,
  type = "text",
}) {
  return (
    <div className="loanField">
      <label>{label}</label>
      <div className={`loanInputWrap ${muted ? "muted" : ""} ${danger ? "danger" : ""}`}>
        <input
          type={type}
          placeholder={placeholder}
          value={value || ""}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {icon && <span className="loanInputIcon">{icon}</span>}
        {suffix && <span className="loanInputIcon">{suffix}</span>}
      </div>
    </div>
  );
}

function getValue(source, keys, fallback = "") {
  if (!source) return fallback;

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return fallback;
}

function formatCurrency(value) {
  return `₹ ${formatAmount(value)}`;
}

function formatAmount(value) {
  const number = Number(value) || 0;
  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");
}

function toInputDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function sumByType(rows, possibleTypes) {
  return rows.reduce((total, item) => {
    const type = String(getValue(item, ["TransactionType", "Type"], "")).toLowerCase();
    const matched = possibleTypes.some((x) => type.includes(x.toLowerCase()));

    if (!matched) return total;

    return total + (Number(getValue(item, ["Amount", "TransactionAmount", "PaidAmount"], 0)) || 0);
  }, 0);
}

function getTypeClass(type) {
  const value = String(type).toLowerCase();
  if (value.includes("receive")) return "receive";
  if (value.includes("make") || value.includes("paid")) return "make";
  return "created";
}

function getAmountClass(type) {
  const value = String(type).toLowerCase();
  if (value.includes("receive")) return "loanAmountGreen";
  if (value.includes("make") || value.includes("paid")) return "loanAmountRed";
  return "loanAmountDark";
}
