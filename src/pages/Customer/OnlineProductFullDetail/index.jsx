"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

import CustomerLayout from "@/pages/Customer/layout";
import {
  GetOnline_ProductByProductId,
  Customer_Wishlist_Manage,
  Customer_Cart_Manage,
} from "@/lib/services/CustomerService";


const OnlineProductFullDetail = () => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("ProductId");

  // ============================================================
  // ROUTE CONFIG
  // ============================================================

  const PRODUCT_LIST_ROUTE = "/OnlineProductDetails";

  // ============================================================
  // STATE
  // ============================================================

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("description");


  // ============================================================
  // HELPER: Get logged-in CustomerId
  // ============================================================

  const getCustomerId = () => {
debugger
    const id = 1;

    return id ? Number(id) : null;
  };


  // ============================================================
  // LOAD PRODUCT DETAILS
  // ============================================================

  const loadProductDetails = async () => {

    if (!productId) {

      Swal.fire({
        icon: "error",
        title: "Invalid Product",
        text: "Product not found.",
      });

      router.push(PRODUCT_LIST_ROUTE);

      return;
    }

    try {

      setLoading(true);
debugger

          const res = await GetOnline_ProductByProductId({
      ProductId: Number(productId),
    });

      if (res?.code === 1 && res?.data) {

        const productData = res.data.Product || res.data.product;
        const imageData = res.data.Images || res.data.images || [];

        setProduct(productData);
        setImages(imageData);

        const primary =
          imageData.find((img) => img.IsPrimary) || imageData[0];

        setSelectedImage(
          primary?.ImageUrl || "/images/no-product-image.png"
        );

      } else {

        Swal.fire({
          icon: "error",
          title: "Product Not Found",
          text: res?.Message || "Unable to load product details.",
        });

        router.push(PRODUCT_LIST_ROUTE);
      }

    } catch (error) {

      console.error("Product details error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to load product details. Please try again.",
      });

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // CHECK IF ALREADY IN CART / WISHLIST
  // ============================================================

  const checkExistingCartAndWishlist = async () => {

    const customerId = getCustomerId();

    if (!customerId || !productId) return;

    try {

      const cartRes = await Customer_Cart_Manage({
        TypeId: 2,
        CustomerId: customerId,
      });

      if (cartRes?.Code === 1 && Array.isArray(cartRes?.Data)) {

        const existingItem = cartRes.Data.find(
          (item) => item.ProductId === Number(productId)
        );

        if (existingItem) {

          setCartQuantity(existingItem.Quantity);
          setQuantity(existingItem.Quantity);

        } else {

          setCartQuantity(0);
        }
      }

    } catch (error) {

      console.error("Cart check error:", error);
    }

    try {

      const wishlistRes = await Customer_Wishlist_Manage({
        TypeId: 2,
        CustomerId: customerId,
      });

      if (wishlistRes?.Code === 1 && Array.isArray(wishlistRes?.Data)) {

        const existsInWishlist = wishlistRes.Data.some(
          (item) => item.ProductId === Number(productId)
        );

        setIsWishlisted(existsInWishlist);
      }

    } catch (error) {

      console.error("Wishlist check error:", error);
    }
  };


  useEffect(() => {

    setQuantity(1);
    setCartQuantity(0);

    loadProductDetails();
    checkExistingCartAndWishlist();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);


  // ============================================================
  // WISHLIST TOGGLE
  // ============================================================

  const handleWishlistToggle = async () => {

    if (wishlistLoading) return;

    const customerId = getCustomerId();

    if (!customerId) {

      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login to add items to wishlist.",
      });

      router.push("/Customer/login");

      return;
    }

    try {

      setWishlistLoading(true);

      const res = await Customer_Wishlist_Manage({
        TypeId: 1,
        CustomerId: customerId,
        ProductId: Number(productId),
      });

      if (res?.Code === 1) {

        setIsWishlisted(res.Data?.IsAdded);

        Swal.fire({
          icon: "success",
          title: res.Data?.IsAdded
            ? "Added to Wishlist"
            : "Removed from Wishlist",
          timer: 1200,
          showConfirmButton: false,
        });

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to update wishlist.",
        });
      }

    } catch (error) {

      console.error("Wishlist toggle error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to update wishlist. Please try again.",
      });

    } finally {

      setWishlistLoading(false);

    }
  };


  // ============================================================
  // ADD / UPDATE CART
  // ============================================================

  const handleAddToCart = async () => {

    if (cartLoading) return;

    const customerId = getCustomerId();

    if (!customerId) {

      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login to add items to cart.",
      });

      router.push("/Customer/login");

      return;
    }

    if (product?.TotalQuantity <= 0) {

      Swal.fire({
        icon: "info",
        title: "Out of Stock",
        text: "This product is currently unavailable.",
      });

      return;
    }

    try {

      setCartLoading(true);

      const wasAlreadyInCart = cartQuantity > 0;

      const res = await Customer_Cart_Manage({
        TypeId: 1,
        CustomerId: customerId,
        ProductId: Number(productId),
        Quantity: quantity,
      });

      if (res?.Code === 1) {

        setCartQuantity(quantity);

        Swal.fire({
          icon: "success",
          title: wasAlreadyInCart ? "Cart Updated" : "Added to Cart",
          text: `${product.ProductName} (Qty: ${quantity})`,
          timer: 1500,
          showConfirmButton: false,
        });

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to add product to cart.",
        });
      }

    } catch (error) {

      console.error("Add to cart error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to add product to cart. Please try again.",
      });

    } finally {

      setCartLoading(false);

    }
  };


  // ============================================================
  // REMOVE FROM CART
  // ============================================================

  const handleRemoveFromCart = async () => {

    const customerId = getCustomerId();

    if (!customerId) return;

    try {

      setCartLoading(true);

      const res = await Customer_Cart_Manage({
        TypeId: 1,
        CustomerId: customerId,
        ProductId: Number(productId),
        Quantity: 0,
      });

      if (res?.Code === 1) {

        setCartQuantity(0);
        setQuantity(1);

        Swal.fire({
          icon: "success",
          title: "Removed from Cart",
          timer: 1200,
          showConfirmButton: false,
        });

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to remove product from cart.",
        });
      }

    } catch (error) {

      console.error("Remove from cart error:", error);

    } finally {

      setCartLoading(false);

    }
  };


  // ============================================================
  // BUY NOW
  // ============================================================

  const handleBuyNow = async () => {

    const customerId = getCustomerId();

    if (!customerId) {

      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login to continue.",
      });

      router.push("/Customer/login");

      return;
    }

    if (product?.TotalQuantity <= 0) {

      Swal.fire({
        icon: "info",
        title: "Out of Stock",
        text: "This product is currently unavailable.",
      });

      return;
    }

    try {

      setCartLoading(true);

      const res = await Customer_Cart_Manage({
        TypeId: 1,
        CustomerId: customerId,
        ProductId: Number(productId),
        Quantity: quantity,
      });

      if (res?.Code === 1) {

        router.push("/cart");

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to proceed.",
        });
      }

    } catch (error) {

      console.error("Buy now error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to proceed. Please try again.",
      });

    } finally {

      setCartLoading(false);

    }
  };


  // ============================================================
  // QUANTITY CONTROLS
  // ============================================================

  const increaseQuantity = () => {

    if (quantity < (product?.TotalQuantity || 1)) {

      setQuantity((prev) => prev + 1);

    } else {

      Swal.fire({
        icon: "info",
        title: "Limit Reached",
        text: "Cannot add more than available stock.",
        timer: 1200,
        showConfirmButton: false,
      });
    }
  };

  const decreaseQuantity = () => {

    if (quantity > 1) {

      setQuantity((prev) => prev - 1);
    }
  };


  // ============================================================
  // PRICE HELPERS
  // ============================================================

  const getMakingChargeText = () => {

    if (!product) return "";

    if (product.MakingChargeType === "Percentage") {

      return `${product.MakingCharge}%`;
    }

    return `₹${product.MakingCharge} / g`;
  };

  const getEstimatedPrice = () => {

    if (!product?.CurrentRate || !product?.NetWeight) return null;

    const metalValue = product.CurrentRate * product.NetWeight;

    const makingCharge =
      product.MakingChargeType === "Percentage"
        ? (metalValue * product.MakingCharge) / 100
        : product.MakingCharge * product.NetWeight;

    return (metalValue + makingCharge).toFixed(2);
  };

  const getTotalPrice = () => {

    const unitPrice = getEstimatedPrice();

    if (!unitPrice) return null;

    return (unitPrice * quantity).toFixed(2);
  };


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (
      <CustomerLayout>
        <div className="product-details-page">

          <div className="product-details-skeleton">

            <div className="skeleton-gallery"></div>

            <div className="skeleton-info">
              <div className="skeleton-line large"></div>
              <div className="skeleton-line medium"></div>
              <div className="skeleton-line small"></div>
              <div className="skeleton-line small"></div>
            </div>

          </div>

        </div>
      </CustomerLayout>
    );
  }


  if (!product) return null;


  return (
    <CustomerLayout>
      <div className="product-details-page">

        {/* ==================================================
            BREADCRUMB
        =================================================== */}

        <div className="breadcrumb">

          <span onClick={() => router.push(PRODUCT_LIST_ROUTE)}>
            Products
          </span>

          <span> / </span>

          <span>{product.CategoryName}</span>

          <span> / </span>

          <strong>{product.ProductName}</strong>

        </div>


        <div className="product-details-container">

          {/* ================================================
              LEFT: IMAGE GALLERY
          ================================================= */}

          <div className="product-gallery">

            <div className="main-image-wrapper">

              {product.IsFeatured && (
                <span className="featured-badge">⭐ Featured</span>
              )}

              <img
                src={selectedImage}
                alt={product.ProductName}
                className="main-image"
              />

            </div>


            {images.length > 1 && (

              <div className="thumbnail-list">

                {images.map((img) => (

                  <div
                    key={img.ImageId}
                    className={`thumbnail-item ${
                      selectedImage === img.ImageUrl ? "active" : ""
                    }`}
                    onClick={() => setSelectedImage(img.ImageUrl)}
                  >

                    <img src={img.ImageUrl} alt={product.ProductName} />

                  </div>

                ))}

              </div>

            )}

          </div>


          {/* ================================================
              RIGHT: PRODUCT INFO
          ================================================= */}

          <div className="product-info">

            <div className="product-info-header">

              <div>

                <span className="product-code">
                  {product.ProductCode}
                </span>

                <h1>{product.ProductName}</h1>

                <div className="product-tags">
                  <span className="tag">{product.MetalName}</span>
                  <span className="tag">{product.CategoryName}</span>
                </div>

              </div>

              <button
                className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                title={
                  isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"
                }
              >
                {isWishlisted ? "♥" : "♡"}
              </button>

            </div>


            {product.ShortDescription && (
              <p className="short-desc">{product.ShortDescription}</p>
            )}


            {/* PRICE SECTION */}

            <div className="price-section">

              <div className="price-row">
                <span>Metal Rate</span>
                <strong>₹{product.CurrentRate} / g</strong>
              </div>

              <div className="price-row">
                <span>Making Charge</span>
                <strong>{getMakingChargeText()}</strong>
              </div>

              {getEstimatedPrice() && (
                <div className="price-row total">
                  <span>Estimated Price (per unit)*</span>
                  <strong>₹{getEstimatedPrice()}</strong>
                </div>
              )}

              <p className="price-note">
                *Final price may vary based on making charges, GST and
                current metal rate.
              </p>

            </div>


            {/* WEIGHT & STOCK */}

            <div className="specs-grid">

              <div className="spec-item">
                <span>Gross Weight</span>
                <strong>{product.GrossWeight} g</strong>
              </div>

              <div className="spec-item">
                <span>Net Weight</span>
                <strong>{product.NetWeight} g</strong>
              </div>

              <div className="spec-item">
                <span>Availability</span>
                <strong
                  className={
                    product.TotalQuantity > 0 ? "in-stock" : "out-stock"
                  }
                >
                  {product.TotalQuantity > 0
                    ? `In Stock (${product.TotalQuantity})`
                    : "Out of Stock"}
                </strong>
              </div>

            </div>


            {/* QUANTITY SELECTOR */}

            {product.TotalQuantity > 0 && (

              <div className="quantity-section">

                <span>Quantity</span>

                <div className="quantity-selector">

                  <button onClick={decreaseQuantity} disabled={quantity <= 1}>
                    −
                  </button>

                  <span className="quantity-value">{quantity}</span>

                  <button
                    onClick={increaseQuantity}
                    disabled={quantity >= product.TotalQuantity}
                  >
                    +
                  </button>

                </div>

                {getTotalPrice() && (
                  <span className="quantity-total">
                    Total: ₹{getTotalPrice()}
                  </span>
                )}

                {cartQuantity > 0 && (
                  <span className="already-in-cart">
                    ✓ {cartQuantity} already in cart
                  </span>
                )}

              </div>

            )}


            {/* ACTION BUTTONS */}

            <div className="action-buttons">

              {cartQuantity > 0 ? (

                <>
                  <button
                    className="btn-add-cart"
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                  >
                    {cartLoading ? "Updating..." : "🛒 Update Cart"}
                  </button>

                  <button
                    className="btn-remove-cart"
                    onClick={handleRemoveFromCart}
                    disabled={cartLoading}
                  >
                    Remove from Cart
                  </button>
                </>

              ) : (

                <button
                  className="btn-add-cart"
                  onClick={handleAddToCart}
                  disabled={cartLoading || product.TotalQuantity <= 0}
                >
                  {cartLoading ? "Adding..." : "🛒 Add to Cart"}
                </button>

              )}

              <button
                className="btn-buy-now"
                onClick={handleBuyNow}
                disabled={cartLoading || product.TotalQuantity <= 0}
              >
                Buy Now
              </button>

              <button
                className="btn-enquire"
                onClick={() =>
                  router.push(`/enquiry?ProductId=${product.ProductId}`)
                }
              >
                Enquire Now
              </button>

            </div>


            {/* TABS: DESCRIPTION */}

            <div className="product-tabs">

              <div className="tab-header">

                <button
                  className={activeTab === "description" ? "active" : ""}
                  onClick={() => setActiveTab("description")}
                >
                  Description
                </button>

                <button
                  className={activeTab === "details" ? "active" : ""}
                  onClick={() => setActiveTab("details")}
                >
                  Product Details
                </button>

              </div>


              <div className="tab-content">

                {activeTab === "description" && (
                  <p>
                    {product.LongDescription ||
                      product.ShortDescription ||
                      "No description available for this product."}
                  </p>
                )}

                {activeTab === "details" && (

                  <table className="details-table">

                    <tbody>

                      <tr>
                        <td>Product Code</td>
                        <td>{product.ProductCode}</td>
                      </tr>

                      <tr>
                        <td>Category</td>
                        <td>{product.CategoryName}</td>
                      </tr>

                      <tr>
                        <td>Metal</td>
                        <td>{product.MetalName}</td>
                      </tr>

                      <tr>
                        <td>Gross Weight</td>
                        <td>{product.GrossWeight} g</td>
                      </tr>

                      <tr>
                        <td>Net Weight</td>
                        <td>{product.NetWeight} g</td>
                      </tr>

                      <tr>
                        <td>Making Charge</td>
                        <td>{getMakingChargeText()}</td>
                      </tr>

                    </tbody>

                  </table>

                )}

              </div>

            </div>

          </div>

        </div>

      </div>
    </CustomerLayout>
  );
};

export default OnlineProductFullDetail;