import Link from "next/link";
import CustomerLayout from "@/pages/Customer/layout";

export default function CustomerProfile() {
  const name = typeof window === "undefined" ? "Customer" : localStorage.getItem("customerName") || "Customer";
  const mobile = typeof window === "undefined" ? "" : localStorage.getItem("customerMobile") || "";
  return <CustomerLayout><section className="customerPage profilePage"><p className="customerEyebrow">MY ACCOUNT</p><h1>Welcome, {name}</h1><div className="profileCard"><div className="profileAvatar">{name.slice(0, 1).toUpperCase()}</div><div><strong>{name}</strong><p>{mobile || "Your mobile number is kept private"}</p></div></div><div className="profileLinks"><Link href="/Customer/Orders"><span>My Orders</span><span>›</span></Link><Link href="/Customer/Address"><span>Saved Addresses</span><span>›</span></Link><Link href="/Customer/Wishlist"><span>Wishlist</span><span>›</span></Link></div></section></CustomerLayout>;
}
