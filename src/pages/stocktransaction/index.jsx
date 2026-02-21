import Link from 'next/link';
import React, { useState,useEffect } from "react";
import { FaGem, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/router";
import { commonInputValidator } from "@/utils/inputValidation";
import { ProductMaster_Manage } from "@/lib/services/MasterService";
import { StockTransaction_Manage } from "@/lib/services/TransactionsService";
import Swal from "sweetalert2";



const AddProduct = () => {
    const router = useRouter();
     
      const [ProductList, setProductList] = useState([]);
      const [selectedProduct, setselectedProduct] = useState("");
      const [transactionTypeList, settransactionTypeList] = useState([]);
      const [selectedTransactionType, setselectedTransactionType] = useState("");
      const [referencetypeList, setreferencetypeList] = useState([]);
      const [netweight, setnetweight] = useState("");
      const [totalquantity, settotalquantity] = useState("");
      const [selectedreferencetype, setSelectedreferencetype] = useState("");
      const [referenceno, setreferenceno] = useState("");
      const [transactiondate, settransactiondate] = useState("");
      const [stockList, setStockList] = useState([]);
      const [editId, setEditId] = useState(null);
       const [error , setError] = useState({
        ProductList:"",transactionTypeList:"",netweight:"",totalquantity:"",
        referencetypeList:"",referenceno:"",totalquantity:"",transactiondate:"",
    });
      const handleValidation = (e) => {
        const newErrors= {};
        let flag = true;
        debugger
        if(selectedProduct===""){
          newErrors.ProductList="Product Name is required"
            flag = false;
        }
        if(selectedTransactionType===""){
          newErrors.transactionTypeList="Transaction Type is required"
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
        if(selectedreferencetype===""){
          newErrors.selectedreferencetype="Reference Type is required"
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
        const handleSubmit = async () => {
              
                  if (!handleValidation()) return;
                    const payload = {
                    StockId: 0,
                    ProductId: Number(selectedProduct),
                    TransactionType: selectedTransactionType,
                    Quantity: Number(totalquantity),
                    Weight: Number(netweight),
                    ReferenceType: selectedreferencetype,
                    ReferenceNo: referenceno,
                    TransactionDate: transactiondate,
                    TypeId: editId ? 2 : 1, // 1=Add, 2=Update
                  };
              
                  try {
              
                    const response = await StockTransaction_Manage(payload);
              
                    if (response?.data && response?.data[0]?.Code === 1) {
                    
                          await Swal.fire({
                            icon: "success",
                            title: "Saved!",
                            text: response?.data[0].Message || "Saved successfully",
                            confirmButtonColor: "#3085d6"
                          });
                    resetForm();
                    loadStockList();
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
                    const resetForm = () => {
    setselectedProduct("");
    setselectedTransactionType("");
    settotalquantity("");
    setnetweight("");
    setSelectedreferencetype("");
    setreferenceno("");
    settransactiondate("");
    setEditId(null);
    setError({
        selectedProduct:"",
        selectedTransactionType:"",
        netweight:"",
        totalquantity:"",
        selectedreferencetype:"",
        referenceno:"",
        transactiondate:"",
    });
                    }
const handleCancel = () => {
    resetForm();
};


   const loadProductList = async () => {
       try {
         const payload = {
               ProductId: 0,
                typeId: 4, // 1=Add, 2=Update
              };
   
         const response = await ProductMaster_Manage(payload);
         setProductList(response?.data || []);
   
       } catch (error) {
         console.error("Error loading product list", error);
       }
     };
     const loadtransactionTypeList = async () => {
       try {
         const payload = {
               ProductId: 0,
                typeId: 5,
              };
   
         const response = await StockTransaction_Manage(payload);
         settransactionTypeList(response?.data || []);
   
       } catch (error) {
         console.error("Error loading transaction type list", error);
       }
     };
     const loadreferencetypeList = async () => {
       try {
         const payload = {
               ProductId: 0,
                typeId: 6,
              };
   
         const response = await StockTransaction_Manage(payload);
         setreferencetypeList(response?.data || []);
   
       } catch (error) {
         console.error("Error loading reference type list", error);
       }
     };
  const loadStockList = async () => {
       try {
         const payload = {
               ProductId: 0,
                typeId: 4, 
              };
   
         const response = await StockTransaction_Manage(payload);
         setStockList(response?.data || []);
   
       } catch (error) {
         console.error("Error loading stock list", error);
       }
     };
       useEffect(() => {
           loadProductList();
           loadtransactionTypeList();
           loadreferencetypeList();
           loadStockList();
         }, []);
         
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
        value={selectedProduct}
        onChange={(e) => {
              setselectedProduct(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, ProductList: "" }));
              }
            }}
      >
        <option value="">-- Select --</option>
        {ProductList.map((item) => (
  <option key={item.ProductId} value={item.ProductId}>
    {item.ProductName}
  </option>
))}
  </select>
      <p style={{color:"red"}}>{error?.ProductList}</p>
      </div>

      <div class="form-group">
        <label>Transaction Type</label>
        <select
        className='dropdown-select'
        value={selectedTransactionType}
        onChange={(e) => {
              setselectedTransactionType(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, transactionTypeList: "" }));
              }
            }}
            
      >
        <option value="">-- Select --</option>
        {transactionTypeList.map((item) => (
    <option key={item.TransactionTypeId} value={item.TransactionTypeId}>
      {item.TransactionType}
    </option>
  ))}
  </select>
      <p style={{color:"red"}}>{error?.transactionTypeList}</p>
      </div>
      
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Total Quantity</label>
        <input type="text" placeholder="Enter total quantity" value={totalquantity} onChange={(e) => {
                          const val = e.target.value;
                      
                          const result = commonInputValidator(val , {
                        numeric: true,
                        allowDecimal : false,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:3
                      });
                          if (result === true) {
                            settotalquantity(val);
                            setError((prev) => ({ ...prev, totalquantity: "" }));
                          } else {
                            setError((prev) => ({ ...prev, totalquantity: result }));
                          }
                        }} onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(totalquantity, {
      numeric: false,
                        allowDecimal : false,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:3
    });

    if (result === true) {
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
  onChange={(e) => {
                          const val = e.target.value;
                      
                          const result = commonInputValidator(val , {
                        numeric: true,
                        allowDecimal : true,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
                      });
                          if (result === true) {
                            setnetweight(val);
                            setError((prev) => ({ ...prev, netweight: "" }));
                          } else {
                            setError((prev) => ({ ...prev, netweight: result }));
                          }
                        }} onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(netweight, {
      numeric: false,
                        allowDecimal : false,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
    });

    if (result === true) {
            setError((prev) => ({ ...prev, netweight: "" }));
    }
    
  }}/>
        <p style={{color:"red"}}>{error?.netweight}</p>
      </div>
      </div>
        <div class="form-row">
      <div class="form-group">
        <label>Reference Type</label>
        <select
        className='dropdown-select'
        value={selectedreferencetype}
        onChange={(e) => {
              setSelectedreferencetype(e.target.value);
              
              if (e.target.value !== "") {
                setError((prev) => ({ ...prev, selectedreferencetype: "" }));
              }
            }}
      >
       <option value="">-- Select --</option>
        {referencetypeList.map((item) => (
    <option key={item.ReferenceTypeId} value={item.ReferenceTypeId}>
      {item.ReferenceType}
    </option>
  ))}
  </select>
      <p style={{color:"red"}}>{error?.selectedreferencetype}</p>
      </div>

      <div class="form-group">
        <label>Reference/Bill No</label>
        <input type="text" placeholder="Reference/Bill No" value={referenceno} onChange={(e) => {
                          const val = e.target.value;
                      
                          const result = commonInputValidator(val , {
                        numeric: false,
                        allowDecimal : false,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
                      });
                          if (result === true) {
                            setreferenceno(val);
                            setError((prev) => ({ ...prev, referenceno: "" }));
                          } else {
                            setError((prev) => ({ ...prev, referenceno: result }));
                          }
                        }} onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(referenceno, {
      numeric: false,
                        allowDecimal : false,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
    });

    if (result === true) {
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
            <button className="btn-primary" onClick={handleSubmit}>Add Stock Transaction</button>
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
              {stockList.map((item, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{item.ProductName}</td>
            <td>{item.TransactionType}</td>
            <td>{item.Quantity}</td>
            <td>{item.Weight}</td>
            <td>{item.ReferenceType}</td>
            <td>{item.ReferenceNo}</td>
            <td>{item.TransactionDate}</td>
          </tr>
        ))}
            </tbody>
          </table>
        </div>

      </div>
   
  );
};

export default AddProduct;
