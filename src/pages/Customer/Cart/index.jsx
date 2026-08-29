"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import CustomerLayout from "@/pages/Customer/layout";
import { Customer_Cart_Manage } from "@/lib/services/CustomerService";


const OnlineCartDetails = () => {

  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null); // ProductId currently being updated/removed



  // ============================================================
  // LOAD CART LIST
  // ============================================================

  const loadCart = async () => {

    try {

      setLoading(true);

      const res = await Customer_Cart_Manage({
        TypeId: 2,
      });

      if (res?.code === 1 && Array.isArray(res?.data)) {

        setCartItems(res.data);

      } else {

        setCartItems([]);
      }

    } catch (error) {

      console.error("Load cart error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to load your cart. Please try again.",
      });

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadCart();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ============================================================
  // UPDATE QUANTITY
  // ============================================================

  const handleQuantityChange = async (item, newQuantity) => {

    if (newQuantity < 1) return;

    if (newQuantity > (item.TotalQuantity || newQuantity)) {

      Swal.fire({
        icon: "info",
        title: "Limit Reached",
        text: "Cannot add more than available stock.",
        timer: 1200,
        showConfirmButton: false,
      });

      return;
    }

    try {

      setUpdatingId(item.ProductId);

      const res = await Customer_Cart_Manage({
        TypeId: 1,
        ProductId: item.ProductId,
        Quantity: newQuantity,
      });

      if (res?.code === 1) {

        setCartItems((prev) =>
          prev.map((ci) =>
            ci.ProductId === item.ProductId
              ? { ...ci, Quantity: newQuantity }
              : ci
          )
        );

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to update quantity.",
        });
      }

    } catch (error) {

      console.error("Update quantity error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to update quantity. Please try again.",
      });

    } finally {

      setUpdatingId(null);

    }
  };


  // ============================================================
  // REMOVE ITEM
  // ============================================================

  const handleRemoveItem = async (item) => {

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Remove Item?",
      text: `Remove ${item.ProductName} from your cart?`,
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;


    try {

      setUpdatingId(item.ProductId);

      const res = await Customer_Cart_Manage({
        TypeId: 1,
        ProductId: item.ProductId,
        Quantity: 0,
      });

      if (res?.code === 1) {

        setCartItems((prev) =>
          prev.filter((ci) => ci.ProductId !== item.ProductId)
        );

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
          text: res?.Message || "Unable to remove item.",
        });
      }

    } catch (error) {

      console.error("Remove item error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to remove item. Please try again.",
      });

    } finally {

      setUpdatingId(null);

    }
  };


  // ============================================================
  // PRICE HELPERS
  // ============================================================

  const getUnitPrice = (item) => {

    if (!item?.CurrentRate || !item?.NetWeight) return 0;

    const metalValue = item.CurrentRate * item.NetWeight;

    const makingCharge =
      item.MakingChargeType === "Percentage"
        ? (metalValue * item.MakingCharge) / 100
        : item.MakingCharge * item.NetWeight;

    return metalValue + makingCharge;
  };

  const getItemTotal = (item) => {

    return (getUnitPrice(item) * item.Quantity).toFixed(2);
  };

  const getCartGrandTotal = () => {

    return cartItems
      .reduce((sum, item) => sum + getUnitPrice(item) * item.Quantity, 0)
      .toFixed(2);
  };


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (
      <CustomerLayout>
        <div className="cart-page">

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
      <div className="cart-page">

        <div className="cart-header">
          <h1>My Cart</h1>
          <span className="cart-count">{cartItems.length} item(s)</span>
        </div>


        {cartItems.length === 0 ? (

          <div className="cart-empty">

            <p>Your cart is empty.</p>

            <button
              className="btn-continue-shopping"
              onClick={() => router.push("/Customer/OnlineProductDetails")}
            >
              Continue Shopping
            </button>

          </div>

        ) : (

          <div className="cart-container">

            {/* ==============================================
                CART ITEMS LIST
            =============================================== */}

            <div className="cart-items-list">

              {cartItems.map((item) => (

                <div className="cart-item" key={item.ProductId}>

                  <img
                    src={item.PrimaryImageUrl || "/images/no-product-image.png"}
                    alt={item.ProductName}
                    className="cart-item-image"
                    onClick={() =>
                      router.push(
                        `/Customer/OnlineProductFullDetail?ProductId=${item.ProductId}`
                      )
                    }
                  />

                  <div className="cart-item-info">

                    <h3
                      onClick={() =>
                        router.push(
                          `/Customer/OnlineProductFullDetail?ProductId=${item.ProductId}`
                        )
                      }
                    >
                      {item.ProductName}
                    </h3>

                    <span className="cart-item-code">
                      {item.ProductCode}
                    </span>

                    <span className="cart-item-price">
                      ₹{getUnitPrice(item).toFixed(2)} / unit
                    </span>

                    {item.TotalQuantity <= 0 && (
                      <span className="out-stock">Out of Stock</span>
                    )}

                  </div>

                  <div className="cart-item-quantity">

                    <button
                      onClick={() =>
                        handleQuantityChange(item, item.Quantity - 1)
                      }
                      disabled={
                        updatingId === item.ProductId || item.Quantity <= 1
                      }
                    >
                      −
                    </button>

                    <span>{item.Quantity}</span>

                    <button
                      onClick={() =>
                        handleQuantityChange(item, item.Quantity + 1)
                      }
                      disabled={
                        updatingId === item.ProductId ||
                        item.Quantity >= (item.TotalQuantity || Infinity)
                      }
                    >
                      +
                    </button>

                  </div>

                  <div className="cart-item-total">
                    ₹{getItemTotal(item)}
                  </div>

                  <button
                    className="btn-remove-item"
                    onClick={() => handleRemoveItem(item)}
                    disabled={updatingId === item.ProductId}
                  >
                    🗑 Remove
                  </button>

                </div>

              ))}

            </div>


            {/* ==============================================
                SUMMARY
            =============================================== */}

            <div className="cart-summary">

              <h3>Order Summary</h3>

              <div className="summary-row">
                <span>Items</span>
                <strong>{cartItems.length}</strong>
              </div>

              <div className="summary-row total">
                <span>Estimated Total</span>
                <strong>₹{getCartGrandTotal()}</strong>
              </div>

              <p className="price-note">
                *Final price may vary based on making charges, GST and
                current metal rate.
              </p>

              <button
                className="btn-checkout"
                onClick={() => router.push("/Customer/OnlineCheckoutDetails")}
                disabled={cartItems.every((i) => i.TotalQuantity <= 0)}
              >
                Proceed to Buy
              </button>

              <button
                className="btn-continue-shopping"
                onClick={() => router.push("/Customer/OnlineProductDetails")}
              >
                Continue Shopping
              </button>

            </div>

          </div>

        )}

      </div>
    </CustomerLayout>
  );
};

export default OnlineCartDetails;
