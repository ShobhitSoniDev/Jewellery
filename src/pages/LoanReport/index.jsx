"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CustomerMaster_Manage} from "@/lib/services/MasterService";
import { LoanReport_Search} from "@/lib/services/ReportsService";
import { LoanEntry_Manage } from "@/lib/services/TransactionsService";
import LoanDetailViewModal from "@/components/CommonView/LoanDetailView";
const LoanReport = () => {
  const pageSize = 10;

  const [customerList, setCustomerList] = useState([]);
  const [reportData, setReportData] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [loanType, setLoanType] = useState("");
  const [loanStatus, setLoanStatus] = useState("");
  const [metalType, setMetalType] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
 const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
const [showViewModal, setShowViewModal] = useState(false);
const [selectedLoan, setSelectedLoan] = useState(null);
  const totalPages = Math.ceil(totalRecords / pageSize);

  useEffect(() => {
    loadCustomerList();
  }, []);
const validateAmountTo = () => {
  if (
    amountFrom &&
    amountTo &&
    Number(amountTo) < Number(amountFrom)
  ) {
    setError("Amount To must be greater than Amount From");
    setAmountTo("");
  } else {
    setError("");
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

      setCustomerList(res?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async (page = 1) => {
    try {
      const payload = {
        LoanId: loanId ? Number(loanId) : null,
        CustomerId: customerId || null,
        LoanType: loanType || null,
        LoanStatus: loanStatus || null,
        MetalType: metalType || null,
        FromDate: fromDate || null,
        ToDate: toDate || null,
        AmountFrom: amountFrom ? Number(amountFrom) : null,
        AmountTo: amountTo ? Number(amountTo) : null,
        PageNo: page,
        PageSize: pageSize,
      };
debugger
      const res = await LoanReport_Search(payload);

      setReportData(res?.data || []);
      setTotalRecords(res?.totalRecords || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load report",
      });
    }
  };
const handleDelete = async (loanId) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You want to delete this loan record?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });

  if (!result.isConfirmed) return;

  try {
    const formData = new FormData();

    formData.append("LoanId", loanId);
    formData.append("TypeId", "3"); // Delete

    const response = await LoanEntry_Manage(formData);

    if (response?.data?.[0]?.Code === 1) {
      Swal.fire(
        "Deleted!",
        response.data[0].Message,
        "success"
      );

      loadLoanHistory();
    } else {
      Swal.fire(
        "Error",
        response?.data?.[0]?.Message || "Delete failed",
        "error"
      );
    }
  } catch (err) {
    console.error(err);

    Swal.fire(
      "Error",
      "Something went wrong",
      "error"
    );
  }
};

const handleView = async (loanId) => {
  try {
    const formData = new FormData();

    formData.append("LoanId", loanId.toString());
    formData.append("TypeId", "5");

    const res = await LoanEntry_Manage(formData);

    if (res?.data?.length > 0) {
      debugger
      setSelectedLoan(res.data[0]);
      setShowViewModal(true);
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
  const handleReset = () => {
    setLoanId("");
    setCustomerId("");
    setLoanType("");
    setLoanStatus("");
    setMetalType("");
    setFromDate("");
    setToDate("");
    setAmountFrom("");
    setAmountTo("");

    setCurrentPage(1);
    setTotalRecords(0);
    setReportData([]);
  };

  return (
    <ProtectedRoute>
    <div className="content-wrapper">
      <div className="form-card">
        <h2>Loan Report</h2>
        <hr />

        <div className="form-row">
          <div className="form-group">
            <label>Loan ID</label>
            <input
              type="number"
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Customer</label>

            <Select
              options={customerList.map((item) => ({
                value: item.CustomerId,
                label: `${item.CustomerName} (${item.MobileNo})`,
              }))}
              value={
                customerList
                  .map((item) => ({
                    value: item.CustomerId,
                    label: `${item.CustomerName} (${item.MobileNo})`,
                  }))
                  .find((x) => x.value === customerId) || null
              }
              onChange={(selected) =>
                setCustomerId(selected?.value || "")
              }
              placeholder="Search Customer..."
              isClearable
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Loan Type</label>

            <select
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
            >
              <option value="">All</option>
              <option value="girvi">Jewellery Deposit</option>
              <option value="cash">Without Jewellery</option>
            </select>
          </div>

          <div className="form-group">
            <label>Loan Status</label>

            <select
              value={loanStatus}
              onChange={(e) => setLoanStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Metal Type</label>

            <select
              value={metalType}
              onChange={(e) => setMetalType(e.target.value)}
            >
              <option value="">All</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount From</label>

         <input
      type="number"
      value={amountFrom}
      onChange={(e) => setAmountFrom(e.target.value)}
    />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Amount To</label>

            <input
      type="number"
      value={amountTo}
      onChange={(e) => setAmountTo(e.target.value)}
      onBlur={validateAmountTo}
    />
    {error && <span style={{color:"red"}}>{error}</span>}
          </div>

          <div className="form-group">
            <label>From Date</label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>To Date</label>

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="form-group"></div>
        </div>

        <div className="btn-group">
          <button
            className="btn-primary"
            onClick={() => handleSearch(1)}
          >
            Search
          </button>

          <button
            className="btn-secondary"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="table-card">
  <div className="table-responsive">
    <table className="table loan-table">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Loan ID</th>
          <th>Customer</th>
          <th>Loan Type</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Interest %</th>
          <th>Metal</th>
          <th>Weight</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {reportData.length === 0 ? (
          <tr>
            <td colSpan="12" style={{ textAlign: "center" }}>
              No Records Found
            </td>
          </tr>
        ) : (
          reportData.map((item, index) => (
            <tr key={index}>
              <td>
                {(currentPage - 1) * pageSize + index + 1}
              </td>
              <td>{item.LoanId}</td>
              <td>{item.CustomerName}</td>
              <td>{item.LoanType}</td>
              <td>{item.LoanStatus}</td>
              <td>{item.Amount}</td>
              <td>{item.InterestRate}</td>
              <td>{item.MetalType}</td>
              <td>{item.Weight}</td>
              <td>{item.StartDate}</td>
              <td>{item.EndDate}</td>

              <td>
                <div className="action-buttons">
                  <button
                    className="btn-secondary"
                    onClick={() => handleDelete(item.LoanId)}
                  >
                    Delete
                  </button>

                  <button
                    className="btn-primary"
                    onClick={() => handleView(item.LoanId)}
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  {totalRecords > 0 && (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginTop: "15px",
      }}
    >
      <button
        disabled={currentPage === 1}
        onClick={() => handleSearch(currentPage - 1)}
      >
        Previous
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        disabled={currentPage >= totalPages}
        onClick={() => handleSearch(currentPage + 1)}
      >
        Next
      </button>
    </div>
  )}
</div>
<LoanDetailViewModal
  open={showViewModal}
  data={selectedLoan}
  onClose={() => {
    setShowViewModal(false);
    setSelectedLoan(null);
  }}
/>
    </div>
     </ProtectedRoute>
  );
};

export default LoanReport;