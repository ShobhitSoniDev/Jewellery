/* eslint-disable react-hooks/set-state-in-effect -- this layout hydrates auth and cached customer data from browser storage. */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  FaGem,
  FaHeart,
  FaShoppingBag,
  FaUserCircle,
  FaSearch,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaBell,
  FaChevronDown,
} from "react-icons/fa";
import { CustomerLogoutUser } from "@/lib/services/AuthService";
import { getMenu } from "@/lib/services/MasterService";
import {
  Customer_Cart_Manage,
  Customer_Wishlist_Manage,
} from "@/lib/services/CustomerService";

/**
 * ─────────────────────────────────────────────────────────────────
 * API CALLS expected (same contract as before):
 *
 * // @/lib/services/MasterService
 * export const getMenu = async () => {
 *   const response = await api.get("/customer/menu");
 *   return response.data; // { code: 1, data: [{ MenuId, MenuName, MenuUrl, Icon }] }
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
  { MenuId: 1, MenuName: "Home", MenuUrl: "/Customer/OnlineProductDetails" },
  { MenuId: 2, MenuName: "Shop", MenuUrl: "/Customer/OnlineProductDetails" },
  { MenuId: 3, MenuName: "My Orders", MenuUrl: "/Customer/Orders" },
  { MenuId: 4, MenuName: "Addresses", MenuUrl: "/Customer/Address" },
];


export default function CustomerLayout({ children }) {

  const router = useRouter();
  const accountRef = useRef(null);

  // null = still checking, false = not logged in (redirecting), true = good to render
  const [isAuthorized, setIsAuthorized] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopLogo, setShopLogo] = useState("");
  const [menuItems, setMenuItems] = useState(DEFAULT_NAV_ITEMS);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [searchText, setSearchText] = useState("");


  // ── Guard: only a logged-in customer can render this layout ──
  useEffect(() => {

    const token =
      sessionStorage.getItem("token") ||
      localStorage.getItem("token");

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


  async function loadMenuItems() {

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
  }


  // ── Cart / Wishlist counts for header badges ──
  async function loadCartAndWishlistCount() {



    try {

      const cartRes = await Customer_Cart_Manage({
        TypeId: 2,
      });

      if (Number(cartRes?.code ?? cartRes?.Code) === 1 && Array.isArray(cartRes?.data ?? cartRes?.Data)) {

        setCartCount((cartRes.data ?? cartRes.Data).length);
      }

    } catch (error) {

      console.error("Cart count load error:", error);
    }

    try {

      const wishlistRes = await Customer_Wishlist_Manage({
        TypeId: 2,
      });

      if (Number(wishlistRes?.code ?? wishlistRes?.Code) === 1 && Array.isArray(wishlistRes?.data ?? wishlistRes?.Data)) {

        setWishlistCount((wishlistRes.data ?? wishlistRes.Data).length);
      }

    } catch (error) {

      console.error("Wishlist count load error:", error);
    }
  }

  // ── Once authorized, show cached values instantly, then refresh ──
  useEffect(() => {
    if (!isAuthorized) return;

    setCustomerName(localStorage.getItem("customerName") || "");
    setShopName(localStorage.getItem("ShopName") || "");
    setShopLogo(localStorage.getItem("ShopLogo") || "");
    loadMenuItems();
    loadCartAndWishlistCount();
  }, [isAuthorized]);


  // ── Close account dropdown on outside click ──
  useEffect(() => {

    const handleClickOutside = (e) => {

      if (accountRef.current && !accountRef.current.contains(e.target)) {

        setIsAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);

  }, []);


  const initials = (customerName || "Customer")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();


  const closeMobileMenu = () => {

    setIsMobileNavOpen(false);
  };


  const handleSearch = () => {

    if (!searchText.trim()) return;

    router.push(`/Customer/OnlineProductDetails?search=${encodeURIComponent(searchText.trim())}`);

    setSearchText("");
    closeMobileMenu();
  };


  const handleLogout = async () => {

    try {

      const payload = {
        CustomerId: localStorage.getItem("customerId") || "",
      };

      const shopCode = localStorage.getItem("shopCode");

      await CustomerLogoutUser(payload);
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      localStorage.removeItem("customerId");
      localStorage.removeItem("customerName");
      localStorage.removeItem("customerAllowedMenus");
      router.replace(shopCode && shopCode !== "undefined" && shopCode !== "null"
        ? `/Customer/login?SC=${encodeURIComponent(shopCode)}` : "/Customer/login");

    } catch (error) {

      sessionStorage.removeItem("token");
      router.replace("/Customer/login");
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
    <div className="custShell">

      {/* ==============================================================
          TOP HEADER
      =============================================================== */}

      <header className="custHeader">

        <div className="custHeaderInner">

          {/* Mobile Hamburger */}

          <button
            className="custHeaderMenuBtn"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <FaBars />
          </button>


          {/* Logo */}

          <Link href="/Customer/OnlineProductDetails" className="custHeaderLogo">

            {shopLogo ? (
              <span
                className="custHeaderLogoImg"
                style={{ backgroundImage: `url(${shopLogo})` }}
              />
            ) : (
              <span className="custHeaderLogoMark">
                <FaGem />
              </span>
            )}

            <div>
              <strong>{shopName || "Jewellery Stock"}</strong>
              <span>Fine Jewellery</span>
            </div>

          </Link>


          {/* Desktop Nav Links */}

          <nav className="custHeaderNav">

            {menuItems.map((menu, index) => {

              const isActive =
                router.pathname.toLowerCase() ===
                (menu.MenuUrl || "").toLowerCase();

              return (
                <Link
                  key={menu.MenuId || index}
                  href={menu.MenuUrl}
                  className={`custHeaderNavLink ${isActive ? "isActive" : ""}`}
                >
                  {menu.MenuName}
                </Link>
              );
            })}

          </nav>


          {/* Search (Desktop) */}

          <div className="custHeaderSearch">

            <FaSearch />

            <input
              type="text"
              placeholder="Search jewellery..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />

          </div>


          {/* Right Icons */}

          <div className="custHeaderActions">

            <button
              className="custHeaderNotifyBtn"
              aria-label="Notifications"
            >
              <FaBell />
            </button>

            <Link href="/Customer/Wishlist" className="custHeaderIconBtn" aria-label="Wishlist">

              <FaHeart />

              {wishlistCount > 0 && (
                <span className="custHeaderBadge">{wishlistCount}</span>
              )}

            </Link>

            <Link href="/Customer/Cart" className="custHeaderIconBtn" aria-label="Cart">

              <FaShoppingBag />

              {cartCount > 0 && (
                <span className="custHeaderBadge">{cartCount}</span>
              )}

            </Link>


            {/* Account Dropdown */}

            <div className="custHeaderAccount" ref={accountRef}>

              <button
                className="custHeaderAvatarBtn"
                onClick={() => setIsAccountOpen((prev) => !prev)}
              >

                <span className="custHeaderAvatar">{initials}</span>

                <FaChevronDown
                  className={`custHeaderAvatarCaret ${
                    isAccountOpen ? "isOpen" : ""
                  }`}
                />

              </button>


              {isAccountOpen && (

                <div className="custAccountDropdown">

                  <div className="custAccountDropdownHeader">

                    <span className="custAccountDropdownAvatar">
                      {initials}
                    </span>

                    <div>
                      <strong>{customerName || "Customer"}</strong>
                      <span>Welcome back 👋</span>
                    </div>

                  </div>


                  <div className="custAccountDropdownList">

                    <Link
                      href="/Customer/Profile"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <FaUserCircle /> My Profile
                    </Link>

                    <Link
                      href="/Customer/Orders"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <FaBoxOpen /> My Orders
                    </Link>

                    <Link
                      href="/Customer/Address"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <FaMapMarkerAlt /> My Addresses
                    </Link>

                    <Link
                      href="/Customer/Wishlist"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <FaHeart /> My Wishlist
                    </Link>

                    <Link
                      href="/Customer/Cart"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <FaShoppingBag /> My Cart
                    </Link>

                  </div>


                  <button
                    className="custAccountDropdownLogout"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt /> Logout
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      </header>


      {/* ==============================================================
          MOBILE SLIDE-IN DRAWER
      =============================================================== */}

      {isMobileNavOpen && (
        <div
          className="custMobileOverlay"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <aside className={`custMobileDrawer ${isMobileNavOpen ? "isOpen" : ""}`}>

        <div className="custMobileDrawerTop">

          <div className="custMobileDrawerProfile">

            <span className="custMobileDrawerAvatar">{initials}</span>

            <div>
              <strong>{customerName || "Customer"}</strong>
              <span>{shopName || "Jewellery Stock"}</span>
            </div>

          </div>

          <button
            className="custMobileDrawerClose"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>

        </div>


        {/* Search (Mobile) */}

        <div className="custMobileDrawerSearch">

          <FaSearch />

          <input
            type="text"
            placeholder="Search jewellery..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />

        </div>


        {/* Quick Actions */}

        <div className="custMobileDrawerQuickActions">

          <Link href="/Customer/Wishlist" onClick={closeMobileMenu}>

            <FaHeart />
            <span>Wishlist</span>

            {wishlistCount > 0 && (
              <span className="custMobileDrawerBadge">{wishlistCount}</span>
            )}

          </Link>

          <Link href="/Customer/Cart" onClick={closeMobileMenu}>

            <FaShoppingBag />
            <span>Cart</span>

            {cartCount > 0 && (
              <span className="custMobileDrawerBadge">{cartCount}</span>
            )}

          </Link>

        </div>


        {/* Nav Links */}

        <nav className="custMobileDrawerNav">

          {menuItems.map((menu, index) => {

            const isActive =
              router.pathname.toLowerCase() ===
              (menu.MenuUrl || "").toLowerCase();

            return (
              <Link
                key={menu.MenuId || index}
                href={menu.MenuUrl}
                className={`custMobileDrawerLink ${isActive ? "isActive" : ""}`}
                onClick={closeMobileMenu}
              >
                {menu.MenuName}
              </Link>
            );
          })}

          <div className="custMobileDrawerDivider" />

          <Link
            href="/Customer/Profile"
            className="custMobileDrawerLink"
            onClick={closeMobileMenu}
          >
            <FaUserCircle /> My Profile
          </Link>

          <Link
            href="/Customer/Orders"
            className="custMobileDrawerLink"
            onClick={closeMobileMenu}
          >
            <FaBoxOpen /> My Orders
          </Link>

          <Link
            href="/Customer/Address"
            className="custMobileDrawerLink"
            onClick={closeMobileMenu}
          >
            <FaMapMarkerAlt /> My Addresses
          </Link>

        </nav>


        <button className="custMobileDrawerLogout" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </aside>


      {/* ==============================================================
          MAIN CONTENT
      =============================================================== */}

      <main className="custPanelContent">{children}</main>

    </div>
  );
}
