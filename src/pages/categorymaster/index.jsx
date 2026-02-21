import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { commonInputValidator } from "@/utils/inputValidation";
import { getMetalList, CategoryMaster_Manage } from "@/lib/services/MasterService";
import Swal from "sweetalert2";
const AddCategory = () => {

  const router = useRouter();

  /* ---------------- STATES ---------------- */

  const [selectedMetal, setSelectedMetal] = useState("");
  const [metalList, setMetalList] = useState([]);

  const [categoryname, setcategoryname] = useState("");
  const [categoryList, setCategoryList] = useState([]);

  const [editId, setEditId] = useState(null);
  const [buttonName, setButtonName] = useState("Save");

  const [error, setError] = useState({
    metalList: "",
    categoryname: "",
  });

  /* ---------------- VALIDATION ---------------- */

  const handleValidation = () => {
    const newErrors = {};
    let flag = true;

    if (!selectedMetal) {
      newErrors.metalList = "Please select Metal Name";
      flag = false;
    }

    if (!categoryname) {
      newErrors.categoryname = "Category Name is required";
      flag = false;
    }

    setError(newErrors);
    return flag;
  };

  /* ---------------- SUBMIT (ADD / UPDATE) ---------------- */

  const handleSubmit = async () => {

    if (!handleValidation()) return;

    const payload = {
      metalId: Number(selectedMetal),
      categoryName: categoryname,
      typeId: editId ? 2 : 1, // 1=Add, 2=Update
      categoryId: editId || 0,
    };

    try {

      const response = await CategoryMaster_Manage(payload);

      if (response?.data && response?.data[0]?.Code === 1) {
      
            await Swal.fire({
              icon: "success",
              title: "Saved!",
              text: response?.data[0].Message || "Saved successfully",
              confirmButtonColor: "#3085d6"
            });
      
            loadCategoryList(); // refresh after success
      resetForm();
          } else {
      
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: response?.data[0].Message || "Failed to save",
              confirmButtonColor: "#3085d6"
            });
          }
      
        } catch (error) {
          console.error(error);
      
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: "Failed to save category",
            confirmButtonColor: "#3085d6"
          });
        }
      };

  /* ---------------- RESET ---------------- */

  const resetForm = () => {
    setSelectedMetal("");
    setcategoryname("");
    setEditId(null);
    setButtonName("Save");
    setError({
      metalList: "",
      categoryname: "",
    });
  };

  const handleCancel = () => {
    resetForm();
  };

  /* ---------------- LOAD METAL LIST ---------------- */

  const loadmetalList = async () => {
    try {
      const payload = {
        metalName: "",
        purity: 0,
        typeId: 4,
      };

      const response = await getMetalList(payload);
      setMetalList(response?.data || []);

    } catch (error) {
      console.error("Error loading metal list", error);
    }
  };

  /* ---------------- LOAD CATEGORY LIST ---------------- */

  const loadCategoryList = async () => {
    try {
      const payload = {
        metalId: 0,
        categoryName: "",
        typeId: 4,
        categoryId: 0,
      };

      const response = await CategoryMaster_Manage(payload);
      setCategoryList(response?.data || []);

    } catch (error) {
      console.error("Error loading category list", error);
    }
  };

  useEffect(() => {
    loadmetalList();
    loadCategoryList();
  }, []);

  /* ---------------- EDIT ---------------- */

  const handleEdit = (item) => {

    setSelectedMetal(item.MetalId.toString());
    setcategoryname(item.CategoryName);
    setEditId(item.CategoryId);
    setButtonName("Update");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------- DELETE ---------------- */

  const handleDeleteCategory = async (id) => {

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!"
  });

  // ✅ User ne cancel kiya to yahin stop
  if (!result.isConfirmed) return;

  try {

    const payload = {
      metalId: 0,
      categoryName: "",
      typeId: 3, // delete
      categoryId: id,
    };

    const response = await CategoryMaster_Manage(payload);

    await Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: response?.data?.[0]?.Message || "Deleted successfully",
      timer: 1500,
      showConfirmButton: false
    });

    loadCategoryList();

  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "Delete failed"
    });
  }
};

  /* ---------------- UI ---------------- */

  return (
    <div className="content-wrapper">

      <div className="form-card">
        <h2>Add New Category</h2>
        <hr />

        <div className="form-group">
          <label>Metal Name</label>

          <select
            className="dropdown-select"
            value={selectedMetal}
            onChange={(e) => {
              setSelectedMetal(e.target.value);
              setError(prev => ({ ...prev, metalList: "" }));
            }}
          >
            <option value="">-- Select --</option>

            {metalList.map((item) => (
              <option key={item.MetalId} value={item.MetalId}>
                {item.MetalDesc}
              </option>
            ))}
          </select>

          <p style={{ color: "red" }}>{error.metalList}</p>
        </div>

        <div className="form-group">
          <label>Category Name</label>

          <input
            type="text"
            value={categoryname}
            placeholder="Enter category name"
            onChange={(e) => {

              const val = e.target.value;

              const result = commonInputValidator(val, {
                numeric: false,
                allowDecimal: false,
                minLength: 1,
                maxLength: 20
              });

              if (result === true) {
                setcategoryname(val);
                setError(prev => ({ ...prev, categoryname: "" }));
              } else {
                setError(prev => ({ ...prev, categoryname: result }));
              }
            }}
          />

          <p style={{ color: "red" }}>{error.categoryname}</p>
        </div>

        <div className="btn-group">
          <button className="btn-primary" onClick={handleSubmit}>
            {buttonName}
          </button>

          <button className="btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Category Name</th>
              <th>Metal Name</th>
              <th>Purity</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {categoryList.map((item, index) => (
              <tr key={item.CategoryId}>
                <td>{index + 1}</td>
                <td>{item.CategoryName}</td>
                <td>{item.MetalName}</td>
                <td>{item.Purity}</td>
                <td>
                  <span className={`badge ${item.IsActive ? "active" : "deactive"}`}>
                    {item.IsActive ? "Active" : "De Active"}
                  </span>
                </td>
                <td>
                  <button  className="btn-edit-grid" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="btn-danger-grid"
                    style={{ marginLeft: "8px" }}
                    onClick={() => handleDeleteCategory(item.CategoryId)}
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
  );
};

export default AddCategory;