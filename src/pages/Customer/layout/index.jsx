import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  FaGem,
  FaHome,
  FaBoxOpen,
  FaBox,
  FaBoxes,
  FaMoneyBillWave,
  FaWallet,
  FaFileInvoice,
  FaUserCircle,
  FaHeadset,
  FaSignOutAlt,
  FaBell,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { CustomerLogoutUser } from "@/lib/services/AuthService";
import { getMenu } from "@/lib/services/MasterService";

/**
 * ─────────────────────────────────────────────────────────────────
 * API CALLS expected in your service files (same contract as the
 * admin DashboardLayout uses for getMenu / ShopMaster_Manage):
 * ─────────────────────────────────────────────────────────────────
 *
 * // @/lib/services/MasterService
 * export const getMenu = async () => {
 *   const response = await api.get("/customer/menu");
 *   return response.data; // { code: 1, data: [{ MenuId, MenuName, MenuUrl, Icon }] }
 * };
 *
 * export const CustomerProfile_Get = async () => {
 *   const response = await api.get("/customer/profile");
 *   return response.data; // { code: 1, data: { CustomerName, ShopName, TagLine, ShopLogo } }
 * };
 *
 * // @/lib/services/AuthService
 * export const CustomerLogoutUser = async (payload) => {
 *   const response = await api.post("/customer/auth/logout", payload);
 *   return response.data; // { code: 1 }
 * };
 * ─────────────────────────────────────────────────────────────────
 */

// Fallback nav used only if the menu API returns nothing (or fails)
const DEFAULT_NAV_ITEMS = [
  { MenuId: 1, MenuName: "Dashboard", MenuUrl: "/Customer/dashboard", Icon: "FaHome" },
  { MenuId: 2, MenuName: "My Pledges", MenuUrl: "/Customer/pledges", Icon: "FaBoxOpen" },
  { MenuId: 3, MenuName: "Payments", MenuUrl: "/Customer/payments", Icon: "FaMoneyBillWave" },
  { MenuId: 4, MenuName: "Profile", MenuUrl: "/Customer/profile", Icon: "FaUserCircle" },
  { MenuId: 5, MenuName: "Support", MenuUrl: "/Customer/support", Icon: "FaHeadset" },
];

const iconMap = {
  FaHome,
  FaGem,
  FaBoxOpen,
  FaBox,
  FaBoxes,
  FaMoneyBillWave,
  FaWallet,
  FaFileInvoice,
  FaUserCircle,
  FaHeadset,
};

