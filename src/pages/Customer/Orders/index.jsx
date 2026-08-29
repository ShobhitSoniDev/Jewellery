import { useEffect, useState } from "react";
import Link from "next/link";
import CustomerLayout from "@/pages/Customer/layout";
import { Customer_Order_Manage } from "@/lib/services/CustomerService";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await Customer_Order_Manage({ TypeId: 2 });
      const rows = response?.data ?? response?.Data ?? [];
      setOrders(Array.isArray(rows) ? rows : []);
    } catch {
      setError("Orders load nahi ho paaye. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  return <CustomerLayout>
    <section className="customerPage orderPage">
      <div className="customerPageHeading">
        <div><p className="customerEyebrow">YOUR PURCHASES</p><h1>My Orders</h1><p>Apne jewellery orders aur delivery status ko track karein.</p></div>
        <Link className="customerPrimaryButton" href="/Customer/OnlineProductDetails">Continue shopping</Link>
      </div>
      {loading ? <div className="customerStateCard">Loading your orders…</div> : error ? <div className="customerStateCard"><p>{error}</p><button className="customerSecondaryButton" onClick={loadOrders}>Try again</button></div> : orders.length === 0 ? <div className="customerStateCard"><h2>No orders yet</h2><p>Aapka pehla favourite piece yahin se shuru hota hai.</p><Link className="customerPrimaryButton" href="/Customer/OnlineProductDetails">Explore jewellery</Link></div> : <div className="orderList">
        {orders.map((order) => {
          const id = order.OrderId ?? order.orderId;
          const status = order.OrderStatus ?? order.Status ?? "Placed";
          return <article className="orderCard" key={id}>
            <div className="orderCardTop"><div><span className="orderNumber">Order #{id}</span><span className="orderDate">Placed on {date(order.OrderDate ?? order.CreatedOn)}</span></div><span className={`orderStatus orderStatus${String(status).replace(/\s/g, "")}`}>{status}</span></div>
            <div className="orderCardBody"><div><strong>{order.ProductName ?? order.ItemCount ? `${order.ItemCount ?? 1} item${Number(order.ItemCount ?? 1) === 1 ? "" : "s"}` : "Jewellery order"}</strong><p>{order.PaymentMode ?? "Payment"} · {order.PaymentStatus ?? "Pending"}</p></div><strong className="orderAmount">{money(order.TotalAmount ?? order.Amount ?? order.GrandTotal)}</strong></div>
            <div className="orderCardActions"><Link href={`/Customer/OrderConfirmation?OrderId=${id}`}>View order details</Link></div>
          </article>;
        })}
      </div>}
    </section>
  </CustomerLayout>;
}
