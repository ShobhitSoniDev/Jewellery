"use client"; // IMPORTANT for app router

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { FaUserCircle, FaSignOutAlt,FaHome, FaGem, FaBoxes, FaBox, FaExchangeAlt, FaUsers   } from "react-icons/fa";
import Link from 'next/link';
import { LogoutUser } from "@/lib/services/AuthService";
import { getMenu } from "@/lib/services/MasterService";

// useEffect(() => {
//   fetch("/api/menu")
//     .then(res => res.json())
//     .then(data => setMenuItems(data));
// }, []);
export default function DashboardLayout({ children }) {

  const iconMap = {
  FaHome: FaHome,
  FaGem: FaGem,
  FaBoxes: FaBoxes,
  FaBox: FaBox,
  FaExchangeAlt: FaExchangeAlt
};
  const [menuOpen, setMenuOpen] = useState(true);

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
 const [menuItems, setMenuItems] = useState([]);
  // outside click close
  useEffect(() => {
    loadMenuItems();
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);
const handleLogout = async () => {
  try {
    debugger;
      const payload = {
    UserId: sessionStorage.getItem("username") || "" // Assuming you have the username stored in session storage  
  };
    const response = await LogoutUser(payload);

    if (response.code === 1) {
      alert(response.message || "Logout successful");

      // ✅ token remove
      sessionStorage.clear();

      // ✅ redirect
      router.push("/login");
    }
  } catch (error) {
    console.error("Logout Error:", error);

    // API fail ho tab bhi logout kar dena chahiye
    sessionStorage.clear();
    router.push("/login");
  }
};
const loadMenuItems = async () => {
  try {
    const response = await getMenu();
    console.log("MENU RESPONSE => ", response);
    setMenuItems(response.data || []);
  } catch (error) {
    console.error("Error loading menu items:", error);
  }
};
// const menuItems = [
//   { id: 1, name: "Home", path: "/dashboard", icon: "🏠" },
//   { id: 2, name: "Add Metal", path: "/metalmaster", icon: "💎" },
//   { id: 3, name: "Add Category", path: "/categorymaster", icon: "📦" },
//   { id: 4, name: "Add Product", path: "/productmaster", icon: "📦" },
//   { id: 5, name: "Stock Transaction", path: "/stocktransaction", icon: "📦" },
//   { id: 6, name: "Customer Master", path: "/customer", icon: "�" }
// ];
  return (
    <div className={`dashboardLayout ${menuOpen ? "menu-open" : "menu-close"}`}>
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
                  <FaGem className="gem" />
                  <h5>Jewelry Stock</h5>
                </div>
        {/* <ul class="menu">
          <li className="menuItem">
           <Link href="/dashboard" className="menuLink">
           <span className="icon">🏠</span>
          <span>Home</span>
          </Link>
         </li>

         <li className="menuItem">
          <Link href="/metalmaster" className="menuLink">
          <span className="icon">💎</span>
          <span>Add Metal</span>
         </Link>
        </li>

         <li className="menuItem">
          <Link href="/categorymaster" className="menuLink">
          <span className="icon">📦</span>
          <span>Add Category</span>
         </Link>
        </li>

         <li className="menuItem">
          <Link href="/productmaster" className="menuLink">
          <span className="icon">📦</span>
          <span>Add Product</span>
         </Link>
        </li>
         <li className="menuItem">
          <Link href="/stocktransaction" className="menuLink">
          <span className="icon">📦</span>
          <span>Stock Transaction</span>
         </Link>
        </li>
        </ul> */}
<ul className="menu">
  {menuItems.map((menu, index) => {
    const IconComponent = iconMap[menu.Icon];

    return (
      <li key={menu.MenuId || index} className="menuItem">
        {menu.MenuUrl && (
          <Link href={menu.MenuUrl} className="menuLink">
            <span className="icon" style={{ marginRight: "8px" }}>
              {IconComponent ? <IconComponent /> : "📌"}
            </span>
            <span>{menu.MenuName}</span>
          </Link>
        )}
      </li>
    );
  })}
</ul>
      </aside>

      {/* MAIN CONTENT */}
      <div className="mainContent">

        {/* TOP BAR */}
        <header className="topbar">
          <button
            className="menuToggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

          <div className="profileMenu" ref={menuRef}>
      <span>Hi, Rohit</span>

      <div
        className="dots"
        onClick={() => setOpen(!open)}
      >
        ⋮
      </div>

      {open && (
       <div className="profileDropdown">
          <div className="menuItem profile" onClick={() => router.push("/profile")}><FaUserCircle />Profile</div>
          
          <div className="menuItem logout" onClick={handleLogout}><FaSignOutAlt />Logout</div>
        </div>
      )}
    </div>
        </header>

        <main className="pageContent">
          {children}
        </main>
      </div>
    </div>
  );
}
