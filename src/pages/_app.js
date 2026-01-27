import "@/styles/globals.css";
import "../styles/login.css";
import "../styles/signup.css";
import "../styles/dashboard.css";
import "../styles/layout.css";
import "../styles/metalmaster.css";
import "../styles/productmaster.css";
import Layout from '@/pages/layout'
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // ❌ Layout Not Required Pages
  const noLayoutPages = ["/login", "/signup"];

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
