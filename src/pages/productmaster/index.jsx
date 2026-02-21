import Link from 'next/link';
import React, { useState,useEffect } from "react";
import { FaGem, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/router";
import { handleDecimalBlur_Weight, handleDecimalInput_Weight,commonInputValidator,runValidators } from "@/utils/inputValidation";
import { getMetalList, CategoryMaster_Manage,ProductMaster_Manage } from "@/lib/services/MasterService";
import Swal from "sweetalert2";
const AddProduct = () => {
    const router = useRouter();
    const [buttonName, setButtonName] = useState("Add Product");
      const [selectedMetal, setSelectedMetal] = useState("");   
      const [metalList, setMetalList] = useState([]);  
      const [categoryname, setcategoryname] = useState("");
      const [productname, setproductname] = useState("");
      const [grossweight, setgrossweight] = useState("");
      const [netweight, setnetweight] = useState("");
      const [wastageweight, setwastageweight] = useState("");
      const [makingcharge, setmakingcharge] = useState("");
      const [ratepergram, setratepergram] = useState("");
      const [totalquantity, settotalquantity] = useState("");
      const [categoryList, setcategoryList] = useState([]);
      const [productList, setProductList] = useState([]);
      const [editId, setEditId] = useState(null);
       const [error , setError] = useState({
        selectedMetal:"",
        categoryname:"",productname:"",grossweight:"",netweight:"",wastageweight:"",
        makingcharge:"",ratepergram:"",totalquantity:"",
    });
      const handleValidation = (e) => {
        debugger;
        const newErrors= {};
        let flag = true;
        if (selectedMetal === "") {
          newErrors.selectedMetal="Please select Metal Name"
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
        /* ---------------- SUBMIT (ADD / UPDATE) ---------------- */
       
         const handleSubmit = async () => {
       
           if (!handleValidation()) return;
       
           const payload = {
             ProductId: 0,
             categoryName: categoryname,
             ProductName: productname,
             GrossWeight: Number(grossweight),
             NetWeight: Number(netweight),
             WastageWeight: Number(wastageweight),
             MakingCharge: Number(makingcharge),
             RatePerGram: Number(ratepergram),
             TotalQuantity: Number(totalquantity),
             typeId: editId ? 2 : 1, // 1=Add, 2=Update
             categoryId: Number(categoryname),
             metalId: Number(selectedMetal)
           };
       
           try {
       
             const response = await ProductMaster_Manage(payload);
       
             if (response?.data && response?.data[0]?.Code === 1) {
             
                   await Swal.fire({
                     icon: "success",
                     title: "Saved!",
                     text: response?.data[0].Message || "Saved successfully",
                     confirmButtonColor: "#3085d6"
                   });
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
       const resetForm = () => {
    setSelectedMetal("");
    setcategoryname("");
    setproductname("");
    setgrossweight("");
    setnetweight("");
    setwastageweight("");
    setmakingcharge("");
    setratepergram("");
    settotalquantity("");
    setEditId(null);
    setButtonName("Save");
    setError({
      metalList: "",
      categoryname: "",
      productname: "",
      grossweight: "",
      netweight: "",
      wastageweight: "",
      makingcharge: "",
      ratepergram: "",
      totalquantity: "",
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
  const getCategoryByMetal = async (metalId) => {
  try {
    const payload = {
        metalName: "",
        purity: 0,
        typeId: 5,
        metalId: metalId,
      };

      const response = await CategoryMaster_Manage(payload);
setcategoryList(response?.data || []);
    console.log(response.data);
  } catch (error) {
    console.error("Error loading category", error);
  }
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
    useEffect(() => {
      loadmetalList();
      loadProductList();
    }, []);

    /* ---------------- EDIT ---------------- */

  const handleEdit = (item) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
debugger
    setSelectedMetal(item.MetalId.toString());
    getCategoryByMetal(item.MetalId);
    setcategoryname(item.CategoryId.toString());
    setproductname(item.ProductName);
    setgrossweight(item.GrossWeight);
    setnetweight(item.NetWeight);
    setwastageweight(item.WastageWeight);
    setmakingcharge(item.MakingCharge);
    setratepergram(item.RatePerGram);
    settotalquantity(item.TotalQuantity);
    setEditId(item.ProductId);
    setButtonName("Update");    
  };

  /* ---------------- DELETE ---------------- */

  const handleDeleteProduct = async (id) => {

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
      ProductId: id,
    };

    const response = await ProductMaster_Manage(payload);

    await Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: response?.data?.[0]?.Message || "Deleted successfully",
      timer: 1500,
      showConfirmButton: false
    });

    loadProductList();

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
        
        {/* Form Card */}
        <div className="form-card">
          <h2>Add New Product</h2>
          <hr />

       <div class="form-row">
      <div class="form-group">
        <label>Metal Name</label>
        <select
  className="dropdown-select"
  value={selectedMetal}
  onChange={(e) => {
    const metalId = e.target.value;

    setSelectedMetal(metalId);
    setError((prev) => ({ ...prev, selectedMetal: "" }));

    // ✅ API Call
    if (metalId) {
      getCategoryByMetal(metalId);
    }
  }}
>
  <option value="">-- Select --</option>

  {metalList.map((item) => (
    <option key={item.MetalId} value={item.MetalId}>
      {item.MetalDesc}
    </option>
  ))}
</select>


          <p style={{ color: "red" }}>{error.selectedMetal}</p>
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
        {categoryList.map((item) => (
    <option key={item.CategoryId} value={item.CategoryId}>
      {item.CategoryName}
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
                          const val = e.target.value;
                      
                          const result = commonInputValidator(val , {
                        numeric: false,
                        allowDecimal : false,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
                      });
                          if (result === true) {
                            setproductname(val);
                            setError((prev) => ({ ...prev, productname: "" }));
                          } else {
                            setError((prev) => ({ ...prev, productname: result }));
                          }
                        }} onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(productname, {
      numeric: false,
                        allowDecimal : false,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
    });

    if (result === true) {
            setError((prev) => ({ ...prev, productname: "" }));
    }
    
  }}/>
        <p style={{color:"red"}}>{error?.productname}</p>
      </div>

      <div class="form-group">
        <label>Gross Weight</label>
        <input type="text" placeholder="Enter gross weight" value={grossweight} onChange={(e) => {
                          const val = e.target.value;
                      
                          const result = commonInputValidator(val , {
                        numeric: true,
                        allowDecimal : true,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
                      });
                          if (result === true) {
                            setgrossweight(val);
                            setError((prev) => ({ ...prev, grossweight: "" }));
                          } else {
                            setError((prev) => ({ ...prev, grossweight: result }));
                          }
                        }}
  onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(grossweight, {
      numeric: true,
                        allowDecimal : true,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
    });

    if (result === true) {
      // ✨ auto decimal format
      handleDecimalBlur_Weight(grossweight, setgrossweight);
      setError((prev) => ({ ...prev, grossweight: "" }));
    }
    
  }}
            />
        <p style={{color:"red"}}>{error?.grossweight}</p>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Net Weight</label>
        <input type="text" placeholder="Enter net weight" value={netweight} onChange={(e) => {
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
                        }}
  onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(netweight, {
      numeric: true,
                        allowDecimal : true,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
    });

    if (result === true) {
      // ✨ auto decimal format
      handleDecimalBlur_Weight(netweight, setnetweight);
      setError((prev) => ({ ...prev, netweight: "" }));
    }
    
  }}/>
        <p style={{color:"red"}}>{error?.netweight}</p>
      </div>

      <div class="form-group">
        <label>Wastage Weight</label>
        <input type="text" placeholder="Enter wastage weight" value={wastageweight} onChange={(e) => {
                          const val = e.target.value;
                      
                          const result = commonInputValidator(val , {
                        numeric: true,
                        allowDecimal : true,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
                      });
                          if (result === true) {
                            setwastageweight(val);
                            setError((prev) => ({ ...prev, wastageweight: "" }));
                          } else {
                            setError((prev) => ({ ...prev, wastageweight: result }));
                          }
                        }}
  onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(wastageweight, {
      numeric: true,
                        allowDecimal : true,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
    });

    if (result === true) {
      // ✨ auto decimal format
      handleDecimalBlur_Weight(wastageweight, setwastageweight);
      setError((prev) => ({ ...prev, wastageweight: "" }));
    }
    
  }}/>
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
                        allowDecimal : true,
                        maxDigits: 10,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
                      });
                          if (result === true) {
                            setmakingcharge(val);
                            setError((prev) => ({ ...prev, makingcharge: "" }));
                          } else {
                            setError((prev) => ({ ...prev, makingcharge: result }));
                          }
                        }} 
                        onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(wastageweight, {
      numeric: true,
                        allowDecimal : true,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
    });

    if (result === true) {
            setError((prev) => ({ ...prev, makingcharge: "" }));
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
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
                      });
                          if (result === true) {
                            setratepergram(val);
                            setError((prev) => ({ ...prev, ratepergram: "" }));
                          } else {
                            setError((prev) => ({ ...prev, ratepergram: result }));
                          }
                        }} 
                        onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(ratepergram, {
      numeric: true,
                        allowDecimal : true,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
    });

    if (result === true) {
            setError((prev) => ({ ...prev, ratepergram: "" }));
    }
    
  }}/>
        <p style={{color:"red"}}>{error?.ratepergram}</p>
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
                        maxDigits: 10,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
                      });
                          if (result === true) {
                            settotalquantity(val);
                            setError((prev) => ({ ...prev, totalquantity: "" }));
                          } else {
                            setError((prev) => ({ ...prev, totalquantity: result }));
                          }
                        }} 
                        onBlur={() => {
    // 🔍 final validation
    const result = commonInputValidator(totalquantity, {
      numeric: true,
                        allowDecimal : false,
                        maxDecimalPlaces: 2,
                        minLength:1,
                        maxLength:20
    });

    if (result === true) {
            setError((prev) => ({ ...prev, totalquantity: "" }));
    }
    
  }}/>
        <p style={{color:"red"}}>{error?.totalquantity}</p>
      </div>
      <div class="form-group">
       
      </div>
      </div>
   
          <div className="btn-group">
            <button className="btn-primary" onClick={handleSubmit}>
            {buttonName}
          </button>
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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
            {productList.map((item, index) => (
              <tr key={item.ProductId}>
                <td>{index + 1}</td>
                <td>{item.CategoryName}</td>
                <td>{item.ProductName}</td>
                <td>{item.GrossWeight}</td>
                <td>{item.NetWeight}</td>
                <td>{item.WastageWeight}</td>
                <td>{item.MakingCharge}</td>
                <td>{item.RatePerGram}</td>
                <td>{item.TotalQuantity}</td>
                <td>
                  <span className={`badge ${item.IsActive ? "active" : "deactive"}`}>
                    {item.IsActive ? "Active" : "De Active"}
                  </span>
                </td>
                <td>
                  <button  className="btn-edit-grid" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="btn-danger-grid"
                    style={{ marginLeft: "8px" }}
                    onClick={() => handleDeleteProduct(item.ProductId)}
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

export default AddProduct;
