"use client";
import React, { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Select from "react-select";
import Swal from "sweetalert2";

import {
  OnlineProduct_Manage,
  ProductImages_Manage,
} from "@/lib/services/CustomerService";
import { ProductMaster_Manage } from "@/lib/services/MasterService";

// =====================================================================
// 🔧 Helper: every SP now replies with either
//    { Status: 1, Message: "..." }   -> success
//    { Status: 0, Message: "..." }   -> error
// ...except Product_Images_Manage's Delete/Set-Primary success rows,
// which use `Success` instead of `Status`. This helper normalises all
// of that into one consistent { isSuccess, message } shape so the UI
// logic doesn't need to special-case every SP branch.
// =====================================================================
const extractStatusMessage = (res, fallbackSuccessMsg, fallbackErrorMsg) => {
  // API may wrap the SP row as res, res.data, or res.data[0] (array) - handle all.
  const row = Array.isArray(res)
    ? res[0]
    : Array.isArray(res?.data)
    ? res.data[0]
    : res?.data ?? res;

  const isSuccess =
    row?.Status === 1 ||
    row?.Status === true ||
    row?.Success === 1 ||
    row?.Success === true;

  const message =
    row?.Message ||
    (isSuccess ? fallbackSuccessMsg || "Done successfully." : fallbackErrorMsg || "Something went wrong.");

  return { isSuccess, message };
};

// Swal popups need a higher z-index than our custom modal overlay,
// otherwise the alert renders BEHIND the popup and looks like nothing happened.
const SWAL_Z_INDEX = 99999;

// =====================================================================
// 🖼️ ProductImagesManager
// Reusable image block: multi-select upload (looped API calls),
// set-primary, single delete + bulk delete.
// Used BOTH inline in the main form AND inside the grid's popup modal,
// so behaviour/UI stays identical everywhere.
// =====================================================================
const ProductImagesManager = ({ productId, onImagesUpdated }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newFiles, setNewFiles] = useState([]);       // File[] picked, not yet uploaded
  const [newPreviews, setNewPreviews] = useState([]); // object URLs, index-aligned with newFiles
  const [primaryIndex, setPrimaryIndex] = useState(null); // which newFile (index) should be primary

  const [selectedForDelete, setSelectedForDelete] = useState([]); // ImageId[]
  const fileInputRef = useRef(null);

  // 🔔 Inline banner shown right inside this component (works both in the
  // main form and inside the popup) - the sure-fire fallback in case a
  // Swal toast ever ends up hidden behind a modal in some browser/theme.
  const [actionMessage, setActionMessage] = useState(null); // { type: 'success' | 'error', text }
  const bannerTimerRef = useRef(null);

  const showBanner = (type, text) => {
    setActionMessage({ type, text });
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setActionMessage(null), 5000);
  };

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const loadImages = async () => {
    if (!productId) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("TypeId", "4");
      formData.append("ProductId", productId.toString());

      const res = await ProductImages_Manage(formData);
      setImages(res?.data || []);
    } catch (err) {
      console.error("Error loading images", err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();

    // reset any pending (not-yet-uploaded) selection whenever product changes
    newPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewFiles([]);
    setNewPreviews([]);
    setPrimaryIndex(null);
    setSelectedForDelete([]);
    setActionMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // 📸 Pick multiple images (camera/gallery) - appends to whatever is already picked
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);

    // if nothing marked primary yet and there are no existing images, default first pick to primary
    setPrimaryIndex((prev) => (prev === null && images.length === 0 ? 0 : prev));

    e.target.value = "";
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setPrimaryIndex((prev) => {
      if (prev === null) return prev;
      if (prev === index) return null;
      return prev > index ? prev - 1 : prev;
    });
  };

  // 🔁 Uploads every picked file one-by-one, looping over
  //    ProductImages_Manage (TypeId = 1) since the API accepts one image per call.
  //    Each call now only replies with { Status, Message } - NOT the updated
  //    image list - so we explicitly reload the list once the loop finishes.
  const handleUploadAll = async () => {
    if (!productId) return;

    if (newFiles.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Images Selected",
        text: "Please choose at least one image to upload",
        zIndex: SWAL_Z_INDEX,
      });
      return;
    }

    let successCount = 0;
    let lastErrorMessage = "";

    try {
      setLoading(true);

      for (let i = 0; i < newFiles.length; i++) {
        const formData = new FormData();
        formData.append("TypeId", "1");
        formData.append("ProductId", productId.toString());
        formData.append("Image", newFiles[i]);
        formData.append("IsPrimary", i === primaryIndex ? "true" : "false");

        // sequential await so primary/order stays consistent on the server
        // eslint-disable-next-line no-await-in-loop
        const res = await ProductImages_Manage(formData);
        const { isSuccess, message } = extractStatusMessage(
          res,
          "Image uploaded successfully.",
          "Image upload failed."
        );

        if (isSuccess) {
          successCount++;
        } else {
          lastErrorMessage = message;
        }
      }

      const allSucceeded = successCount === newFiles.length;
      const summaryMsg = allSucceeded
        ? `${successCount} image${successCount > 1 ? "s" : ""} uploaded successfully.`
        : `${successCount} of ${newFiles.length} uploaded. ${lastErrorMessage ? "Last error: " + lastErrorMessage : ""}`;

      await Swal.fire({
        icon: allSucceeded ? "success" : "warning",
        title: allSucceeded ? "Uploaded!" : "Partially Uploaded",
        text: summaryMsg,
        zIndex: SWAL_Z_INDEX,
      });
      showBanner(allSucceeded ? "success" : "error", summaryMsg);

      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewFiles([]);
      setNewPreviews([]);
      setPrimaryIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await loadImages();
      onImagesUpdated?.();
    } catch (err) {
      console.error(err);
      const msg = "Some images failed to upload. Please try again.";
      Swal.fire({ icon: "error", title: "Error", text: msg, zIndex: SWAL_Z_INDEX });
      showBanner("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("TypeId", "3");
      formData.append("ImageId", imageId.toString());

      const res = await ProductImages_Manage(formData);
      const { isSuccess, message } = extractStatusMessage(
        res,
        "Primary image updated successfully.",
        "Failed to set primary image."
      );

      if (isSuccess) {
        await loadImages();
        onImagesUpdated?.();
      }

      showBanner(isSuccess ? "success" : "error", message);
      Swal.fire({
        icon: isSuccess ? "success" : "error",
        title: isSuccess ? "Updated!" : "Error",
        text: message,
        zIndex: SWAL_Z_INDEX,
      });
    } catch (err) {
      console.error(err);
      const msg = "Something went wrong";
      showBanner("error", msg);
      Swal.fire({ icon: "error", title: "Error", text: msg, zIndex: SWAL_Z_INDEX });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      zIndex: SWAL_Z_INDEX,
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("TypeId", "2");
      formData.append("ImageId", imageId.toString());

      const res = await ProductImages_Manage(formData);
      const { isSuccess, message } = extractStatusMessage(
        res,
        "Image deleted successfully.",
        "Delete failed."
      );

      if (isSuccess) {
        setSelectedForDelete((prev) => prev.filter((id) => id !== imageId));
        await loadImages();
        onImagesUpdated?.();
      }

      showBanner(isSuccess ? "success" : "error", message);
      Swal.fire({
        icon: isSuccess ? "success" : "error",
        title: isSuccess ? "Deleted!" : "Error",
        text: message,
        zIndex: SWAL_Z_INDEX,
      });
    } catch (err) {
      console.error(err);
      const msg = "Something went wrong";
      showBanner("error", msg);
      Swal.fire({ icon: "error", title: "Error", text: msg, zIndex: SWAL_Z_INDEX });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectForDelete = (imageId) => {
    setSelectedForDelete((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
    );
  };

  // 🔁 Bulk delete - loops over ProductImages_Manage (TypeId = 2) for each selected image
  const handleDeleteSelected = async () => {
    if (selectedForDelete.length === 0) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete ${selectedForDelete.length} selected image(s)?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "No",
      zIndex: SWAL_Z_INDEX,
    });

    if (!result.isConfirmed) return;

    let successCount = 0;
    let lastErrorMessage = "";

    try {
      setLoading(true);

      for (const imageId of selectedForDelete) {
        const formData = new FormData();
        formData.append("TypeId", "2");
        formData.append("ImageId", imageId.toString());
        // eslint-disable-next-line no-await-in-loop
        const res = await ProductImages_Manage(formData);
        const { isSuccess, message } = extractStatusMessage(
          res,
          "Image deleted successfully.",
          "Delete failed."
        );

        if (isSuccess) {
          successCount++;
        } else {
          lastErrorMessage = message;
        }
      }

      setSelectedForDelete([]);
      await loadImages();
      onImagesUpdated?.();

      const allSucceeded = successCount === selectedForDelete.length;
      const summaryMsg = allSucceeded
        ? "Selected images deleted successfully."
        : `${successCount} deleted. ${lastErrorMessage ? "Last error: " + lastErrorMessage : ""}`;

      showBanner(allSucceeded ? "success" : "error", summaryMsg);
      Swal.fire({
        icon: allSucceeded ? "success" : "warning",
        title: allSucceeded ? "Deleted!" : "Partially Deleted",
        text: summaryMsg,
        zIndex: SWAL_Z_INDEX,
      });
    } catch (err) {
      console.error(err);
      const msg = "Some images failed to delete";
      showBanner("error", msg);
      Swal.fire({ icon: "error", title: "Error", text: msg, zIndex: SWAL_Z_INDEX });
    } finally {
      setLoading(false);
    }
  };

  if (!productId) return null;

  return (
    <div>
      {/* 🔔 Inline status banner - always visible inside this component/popup,
          regardless of any Swal stacking issues */}
      {actionMessage && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            marginBottom: "10px",
            fontSize: "13px",
            fontWeight: 600,
            color: actionMessage.type === "success" ? "#1b5e20" : "#b71c1c",
            background: actionMessage.type === "success" ? "#e8f5e9" : "#ffebee",
            border: `1px solid ${actionMessage.type === "success" ? "#a5d6a7" : "#ef9a9a"}`,
          }}
        >
          {actionMessage.text}
        </div>
      )}

      <div className="form-row" style={{ alignItems: "flex-end" }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Upload Images (you can select multiple)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
          />
        </div>

        <div className="form-group">
          <button
            type="button"
            className="btn-primary"
            onClick={handleUploadAll}
            disabled={loading || newFiles.length === 0}
          >
            {loading ? "Please wait..." : `Upload ${newFiles.length > 0 ? `(${newFiles.length})` : ""}`}
          </button>
        </div>
      </div>

      {/* Pending previews (not yet uploaded) - pick which one should be primary */}
      {newPreviews.length > 0 && (
        <>
          <p style={{ fontSize: "12px", color: "#777", margin: "4px 0" }}>
            Click a photo below to mark it as the primary image (optional).
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
            {newPreviews.map((src, index) => (
              <div
                key={`pending-${index}`}
                style={{
                  position: "relative",
                  width: "100px",
                  border: primaryIndex === index ? "2px solid #2e7d32" : "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "4px",
                  cursor: "pointer",
                }}
                onClick={() => setPrimaryIndex(index)}
              >
                <img
                  src={src}
                  width="100"
                  style={{ borderRadius: "6px", display: "block" }}
                  alt={`Pending upload ${index + 1}`}
                />

                {primaryIndex === index && (
                  <span style={{ fontSize: "10px", color: "#2e7d32", fontWeight: 600 }}>
                    Primary
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNewFile(index);
                  }}
                  title="Remove"
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "none",
                    background: "#e53935",
                    color: "#fff",
                    fontSize: "12px",
                    lineHeight: "20px",
                    cursor: "pointer",
                  }}
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Already-uploaded images */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <label style={{ margin: 0 }}>Uploaded Images</label>
        {selectedForDelete.length > 0 && (
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "4px 10px" }}
            onClick={handleDeleteSelected}
          >
            Delete Selected ({selectedForDelete.length})
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
        {images.length > 0 ? (
          images.map((img) => (
            <div
              key={img.ImageId}
              style={{
                position: "relative",
                width: "110px",
                border: img.IsPrimary ? "2px solid #2e7d32" : "1px solid #ddd",
                borderRadius: "8px",
                padding: "4px",
              }}
            >
              <input
                type="checkbox"
                checked={selectedForDelete.includes(img.ImageId)}
                onChange={() => toggleSelectForDelete(img.ImageId)}
                style={{ position: "absolute", top: "4px", left: "4px" }}
                title="Select for bulk delete"
              />

              <img
                src={img.ImagePathUrls}
                width="100"
                style={{ borderRadius: "6px", display: "block" }}
                alt={`Product image ${img.ImageId}`}
              />

              {img.IsPrimary ? (
                <span style={{ fontSize: "10px", color: "#2e7d32", fontWeight: 600 }}>
                  Primary
                </span>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: "10px", padding: "2px 6px", marginTop: "4px" }}
                  onClick={() => handleSetPrimary(img.ImageId)}
                >
                  Set Primary
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeleteImage(img.ImageId)}
                title="Delete this image"
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#e53935",
                  color: "#fff",
                  fontSize: "12px",
                  lineHeight: "20px",
                  cursor: "pointer",
                }}
              >
                ✖
              </button>
            </div>
          ))
        ) : (
          <p style={{ color: "#777" }}>
            {loading ? "Loading images..." : "No images uploaded yet."}
          </p>
        )}
      </div>
    </div>
  );
};

