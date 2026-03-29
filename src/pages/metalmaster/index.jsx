import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { commonInputValidator } from "@/utils/inputValidation";
import { MetalMaster_Manage, getMetalList } from "@/lib/services/MasterService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";

const AddMetal = () => {
  const router = useRouter();

  const [metalname, setmetalname] = useState("");
  const [purity, setpurity] = useState("");
  const [metalList, setMetalList] = useState([]);
  const [purityList, setPurityList] = useState([]);

  const [editId, setEditId] = useState(null);
  const [buttonName, setButtonName] = useState("Save");
  const [error, setError] = useState({ metalname: "", purity: "" });
  const [voiceStatus, setVoiceStatus] = useState(""); // mic status
// Temp state to trigger submit after voice set
const [voiceSubmitTrigger, setVoiceSubmitTrigger] = useState(false);
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
    setError({ metalname: "", purity: "" });
  };

  /* ---------------- Submit (Add / Update) ---------------- */
  const handleSubmit = async () => {
    if (!handleValidation()) return;

    const payload = {
      metalName: metalname,
      purity: Number(purity),
      typeId: editId ? 2 : 1,
      metalId: editId || 0,
    };

    try {
      const response = await MetalMaster_Manage(payload);
if(response?.data[0]?.code === 1)
{      
  Swal.fire({
        icon: "success",
        title: "Success",
        text: response?.data[0]?.Message || "Saved Successfully",
        confirmButtonColor: "#3085d6",
      });
      resetForm();
      loadMetalList(4);
    }
      else {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: response?.data[0]?.Message || "Failed to save",
        confirmButtonColor: "#3085d6",
      });
    }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error?.response?.data[0]?.Message || "Failed to save",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  /* ---------------- Cancel ---------------- */
  const handleCancel = () => resetForm();

  /* ---------------- Load List ---------------- */
  const loadMetalList = async (typeId) => {
    try {
      const payload = { metalName: "", purity: 0, typeId };
      const response = await getMetalList(payload);

      if (typeId === 4) setMetalList(response?.data || []);
      else if (typeId === 5) setPurityList(response?.data || []);
    } catch (error) {
      console.error("Error loading metal list", error);
    }
  };

  // useEffect(() => {
  //   loadMetalList(4); // metal list
  //   loadMetalList(5); // purity list
  // }, []);

  useEffect(() => {
    loadMetalList(4); // metal list
    loadMetalList(5); // purity list
  if (voiceSubmitTrigger) {
    handleSubmit();
    setVoiceSubmitTrigger(false);
  }
}, [metalname, purity, voiceSubmitTrigger]);
  /* ---------------- Edit ---------------- */
  const handleEdit = (item) => {
    setmetalname(item.MetalName);
    setpurity(item.PurityId.toString());
    setEditId(item.MetalId);
    setButtonName("Update");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const payload = { metalName: "", purity: 0, typeId: 3, metalId: id };
      const response = await MetalMaster_Manage(payload);
      if (response?.code === 1) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: response?.Message || "Deleted successfully",
          confirmButtonColor: "#3085d6",
        });
        loadMetalList(4);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: response?.Message || "Failed to delete",
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "Error!", text: "Delete failed", confirmButtonColor: "#3085d6" });
    }
  };

  /* ---------------- Voice Recognition ---------------- */
  const startVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      Swal.fire({ icon: "error", title: "Oops", text: "Your browser does not support voice recognition!" });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setVoiceStatus("Listening... 🎤");
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      handleVoiceCommand(transcript);
      setVoiceStatus("Command received ✅");
    };

    recognition.onerror = (event) => setVoiceStatus("Error ❌");
    recognition.onend = () => setTimeout(() => setVoiceStatus(""), 2000);

    recognition.start();
  };

  /* ---------------- Voice Command Parser ---------------- */
  const handleVoiceCommand = (text) => {
  const addMetalPattern = /add (\w+)\s*(\d+)\s*carat/i;
  if (addMetalPattern.test(text)) {
    const [, metal, carat] = text.match(addMetalPattern);

    const purityItem = purityList.find((p) =>
      p.PurityDesc.toString().toLowerCase().includes(carat.toLowerCase())
    );

    if (!purityItem) {
      Swal.fire({ icon: "error", title: "Error", text: `Purity ${carat} not found!` });
      return;
    }

    setmetalname(metal);
    setpurity(purityItem.PurityId.toString());
    setEditId(null);
    setButtonName("Save");

    Swal.fire({ icon: "info", title: "Voice Input", text: `Adding ${metal} ${carat} CARAT` });

    // Trigger submit via useEffect after state updated
    setVoiceSubmitTrigger(true);
  }
};

  return (
    <ProtectedRoute>
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
                const result = commonInputValidator(val, { numeric: false, allowDecimal: false, minLength: 1, maxLength: 20 });
                if (result === true) setmetalname(val), setError((prev) => ({ ...prev, metalname: "" }));
                else setError((prev) => ({ ...prev, metalname: result }));
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
                if (e.target.value) setError((prev) => ({ ...prev, purity: "" }));
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
            <button className="btn-primary" onClick={handleSubmit}>{buttonName}</button>
            <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>

          {/* Voice Button */}
          <div style={{ marginTop: "10px" }}>
            <button className="btn-secondary" onClick={startVoiceRecognition} style={{ backgroundColor: "#f0ad4e", color: "#fff" }}>
              🎤 Voice Input
            </button>
            <span style={{ marginLeft: "10px", color: "green" }}>{voiceStatus}</span>
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
                    <span className={`badge ${item.IsActive ? "active" : "deactive"}`}>
                      {item.IsActive ? "Active" : "De Active"}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit-grid" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-danger-grid" style={{ marginLeft: "8px" }} onClick={() => handleDeleteMetal(item.MetalId)}>Delete</button>
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

export default AddMetal;