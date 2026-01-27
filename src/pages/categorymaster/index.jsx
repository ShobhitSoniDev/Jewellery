import Link from 'next/link';
import React, { useState } from "react";
import { FaGem, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/router";

const AddMetal = () => {
    const router = useRouter();
      const [metalname, setmetalname] = useState("");
      
      const [categoryname, setcategoryname] = useState("");
       const [error , setError] = useState({
        metalname:"",
        categoryname:"",
    });
      const handleValidation = (e) => {
        const newErrors= {};
        let flag = true;
        if (metalname === "") {
          newErrors.metalname="Please select Metal Name"
            flag = false;
        }       
        if(categoryname===""){
          newErrors.categoryname="Category Name is required"
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
    alert("Category Added Successfully");
    // Clear form fields
    setmetalname("");
    setcategoryname("");
    setError({
        metalname:"",
        categoryname:"",
    });
   }
}
const handleCancel = () => {
    setmetalname("");
    setcategoryname("");
    setError({
        metalname: "",
        categoryname: "",
    });
};
const MetalList = [
  { id: 1, name: "Gold" },
  { id: 2, name: "Silver" },
  { id: 3, name: "Diamond" }
];
  return (
  
      <div className="content-wrapper">
        
        {/* Form Card */}
        <div className="form-card">
          <h2>Add New Category</h2>
          <hr />

        <div className="form-group">
            <label>Metal Name</label>
            <select
        className='dropdown-select'
        value={metalname}
        onChange={(e) => {
              setmetalname(e.target.value);
              // Agar type kar rahe hain toh error clear karein
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, metalname: "" }));
              }
            }}
      >
        <option value="">-- Select --</option>
        {MetalList.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
    ))}
      </select>

      
            <p style={{color:"red"}}>{error?.metalname}</p>
        </div>
        <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              placeholder="Enter metal category name"
              value={categoryname}
              onChange={(e) => {
              setcategoryname(e.target.value);
              // Agar type kar rahe hain toh error clear karein
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, categoryname: "" }));
              }
            }}
            />
            <p style={{color:"red"}}>{error?.categoryname}</p>
        </div>
          <div className="btn-group">
            <button className="btn-primary" onClick={handleSubmit}>Add Category</button>
            <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Gold Ring</td>
                <td>Gold</td>
                <td>280</td>
                <td><span className="badge stock">Stock</span></td>
              </tr>
              <tr>
                <td>Diamond Ring</td>
                <td>Diamond</td>
                <td>280</td>
                <td><span className="badge sale">Sale</span></td>
              </tr>
              <tr>
                <td>Silver Ring</td>
                <td>Silver</td>
                <td>40</td>
                <td><span className="badge stock">Stock</span></td>
              </tr>
              <tr>
                <td>Emerald Ring</td>
                <td>Emerald</td>
                <td>12</td>
                <td><span className="badge left">Left</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
   
  );
};

export default AddMetal;
