import "@/styles/globals.css";
import "../styles/login.css";
import "../styles/signup.css";
import "../styles/dashboard.css";
import "../styles/layout.css";
import "../styles/metalmaster.css";
import "../styles/productmaster.css";
import "../styles/LoanTransaction.css";
import "../styles/Customer/login.css";
import "../styles/Customer/layout.css";
import "../styles/Customer/OnlineProductDetails.css";
import "../styles/Customer/Wishlist.css";
import "../styles/Customer/Address.css";
import "../styles/Customer/OnlineCheckoutDetails.css";
import "../styles/Customer/customer-pages.css";
import Layout from '@/pages/layout'
import LayoutCustomer from '@/pages/Customer/layout'
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // ❌ Layout Not Required Pages
  const noLayoutPages = ["/login", "/signup", "/Customer/login", "/Customer/dashboard", "/Customer/OnlineProductDetails", 
    "/Customer/OnlineProductFullDetail", "/Customer/Cart", "/Customer/Wishlist", "/Customer/Address", "/Customer/OnlineCheckoutDetails",
    "/Customer/Orders", "/Customer/OrderConfirmation", "/Customer/Profile"];

   // 🔐 App start hote hi login par redirect
  useEffect(() => {
    if (router.pathname === "/") {
      router.replace("/login");
    }
  }, [router]);

  // login & signup ke liye direct render
  if (noLayoutPages.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }

  // layout required pages
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
