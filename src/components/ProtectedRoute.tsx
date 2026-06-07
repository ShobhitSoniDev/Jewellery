"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ProtectedRoute({ children }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const storedMenus = localStorage.getItem("allowedMenus");

    if (!storedMenus) {
      router.push("/login");
      return;
    }

    const menus = JSON.parse(storedMenus);

    const isAllowed = menus.some(
      (menu: any) => menu.MenuUrl === pathname
    );

    if (!isAllowed) {
      setAuthorized(false);
    } else {
      setAuthorized(true);
    }
  }, [pathname]);

  if (authorized === null) return null;

  if (!authorized) {
  return (
    <div
      style={{
        height: "50vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f4f6f9",
      }}
    >
      <div
        style={{
          textAlign: "center",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          maxWidth: "400px",
        }}
      >
        <div style={{ fontSize: "60px", marginBottom: "10px" }}>🚫</div>

        <h2 style={{ marginBottom: "10px", color: "#e53935" }}>
          Access Denied
        </h2>

        <p style={{ color: "#555", marginBottom: "20px" }}>
          You are not authorized to access this page.
        </p>

        <button
          onClick={() => window.history.back()}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

  return children;
}