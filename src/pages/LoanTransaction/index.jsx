"use client";
import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CustomerMaster_Manage } from "@/lib/services/MasterService";
import Select from "react-select";
import Swal from "sweetalert2";

const LoanEntry = () => {

  const [loanType, setLoanType] = useState("girvi");
  const [amount, setAmount] = useState("");
  const [interestType, setInterestType] = useState("Monthly");
  const [interestRate, setInterestRate] = useState("");
  const [startDate, setStartDate] = useState("");

  const [metalType, setMetalType] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [remark, setRemark] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const [customerList, setCustomerList] = useState([]);
  const [customerId, setCustomerId] = useState("");

  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    address: ""
  });

  // 📸 Image Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  // 🔄 Load Customers
  const loadCustomerList = async () => {
    try {
      const payload = {
        customerId: "",
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

  useEffect(() => {
    (async () => {
      const list = await loadCustomerList();
      setCustomerList(list);
    })();
  }, []);

  // 🔥 ADD CUSTOMER
  const handleAddCustomer = async () => {
  try {
    if (!newCustomer.name || !newCustomer.mobile) {
      await Swal.fire({
        icon: "warning",
        title: "Validation",
        text: "Name and Mobile are required",
        zIndex: 99999
      });
      return;
    }

    // 🔁 Duplicate check
    const exists = customerList.find(
      (c) => c.MobileNo === newCustomer.mobile
    );

    if (exists) {
      await Swal.fire({
        icon: "warning",
        title: "Duplicate",
        text: "Customer already exists",
        zIndex: 99999
      });
      return;
    }

    const payload = {
      customerId: "",
      customerName: newCustomer.name,
      mobileNo: newCustomer.mobile,
      address: newCustomer.address,
      email: "",
      city: "",
      pincode: 0,
      typeId: 1,
    };

    const res = await CustomerMaster_Manage(payload);

    if (res?.data?.[0]?.Code === 1) {

      // ✅ Pehle modal close karo
      setShowCustomerModal(false);

      // ✅ Success popup (ab upar dikhega)
      await Swal.fire({
        icon: "success",
        title: "Saved!",
        text: res?.data?.[0]?.Message || "Customer added successfully",
        confirmButtonColor: "#3085d6",
        zIndex: 99999
      });

      // 🔄 Reload list
      const updatedList = await loadCustomerList();
      setCustomerList(updatedList);

      // 🔍 Find new customer
      const addedCustomer = updatedList.find(
        (c) => c.MobileNo === newCustomer.mobile
      );

      if (addedCustomer) {
        setCustomerId(addedCustomer.CustomerId);
      }

      // 🔄 Reset
      setNewCustomer({ name: "", mobile: "", address: "" });

    } else {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: res?.data?.[0]?.Message || "Failed to add customer",
        zIndex: 99999
      });
    }

  } catch (err) {
    console.error(err);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Something went wrong",
      zIndex: 99999
    });
  }
};

  return (
    <ProtectedRoute>
      <div className="content-wrapper">

        {/* FORM */}
        <div className="form-card">
          <h2>Girvi / Loan Entry</h2>
          <hr />

          {/* ROW 1 */}
          <div className="form-row">

            <div className="form-group">
              <label>Customer</label>

              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
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
                        .find((c) => c.value === customerId) || null
                    }
                    onChange={(selected) => {
                      setCustomerId(selected?.value || "");
                    }}
                    placeholder="Search Customer..."
                    isClearable
                  />
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowCustomerModal(true)}
                >
                  + Add
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Loan Type</label>
              <select
                className="dropdown-select"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
              >
                <option value="girvi">Jewellery Deposit</option>
                <option value="cash">Without Jewellery</option>
              </select>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="form-row">
            <div className="form-group">
              <label>Loan Amount</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Interest Type</label>
              <select
                className="dropdown-select"
                value={interestType}
                onChange={(e) => setInterestType(e.target.value)}
              >
                <option>Monthly</option>
                <option>Yearly</option>
              </select>
            </div>
          </div>

          {/* ROW 3 */}
          <div className="form-row">
            <div className="form-group">
              <label>Interest Rate</label>
              <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>

          {/* GIRVI */}
          {loanType === "girvi" && (
            <>
              <h3>Jewellery Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Metal</label>
                  <select value={metalType} onChange={(e) => setMetalType(e.target.value)}>
                    <option value="">--Select--</option>
                    <option>Gold</option>
                    <option>Silver</option>
                    <option>Both</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Weight</label>
                  <input value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
              </div>
            </>
          )}

        </div>

        {/* 🔥 MODAL */}
        {showCustomerModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal">

              <div className="modal-header">
                <h2>Add Customer</h2>
                <button onClick={() => setShowCustomerModal(false)}>✖</button>
              </div>

              <hr />

              <div className="modal-body">

                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    value={newCustomer.mobile}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, mobile: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, address: e.target.value })
                    }
                  />
                </div>

                <div className="btn-group">
                  <button className="btn-primary" onClick={handleAddCustomer}>
                    Save
                  </button>
                  <button className="btn-secondary" onClick={() => setShowCustomerModal(false)}>
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

export default LoanEntry;