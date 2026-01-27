import Link from 'next/link';
import React, { useState } from "react";
import { FaGem, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/router";
import { handleDecimalBlur_Weight, handleDecimalInput_Weight,commonInputValidator,runValidators } from "@/utils/inputValidation";

const AddProduct = () => {
    const router = useRouter();
      const [metalname, setmetalname] = useState("");      
      const [categoryname, setcategoryname] = useState("");
      const [productname, setproductname] = useState("");
      const [grossweight, setgrossweight] = useState("");
      const [netweight, setnetweight] = useState("");
      const [wastageweight, setwastageweight] = useState("");
      const [makingcharge, setmakingcharge] = useState("");
      const [ratepergram, setratepergram] = useState("");
      const [totalquantity, settotalquantity] = useState("");

       const [error , setError] = useState({
        metalname:"",
        categoryname:"",productname:"",grossweight:"",netweight:"",wastageweight:"",
        makingcharge:"",ratepergram:"",totalquantity:"",
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
        if(productname===""){
          newErrors.productname="Product Name is required"
            flag = false;
        }
        if(grossweight===""){
          newErrors.grossweight="Gross Weight is required"
            flag = false;
        }
        if(netweight===""){
          newErrors.netweight="Net Weight is required"
            flag = false;
        }
        if(wastageweight===""){
          newErrors.wastageweight="Wastage Weight is required"
            flag = false;
        }
        if(makingcharge===""){
          newErrors.makingcharge="Making Charge is required"
            flag = false;
        }
        if(ratepergram===""){
          newErrors.ratepergram="Rate Per Gram is required"
            flag = false;
        }
        if(totalquantity===""){
          newErrors.totalquantity="Total Quantity is required"
            flag = false;
        }
        setError(newErrors);
        return flag;
       };
       const handleSubmit = ()=>{

let isValid = handleValidation();
debugger;
   if (isValid) {
    alert("Product Added Successfully");
    // Clear form fields
    setmetalname("");
    setcategoryname("");
    setproductname("");
    setgrossweight("");
    setnetweight("");
    setwastageweight("");
    setmakingcharge("");
    setratepergram("");
    settotalquantity("");
    setError({
        metalname:"",
        categoryname:"",
    });
   }
}
const handleCancel = () => {
    setmetalname("");
    setcategoryname("");
    setproductname("");
    setgrossweight("");
    setnetweight("");
    setwastageweight("");
    setmakingcharge("");
    setratepergram("");
    settotalquantity("");
    setError({
        metalname: "",
        categoryname: "",
        productname:"",
        grossweight:"",
        netweight:"",
        wastageweight:"",
        makingcharge:"",
        ratepergram:"",
        totalquantity:"",
    });
};
const MetalList = [
  { id: 1, name: "Gold" },
  { id: 2, name: "Silver" },
  { id: 3, name: "Diamond" }
];
const CategoryList = [
  { id: 1, name: "Ring" },
  { id: 2, name: "Payal" },
  { id: 3, name: "Nechlesh" },
  { id: 4, name: "Brachlet" }
];
  return (
      <div className="content-wrapper">
        
        {/* Form Card */}
        <div className="form-card">
          <h2>Add New Product</h2>
          <hr />

       <div class="form-row">
      <div class="form-group">
        <label>Metal Name</label>
        <select
        className='dropdown-select'
        value={metalname}
        onChange={(e) => {
              setmetalname(e.target.value);
              
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

      <div class="form-group">
        <label>Category Name</label>
        <select
        className='dropdown-select'
        value={categoryname}
        onChange={(e) => {
              setcategoryname(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, categoryname: "" }));
              }
            }}
      >
        <option value="">-- Select --</option>
        {CategoryList.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
    ))}
      </select>
      <p style={{color:"red"}}>{error?.categoryname}</p>
      </div>
    </div>

   
    <div class="form-row">
      <div class="form-group">
        <label>Product Name</label>
        <input type="text" placeholder="Enter product name" value={productname} onChange={(e) => {
              setproductname(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, productname: "" }));
              }
            }} />
        <p style={{color:"red"}}>{error?.productname}</p>
      </div>

      <div class="form-group">
        <label>Gross Weight</label>
        <input type="text" placeholder="Enter gross weight" value={grossweight} onChange={(e) =>
    handleDecimalInput_Weight(
      e.target.value,
      setgrossweight,
      setError,
      "grossweight"
    )
  }
  onBlur={() => handleDecimalBlur_Weight(grossweight, setgrossweight)}
            />
        <p style={{color:"red"}}>{error?.grossweight}</p>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Net Weight</label>
        <input type="text" placeholder="Enter net weight" value={netweight} onChange={(e) =>
    handleDecimalInput_Weight(
      e.target.value,
      setnetweight,
      setError,
      "netweight"
    )
  }
  onBlur={() => handleDecimalBlur_Weight(netweight, setnetweight)}/>
        <p style={{color:"red"}}>{error?.netweight}</p>
      </div>

      <div class="form-group">
        <label>Wastage Weight</label>
        <input type="text" placeholder="Enter wastage weight" value={wastageweight} onChange={(e) =>
    handleDecimalInput_Weight(
      e.target.value,
      setwastageweight,
      setError,
      "wastageweight"
    )
  }
  onBlur={() => handleDecimalBlur_Weight(wastageweight, setwastageweight)}/>
        <p style={{color:"red"}}>{error?.wastageweight}</p>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Making Charge</label>
        <input type="text" placeholder="Enter making charge" value={makingcharge} onChange={(e) => {
    const val = e.target.value;

    const result = commonInputValidator(val , {
  numeric: true,
  allowDecimal : false,
  maxDigits: 10,
  maxDecimalPlaces: 2
});


    if (result === true) {
      setmakingcharge(val);
      setError((prev) => ({ ...prev, makingcharge: "" }));
    } else {
      setError((prev) => ({ ...prev, makingcharge: result }));
    }
  }}/>
        <p style={{color:"red"}}>{error?.makingcharge}</p>
      </div>

      <div class="form-group">
        <label>Rate Per Gram</label>
        <input type="text" placeholder="Enter rate per gram" value={ratepergram} onChange={(e) => {
    const val = e.target.value;

    const result = commonInputValidator(val , {
  numeric: true,
  allowDecimal : true,
  maxDigits: 10,
  maxDecimalPlaces: 2
});

    if (result === true) {
      setratepergram(val);
      setError((prev) => ({ ...prev, ratepergram: "" }));
    } else {
      setError((prev) => ({ ...prev, ratepergram: result }));
    }}}/>
        <p style={{color:"red"}}>{error?.ratepergram}</p>
      </div>
    </div>
      <div class="form-row">
      <div class="form-group">
        <label>Total Quantity</label>
        <input type="text" placeholder="Enter total quantity" value={totalquantity} onChange={(e) => {
              settotalquantity(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, totalquantity: "" }));
              }
            }}/>
        <p style={{color:"red"}}>{error?.totalquantity}</p>
      </div>
      <div class="form-group">
       
      </div>
      </div>
   
          <div className="btn-group">
            <button className="btn-primary" onClick={handleSubmit}>Add Product</button>
            <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Metal Name</th>
                <th>Category</th>
                <th>Product</th>
                <th>Gross Weight</th>
                <th>Net Weight</th>
                <th>Wastage Weight</th>
                <th>Making Charge</th>
                <th>Rate Per Gram</th>
                <th>Total Quantity</th>
              </tr>
            </thead>

            <tbody>
              <tr>
      <td>Gold</td>
      <td>Ring</td>
      <td>Gold Ring 22K</td>
      <td>10.500 g</td>
      <td>10.200 g</td>
      <td>0.300 g</td>
      <td>₹1500</td>
      <td>₹6200</td>
      <td>5</td>
    </tr>

    <tr>
      <td>Gold</td>
      <td>Necklace</td>
      <td>Gold Necklace</td>
      <td>25.750 g</td>
      <td>25.000 g</td>
      <td>0.750 g</td>
      <td>₹3500</td>
      <td>₹6200</td>
      <td>2</td>
    </tr>

    <tr>
      <td>Silver</td>
      <td>Anklet</td>
      <td>Silver Anklet</td>
      <td>40.000 g</td>
      <td>39.200 g</td>
      <td>0.800 g</td>
      <td>₹800</td>
      <td>₹75</td>
      <td>10</td>
    </tr>

    <tr>
      <td>Platinum</td>
      <td>Bracelet</td>
      <td>Platinum Bracelet</td>
      <td>15.300 g</td>
      <td>15.000 g</td>
      <td>0.300 g</td>
      <td>₹5000</td>
      <td>₹3400</td>
      <td>1</td>
    </tr>
            </tbody>
          </table>
        </div>

      </div>
   
  );
};

export default AddProduct;
