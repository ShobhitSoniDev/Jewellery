"use client";

import React, { useState } from "react";
import Select from "react-select";

const LoanReport = () => {

  const [customerId, setCustomerId] = useState("");
  const [loanType, setLoanType] = useState("");
  const [metalType, setMetalType] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");

  const [reportData, setReportData] = useState([]);

  const handleSearch = async () => {

    const payload = {
      CustomerId: customerId,
      LoanType: loanType,
      MetalType: metalType,
      FromDate: fromDate,
      ToDate: toDate,
      AmountFrom: amountFrom,
      AmountTo: amountTo
    };

    console.log(payload);

    // API CALL
    // const res = await LoanReport_Search(payload);
    // setReportData(res.data);

  };

  const handleReset = () => {

    setCustomerId("");
    setLoanType("");
    setMetalType("");

    setFromDate("");
    setToDate("");

    setAmountFrom("");
    setAmountTo("");

    setReportData([]);
  };

  return (
    <div className="content-wrapper">

      <div className="form-card">

        <h2>Loan Report</h2>
        <hr />

        <div className="form-row">

          <div className="form-group">
            <label>Customer</label>

            <Select
              placeholder="Select Customer"
              options={[]}
              onChange={(e) => setCustomerId(e?.value)}
            />
          </div>

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
              value={amountFrom}
              onChange={(e) => setAmountFrom(e.target.value)}
            />
          </div>

        </div>

        <div className="form-row">

          <div className="form-group">
            <label>Amount To</label>

            <input
              value={amountTo}
              onChange={(e) => setAmountTo(e.target.value)}
            />
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
            onClick={handleSearch}
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

      {/* REPORT GRID */}

      <div className="table-card">

        <table className="table">

          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Customer</th>
              <th>Loan Type</th>
              <th>Amount</th>
              <th>Interest %</th>
              <th>Metal</th>
              <th>Weight</th>
              <th>Items</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>

          <tbody>

            {reportData.length === 0 ? (
              <tr>
                <td colSpan="10">
                  No Records Found
                </td>
              </tr>
            ) : (
              reportData.map((item, index) => (
                <tr key={index}>
                  <td>{item.LoanId}</td>
                  <td>{item.CustomerName}</td>
                  <td>{item.LoanType}</td>
                  <td>{item.Amount}</td>
                  <td>{item.InterestRate}</td>
                  <td>{item.MetalType}</td>
                  <td>{item.Weight}</td>
                  <td>{item.ItemCount}</td>
                  <td>{item.StartDate}</td>
                  <td>{item.EndDate}</td>
                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default LoanReport;