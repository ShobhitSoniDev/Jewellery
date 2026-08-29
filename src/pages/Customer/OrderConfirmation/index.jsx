import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaCheck } from "react-icons/fa";
import CustomerLayout from "@/pages/Customer/layout";
import { Customer_Order_Manage } from "@/lib/services/CustomerService";

export default function OrderConfirmation() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const orderId = router.query.OrderId;

  useEffect(() => {
    if (!router.isReady || !orderId) return;
    Customer_Order_Manage({ TypeId: 3, OrderId: orderId })
      .then((res) => setOrder(res?.data ?? res?.Data ?? null))
      .catch(() => setOrder(null));
  }, [router.isReady, orderId]);

  const amount = order?.TotalAmount ?? order?.Amount ?? order?.GrandTotal;
  return <CustomerLayout>
    <section className="customerPage confirmationPage">
      <div className="confirmationMark"><FaCheck /></div>
      <p className="customerEyebrow">ORDER CONFIRMED</p>
      <h1>Thank you for your order!</h1>
      <p className="confirmationLead">Aapka order successfully place ho gaya hai. Hum jaldi hi aapko status update bhejenge.</p>
      <div className="confirmationDetails">
        <div><span>Order number</span><strong>#{order?.OrderId ?? orderId ?? "—"}</strong></div>
        <div><span>Payment</span><strong>{order?.PaymentMode ?? "Processing"}</strong></div>
        {amount !== undefined && <div><span>Order total</span><strong>₹{Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>}
      </div>
      <p className="confirmationNote">Order details aur delivery updates aapke <Link href="/Customer/Orders">My Orders</Link> section me hamesha available rahenge.</p>
      <div className="confirmationActions"><Link className="customerPrimaryButton" href="/Customer/Orders">View my orders</Link><Link className="customerSecondaryButton" href="/Customer/OnlineProductDetails">Continue shopping</Link></div>
    </section>
  </CustomerLayout>;
}
