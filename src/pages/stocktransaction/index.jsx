import Link from 'next/link';
import React, { useState, useEffect } from "react";
import { FaGem, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/router";
import { commonInputValidator } from "@/utils/inputValidation";
import { ProductMaster_Manage } from "@/lib/services/MasterService";
import { StockTransaction_Manage } from "@/lib/services/TransactionsService";
import Swal from "sweetalert2";
import ProtectedRoute from "@/components/ProtectedRoute";


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
    const [error, setError] = useState({
        ProductList: "", transactionTypeList: "", netweight: "", totalquantity: "",
        referencetypeList: "", referenceno: "", transactiondate: "",
    });

    const handleValidation = () => {
        const newErrors = {};
        let flag = true;

        if (selectedProduct === "") {
            newErrors.ProductList = "Product Name is required";
            flag = false;
        }
        if (selectedTransactionType === "") {
            newErrors.transactionTypeList = "Transaction Type is required";
            flag = false;
        }
        if (netweight === "") {
            newErrors.netweight = "Net Weight is required";
            flag = false;
        }
        if (totalquantity === "") {
            newErrors.totalquantity = "Total Quantity is required";
            flag = false;
        }
        if (selectedreferencetype === "") {
            newErrors.selectedreferencetype = "Reference Type is required";
            flag = false;
        }
        if (referenceno === "") {
            newErrors.referenceno = "Reference/Bill No is required";
            flag = false;
        }
        if (transactiondate === "") {
            newErrors.transactiondate = "Transaction Date is required";
            flag = false;
        }
        setError(newErrors);
        return flag;
    };

    const handleSubmit = async () => {
        if (!handleValidation()) return;

        const payload = {
            StockId: editId ? editId : 0,
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
                text: "Failed to save stock transaction",
                confirmButtonColor: "#3085d6"
            });
        }
    };

    // ✏️ EDIT - Grid se data form mein fill karo
    const handleEdit = (item) => {
        setEditId(item.StockId);
        setselectedProduct(String(item.ProductId));
        setselectedTransactionType(String(item.TransactionTypeId));
        settotalquantity(String(item.Quantity));
        setnetweight(String(item.Weight));
        setSelectedreferencetype(String(item.ReferenceTypeId));
        setreferenceno(item.ReferenceNo);

        // Date format: API se "DD-MM-YYYY" ya "YYYY-MM-DD" aa sakta hai
        // input[type=date] ko "YYYY-MM-DD" chahiye
        const rawDate = item.TransactionDate || "";
        if (rawDate.includes("T")) {
            // ISO format: "2024-06-15T00:00:00" → "2024-06-15"
            settransactiondate(rawDate.split("T")[0]);
        } else {
            settransactiondate(rawDate);
        }

        // Scroll to top so user can see form
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // 🗑️ DELETE - Confirm karke delete karo
    const handleDelete = async (item) => {
        const confirm = await Swal.fire({
            icon: "warning",
            title: "Delete karna chahte hain?",
            text: `"${item.ProductName}" ki yeh transaction delete ho jayegi.`,
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Haan, Delete karo",
            cancelButtonText: "Nahi",
        });

        if (!confirm.isConfirmed) return;

        const payload = {
            StockId: item.StockId,
            ProductId: 0,
            TransactionType: 0,
            Quantity: 0,
            Weight: 0,
            ReferenceType: 0,
            ReferenceNo: "",
            TransactionDate: "",
            TypeId: 3, // 3 = Delete
        };

        try {
            const response = await StockTransaction_Manage(payload);

            if (response?.data && response?.data[0]?.Code === 1) {
                await Swal.fire({
                    icon: "success",
                    title: "Deleted!",
                    text: response?.data[0].Message || "Record delete ho gaya",
                    confirmButtonColor: "#3085d6"
                });
                loadStockList();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text: response?.data[0].Message || "Delete nahi hua",
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
            selectedProduct: "",
            selectedTransactionType: "",
            netweight: "",
            totalquantity: "",
            selectedreferencetype: "",
            referenceno: "",
            transactiondate: "",
        });
    };

    const handleCancel = () => {
        resetForm();
    };

    const loadProductList = async () => {
        try {
            const payload = { ProductId: 0, typeId: 4 };
            const response = await ProductMaster_Manage(payload);
            setProductList(response?.data || []);
        } catch (error) {
            console.error("Error loading product list", error);
        }
    };

    const loadtransactionTypeList = async () => {
        try {
            const payload = { ProductId: 0, typeId: 5 };
            const response = await StockTransaction_Manage(payload);
            settransactionTypeList(response?.data || []);
        } catch (error) {
            console.error("Error loading transaction type list", error);
        }
    };

    const loadreferencetypeList = async () => {
        try {
            const payload = { ProductId: 0, typeId: 6 };
            const response = await StockTransaction_Manage(payload);
            setreferencetypeList(response?.data || []);
        } catch (error) {
            console.error("Error loading reference type list", error);
        }
    };

    const loadStockList = async () => {
        try {
            const payload = { ProductId: 0, typeId: 4 };
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
        <ProtectedRoute>
            <div className="content-wrapper">

                {/* Form Card */}
                <div className="form-card">
                    {/* 🔖 Title: Edit mode mein "Update" dikhao */}
                    <h2>{editId ? "Update Stock Transaction" : "Stock Transaction"}</h2>
                    <hr />

                    <div className="form-row">
                        <div className="form-group">
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
                            <p style={{ color: "red" }}>{error?.ProductList}</p>
                        </div>

                        <div className="form-group">
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
                            <p style={{ color: "red" }}>{error?.transactionTypeList}</p>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Total Quantity</label>
                            <input
                                type="text"
                                placeholder="Enter total quantity"
                                value={totalquantity}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const result = commonInputValidator(val, {
                                        numeric: true, allowDecimal: false,
                                        maxDecimalPlaces: 2, minLength: 1, maxLength: 3
                                    });
                                    if (result === true) {
                                        settotalquantity(val);
                                        setError((prev) => ({ ...prev, totalquantity: "" }));
                                    } else {
                                        setError((prev) => ({ ...prev, totalquantity: result }));
                                    }
                                }}
                                onBlur={() => {
                                    const result = commonInputValidator(totalquantity, {
                                        numeric: false, allowDecimal: false,
                                        maxDecimalPlaces: 2, minLength: 1, maxLength: 3
                                    });
                                    if (result === true) {
                                        setError((prev) => ({ ...prev, totalquantity: "" }));
                                    }
                                }}
                            />
                            <p style={{ color: "red" }}>{error?.totalquantity}</p>
                        </div>

                        <div className="form-group">
                            <label>Net Weight</label>
                            <input
                                type="text"
                                placeholder="Enter net weight"
                                value={netweight}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const result = commonInputValidator(val, {
                                        numeric: true, allowDecimal: true,
                                        maxDecimalPlaces: 2, minLength: 1, maxLength: 20
                                    });
                                    if (result === true) {
                                        setnetweight(val);
                                        setError((prev) => ({ ...prev, netweight: "" }));
                                    } else {
                                        setError((prev) => ({ ...prev, netweight: result }));
                                    }
                                }}
                                onBlur={() => {
                                    const result = commonInputValidator(netweight, {
                                        numeric: false, allowDecimal: false,
                                        maxDecimalPlaces: 2, minLength: 1, maxLength: 20
                                    });
                                    if (result === true) {
                                        setError((prev) => ({ ...prev, netweight: "" }));
                                    }
                                }}
                            />
                            <p style={{ color: "red" }}>{error?.netweight}</p>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
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
                            <p style={{ color: "red" }}>{error?.selectedreferencetype}</p>
                        </div>

                        <div className="form-group">
                            <label>Reference/Bill No</label>
                            <input
                                type="text"
                                placeholder="Reference/Bill No"
                                value={referenceno}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const result = commonInputValidator(val, {
                                        numeric: false, allowDecimal: false,
                                        maxDecimalPlaces: 2, minLength: 1, maxLength: 20
                                    });
                                    if (result === true) {
                                        setreferenceno(val);
                                        setError((prev) => ({ ...prev, referenceno: "" }));
                                    } else {
                                        setError((prev) => ({ ...prev, referenceno: result }));
                                    }
                                }}
                                onBlur={() => {
                                    const result = commonInputValidator(referenceno, {
                                        numeric: false, allowDecimal: false,
                                        maxDecimalPlaces: 2, minLength: 1, maxLength: 20
                                    });
                                    if (result === true) {
                                        setError((prev) => ({ ...prev, referenceno: "" }));
                                    }
                                }}
                            />
                            <p style={{ color: "red" }}>{error?.referenceno}</p>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Transaction Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="date"
                                value={transactiondate}
                                onChange={(e) => {
                                    settransactiondate(e.target.value);
                                    if (e.target.value !== "") {
                                        setError((prev) => ({ ...prev, transactiondate: "" }));
                                    }
                                }}
                            />
                            <p style={{ color: "red" }}>{error?.transactiondate}</p>
                        </div>
                        <div className="form-group"></div>
                    </div>

                    <div className="btn-group">
                        {/* 🔖 Edit mode mein button text change hoga */}
                        <button className="btn-primary" onClick={handleSubmit}>
                            {editId ? "Update Stock Transaction" : "Add Stock Transaction"}
                        </button>
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
                                {/* ✅ New column for Actions */}
                                <th>Action</th>
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

                                    {/* ✅ Edit & Delete Buttons */}
                                    <td>
                                        <button
                                            className="btn-edit"
                                            title="Edit"
                                            onClick={() => handleEdit(item)}
                                            style={{
                                                marginRight: "6px",
                                                backgroundColor: "#f0ad4e",
                                                color: "#fff",
                                                border: "none",
                                                padding: "4px 10px",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>

                                        <button
                                            className="btn-delete"
                                            title="Delete"
                                            onClick={() => handleDelete(item)}
                                            style={{
                                                backgroundColor: "#d9534f",
                                                color: "#fff",
                                                border: "none",
                                                padding: "4px 10px",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            🗑️ Delete
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

export default AddProduct;
