import Link from 'next/link';
import React, { useState } from "react";
import { FaGem, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/router";

const AddMetal = () => {
    const router = useRouter();
      const [metalname, setmetalname] = useState("");
      
      const [purity, setpurity] = useState("");
       const [error , setError] = useState({
        metalname:"",
        purity:"",
    });
      const handleValidation = (e) => {
        const newErrors= {};
        let flag = true;
        if (metalname === "") {
          newErrors.metalname="Metal Name is required"
            flag = false;
        }       
        if(purity===""){
          newErrors.purity="Please select Purity"
            flag = false;
        }
        newErrors;
        setError(newErrors);
        return flag;
       };
       const handleSubmit = ()=>{

let isValid = handleValidation();
debugger;
   if (isValid) {
    alert("Metal Added Successfully");
    // Clear form fields
    setmetalname("");
    setpurity("");
    setError({
        metalname:"",
        purity:"",
    });
   }
}
const handleCancel = () => {
    setmetalname("");
    setpurity("");
    setError({
        metalname: "",
        purity: "",
    });
};
const PurityList = [
  { id: 1, name: "22" },
  { id: 2, name: "18" },
  { id: 3, name: "14" }
];
  return (
  
      <div className="content-wrapper">
        
        {/* Form Card */}
        <div className="form-card">
          <h2>Add New Metal</h2>
          <hr />

        <div className="form-group">
            <label>Metal Name</label>
            <input
              type="text"
              placeholder="e.g. Platinum, Rose Gold"
              value={metalname}
              onChange={(e) => {
              setmetalname(e.target.value);
              // Agar type kar rahe hain toh error clear karein
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, metalname: "" }));
              }
            }}
            />
            <p style={{color:"red"}}>{error?.metalname}</p>
        </div>
        <div className="form-group">
            <label>Purity</label>
            <select
        className='dropdown-select'
        value={purity}
        onChange={(e) => {
              setpurity(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, purity: "" }));
              }
            }}
      >
        <option value="">-- Select --</option>
        {PurityList.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
    ))}
      </select>
            <p style={{color:"red"}}>{error?.purity}</p>
        </div>
          <div className="btn-group">
            <button className="btn-primary" onClick={handleSubmit}>Add Metal</button>
            <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                
                <th>Metal Name</th>
                <th>Purity</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Gold</td>
                <td>18</td>
                <td><span className="badge active">Active</span></td>
              </tr>
              <tr>
                
                <td>Diamond</td>
                <td>0</td>
                <td><span className="badge deactive">De Active</span></td>
              </tr>
              <tr>
                
                <td>Silver</td>
                <td>0</td>
                <td><span className="badge active">Active</span></td>
              </tr>
             
            </tbody>
          </table>
        </div>

      </div>
   
  );
};

export default AddMetal;