const OnlineProductEntry = () => {
  // ---------------- Grid (TypeId = 3 of Online_Product_Manage) ----------------
  const [gridData, setGridData] = useState([]);
  const [gridLoading, setGridLoading] = useState(false);

  // ---------------- Product master (dropdown to pick a physical product) ------
  const [productMasterList, setProductMasterList] = useState([]);

  // ---------------- Form (Online Product Detail) -------------------------------
  const [selectedProductId, setSelectedProductId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [showOnWeb, setShowOnWeb] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false); // true once a product already has online detail
  const [error, setError] = useState({});
  const [saving, setSaving] = useState(false);

  // ---------------- Grid "Manage Images" popup -----------------------------
  const [imageModalProduct, setImageModalProduct] = useState(null); // { ProductId, ProductName }

  const buttonName = isEditMode ? "Update" : "Save";

  // =============================================================
  // LOAD: Grid List (TypeId = 3)
  // =============================================================
  const loadGrid = async () => {
    try {
      setGridLoading(true);

      const payload = { TypeId: 3 };
      const res = await OnlineProduct_Manage(payload);

      setGridData(res?.data || []);
    } catch (err) {
      console.error("Error loading online product grid", err);
      setGridData([]);
    } finally {
      setGridLoading(false);
    }
  };

  // =============================================================
  // LOAD: Product Master (for the ProductId dropdown)
  // =============================================================
  const loadProductMasterList = async () => {
    try {
      const res = await ProductMaster_Manage({ TypeId: 1 });
      setProductMasterList(res?.data || []);
    } catch (err) {
      console.error("Error loading product master list", err);
      setProductMasterList([]);
    }
  };

  useEffect(() => {
    loadGrid();
    loadProductMasterList();
  }, []);

  // =============================================================
  // LOAD: Product Detail (TypeId = 2)
  // Used when user clicks "Edit" on a grid row.
  // (Images for the selected product are handled by ProductImagesManager itself)
  // Note: TypeId = 2 still returns the actual detail row(s), not a Status/Message.
  // =============================================================
  const loadProductDetail = async (productId) => {
    try {
      const payload = { TypeId: 2, ProductId: productId };
      const res = await OnlineProduct_Manage(payload);

      const detail = Array.isArray(res?.data) ? res.data[0] : res?.data;

      if (detail) {
        setShortDescription(detail.ShortDescription || "");
        setLongDescription(detail.LongDescription || "");
        setIsFeatured(!!detail.IsFeatured);
        setShowOnWeb(detail.ShowOnWeb === undefined ? true : !!detail.ShowOnWeb);
        setIsEditMode(true);
      } else {
        // Product exists in Product_Master but has no Online_Product row yet
        setShortDescription("");
        setLongDescription("");
        setIsFeatured(false);
        setShowOnWeb(true);
        setIsEditMode(false);
      }
    } catch (err) {
      console.error("Error loading product detail", err);
    }
  };

  const handleSelectProduct = async (selected) => {
    const productId = selected?.value || "";
    setSelectedProductId(productId);
    setError({});

    if (!productId) {
      resetForm(false);
      return;
    }

    await loadProductDetail(productId);
  };

  // =============================================================
  // VALIDATION
  // =============================================================
  const handleValidation = () => {
    let flag = true;
    const newError = {};

    if (!selectedProductId) {
      newError.selectedProductId = "Product is required";
      flag = false;
    }

    if (!shortDescription || !shortDescription.trim()) {
      newError.shortDescription = "Short description is required";
      flag = false;
    }

    setError(newError);
    return flag;
  };

  // =============================================================
  // SUBMIT: Add / Update Online Product Detail (TypeId = 1)
  // SP now replies with { Status: 1/0, Message: "..." } - show that
  // Message directly (this is the separate confirmation call right
  // after submit that the message needs to be bound from).
  // =============================================================
  const handleSubmit = async () => {
    try {
      if (!handleValidation()) return;

      setSaving(true);

      const payload = {
        TypeId: 1,
        ProductId: selectedProductId,
        ShortDescription: shortDescription,
        LongDescription: longDescription,
        IsFeatured: isFeatured,
        ShowOnWeb: showOnWeb,
      };

      const result = await OnlineProduct_Manage(payload);
      const { isSuccess, message } = extractStatusMessage(
        result,
        "Product Saved Successfully.",
        "Failed to save online product details"
      );

      if (isSuccess) {
        await Swal.fire({
          icon: "success",
          title: isEditMode ? "Updated!" : "Saved!",
          text: message,
          zIndex: SWAL_Z_INDEX,
        });

        setIsEditMode(true);
        await loadGrid();
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: message,
          zIndex: SWAL_Z_INDEX,
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
        zIndex: SWAL_Z_INDEX,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditRow = async (row) => {
    setSelectedProductId(row.ProductId);
    await loadProductDetail(row.ProductId);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = (reloadGrid = true) => {
    setSelectedProductId("");
    setShortDescription("");
    setLongDescription("");
    setIsFeatured(false);
    setShowOnWeb(true);
    setIsEditMode(false);
    setError({});

    if (reloadGrid) loadGrid();
  };

  return (
    <ProtectedRoute>
      <div className="content-wrapper">
        {/* FORM */}
        <div className="form-card">
          <h2>Online Product Entry</h2>
          <hr />

          {/* ROW 1 */}
          <div className="form-row">
            <div className="form-group">
              <label>Product</label>
              <Select
                options={productMasterList.map((item) => ({
                  value: item.ProductId,
                  label: `${item.ProductName} | ${item.ProductCode}`,
                }))}
                value={
                  productMasterList
                    .map((item) => ({
                      value: item.ProductId,
                      label: `${item.ProductName} | ${item.ProductCode}`,
                    }))
                    .find((p) => p.value === selectedProductId) || null
                }
                onChange={handleSelectProduct}
                placeholder="Search Product..."
                isClearable
              />
              <p style={{ color: "red" }}>{error.selectedProductId}</p>
            </div>

            <div className="form-group">
              <label>Show On Web</label>
              <select
                className="dropdown-select"
                value={showOnWeb ? "1" : "0"}
                onChange={(e) => setShowOnWeb(e.target.value === "1")}
              >
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="form-row">
            <div className="form-group">
              <label>Short Description</label>
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={300}
              />
              <p style={{ color: "red" }}>{error.shortDescription}</p>
            </div>

            <div className="form-group">
              <label>Is Featured</label>
              <select
                className="dropdown-select"
                value={isFeatured ? "1" : "0"}
                onChange={(e) => setIsFeatured(e.target.value === "1")}
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </div>
          </div>

          {/* ROW 3 */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Long Description</label>
              <textarea
                rows={5}
                style={{ width: "100%" }}
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}></div>
          </div>

          {/* IMAGES SECTION - available as soon as a product is picked (product already exists in Product_Master) */}
          <h3>Product Images</h3>

          {!selectedProductId ? (
            <p style={{ color: "#777" }}>Select a product above to upload/manage its images.</p>
          ) : (
            <ProductImagesManager productId={selectedProductId} onImagesUpdated={loadGrid} />
          )}

          <div className="btn-group" style={{ marginTop: "18px" }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : buttonName}
            </button>
            <button className="btn-secondary" onClick={() => resetForm()}>
              Cancel
            </button>
          </div>
        </div>

        {/* GRID */}
        <div className="form-card" style={{ marginTop: "20px" }}>
          <h3>Online Products</h3>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", minWidth: "950px", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Short Description</th>
                  <th>Featured</th>
                  <th>Show On Web</th>
                  <th>Views</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {gridLoading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "15px" }}>
                      Loading...
                    </td>
                  </tr>
                ) : gridData.length > 0 ? (
                  gridData.map((row) => (
                    <tr key={row.WebDetailId || row.ProductId}>
                      <td>
                        {row.PrimaryImageUrl ? (
                          <img
                            src={row.PrimaryImageUrl}
                            width="50"
                            style={{ borderRadius: "4px" }}
                            alt={row.ProductName}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{row.ProductCode}</td>
                      <td>{row.ProductName}</td>
                      <td>{row.ShortDescription}</td>
                      <td>{row.IsFeatured ? "Yes" : "No"}</td>
                      <td>{row.ShowOnWeb ? "Yes" : "No"}</td>
                      <td>{row.ViewCount}</td>
                      <td>
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                          <button className="btn-primary" onClick={() => handleEditRow(row)}>
                            Edit
                          </button>

                          <button
                            className="btn-secondary"
                            onClick={() =>
                              setImageModalProduct({
                                ProductId: row.ProductId,
                                ProductName: row.ProductName,
                              })
                            }
                          >
                            Images
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "15px" }}>
                      No Record Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🖼️ IMAGES POPUP - quick upload/delete straight from the grid, no need to open Edit */}
      {imageModalProduct && (
        <div className="custom-modal-overlay">
          <div className="custom-modal" style={{ maxWidth: "600px", width: "95%" }}>
            <div className="modal-header">
              <h2>Manage Images - {imageModalProduct.ProductName}</h2>
              <button onClick={() => setImageModalProduct(null)}>✖</button>
            </div>

            <hr />

            <div className="modal-body">
              <ProductImagesManager
                productId={imageModalProduct.ProductId}
                onImagesUpdated={loadGrid}
              />

              <div className="btn-group" style={{ marginTop: "16px" }}>
                <button className="btn-secondary" onClick={() => setImageModalProduct(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default OnlineProductEntry;
