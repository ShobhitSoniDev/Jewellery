"use client";
import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CustomerMaster_Manage } from "@/lib/services/MasterService";
import { LoanEntry_Manage } from "@/lib/services/TransactionsService";
import Select from "react-select";
import Swal from "sweetalert2";

const LoanEntry = () => {

  const [loanType, setLoanType] = useState("girvi");
  const [amount, setAmount] = useState("");
  const [interestType, setInterestType] = useState("Monthly");
  const [interestRate, setInterestRate] = useState("");
  const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
  const [metalType, setMetalType] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [remark, setRemark] = useState("");
 const [photos, setPhotos] = useState([]);
const [imagePreviews, setImagePreviews] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [expectedLoanDuration, setexpectedLoanDuration] = useState("");
  const [itemCount, setItemCount] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [estimatedInterest, setestimatedInterest] = useState(0);
const [estimatedTotalPayable, setestimatedTotalPayable] = useState(0);
const [error, seterror] = useState({});
 const [editId, setEditId] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    address: ""
  });
 const buttonName = "Save";
  // 📸 Image Preview
const handleImageChange = (e) => {
  const files = Array.from(e.target.files);

  setPhotos(files);

  const previews = files.map((file) => URL.createObjectURL(file));
  setImagePreviews(previews);
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
useEffect(() => {
  if (!startDate || !expectedLoanDuration) return;

  const start = new Date(startDate);
  const end = new Date(start);

  if (interestType === "Monthly") {
    end.setMonth(end.getMonth() + parseInt(expectedLoanDuration));
  } else {
    end.setFullYear(end.getFullYear() + parseInt(expectedLoanDuration));
  }

  const calculatedEndDate = end.toISOString().split("T")[0];

  if (calculatedEndDate !== endDate) {
    setEndDate(calculatedEndDate);
  }
}, [startDate, expectedLoanDuration, interestType]);

useEffect(() => {
  if (!startDate || !endDate) return;

  const start = new Date(startDate);
  const end = new Date(endDate);

  let duration = 0;

  if (interestType === "Monthly") {
    duration =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (end.getDate() > start.getDate()) {
      duration += 1;
    }

    if (duration === 0 && end > start) {
      duration = 1;
    }
  } else {
    duration = end.getFullYear() - start.getFullYear();

    if (
      end.getMonth() > start.getMonth() ||
      (end.getMonth() === start.getMonth() &&
        end.getDate() > start.getDate())
    ) {
      duration += 1;
    }

    if (duration === 0 && end > start) {
      duration = 1;
    }
  }

  if (String(duration) !== String(expectedLoanDuration)) {
    setexpectedLoanDuration(duration);
  }
}, [startDate, endDate, interestType]);

useEffect(() => {
  if (!amount || !interestRate || !expectedLoanDuration) {
    setestimatedInterest(0);
    setestimatedTotalPayable(0);
    return;
  }

  const P = parseFloat(amount) || 0;
  const R = parseFloat(interestRate) || 0;
  const T = parseFloat(expectedLoanDuration) || 0;

  const interest = (P * R * T) / 100;

  setestimatedInterest(interest);
  setestimatedTotalPayable(P + interest);
}, [amount, interestRate, expectedLoanDuration, interestType]);

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

const handleValidation = () => {
  let flag = true;
  let newerror = {};
  // Customer
  if (!customerId) {
    newerror.customerId = "Customer is required";
    flag = false;
  }

  // Loan Amount
  if (!amount) {
    newerror.amount = "Loan amount is required";
    flag = false;
  } else if (isNaN(amount)) {
    newerror.amount = "Enter valid amount";
    flag = false;
  }

  // Interest Rate
  if (!interestRate) {
    newerror.interestRate = "Interest rate is required";
    flag = false;
  }

  // Expected Duration
  if (!expectedLoanDuration) {
    newerror.expectedLoanDuration = "Expected duration is required";
    flag = false;
  }

  // Start Date
  if (!startDate) {
    newerror.startDate = "Start date is required";
    flag = false;
  }
 if (!endDate) {
    newerror.endDate = "End date is required";
    flag = false;
  }
  // GIRVI specific fields
  if (loanType === "girvi") {

    if (!metalType) {
      newerror.metalType = "Metal type is required";
      flag = false;
    }

    if (!weight) {
      newerror.weight = "Weight is required";
      flag = false;
    }
debugger
    if (!itemCount) {
      newerror.itemCount = "Item count is required";
      flag = false;
    }

    // if (!description) {
    //   newerror.description = "Description is required";
    //   flag = false;
    // }

    // // Optional but recommended
    // if (!photos || photos.length === 0) {
    //   newerror.photos = "At least one photo is required";
    //   flag = false;
    // }
  }

  seterror(newerror);
  return flag;
};
// ✅ SUBMIT FORM
 const handleSubmit = async () => {
  try {
    if (!handleValidation()) return;

    const formData = new FormData();

    formData.append("LoanId", editId ? editId.toString() : "0");
    formData.append("CustomerId", customerId?.toString());
    formData.append("LoanType", loanType || "");
    formData.append("Amount", amount?.toString());
    formData.append("InterestType", interestType || "");
    formData.append("InterestRate", interestRate?.toString());

    // ✅ FIX DATE FORMAT
    formData.append(
      "StartDate",
      startDate ? new Date(startDate).toISOString() : ""
    );

    formData.append("MetalType", metalType || "");
    formData.append("Weight", weight?.toString());
    formData.append("ItemCount", itemCount?.toString());
    formData.append("Description", description || "");
    formData.append("Remark", remark || "");
    formData.append("TypeId", editId ? "2" : "1");

    // ✅ FILES
    if (photos?.length > 0) {
      photos.forEach(file => {
        formData.append("Photos", file);
      });
    }

    console.log([...formData.entries()]);

    const result = await LoanEntry_Manage(formData);

    if (result?.data?.code === 1 || result?.data?.[0]?.Code === 1) {
      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: result?.data?.message || "Success",
      });

      resetForm();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: result?.data?.message || "Failed",
      });
    }

  } catch (err) {
    console.error(err);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Something went wrong",
    });
  }
};
// 🔄 RESET FORM
  const resetForm = () => {
    setLoanType("girvi");
    setAmount("");
    setInterestType("Monthly");
    setInterestRate("");
    setStartDate("");
setEndDate("");
    setMetalType("");
    setWeight("");
    setItemCount("");
    setDescription("");
    setRemark("");
setPhotos([]);
setImagePreviews([]);

    setCustomerId("");
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
                  <p style={{color:"red"}}>{error.customerId}</p>
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
              <p style={{color:"red"}}>{error.loanType}</p>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="form-row">
            <div className="form-group">
              <label>Loan Amount</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p style={{color:"red"}}>{error.amount}</p>
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
              <p style={{color:"red"}}>{error.interestType}</p>
            </div>
          </div>

          {/* ROW 3 */}
          <div className="form-row">
            <div className="form-group">
              <label>Interest Rate</label>
              <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
           <p style={{color:"red"}}>{error.interestRate}</p>
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <p style={{color:"red"}}>{error.startDate}</p>
            </div>
          </div>
<div className="form-row">

  <div className="form-group">
  <label>End Date</label>
  <input  type="date"  value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <p style={{color:"red"}}>{error.endDate}</p>
  
</div>
  <div className="form-group">
  <label>Expected Duration (Months/Year)</label>
  <input 
    type="number"
    value={expectedLoanDuration} 
    onChange={(e) => setexpectedLoanDuration(e.target.value)} 
  />
  <p style={{color:"red"}}>{error.expectedLoanDuration}</p>
</div>

</div>
<div className="form-row">
<div className="form-group">
  <label>Estimated Interest</label>
  <input value={estimatedInterest} readOnly />

  {/* 👇 Green label */}
  <p style={{ color: "green", marginTop: "6px", fontWeight: "600" }}>
    Estimated Total Payable: ₹ {estimatedTotalPayable}
  </p>
</div>
<div className="form-group">  </div>
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
                  <p style={{color:"red"}}>{error.metalType}</p>
                </div>

                <div className="form-group">
                  <label>Weight</label>
                  <input value={weight} onChange={(e) => setWeight(e.target.value)} />
                  <p style={{color:"red"}}>{error.weight}</p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
  <label>Jewellery Photos</label>

  <input  type="file"  accept="image/*"   multiple  onChange={handleImageChange} />

  {/* Preview */}
  <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
    {imagePreviews.map((src, index) => (
      <img 
        key={index}
        src={src} 
        width="100" 
        style={{ borderRadius: "6px" }}
      />
    ))}
  </div>
</div>

 <div className="form-group">
  <label>Item Count</label>
  <input type="number" value={itemCount} onChange={(e) => setItemCount(e.target.value)} />
  <p style={{color:"red"}}>{error.itemCount}</p>
</div>
              </div>
              <div className="form-row">

<div className="form-group">
                  <label>Description</label>
                  <input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
<div className="form-group"></div>
</div>
              <div className="btn-group">
                <button className="btn-primary" onClick={handleSubmit}>{buttonName}</button>
                <button className="btn-secondary" onClick={resetForm}>Cancel</button>
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