export default function CustomerLayout({ children }) {
  const router = useRouter();
  const menuRef = useRef(null);

  // null = still checking, false = not logged in (redirecting), true = good to render
  const [isAuthorized, setIsAuthorized] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopLogo, setShopLogo] = useState("");
  const [menuItems, setMenuItems] = useState(DEFAULT_NAV_ITEMS);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // ── Guard: only a logged-in customer can render this layout ──
  useEffect(() => {
    const token =
      sessionStorage.getItem("token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    console.log("[CustomerLayout] token found:", token); // TEMP DEBUG — remove once fixed

    if (!token) {
      const shopCode = localStorage.getItem("shopCode");
      router.replace(
        shopCode && shopCode !== "undefined" && shopCode !== "null"
          ? `/Customer/login?SC=${encodeURIComponent(shopCode)}`
          : "/Customer/login"
      );
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  // ── Once authorized, show cached values instantly, then refresh ──
  useEffect(() => {
    if (!isAuthorized) return;

    setCustomerName(localStorage.getItem("customerName") || "");
    setShopName(localStorage.getItem("ShopName") || "");
    setShopLogo(localStorage.getItem("ShopLogo") || "");

    loadMenuItems();
    //loadCustomerProfile();
  }, [isAuthorized]);

  const loadMenuItems = async () => {
    try {
      const response = await getMenu();
      const data = response?.data || [];

      if (data.length > 0) {
        localStorage.setItem("customerAllowedMenus", JSON.stringify(data));
        setMenuItems(data);
      }
    } catch (error) {
      console.error("Error loading customer menu items:", error);
    }
  };

//   const loadCustomerProfile = async () => {
//     try {
//       const response = await CustomerProfile_Get();
//       const profile = response?.data;

//       if (profile) {
//         setCustomerName(profile.CustomerName || "");
//         setShopName(profile.ShopName || "");
//         setShopLogo(profile.ShopLogo || "");

//         localStorage.setItem("customerName", profile.CustomerName || "");
//         localStorage.setItem("ShopName", profile.ShopName || "");
//         localStorage.setItem("ShopLogo", profile.ShopLogo || "");
//       }
//     } catch (error) {
//       console.error("Error loading customer profile:", error);
//     }
//   };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        // profile dropdown, if you wire one up later, closes here
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (customerName || "Customer")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const closeMobileMenu = () => {
    if (window.innerWidth <= 800) setIsMobileNavOpen(false);
  };

  const handleLogout = async () => {
    try {
      const payload = { CustomerId: localStorage.getItem("customerId") || "" };
      const shopCode = localStorage.getItem("shopCode");
      const response = await CustomerLogoutUser(payload);

      if (response?.code === 1) {
        sessionStorage.clear();
        router.push(
          shopCode && shopCode !== "undefined" && shopCode !== "null"
            ? `/Customer/login?SC=${encodeURIComponent(shopCode)}`
            : "/Customer/login"
        );
      }
    } catch (error) {
      sessionStorage.clear();
      router.push("/Customer/login");
    }
  };

  // ── Still checking the token, or redirecting: render nothing (no flash) ──
  if (!isAuthorized) {
    return (
      <div className="custAuthChecking">
        <span className="custAuthCheckingSpinner" />
      </div>
    );
  }

  return (
    <div className="custPanel">
      {/* ── Sidebar ── */}
      <aside className={`custSidebar ${isMobileNavOpen ? "isOpen" : ""}`}>
        <div className="custSidebarTop">
          {shopLogo ? (
            <span
              className="custSidebarLogoMark custSidebarLogoImg"
              style={{ backgroundImage: `url(${shopLogo})` }}
            />
          ) : (
            <span className="custSidebarLogoMark">
              <FaGem />
            </span>
          )}
          <div>
            <strong>{shopName || "Jewellery Stock"}</strong>
            <span>Customer Panel</span>
          </div>
          <button
            className="custSidebarClose"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="custSidebarNav">
          {menuItems.map((menu, index) => {
            const IconComponent = iconMap[menu.Icon] || FaGem;
            const isActive =
              router.pathname.toLowerCase() === (menu.MenuUrl || "").toLowerCase();

            return (
              <Link
                key={menu.MenuId || index}
                href={menu.MenuUrl}
                className={`custSidebarLink ${isActive ? "isActive" : ""}`}
                onClick={closeMobileMenu}
              >
                <IconComponent />
                <span>{menu.MenuName}</span>
              </Link>
            );
          })}
        </nav>

        <button className="custSidebarLogout" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      {isMobileNavOpen && (
        <div className="custSidebarOverlay" onClick={() => setIsMobileNavOpen(false)} />
      )}

      {/* ── Main column ── */}
      <div className="custPanelMain">
        <header className="custTopbar">
          <button
            className="custTopbarMenuBtn"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <FaBars />
          </button>

          <div className="custTopbarWelcome">
            <span>Namaste,</span>
            <strong>{customerName ? customerName.split(" ")[0] : "Customer"} 👋</strong>
          </div>

          <div className="custTopbarActions" ref={menuRef}>
            <button className="custTopbarBell" aria-label="Notifications">
              <FaBell />
              {notificationCount > 0 && (
                <span className="custTopbarBellDot">{notificationCount}</span>
              )}
            </button>
            <div className="custTopbarAvatar">{initials}</div>
          </div>
        </header>

        <main className="custPanelContent">{children}</main>
      </div>
    </div>
  );
}
