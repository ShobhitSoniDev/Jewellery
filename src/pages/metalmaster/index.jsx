import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { commonInputValidator } from "@/utils/inputValidation";
import { MetalMaster_Manage, getMetalList } from "@/lib/services/MasterService";
import Swal from "sweetalert2";

const AddMetal = () => {
  const router = useRouter();

  const [metalname, setmetalname] = useState("");
  const [purity, setpurity] = useState("");
  const [metalList, setMetalList] = useState([]);
  const [purityList, setPurityList] = useState([]);

  const [editId, setEditId] = useState(null);
  const [buttonName, setButtonName] = useState("Save");

  const [error, setError] = useState({
    metalname: "",
    purity: "",
  });

  /* ---------------- Validation ---------------- */
  const handleValidation = () => {
    const newErrors = {};
    let flag = true;

    if (!metalname.trim()) {
      newErrors.metalname = "Metal Name is required";
      flag = false;
    }

    if (!purity) {
      newErrors.purity = "Please select Purity";
      flag = false;
    }

    setError(newErrors);
    return flag;
  };

  /* ---------------- Reset Form ---------------- */
  const resetForm = () => {
    setmetalname("");
    setpurity("");
    setEditId(null);
    setButtonName("Save");
    setError({
      metalname: "",
      purity: "",
    });
  };

  /* ---------------- Submit (Add / Update) ---------------- */
  const handleSubmit = async () => {
    if (!handleValidation()) return;
    const payload = {
      metalName: metalname,
      purity: Number(purity),
      typeId: editId ? 2 : 1, // 1 = Add, 2 = Update
      metalId: editId || 0,
    };

    try {
      const response = await MetalMaster_Manage(payload);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: response?.data?.[0]?.Message || "Saved Successfully",
        confirmButtonColor: "#3085d6",
      });
      resetForm();
      loadMetalList(4); // Refresh list after add/update
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error?.response?.data?.[0]?.Message || "Failed to save",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  /* ---------------- Cancel ---------------- */
  const handleCancel = () => {
    resetForm();
  };



  /* ---------------- Load List ---------------- */
  const loadMetalList = async (typeId) => {
    try {
      const payload = {
        metalName: "",
        purity: 0,
        typeId: typeId,
      };

      const response = await getMetalList(payload);
      if(typeId===4)
      {
        setMetalList(response?.data || []);
      }
      else if(typeId===5)
      {
        setPurityList(response?.data || []);
      }
      
    } catch (error) {
      console.error("Error loading metal list", error);
    }
  };

  useEffect(() => {
    loadMetalList(4);  //Bind metal list
    loadMetalList(5); //Bind purity list
  }, []);

  /* ---------------- Edit ---------------- */
  const handleEdit = (item) => {
    setmetalname(item.MetalName);
    setpurity(item.PurityId.toString());
    setEditId(item.MetalId);
    setButtonName("Update");
    window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
  };

  /* ---------------- Delete ---------------- */
  const handleDeleteMetal = async (id) => {

  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!"
  });

  // ✅ cancel kiya to stop
  if (!result.isConfirmed) return;

  try {

    const payload = {
      metalName: "",
      purity: 0,
      typeId: 3,
      metalId: id,
    };

    const response = await MetalMaster_Manage(payload);
debugger
    // ✅ success condition
    if (response?.data && response?.data[0]?.code === 1) {

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: response?.data[0].Message || "Deleted successfully",
        confirmButtonColor: "#3085d6"
      });

      loadMetalList(4); // refresh after success

    } else {

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: response?.data[0].Message || "Failed to delete",
        confirmButtonColor: "#3085d6"
      });
    }

  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "Delete failed",
      confirmButtonColor: "#3085d6"
    });
  }
};


  return (
    <div className="content-wrapper">
      {/* Form */}
      <div className="form-card">
        <h2>Add New Metal</h2>
        <hr />

        <div className="form-group">
          <label>Metal Name</label>
          <input
            type="text"
            value={metalname}
            placeholder="e.g. Platinum, Rose Gold"
            onChange={(e) => {
              const val = e.target.value;

              const result = commonInputValidator(val, {
                numeric: false,
                allowDecimal: false,
                minLength: 1,
                maxLength: 20,
              });

              if (result === true) {
                setmetalname(val);
                setError((prev) => ({ ...prev, metalname: "" }));
              } else {
                setError((prev) => ({ ...prev, metalname: result }));
              }
            }}
          />
          <p style={{ color: "red" }}>{error.metalname}</p>
        </div>

        <div className="form-group">
          <label>Purity</label>
          <select
            value={purity}
            onChange={(e) => {
              setpurity(e.target.value);
              if (e.target.value)
                setError((prev) => ({ ...prev, purity: "" }));
            }}
          >
            <option value="">-- Select --</option>
            {purityList.map((item) => (
              <option key={item.PurityId} value={item.PurityId}>
                {item.PurityDesc}
              </option>
            ))}
          </select>

          <p style={{ color: "red" }}>{error.purity}</p>
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

      {/* Table */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Metal Name</th>
              <th>Purity</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {metalList.map((item, index) => (
              <tr key={item.MetalId}>
                <td>{index + 1}</td>
                <td>{item.MetalName}</td>
                <td>{item.Purity}</td>
                <td>
                  <span
                    className={`badge ${
                      item.IsActive ? "active" : "deactive"
                    }`}
                  >
                    {item.IsActive ? "Active" : "De Active"}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-edit-grid"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger-grid" style={{ marginLeft: "8px" }}
                    onClick={() => handleDeleteMetal(item.MetalId)}
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

export default AddMetal;
