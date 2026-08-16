"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import CustomerLayout from "@/pages/Customer/layout";
import { Customer_Address_Manage } from "@/lib/services/CustomerService";


const EMPTY_FORM = {
  AddressId: 0,
  AddressLabel: "HOME",
  AddressLine: "",
  City: "",
  State: "",
  Pincode: "",
  IsDefault: false,
};


const OnlineCustomerAddress = () => {

  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null); // AddressId currently being deleted / set default

  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);


  // ============================================================
  // HELPER: Get logged-in CustomerId
  // ============================================================

  const getCustomerId = () => {

    const id = 1;

    return id ? Number(id) : null;
  };


  // ============================================================
  // LOAD ADDRESS LIST (TypeId 4 = Bind All)
  // ============================================================

  const loadAddresses = async () => {

    const customerId = getCustomerId();

    if (!customerId) {

      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login to view your addresses.",
      });

      router.push("/Customer/login");

      return;
    }

    try {

      setLoading(true);

      const res = await Customer_Address_Manage({
        TypeId: 4,
        CustomerId: customerId,
      });

      if (res?.code === 1 && Array.isArray(res?.data)) {

        setAddresses(res.data);

      } else {

        setAddresses([]);
      }

    } catch (error) {

      console.error("Load address error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to load your addresses. Please try again.",
      });

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadAddresses();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ============================================================
  // OPEN FORM (ADD / EDIT)
  // ============================================================

  const openAddForm = () => {

    setFormData(EMPTY_FORM);
    setIsEditMode(false);
    setShowForm(true);
  };

  const openEditForm = (address) => {

    setFormData({
      AddressId: address.AddressId,
      AddressLabel: address.AddressLabel || "HOME",
      AddressLine: address.AddressLine || "",
      City: address.City || "",
      State: address.State || "",
      Pincode: address.Pincode || "",
      IsDefault: !!address.IsDefault,
    });

    setIsEditMode(true);
    setShowForm(true);
  };

  const closeForm = () => {

    setShowForm(false);
    setFormData(EMPTY_FORM);
  };


  // ============================================================
  // FORM FIELD CHANGE
  // ============================================================

  const handleFieldChange = (field, value) => {

    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  // ============================================================
  // SAVE (ADD = TypeId 1 / UPDATE = TypeId 2)
  // ============================================================

  const handleSave = async (e) => {

    e.preventDefault();

    if (!formData.AddressLine.trim() || !formData.City.trim() || !formData.Pincode.trim()) {

      Swal.fire({
        icon: "warning",
        title: "Missing Details",
        text: "Address, City and Pincode are required.",
      });

      return;
    }

    const customerId = getCustomerId();

    try {

      setSaving(true);

      const res = await Customer_Address_Manage({
        TypeId: isEditMode ? 2 : 1,
        AddressId: isEditMode ? formData.AddressId : 0,
        CustomerId: customerId,
        AddressLabel: formData.AddressLabel || "HOME",
        AddressLine: formData.AddressLine,
        City: formData.City,
        State: formData.State,
        Pincode: formData.Pincode,
        IsDefault: formData.IsDefault,
      });

      if (res?.code === 1) {

        Swal.fire({
          icon: "success",
          title: isEditMode ? "Address Updated" : "Address Added",
          timer: 1200,
          showConfirmButton: false,
        });

        closeForm();
        loadAddresses();

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to save address.",
        });
      }

    } catch (error) {

      console.error("Save address error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to save address. Please try again.",
      });

    } finally {

      setSaving(false);

    }
  };


  // ============================================================
  // DELETE ADDRESS (TypeId 3)
  // ============================================================

  const handleDelete = async (address) => {

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete Address?",
      text: `Remove this ${address.AddressLabel} address?`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    const customerId = getCustomerId();

    try {

      setBusyId(address.AddressId);

      const res = await Customer_Address_Manage({
        TypeId: 3,
        AddressId: address.AddressId,
        CustomerId: customerId,
      });

      if (res?.code === 1) {

        Swal.fire({
          icon: "success",
          title: "Address Deleted",
          timer: 1200,
          showConfirmButton: false,
        });

        loadAddresses();

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to delete address.",
        });
      }

    } catch (error) {

      console.error("Delete address error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to delete address. Please try again.",
      });

    } finally {

      setBusyId(null);

    }
  };


  // ============================================================
  // SET AS DEFAULT (TypeId 2 with same data, IsDefault = true)
  // ============================================================

  const handleSetDefault = async (address) => {

    if (address.IsDefault) return;

    const customerId = getCustomerId();

    try {

      setBusyId(address.AddressId);

      const res = await Customer_Address_Manage({
        TypeId: 2,
        AddressId: address.AddressId,
        CustomerId: customerId,
        AddressLabel: address.AddressLabel,
        AddressLine: address.AddressLine,
        City: address.City,
        State: address.State,
        Pincode: address.Pincode,
        IsDefault: true,
      });

      if (res?.code === 1) {

        loadAddresses();

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to set default address.",
        });
      }

    } catch (error) {

      console.error("Set default error:", error);

    } finally {

      setBusyId(null);

    }
  };


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (
      <CustomerLayout>
        <div className="address-page">

          <div className="cart-skeleton">

            <div className="skeleton-line large"></div>
            <div className="skeleton-line medium"></div>
            <div className="skeleton-line medium"></div>

          </div>

        </div>
      </CustomerLayout>
    );
  }


  return (
    <CustomerLayout>
      <div className="address-page">

        <div className="cart-header">
          <h1>My Addresses</h1>
          <button className="btn-add-address" onClick={openAddForm}>
            + Add New Address
          </button>
        </div>


        {addresses.length === 0 ? (

          <div className="cart-empty">

            <p>You haven't saved any address yet.</p>

            <button className="btn-continue-shopping" onClick={openAddForm}>
              Add Address
            </button>

          </div>

        ) : (

          <div className="address-grid">

            {addresses.map((address) => (

              <div
                className={`address-card ${
                  address.IsDefault ? "default" : ""
                }`}
                key={address.AddressId}
              >

                <div className="address-card-header">

                  <span className="address-label">
                    {address.AddressLabel}
                  </span>

                  {address.IsDefault && (
                    <span className="default-badge">Default</span>
                  )}

                </div>

                <p className="address-line">{address.AddressLine}</p>

                <p className="address-meta">
                  {address.City}
                  {address.State ? `, ${address.State}` : ""} -{" "}
                  {address.Pincode}
                </p>

                <div className="address-card-actions">

                  {!address.IsDefault && (
                    <button
                      className="btn-set-default"
                      onClick={() => handleSetDefault(address)}
                      disabled={busyId === address.AddressId}
                    >
                      Set as Default
                    </button>
                  )}

                  <button
                    className="btn-edit-address"
                    onClick={() => openEditForm(address)}
                    disabled={busyId === address.AddressId}
                  >
                    Edit
                  </button>

                  <button
                    className="btn-delete-address"
                    onClick={() => handleDelete(address)}
                    disabled={busyId === address.AddressId}
                  >
                    {busyId === address.AddressId ? "..." : "Delete"}
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}


        {/* ==================================================
            ADD / EDIT MODAL
        =================================================== */}

        {showForm && (

          <div className="address-modal-overlay" onClick={closeForm}>

            <div
              className="address-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="address-modal-header">

                <h3>{isEditMode ? "Edit Address" : "Add New Address"}</h3>

                <button className="btn-close-modal" onClick={closeForm}>
                  ✕
                </button>

              </div>

              <form onSubmit={handleSave} className="address-form">

                <div className="form-group">

                  <label>Address Type</label>

                  <div className="address-type-pills">

                    {["HOME", "OFFICE", "OTHER"].map((type) => (

                      <button
                        type="button"
                        key={type}
                        className={`address-type-pill ${
                          formData.AddressLabel === type ? "active" : ""
                        }`}
                        onClick={() => handleFieldChange("AddressLabel", type)}
                      >
                        {type === "HOME" && <span className="pill-icon">🏠</span>}
                        {type === "OFFICE" && <span className="pill-icon">🏢</span>}
                        {type === "OTHER" && <span className="pill-icon">📍</span>}
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </button>

                    ))}

                  </div>

                </div>
<div className="form-row">
                <div className="form-group">

                  <label htmlFor="addr-line">Address *</label>

                  <textarea
                    id="addr-line"
                    rows={3}
                    placeholder="House no, street, area"
                    value={formData.AddressLine}
                    onChange={(e) =>
                      handleFieldChange("AddressLine", e.target.value)
                    }
                    required
                  />

                </div>
                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label htmlFor="addr-city">City *</label>

                    <input
                      id="addr-city"
                      type="text"
                      placeholder="e.g. Lucknow"
                      value={formData.City}
                      onChange={(e) =>
                        handleFieldChange("City", e.target.value)
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label htmlFor="addr-state">State</label>

                    <input
                      id="addr-state"
                      type="text"
                      placeholder="e.g. Uttar Pradesh"
                      value={formData.State}
                      onChange={(e) =>
                        handleFieldChange("State", e.target.value)
                      }
                    />

                  </div>

                </div>
<div className="form-row">
                <div className="form-group">

                  <label htmlFor="addr-pincode">Pincode *</label>

                  <input
                    id="addr-pincode"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit pincode"
                    maxLength={10}
                    value={formData.Pincode}
                    onChange={(e) =>
                      handleFieldChange(
                        "Pincode",
                        e.target.value.replace(/[^0-9]/g, "")
                      )
                    }
                    required
                  />

                </div>




<div className="form-group">

</div>
</div>
                <label className="default-toggle">

                  <input
                    type="checkbox"
                    checked={formData.IsDefault}
                    onChange={(e) =>
                      handleFieldChange("IsDefault", e.target.checked)
                    }
                  />

                  <span className="default-toggle-track">
                    <span className="default-toggle-thumb"></span>
                  </span>

                  <span className="default-toggle-label">
                    Set as default address
                  </span>

                </label>

                <div className="address-form-actions">

                  <button
                    type="button"
                    className="btn-continue-shopping"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-add-cart"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Address"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>
    </CustomerLayout>
  );
};

export default OnlineCustomerAddress;
