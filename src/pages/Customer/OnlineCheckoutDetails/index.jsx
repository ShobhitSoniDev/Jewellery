"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import CustomerLayout from "@/pages/Customer/layout";
import {
  Customer_Cart_Manage,
  Customer_Address_Manage,
  Customer_Order_Place,
  Customer_Payment_Verify,
} from "@/lib/services/CustomerService";


const RAZORPAY_KEY_ID = "rzp_test_TT7Kir0Tr3J0bA"; // set this in .env.local

const EMPTY_ADDRESS_FORM = {
  AddressId: 0,
  AddressLabel: "HOME",
  AddressLine: "",
  MobileNo: "",
  City: "",
  State: "",
  Pincode: "",
  IsDefault: false,
};


const OnlineCheckoutDetails = () => {

  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormData, setAddressFormData] = useState(EMPTY_ADDRESS_FORM);
  const [savingAddress, setSavingAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  // "COD" | "CARD" | "UPI" | "NETBANKING" | "WALLET"




  // ============================================================
  // LOAD CART + ADDRESSES
  // ============================================================

  const loadCheckoutData = async () => {
    try {

      setLoading(true);

      const cartRes = await Customer_Cart_Manage({
        TypeId: 2,
      });

      if (cartRes?.code === 1 && Array.isArray(cartRes?.data)) {

        setCartItems(cartRes.data);

      } else {

        setCartItems([]);
      }

      await loadAddresses();

    } catch (error) {

      console.error("Load checkout error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to load checkout details. Please try again.",
      });

    } finally {

      setLoading(false);

    }
  };


  const loadAddresses = async () => {

    try {

      const res = await Customer_Address_Manage({
        TypeId: 4, // Bind All
      });

      if (res?.code === 1 && Array.isArray(res?.data)) {

        setAddresses(res.data);

        const defaultAddr =
          res.data.find((a) => a.IsDefault) || res.data[0];

        if (defaultAddr) {

          setSelectedAddressId(defaultAddr.AddressId);

        } else {

          setShowAddressForm(true);
        }

      } else {

        setAddresses([]);
        setShowAddressForm(true);
      }

    } catch (error) {

      console.error("Load address error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to load your addresses. Please try again.",
      });
    }
  };


  useEffect(() => {

    loadCheckoutData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ============================================================
  // PRICE HELPERS (same logic as cart page)
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

    return getUnitPrice(item) * item.Quantity;
  };

  const getCartSubtotal = () => {

    return cartItems.reduce(
      (sum, item) => sum + getUnitPrice(item) * item.Quantity,
      0
    );
  };

  // Placeholder charges — wire these to your real GST / shipping rules
  const getGstAmount = () => {

    return getCartSubtotal() * 0.03; // e.g. 3% GST on gold — adjust as needed
  };

  const getShippingCharge = () => {

    return 0; // free shipping — adjust as needed
  };

  const getGrandTotal = () => {

    return (getCartSubtotal() + getGstAmount() + getShippingCharge()).toFixed(2);
  };


  // ============================================================
  // ADDRESS: ADD NEW (inline, same TypeId 1 as address page)
  // ============================================================

  const openAddAddressForm = () => {

    setAddressFormData(EMPTY_ADDRESS_FORM);
    setShowAddressForm(true);
  };

  const closeAddAddressForm = () => {

    setShowAddressForm(false);
    setAddressFormData(EMPTY_ADDRESS_FORM);
  };

  const handleAddressFieldChange = (field, value) => {

    setAddressFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveNewAddress = async (e) => {

    e.preventDefault();

    const { AddressLine, MobileNo, City, Pincode } = addressFormData;

    if (!AddressLine.trim() || !MobileNo.trim() || !City.trim() || !Pincode.trim()) {

      Swal.fire({
        icon: "warning",
        title: "Missing Details",
        text: "Address, Mobile No, City and Pincode are required.",
      });

      return;
    }


    try {

      setSavingAddress(true);

      const res = await Customer_Address_Manage({
        TypeId: 1, // Add
        AddressId: 0,
        AddressLabel: addressFormData.AddressLabel || "HOME",
        AddressLine: addressFormData.AddressLine,
        MobileNo: addressFormData.MobileNo,
        City: addressFormData.City,
        State: addressFormData.State,
        Pincode: addressFormData.Pincode,
        IsDefault: addressFormData.IsDefault,
      });

      if (res?.code === 1) {

        Swal.fire({
          icon: "success",
          title: "Address Added",
          timer: 1200,
          showConfirmButton: false,
        });

        closeAddAddressForm();

        // reload list, then select the newly added address
        const refreshed = await Customer_Address_Manage({
          TypeId: 4,
        });

        if (refreshed?.code === 1 && Array.isArray(refreshed?.data)) {

          setAddresses(refreshed.data);

          const newlyAdded =
            refreshed.data.find((a) => a.AddressId === res?.data?.AddressId) ||
            refreshed.data[refreshed.data.length - 1];

          if (newlyAdded) setSelectedAddressId(newlyAdded.AddressId);
        }

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

      setSavingAddress(false);

    }
  };


  // ============================================================
  // RAZORPAY SCRIPT LOADER
  // ============================================================

  const loadRazorpayScript = () => {

    return new Promise((resolve) => {

      if (window.Razorpay) {

        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };


  // ============================================================
  // PLACE ORDER
  // ============================================================

  const handlePlaceOrder = async () => {

    if (!selectedAddressId) {

      Swal.fire({
        icon: "info",
        title: "Address required",
        text: "Please select or add a delivery address.",
      });

      return;
    }

    if (cartItems.length === 0) return;

    if (paymentMethod === "COD") {

      await placeCodOrder();

    } else {

      await placeOnlineOrder();
    }
  };


  // ------------------------------------------------------------
  // COD FLOW — TypeId 1 = place & finalize immediately
  // ------------------------------------------------------------

  const placeCodOrder = async () => {

    try {

      setPlacingOrder(true);

      const res = await Customer_Order_Place({
        TypeId: 1,
        AddressId: selectedAddressId,
        PaymentMode: "COD",
        Amount: Number(getGrandTotal()),
      });

      if (res?.code === 1) {

        Swal.fire({
          icon: "success",
          title: "Order Placed",
          text: "Your order has been placed successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        router.push(`/Customer/OrderConfirmation?OrderId=${res?.data?.OrderId || ""}`);

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to place order.",
        });
      }

    } catch (error) {

      console.error("Place COD order error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to place order. Please try again.",
      });

    } finally {

      setPlacingOrder(false);

    }
  };


  // ------------------------------------------------------------
  // ONLINE (RAZORPAY) FLOW — TypeId 2 = create pending order +
  // Razorpay order
  // ------------------------------------------------------------

  const placeOnlineOrder = async () => {

    try {

      setPlacingOrder(true);

      const orderRes = await Customer_Order_Place({
        TypeId: 2,
        AddressId: selectedAddressId,
        PaymentMode: paymentMethod, // "CARD" | "UPI" | "NETBANKING" | "WALLET"
        Amount: Number(getGrandTotal()),
      });
      if (orderRes?.code !== 1 || !orderRes?.data?.razorpayOrderId) {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: orderRes?.message || "Unable to initiate payment.",
        });

        return;
      }

      const { razorpayOrderId, amount, currency, orderId } = orderRes.data;

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {

        Swal.fire({
          icon: "error",
          title: "Payment unavailable",
          text: "Unable to load payment gateway. Check your connection and try again.",
        });

        return;
      }

      const methodPreference = {
        CARD: "card",
        UPI: "upi",
        NETBANKING: "netbanking",
        WALLET: "wallet",
      }[paymentMethod];

      const selectedAddress = addresses.find(
        (a) => a.AddressId === selectedAddressId
      );

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: Math.round(Number(amount) * 100), // paise
        currency: currency || "INR",
        name: "Your Jewellery Store",
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        method: methodPreference ? { [methodPreference]: true } : undefined,
        prefill: {
          name: selectedAddress?.AddressLabel || "",
          contact: selectedAddress?.MobileNo || "",
        },
        theme: {
          color: "#b8860b",
        },
        handler: async (response) => {

          await verifyPaymentAndFinish(OrderId, response);
        },
        modal: {
          ondismiss: () => {

            setPlacingOrder(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", () => {

        setPlacingOrder(false);

        Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "Your payment could not be processed. Please try again.",
        });
      });

      rzp.open();

    } catch (error) {

      console.error("Online order error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to process payment. Please try again.",
      });

      setPlacingOrder(false);
    }
  };


  const verifyPaymentAndFinish = async (orderId, rzpResponse) => {

    try {

      const verifyRes = await Customer_Payment_Verify({
        OrderId: orderId,
        RazorpayOrderId: rzpResponse.razorpay_order_id,
        RazorpayPaymentId: rzpResponse.razorpay_payment_id,
        RazorpaySignature: rzpResponse.razorpay_signature,
      });

      if (verifyRes?.code === 1) {

        Swal.fire({
          icon: "success",
          title: "Payment Successful",
          text: "Your order has been placed successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        router.push(`/Customer/OrderConfirmation?OrderId=${orderId}`);

      } else {

        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: verifyRes?.Message || "Payment could not be verified.",
        });
      }

    } catch (error) {

      console.error("Verify payment error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to verify payment. Please contact support.",
      });

    } finally {

      setPlacingOrder(false);
    }
  };


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (
      <CustomerLayout>
        <div className="checkout-page">

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
      <div className="checkout-page">

        <div className="checkout-header">
          <h1>Checkout</h1>
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

          <div className="checkout-container">

            {/* ==============================================
                LEFT COLUMN
            =============================================== */}

            <div className="checkout-left">

              {/* -------- ADDRESS SECTION -------- */}

              <div className="checkout-section">

                <div className="checkout-section-header">
                  <h3>Delivery Address</h3>

                  {addresses.length > 0 && (
                    <button
                      className="btn-add-address"
                      onClick={openAddAddressForm}
                    >
                      + Add New Address
                    </button>
                  )}
                </div>

                {addresses.length > 0 && (

                  <div className="checkout-address-list">

                    {addresses.map((addr) => (

                      <label
                        className={`checkout-address-card ${
                          selectedAddressId === addr.AddressId ? "selected" : ""
                        }`}
                        key={addr.AddressId}
                      >
                        <input
                          type="radio"
                          name="deliveryAddress"
                          checked={selectedAddressId === addr.AddressId}
                          onChange={() => setSelectedAddressId(addr.AddressId)}
                        />

                        <div className="checkout-address-details">

                          <div className="checkout-address-top">
                            <span className="address-label">
                              {addr.AddressLabel}
                            </span>

                            {addr.IsDefault && (
                              <span className="default-badge">Default</span>
                            )}
                          </div>

                          <p className="address-line">{addr.AddressLine}</p>

                          <p className="address-meta">
                            {addr.MobileNo}, {addr.City}
                            {addr.State ? `, ${addr.State}` : ""} -{" "}
                            {addr.Pincode}
                          </p>

                        </div>
                      </label>

                    ))}

                  </div>

                )}

                {addresses.length === 0 && !showAddressForm && (

                  <div className="cart-empty">
                    <p>No saved address found.</p>
                    <button
                      className="btn-continue-shopping"
                      onClick={openAddAddressForm}
                    >
                      Add Address
                    </button>
                  </div>

                )}

              </div>


              {/* -------- PAYMENT METHOD SECTION -------- */}

              <div className="checkout-section">

                <h3>Payment Method</h3>

                <div className="payment-options">

                  <label
                    className={`payment-option ${
                      paymentMethod === "COD" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                    />
                    <span className="payment-icon">💵</span>
                    <div className="payment-text">
                      <strong>Cash on Delivery</strong>
                      <span>Pay when your order arrives</span>
                    </div>
                  </label>

                  <label
                    className={`payment-option ${
                      paymentMethod === "CARD" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "CARD"}
                      onChange={() => setPaymentMethod("CARD")}
                    />
                    <span className="payment-icon">💳</span>
                    <div className="payment-text">
                      <strong>Credit / Debit Card</strong>
                      <span>Visa, Mastercard, RuPay & more</span>
                    </div>
                  </label>

                  <label
                    className={`payment-option ${
                      paymentMethod === "UPI" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "UPI"}
                      onChange={() => setPaymentMethod("UPI")}
                    />
                    <span className="payment-icon">📱</span>
                    <div className="payment-text">
                      <strong>UPI</strong>
                      <span>Google Pay, PhonePe, Paytm & more</span>
                    </div>
                  </label>

                  <label
                    className={`payment-option ${
                      paymentMethod === "NETBANKING" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "NETBANKING"}
                      onChange={() => setPaymentMethod("NETBANKING")}
                    />
                    <span className="payment-icon">🏦</span>
                    <div className="payment-text">
                      <strong>Net Banking</strong>
                      <span>All major banks supported</span>
                    </div>
                  </label>

                  <label
                    className={`payment-option ${
                      paymentMethod === "WALLET" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "WALLET"}
                      onChange={() => setPaymentMethod("WALLET")}
                    />
                    <span className="payment-icon">👛</span>
                    <div className="payment-text">
                      <strong>Wallets</strong>
                      <span>Paytm, Amazon Pay & more</span>
                    </div>
                  </label>

                  {paymentMethod !== "COD" && (

                    <p className="razorpay-note">
                      🔒 Secured by Razorpay. You&apos;ll complete this payment in
                      a secure window after clicking &quot;Place Order&quot;.
                    </p>

                  )}

                </div>

              </div>

            </div>


            {/* ==============================================
                RIGHT COLUMN — ORDER SUMMARY
            =============================================== */}

            <div className="checkout-right">

              <div className="checkout-summary">

                <h3>Order Summary</h3>

                <div className="summary-items">

                  {cartItems.map((item) => (

                    <div className="summary-item-row" key={item.ProductId}>

                      <img
                        src={
                          item.PrimaryImageUrl ||
                          "/images/no-product-image.png"
                        }
                        alt={item.ProductName}
                      />

                      <div className="summary-item-info">
                        <span className="summary-item-name">
                          {item.ProductName}
                        </span>
                        <span className="summary-item-qty">
                          Qty: {item.Quantity}
                        </span>
                      </div>

                      <span className="summary-item-price">
                        ₹{getItemTotal(item).toFixed(2)}
                      </span>

                    </div>

                  ))}

                </div>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>₹{getCartSubtotal().toFixed(2)}</strong>
                </div>

                <div className="summary-row">
                  <span>GST</span>
                  <strong>₹{getGstAmount().toFixed(2)}</strong>
                </div>

                <div className="summary-row">
                  <span>Shipping</span>
                  <strong>
                    {getShippingCharge() > 0
                      ? `₹${getShippingCharge().toFixed(2)}`
                      : "Free"}
                  </strong>
                </div>

                <div className="summary-row total">
                  <span>Total Amount</span>
                  <strong>₹{getGrandTotal()}</strong>
                </div>

                <button
                  className="btn-checkout"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || !selectedAddressId}
                >
                  {placingOrder
                    ? "Processing..."
                    : paymentMethod === "COD"
                    ? "Place Order"
                    : "Proceed to Pay"}
                </button>

                <p className="price-note">
                  *Final price may vary based on making charges, GST and
                  current metal rate.
                </p>

              </div>

            </div>

          </div>

        )}


        {/* ==================================================
            ADD NEW ADDRESS MODAL (same fields as address page)
        =================================================== */}

        {showAddressForm && (

          <div className="address-modal-overlay" onClick={closeAddAddressForm}>

            <div
              className="address-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="address-modal-header">

                <h3>Add New Address</h3>

                <button
                  className="btn-close-modal"
                  onClick={closeAddAddressForm}
                >
                  ✕
                </button>

              </div>

              <form onSubmit={handleSaveNewAddress} className="address-form">

                <div className="form-group">

                  <label>Address Type</label>

                  <div className="address-type-pills">

                    {["HOME", "OFFICE", "OTHER"].map((type) => (

                      <button
                        type="button"
                        key={type}
                        className={`address-type-pill ${
                          addressFormData.AddressLabel === type ? "active" : ""
                        }`}
                        onClick={() =>
                          handleAddressFieldChange("AddressLabel", type)
                        }
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

                    <label htmlFor="co-addr-line">Address *</label>

                    <textarea
                      id="co-addr-line"
                      rows={3}
                      placeholder="House no, street, area"
                      value={addressFormData.AddressLine}
                      onChange={(e) =>
                        handleAddressFieldChange("AddressLine", e.target.value)
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label htmlFor="co-addr-mobileno">Mobile No *</label>

                    <input
                      id="co-addr-mobileno"
                      type="text"
                      placeholder="0000000000"
                      value={addressFormData.MobileNo}
                      onChange={(e) =>
                        handleAddressFieldChange("MobileNo", e.target.value)
                      }
                      required
                    />

                  </div>

                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label htmlFor="co-addr-city">City *</label>

                    <input
                      id="co-addr-city"
                      type="text"
                      placeholder="e.g. Lucknow"
                      value={addressFormData.City}
                      onChange={(e) =>
                        handleAddressFieldChange("City", e.target.value)
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label htmlFor="co-addr-state">State</label>

                    <input
                      id="co-addr-state"
                      type="text"
                      placeholder="e.g. Uttar Pradesh"
                      value={addressFormData.State}
                      onChange={(e) =>
                        handleAddressFieldChange("State", e.target.value)
                      }
                    />

                  </div>

                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label htmlFor="co-addr-pincode">Pincode *</label>

                    <input
                      id="co-addr-pincode"
                      type="text"
                      inputMode="numeric"
                      placeholder="6-digit pincode"
                      maxLength={10}
                      value={addressFormData.Pincode}
                      onChange={(e) =>
                        handleAddressFieldChange(
                          "Pincode",
                          e.target.value.replace(/[^0-9]/g, "")
                        )
                      }
                      required
                    />

                  </div>

                  <div className="form-group"></div>

                </div>

                <label className="default-toggle">

                  <input
                    type="checkbox"
                    checked={addressFormData.IsDefault}
                    onChange={(e) =>
                      handleAddressFieldChange("IsDefault", e.target.checked)
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
                    onClick={closeAddAddressForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-add-cart"
                    disabled={savingAddress}
                  >
                    {savingAddress ? "Saving..." : "Save Address"}
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

export default OnlineCheckoutDetails;
