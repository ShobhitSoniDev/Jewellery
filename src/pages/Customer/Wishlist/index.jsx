"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import CustomerLayout from "@/pages/Customer/layout";
import {
  Customer_Wishlist_Manage,
  Customer_Cart_Manage,
} from "@/lib/services/CustomerService";


const OnlineWishlistDetails = () => {

  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null); // ProductId currently being removed / moved to cart



  // ============================================================
  // LOAD WISHLIST
  // ============================================================

  const loadWishlist = async () => {


    try {

      setLoading(true);

      const res = await Customer_Wishlist_Manage({
        TypeId: 2,
      });

      if (res?.code === 1 && Array.isArray(res?.data)) {

        setWishlistItems(res.data);

      } else {

        setWishlistItems([]);
      }

    } catch (error) {

      console.error("Load wishlist error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to load your wishlist. Please try again.",
      });

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadWishlist();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ============================================================
  // REMOVE FROM WISHLIST
  // ============================================================

  const handleRemove = async (item) => {

    
    try {

      setBusyId(item.ProductId);

      const res = await Customer_Wishlist_Manage({
        TypeId: 1,
        ProductId: item.ProductId,
      });

      if (res?.code === 1) {

        setWishlistItems((prev) =>
          prev.filter((wi) => wi.ProductId !== item.ProductId)
        );

        Swal.fire({
          icon: "success",
          title: "Removed from Wishlist",
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

      console.error("Remove wishlist item error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to remove item. Please try again.",
      });

    } finally {

      setBusyId(null);

    }
  };


  // ============================================================
  // MOVE TO CART
  // ============================================================

  const handleMoveToCart = async (item) => {

    if (item.TotalQuantity <= 0) {

      Swal.fire({
        icon: "info",
        title: "Out of Stock",
        text: "This product is currently unavailable.",
      });

      return;
    }


    try {

      setBusyId(item.ProductId);

      const cartRes = await Customer_Cart_Manage({
        TypeId: 1,
        ProductId: item.ProductId,
        Quantity: 1,
      });

      if (cartRes?.code === 1) {

        // remove from wishlist after successfully moving to cart
        await Customer_Wishlist_Manage({
          TypeId: 1,
          ProductId: item.ProductId,
        });

        setWishlistItems((prev) =>
          prev.filter((wi) => wi.ProductId !== item.ProductId)
        );

        Swal.fire({
          icon: "success",
          title: "Moved to Cart",
          text: `${item.ProductName} added to your cart.`,
          timer: 1500,
          showConfirmButton: false,
        });

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: cartRes?.Message || "Unable to add product to cart.",
        });
      }

    } catch (error) {

      console.error("Move to cart error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to add product to cart. Please try again.",
      });

    } finally {

      setBusyId(null);

    }
  };


  // ============================================================
  // PRICE HELPER
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


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (
      <CustomerLayout>
        <div className="wishlist-page">

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
      <div className="wishlist-page">

        <div className="cart-header">
          <h1>My Wishlist</h1>
          <span className="cart-count">{wishlistItems.length} item(s)</span>
        </div>


        {wishlistItems.length === 0 ? (

          <div className="cart-empty">

            <p>Your wishlist is empty.</p>

            <button
              className="btn-continue-shopping"
              onClick={() => router.push("/Customer/OnlineProductDetails")}
            >
              Continue Shopping
            </button>

          </div>

        ) : (

          <div className="wishlist-grid">

            {wishlistItems.map((item) => (

              <div className="wishlist-card" key={item.ProductId}>

                <div className="wishlist-card-image">

                  <img
                    src={item.PrimaryImageUrl || "/images/no-product-image.png"}
                    alt={item.ProductName}
                    onClick={() =>
                      router.push(
                        `/Customer/OnlineProductFullDetail?ProductId=${item.ProductId}`
                      )
                    }
                  />

                  <button
                    className="wishlist-card-remove"
                    onClick={() => handleRemove(item)}
                    disabled={busyId === item.ProductId}
                    title="Remove from Wishlist"
                  >
                    ✕
                  </button>

                </div>

                <div className="wishlist-card-info">

                  <h3
                    onClick={() =>
                      router.push(
                        `/Customer/OnlineProductFullDetail?ProductId=${item.ProductId}`
                      )
                    }
                  >
                    {item.ProductName}
                  </h3>

                  <span className="wishlist-card-code">
                    {item.ProductCode}
                  </span>

                  <span className="wishlist-card-price">
                    ₹{getUnitPrice(item).toFixed(2)}
                  </span>

                  <span
                    className={
                      item.TotalQuantity > 0 ? "in-stock" : "out-stock"
                    }
                  >
                    {item.TotalQuantity > 0 ? "In Stock" : "Out of Stock"}
                  </span>

                </div>

                <button
                  className="btn-add-cart"
                  onClick={() => handleMoveToCart(item)}
                  disabled={
                    busyId === item.ProductId || item.TotalQuantity <= 0
                  }
                >
                  {busyId === item.ProductId
                    ? "Adding..."
                    : "🛒 Move to Cart"}
                </button>

              </div>

            ))}

          </div>

        )}

      </div>
    </CustomerLayout>
  );
};

export default OnlineWishlistDetails;
