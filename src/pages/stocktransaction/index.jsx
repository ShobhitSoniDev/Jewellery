import Link from 'next/link';
import React, { useState } from "react";
import { FaGem, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/router";
import { handleDecimalBlur_Weight, handleDecimalInput_Weight } from "@/utils/inputValidation";

const AddProduct = () => {
    const router = useRouter();
     
      const [productname, setproductname] = useState("");
      const [transactiontype, settransactiontype] = useState("");
      const [netweight, setnetweight] = useState("");
      const [totalquantity, settotalquantity] = useState("");
      const [referencetype, setreferencetype] = useState("");
      const [referenceno, setreferenceno] = useState("");
      const [transactiondate, settransactiondate] = useState("");
       const [error , setError] = useState({
        productname:"",transactiontype:"",netweight:"",totalquantity:"",
        referencetype:"",referenceno:"",totalquantity:"",transactiondate:"",
    });
      const handleValidation = (e) => {
        const newErrors= {};
        let flag = true;
        
        if(productname===""){
          newErrors.productname="Product Name is required"
            flag = false;
        }
        if(transactiontype===""){
          newErrors.transactiontype="Transaction Type is required"
            flag = false;
        }
        if(netweight===""){
          newErrors.netweight="Net Weight is required"
            flag = false;
        }
        if(totalquantity===""){
          newErrors.totalquantity="Total Quantity is required"
            flag = false;
        }
        if(referencetype===""){
          newErrors.referencetype="Reference Type is required"
            flag = false;
        }
        if(referenceno===""){
          newErrors.referenceno="Reference/Bill No is required"
            flag = false;
        }
        if(transactiondate===""){
          newErrors.transactiondate="Transaction Date is required"
            flag = false;
        }
        setError(newErrors);
        return flag;
       };
       const handleSubmit = ()=>{

let isValid = handleValidation();
debugger;
   if (isValid) {
    alert("Stock Transaction Added Successfully");
    // Clear form fields
    setproductname("");
    settransactiontype("");
    settotalquantity("");
    setnetweight("");
    setreferencetype("");
    setreferenceno("");
    settransactiondate("");
    setError({
        productname:"",
        transactiontype:"",
        netweight:"",
        totalquantity:"",
        referencetype:"",
        referenceno:"",
        transactiondate:"",
    });
   }
}
const handleCancel = () => {
    setproductname("");
    settransactiontype("");
    settotalquantity("");
    setnetweight("");
    setreferencetype("");
    setreferenceno("");
    settransactiondate("");
    setError({
        productname:"",
        transactiontype:"",
        netweight:"",
        totalquantity:"",
        referencetype:"",
        referenceno:"",
        transactiondate:"",
    });
};
const gridData = [
    {
      productName: "Payal Fancy",
      transactionType: "IN",
      totalQty: 2,
      netWeight: "66.50",
      referenceType: "PURCHASE",
      billNo: "BI001",
      transactionDate: "15-01-2026"
    },
    {
      productName: "Chain Gold",
      transactionType: "OUT",
      totalQty: 1,
      netWeight: "20.10",
      referenceType: "SALE",
      billNo: "SI045",
      transactionDate: "16-01-2026"
    },
    {
      productName: "Chain Silver",
      transactionType: "OUT",
      totalQty: 1,
      netWeight: "32.10",
      referenceType: "SALE",
      billNo: "SI045",
      transactionDate: "16-01-2026"
    }
  ];
  return (
      <div className="content-wrapper">
        
        {/* Form Card */}
        <div className="form-card">
          <h2>Stock Transaction</h2>
          <hr />

       <div class="form-row">
      <div class="form-group">
        <label>Product Name</label>
        <select
        className='dropdown-select'
        value={productname}
        onChange={(e) => {
              setproductname(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, productname: "" }));
              }
            }}
      >
        <option value="">-- Select --</option>
        <option value="ringfancy">Ring Fancy</option>
        <option value="payalfancy">Payal Fancy</option>
        <option value="nechleshwithstone">Nechlesh with stone</option>
      </select>
      <p style={{color:"red"}}>{error?.productname}</p>
      </div>

      <div class="form-group">
        <label>Transaction Type</label>
        <select
        className='dropdown-select'
        value={transactiontype}
        onChange={(e) => {
              settransactiontype(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, transactiontype: "" }));
              }
            }}
            
      >
        <option value="">-- Select --</option>
        <option value="in">IN</option>
        <option value="out">OUT</option>
      </select>
      <p style={{color:"red"}}>{error?.transactiontype}</p>
      </div>
      
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Total Quantity</label>
        <input type="text" placeholder="Enter total quantity" value={totalquantity} onChange={(e) => {
    // sirf numbers allow
    let val = e.target.value.replace(/[^0-9]/g, "");

    // empty allow (backspace ke liye)
    if (val === "") {
      settotalquantity("");
      setError((prev) => ({ ...prev, totalquantity: "" }));
      return;
    }
    // ❌ starting with zero not allowed (0, 01, 0.5)
    if (val.length === 1 && val === "0") return;
    if (val.startsWith("0") && !val.startsWith("0.")) return;
    if (val.startsWith("0.")) return;
    const num = Number(val);

    // sirf 1 se 1000 ke beech
    if (num >= 1 && num <= 1000) {
      settotalquantity(val);
      setError((prev) => ({ ...prev, totalquantity: "" }));
    }
    
  }}/>
        <p style={{color:"red"}}>{error?.totalquantity}</p>
      </div>
      <div class="form-group">
        <label>Net Weight</label>
        <input
  type="text"
  placeholder="Enter net weight"
  value={netweight}
  onChange={(e) =>
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
      </div>
        <div class="form-row">
      <div class="form-group">
        <label>Reference Type</label>
        <select
        className='dropdown-select'
        value={referencetype}
        onChange={(e) => {
              setreferencetype(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, referencetype: "" }));
              }
            }}
      >
        <option value="">-- Select --</option>
        <option value="PURCHASE">PURCHASE</option>
        <option value="SALE">SALE</option>
        <option value="ADJUSTMENT">ADJUSTMENT</option>
      </select>
      <p style={{color:"red"}}>{error?.referencetype}</p>
      </div>

      <div class="form-group">
        <label>Reference/Bill No</label>
        <input type="text" placeholder="Reference/Bill No" value={referenceno} onChange={(e) => {
              setreferenceno(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, referenceno: "" }));
              }
            }}/>
        <p style={{color:"red"}}>{error?.referenceno}</p>
      </div>
      
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Transaction Date</label>
        <input
  type="date"
  className="form-control"
  name="date" value={transactiondate}
  onChange={(e) => {
              settransactiondate(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, transactiondate: "" }));
              }
            }}/>
        <p style={{color:"red"}}>{error?.transactiondate}</p>
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
                <th>Sr No</th>
                <th>Product</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Net Wt</th>
                <th>Reference</th>
                <th>Bill No</th>
                <th>Transaction Date</th>
              </tr>
            </thead>

            <tbody>
              {gridData.map((item, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{item.productName}</td>
            <td>{item.transactionType}</td>
            <td>{item.totalQty}</td>
            <td>{item.netWeight}</td>
            <td>{item.referenceType}</td>
            <td>{item.billNo}</td>
            <td>{item.transactionDate}</td>
          </tr>
        ))}
            </tbody>
          </table>
        </div>

      </div>
   
  );
};

export default AddProduct;
