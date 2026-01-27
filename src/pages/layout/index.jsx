"use client"; // IMPORTANT for app router

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { FaUserCircle, FaSignOutAlt,FaGem } from "react-icons/fa";
import Link from 'next/link';
export default function DashboardLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(true);

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // outside click close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className={`dashboardLayout ${menuOpen ? "menu-open" : "menu-close"}`}>
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
                  <FaGem className="gem" />
                  <h5>Jewelry Stock</h5>
                </div>
        <ul class="menu">
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
          
          <div className="menuItem logout" onClick={() => router.push("/login")}><FaSignOutAlt />Logout</div>
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
