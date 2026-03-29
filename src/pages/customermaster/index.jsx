import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { commonInputValidator } from "@/utils/inputValidation";
import { CustomerMaster_Manage } from "@/lib/services/MasterService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";


const AddCustomer = () => {

 const router = useRouter();

  /* ---------------- STATES ---------------- */

  const [customerList, setCustomerList] = useState([]);

  const [form, setForm] = useState({
    customerName: "",
    mobileNo: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [editId, setEditId] = useState(null);
  const [buttonName, setButtonName] = useState("Save");

  const [error, setError] = useState({});

  /* ---------------- VALIDATION ---------------- */

  const handleValidation = () => {
    let flag = true;
    let newErrors = {};

    if (!form.customerName) {
      newErrors.customerName = "Customer Name is required";
      flag = false;
    }

    if (!form.mobileNo) {
      newErrors.mobileNo = "Mobile No is required";
      flag = false;
    }

    if (!form.email) {
      newErrors.email = "Email is required";
      flag = false;
    }

    if (!form.city) {
      newErrors.city = "City is required";
      flag = false;
    }
    if (!form.address) {
      newErrors.address = "Address is required";
      flag = false;
    }

    if (!form.pincode) {
      newErrors.pincode = "Pincode is required";
      flag = false;
    }


    setError(newErrors);
    return flag;
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {

    if (!handleValidation()) return;

    const payload = {
      customerId: editId || "",
      customerName: form.customerName,
      mobileNo: form.mobileNo,
      email: form.email,
      address: form.address,
      city: form.city,
      pincode: Number(form.pincode || 0),
      typeId: editId ? 2 : 1,
    };

    try {

      const response = await CustomerMaster_Manage(payload);

      if (response && response.data && response.data[0] && response.data[0].Code === 1) {

        await Swal.fire({
          icon: "success",
          title: "Saved!",
          text: response.data[0].Message || "Saved successfully",
        });

        loadCustomerList();
        resetForm();

      } else {

        Swal.fire({
          icon: "error",
          title: "Error",
          text: response?.data?.[0]?.Message || "Save failed",
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

  /* ---------------- RESET ---------------- */

  const resetForm = () => {
    setForm({
      customerName: "",
      mobileNo: "",
      email: "",
      address: "",
      city: "",
      pincode: "",
    });

    setEditId(null);
    setButtonName("Save");
    setError({});
  };

  /* ---------------- LOAD LIST ---------------- */

  const loadCustomerList = async () => {
    try {
debugger
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
      setCustomerList(res?.data || []);

    } catch (err) {
      console.error("Error loading customers", err);
    }
  };

  useEffect(() => {
    loadCustomerList();
  }, []);

  /* ---------------- EDIT ---------------- */

  const handleEdit = (item) => {

    setForm({
      customerName: item.CustomerName || "",
      mobileNo: item.MobileNo || "",
      email: item.Email || "",
      address: item.Address || "",
      city: item.City || "",
      pincode: item.Pincode ? item.Pincode.toString() : "",
    });

    setEditId(item.CustomerId);
    setButtonName("Update");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (id) => {

    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!result.isConfirmed) return;

    try {

      const payload = {
        customerId: id,
        typeId: 3,
      };

      await CustomerMaster_Manage(payload);

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });

      loadCustomerList();

    } catch (err) {

      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Delete failed",
      });
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <ProtectedRoute>
      <div className="content-wrapper">

        <div className="form-card">
          <h2>Customer Master</h2>
          <hr />
          <div class="form-row">
<div className="form-group">
          <label>Customer Name</label>
          <input
            placeholder="Customer Name"
            value={form.customerName}
            onChange={(e) => {
                          const val = e.target.value;
            
                          const result = commonInputValidator(val, {
                            numeric: false,
                            allowDecimal: false,
                            minLength: 1,
                            maxLength: 30,
                          });
            
                          if (result === true) {
                            setForm({ ...form, customerName: e.target.value })
                            setError((prev) => ({ ...prev, customerName: "" }));
                          } else {
                            setError((prev) => ({ ...prev, customerName: result }));
                          }
                        }}
          />
          <p style={{color:"red"}}>{error.customerName}</p>
</div>
<div className="form-group">
          <label>Mobile No</label>
          <input
            placeholder="Mobile No"
            value={form.mobileNo}
            onChange={(e) => {
                          const val = e.target.value;
            
                          const result = commonInputValidator(val, {
                            numeric: true,
                            allowDecimal: false,
                            minLength: 10,
                            maxLength: 10,
                          });
            
                          if (result === true) {
                            setForm({ ...form, mobileNo: e.target.value })
                            setError((prev) => ({ ...prev, mobileNo: "" }));
                          } else {
                            setError((prev) => ({ ...prev, mobileNo: result }));
                          }
                        }}
          />
          <p style={{color:"red"}}>{error.mobileNo}</p>
</div>
</div>
<div class="form-row">
<div className="form-group">
          <label>Email</label>
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => {
                          const val = e.target.value;
            
                          const result = commonInputValidator(val, {
                            numeric: false,
                            allowDecimal: false,
                            minLength: 1,
                            maxLength: 50,
                          });
            
                          if (result === true) {
                            setForm({ ...form, email: e.target.value })
                            setError((prev) => ({ ...prev, email: "" }));
                          } else {
                            setError((prev) => ({ ...prev, email: result }));
                          }
                        }}
          />
          <p style={{color:"red"}}>{error.email}</p>
</div>
<div className="form-group">
          <label>Address</label>
          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => {
                          const val = e.target.value;
            
                          const result = commonInputValidator(val, {
                            numeric: false,
                            allowDecimal: false,
                            minLength: 1,
                            maxLength: 100,
                          });
            
                          if (result === true) {
                            setForm({ ...form, address: e.target.value })
                            setError((prev) => ({ ...prev, address: "" }));
                          } else {
                            setError((prev) => ({ ...prev, address: result }));
                          }
                        }}
          />
          <p style={{color:"red"}}>{error.address}</p>
</div>
</div>
<div class="form-row">
<div className="form-group">
          <label>City</label>
          <input
            placeholder="City"
            value={form.city}
            onChange={(e) => {
                          const val = e.target.value;
            
                          const result = commonInputValidator(val, {
                            numeric: false,
                            allowDecimal: false,
                            minLength: 1,
                            maxLength: 20,
                          });
            
                          if (result === true) {
                            setForm({ ...form, city: e.target.value })
                            setError((prev) => ({ ...prev, city: "" }));
                          } else {
                            setError((prev) => ({ ...prev, city: result }));
                          }
                        }}
          />
          <p style={{color:"red"}}>{error.city}</p>
</div>
<div className="form-group">
          <label>Pincode</label>
          <input
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) => {
                          const val = e.target.value;
            
                          const result = commonInputValidator(val, {
                            numeric: true,
                            allowDecimal: false,
                            minLength: 1,
                            maxLength: 20,
                          });
            
                          if (result === true) {
                            setForm({ ...form, pincode: e.target.value })
                            setError((prev) => ({ ...prev, pincode: "" }));
                          } else {
                            setError((prev) => ({ ...prev, pincode: result }));
                          }
                        }}
          />
          <p style={{color:"red"}}>{error.pincode}</p>
</div>
</div>
          <div className="btn-group">
            <button className="btn-primary" onClick={handleSubmit}>{buttonName}</button>
            <button className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Name</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>City</th>
                <th>Pincode</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {customerList.map((item, index) => (
                <tr key={item.CustomerId}>
                  <td>{index + 1}</td>
                  <td>{item.CustomerId}</td>
                  <td>{item.CustomerName}</td>
                  <td>{item.MobileNo}</td>
                  <td>{item.Email}</td>
                  <td>{item.City}</td>
                  <td>{item.Pincode}</td>
                  <td>
                  <button  className="btn-edit-grid" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="btn-danger-grid"
                    style={{ marginLeft: "8px" }}
                    onClick={() => handleDelete(item.CustomerId)}
                  >
                    Delete
                  </button>
                </td>
                  
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </ProtectedRoute>
  );
};

export default AddCustomer;