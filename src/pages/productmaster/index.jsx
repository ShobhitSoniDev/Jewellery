import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { commonInputValidator } from "@/utils/inputValidation";
import {
  ProductMaster_Manage,
  MetalMaster_Manage,
  CategoryMaster_Manage,
} from "@/lib/services/MasterService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

const ProductMaster = () => {
  const router = useRouter();

  /* ---------------- STATES ---------------- */
  const [productList, setProductList] = useState([]);

  const [form, setForm] = useState({
    productCode: "",
    productName: "",
    categoryId: "",
    metalId: "",
    makingCharge: "",
    makingChargeType: "FLAT",
    isActive: true,
  });

  const [editId, setEditId] = useState(null);
  const [buttonName, setButtonName] = useState("Save");
  const [error, setError] = useState({});
  const [metalList, setMetalList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);

  /* ---------------- LOAD DROPDOWNS ---------------- */
  const loadMetalList = async () => {
    try {
      const payload = {
        metalName: "",
        purity: 0,
        createdBy: "",
        typeId: 4,
        metalId: 0,
      };
      const res = await MetalMaster_Manage(payload);
      setMetalList(res?.data || []);
    } catch (err) {
      console.error("Error loading metals", err);
    }
  };

  const loadCategoryList = async (metalId) => {
    try {
      setCategoryList([]);
      const payload = {
        metalId: Number(metalId),
        categoryName: "",
        createdBy: "",
        typeId: 5,
        categoryId: 0,
      };
      const res = await CategoryMaster_Manage(payload);
      setCategoryList(res?.data || []);
    } catch (err) {
      console.error("Error loading categories", err);
    }
  };

  useEffect(() => {
    loadProductList();
    loadMetalList();
  }, []);

  /* ---------------- METAL CHANGE ---------------- */
  const handleMetalChange = (e) => {
    const selectedMetalId = e.target.value;
    setForm((prev) => ({
      ...prev,
      metalId: selectedMetalId,
      categoryId: "",
    }));
    setError((prev) => ({ ...prev, metalId: "", categoryId: "" }));

    if (selectedMetalId) {
      loadCategoryList(selectedMetalId);
    } else {
      setCategoryList([]);
    }
  };

  /* ---------------- VALIDATION ---------------- */
  const handleValidation = () => {
    let flag = true;
    let newErrors = {};

    if (!form.productCode) {
      newErrors.productCode = "Product Code is required";
      flag = false;
    }
    if (!form.productName) {
      newErrors.productName = "Product Name is required";
      flag = false;
    }
    if (!form.metalId) {
      newErrors.metalId = "Metal is required";
      flag = false;
    }
    if (!form.categoryId) {
      newErrors.categoryId = "Category is required";
      flag = false;
    }
    if (!form.makingCharge) {
      newErrors.makingCharge = "Making Charge is required";
      flag = false;
    }

    setError(newErrors);
    return flag;
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (!handleValidation()) return;

    const createdBy = sessionStorage.getItem("username") || "Admin";

    const payload = {
      ProductId: editId || 0,
      ProductCode: form.productCode,
      ProductName: form.productName,
      CategoryId: Number(form.categoryId),
      MetalId: Number(form.metalId),
      MakingCharge: parseFloat(form.makingCharge || 0),
      MakingChargeType: form.makingChargeType,
      IsActive: form.isActive,
      CreatedBy: createdBy,
      TypeId: editId ? 3 : 2,
    };

    try {
      const response = await ProductMaster_Manage(payload);

      if (response?.data?.[0]?.Message) {
        await Swal.fire({
          icon: "success",
          title: "Saved!",
          text: response.data[0].Message,
        });
        loadProductList();
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
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong" });
    }
  };

  /* ---------------- RESET ---------------- */
  const resetForm = () => {
    setForm({
      productCode: "",
      productName: "",
      categoryId: "",
      metalId: "",
      makingCharge: "",
      makingChargeType: "FLAT",
      isActive: true,
    });
    setCategoryList([]);
    setEditId(null);
    setButtonName("Save");
    setError({});
  };

  /* ---------------- LOAD PRODUCT LIST ---------------- */
  const loadProductList = async () => {
    try {
      const res = await ProductMaster_Manage({ TypeId: 1 });
      setProductList(res?.data || []);
    } catch (err) {
      console.error("Error loading products", err);
    }
  };

  /* ---------------- EDIT ---------------- */
  const handleEdit = async (item) => {
    if (item.MetalId) {
      await loadCategoryList(item.MetalId);
    }
    setForm({
      productCode: item.ProductCode || "",
      productName: item.ProductName || "",
      categoryId: item.CategoryId ? item.CategoryId.toString() : "",
      metalId: item.MetalId ? item.MetalId.toString() : "",
      makingCharge: item.MakingCharge ? item.MakingCharge.toString() : "",
      makingChargeType: item.MakingChargeType || "FLAT",
      isActive: item.IsActive ?? true,
    });

    setEditId(item.ProductId);
    setButtonName("Update");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (ProductId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!result.isConfirmed) return;

    try {
      const createdBy = sessionStorage.getItem("username") || "Admin";
      const payload = { ProductId, CreatedBy: createdBy, TypeId: 4 };
      const response = await ProductMaster_Manage(payload);

      if (response && response.data && response.data[0] && response.data[0].Code === 1) {
                  await Swal.fire({
                    icon: "success",
                    title: "Saved!",
                    text: response.data[0].Message || "Saved successfully",
                  });
               loadProductList();
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
      Swal.fire({ icon: "error", title: "Error", text: "Delete failed" });
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <ProtectedRoute>
      <div className="content-wrapper">

        {/* ---------------- FORM ---------------- */}
        <div className="form-card">
          <h2>Product Master</h2>
          <hr />

          {/* Row 1: Product Code | Product Name */}
          <div className="form-row">
            <div className="form-group">
              <label>Product Code</label>
              <input
                placeholder="Product Code"
                value={form.productCode}
                onChange={(e) => {
                  const val = e.target.value;
                  const result = commonInputValidator(val, {
                    numeric: false,
                    allowDecimal: false,
                    minLength: 1,
                    maxLength: 30,
                  });
                  if (result === true) {
                    setForm({ ...form, productCode: val.toUpperCase() });
                    setError((prev) => ({ ...prev, productCode: "" }));
                  } else {
                    setError((prev) => ({ ...prev, productCode: result }));
                  }
                }}
              />
              <p style={{ color: "red" }}>{error.productCode}</p>
            </div>

            <div className="form-group">
              <label>Product Name</label>
              <input
                placeholder="Product Name"
                value={form.productName}
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
                    setForm({ ...form, productName: val });
                    setError((prev) => ({ ...prev, productName: "" }));
                  } else {
                    setError((prev) => ({ ...prev, productName: result }));
                  }
                }}
              />
              <p style={{ color: "red" }}>{error.productName}</p>
            </div>
          </div>

          {/* Row 2: Metal | Category */}
          <div className="form-row">
            <div className="form-group">
              <label>Metal</label>
              <select value={form.metalId} onChange={handleMetalChange}>
                <option value="">-- Select Metal --</option>
                {metalList.map((metal) => (
                  <option key={metal.MetalId} value={metal.MetalId}>
                    {metal.MetalDesc}
                  </option>
                ))}
              </select>
              <p style={{ color: "red" }}>{error.metalId}</p>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  setForm({ ...form, categoryId: e.target.value });
                  setError((prev) => ({ ...prev, categoryId: "" }));
                }}
                disabled={!form.metalId}
              >
                <option value="">
                  {form.metalId ? "-- Select Category --" : "-- Select Metal First --"}
                </option>
                {categoryList.map((cat) => (
                  <option key={cat.CategoryId} value={cat.CategoryId}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
              <p style={{ color: "red" }}>{error.categoryId}</p>
            </div>
          </div>

          {/* Row 3: Making Charge | Making Charge Type */}
          <div className="form-row">
            <div className="form-group">
              <label>Making Charge</label>
              <input
                placeholder="Making Charge"
                value={form.makingCharge}
                onChange={(e) => {
                  const val = e.target.value;
                  const result = commonInputValidator(val, {
                    numeric: true,
                    allowDecimal: true,
                    minLength: 1,
                    maxLength: 10,
                  });
                  if (result === true) {
                    setForm({ ...form, makingCharge: val });
                    setError((prev) => ({ ...prev, makingCharge: "" }));
                  } else {
                    setError((prev) => ({ ...prev, makingCharge: result }));
                  }
                }}
              />
              <p style={{ color: "red" }}>{error.makingCharge}</p>
            </div>

            <div className="form-group">
              <label>Making Charge Type</label>
              <select
                value={form.makingChargeType}
                onChange={(e) =>
                  setForm({ ...form, makingChargeType: e.target.value })
                }
              >
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENT">Percent (%)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Is Active */}
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
            <div className="form-group"></div>
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

        {/* ---------------- TABLE ---------------- */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Metal</th>
                <th>Category</th>
                <th>Making Charge</th>
                <th>Charge Type</th>
                <th>Qty</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((item, index) => (
                <tr key={item.ProductId}>
                  <td>{index + 1}</td>
                  <td>{item.ProductCode}</td>
                  <td>{item.ProductName}</td>
                  <td>{item.MetalName}</td>
                  <td>{item.CategoryName}</td>
                  <td>{item.MakingCharge}</td>
                  <td>{item.MakingChargeType}</td>
                  <td>{item.TotalQuantity}</td>
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
                      onClick={() => handleDelete(item.ProductId)}
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

export default ProductMaster;