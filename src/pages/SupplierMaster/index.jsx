import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { commonInputValidator } from "@/utils/inputValidation";
import { SupplierMaster_Manage } from "@/lib/services/MasterService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

const SupplierMaster = () => {
  const router = useRouter();

  /* ---------------- STATES ---------------- */

  const [supplierList, setSupplierList] = useState([]);

  const [form, setForm] = useState({
    supplierName: "",
    phone: "",
    gstin: "",
    address: "",
    isActive: true,
  });

  const [editId, setEditId] = useState(null);
  const [buttonName, setButtonName] = useState("Save");
  const [error, setError] = useState({});

  /* ---------------- VALIDATION ---------------- */

  const handleValidation = () => {
    let flag = true;
    let newErrors = {};

    if (!form.supplierName) {
      newErrors.supplierName = "Supplier Name is required";
      flag = false;
    }

    if (!form.phone) {
      newErrors.phone = "Phone is required";
      flag = false;
    }

    if (!form.gstin) {
      newErrors.gstin = "GSTIN is required";
      flag = false;
    }

    if (!form.address) {
      newErrors.address = "Address is required";
      flag = false;
    }

    setError(newErrors);
    return flag;
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    if (!handleValidation()) return;

    const payload = {
      SupplierId: editId || 0,
      SupplierName: form.supplierName,
      Phone: form.phone,
      GSTIN: form.gstin,
      Address: form.address,
      IsActive: form.isActive,
      TypeId: editId ? 2 : 1,
    };

    try {
      const response = await SupplierMaster_Manage(payload);

      if (
        response &&
        response.data &&
        response.data[0] &&
        response.data[0].Message
      ) {
        await Swal.fire({
          icon: "success",
          title: "Saved!",
          text: response.data[0].Message || "Saved successfully",
        });

        loadSupplierList();
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
      supplierName: "",
      phone: "",
      gstin: "",
      address: "",
      isActive: true,
    });
    setEditId(null);
    setButtonName("Save");
    setError({});
  };

  /* ---------------- LOAD LIST ---------------- */

  const loadSupplierList = async () => {
    try {
      const payload = {
        SupplierId: 0,
        SupplierName: "",
        Phone: "",
        GSTIN: "",
        Address: "",
        IsActive: true,
        TypeId: 5, // Get All
      };

      const res = await SupplierMaster_Manage(payload);
      setSupplierList(res?.data || []);
    } catch (err) {
      console.error("Error loading suppliers", err);
    }
  };

  useEffect(() => {
    loadSupplierList();
  }, []);

  /* ---------------- EDIT ---------------- */

  const handleEdit = (item) => {
    setForm({
      supplierName: item.SupplierName || "",
      phone: item.Phone || "",
      gstin: item.GSTIN || "",
      address: item.Address || "",
      isActive: item.IsActive ?? true,
    });

    setEditId(item.SupplierId);
    setButtonName("Update");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (SupplierId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!result.isConfirmed) return;

    try {
      const payload = {
        SupplierId: SupplierId,
        TypeId: 3, // Delete
      };

      await SupplierMaster_Manage(payload);

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });

      loadSupplierList();
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
          <h2>Supplier Master</h2>
          <hr />

          <div className="form-row">
            <div className="form-group">
              <label>Supplier Name</label>
              <input
                placeholder="Supplier Name"
                value={form.supplierName}
                onChange={(e) => {
                  const val = e.target.value;
                  const result = commonInputValidator(val, {
                    numeric: false,
                    allowDecimal: false,
                    minLength: 1,
                    maxLength: 150,
                    allowHindi: true,
                  });
                  if (result === true) {
                    setForm({ ...form, supplierName: val });
                    setError((prev) => ({ ...prev, supplierName: "" }));
                  } else {
                    setError((prev) => ({ ...prev, supplierName: result }));
                  }
                }}
              />
              <p style={{ color: "red" }}>{error.supplierName}</p>
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  const result = commonInputValidator(val, {
                    numeric: true,
                    allowDecimal: false,
                    minLength: 10,
                    maxLength: 15,
                  });
                  if (result === true) {
                    setForm({ ...form, phone: val });
                    setError((prev) => ({ ...prev, phone: "" }));
                  } else {
                    setError((prev) => ({ ...prev, phone: result }));
                  }
                }}
              />
              <p style={{ color: "red" }}>{error.phone}</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>GSTIN</label>
              <input
                placeholder="GSTIN"
                value={form.gstin}
                onChange={(e) => {
                  const val = e.target.value;
                  const result = commonInputValidator(val, {
                    numeric: false,
                    allowDecimal: false,
                    minLength: 1,
                    maxLength: 15,
                  });
                  if (result === true) {
                    setForm({ ...form, gstin: val.toUpperCase() });
                    setError((prev) => ({ ...prev, gstin: "" }));
                  } else {
                    setError((prev) => ({ ...prev, gstin: result }));
                  }
                }}
              />
              <p style={{ color: "red" }}>{error.gstin}</p>
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
                    maxLength: 200,
                    allowHindi: true,
                  });
                  if (result === true) {
                    setForm({ ...form, address: val });
                    setError((prev) => ({ ...prev, address: "" }));
                  } else {
                    setError((prev) => ({ ...prev, address: result }));
                  }
                }}
              />
              <p style={{ color: "red" }}>{error.address}</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Is Active</label>
              <select
                value={form.isActive ? "true" : "false"}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.value === "true" })
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="form-group">    </div>
          </div>

          <div className="btn-group">
            <button className="btn-primary" onClick={handleSubmit}>
              {buttonName}
            </button>
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
                <th>Supplier ID</th>
                <th>Supplier Name</th>
                <th>Phone</th>
                <th>GSTIN</th>
                <th>Address</th>
                <th>Is Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {supplierList.map((item, index) => (
                <tr key={item.SupplierId}>
                  <td>{index + 1}</td>
                  <td>{item.SupplierId}</td>
                  <td>{item.SupplierName}</td>
                  <td>{item.Phone}</td>
                  <td>{item.GSTIN}</td>
                  <td>{item.Address}</td>
                  <td>{item.IsActive ? "Active" : "Inactive"}</td>
                  <td>
                    <button
                      className="btn-edit-grid"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger-grid"
                      style={{ marginLeft: "8px" }}
                      onClick={() => handleDelete(item.SupplierId)}
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

export default SupplierMaster;
