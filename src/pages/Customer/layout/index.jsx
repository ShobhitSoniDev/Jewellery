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
  { MenuId: 2, MenuName: "Shop", MenuUrl: "/OnlineProductList" },
  { MenuId: 3, MenuName: "My Orders", MenuUrl: "/Customer/orders" },
  { MenuId: 4, MenuName: "Support", MenuUrl: "/Customer/support" },
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


  // ── Once authorized, show cached values instantly, then refresh ──
  useEffect(() => {

    if (!isAuthorized) return;

    setCustomerName(localStorage.getItem("customerName") || "");
    setShopName(localStorage.getItem("ShopName") || "");
    setShopLogo(localStorage.getItem("ShopLogo") || "");

    loadMenuItems();
    loadCartAndWishlistCount();

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


  // ── Cart / Wishlist counts for header badges ──
  const loadCartAndWishlistCount = async () => {



    try {

      const cartRes = await Customer_Cart_Manage({
        TypeId: 2,
      });

      if (cartRes?.Code === 1 && Array.isArray(cartRes?.Data)) {

        setCartCount(cartRes.Data.length);
      }

    } catch (error) {

      console.error("Cart count load error:", error);
    }

    try {

      const wishlistRes = await Customer_Wishlist_Manage({
        TypeId: 2,
      });

      if (wishlistRes?.Code === 1 && Array.isArray(wishlistRes?.Data)) {

        setWishlistCount(wishlistRes.Data.length);
      }

    } catch (error) {

      console.error("Wishlist count load error:", error);
    }
  };


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

    router.push(`Customer/OnlineProductList?search=${encodeURIComponent(searchText.trim())}`);

    setSearchText("");
    closeMobileMenu();
  };


  const handleLogout = async () => {

    try {

      const payload = {
        CustomerId: localStorage.getItem("customerId") || "",
      };

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

            <Link href="Wishlist" className="custHeaderIconBtn" aria-label="Wishlist">

              <FaHeart />

              {wishlistCount > 0 && (
                <span className="custHeaderBadge">{wishlistCount}</span>
              )}

            </Link>

            <Link href="Cart" className="custHeaderIconBtn" aria-label="Cart">

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
                      href="/Customer/profile"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <FaUserCircle /> My Profile
                    </Link>

                    <Link
                      href="/Customer/orders"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <FaBoxOpen /> My Orders
                    </Link>

                    <Link
                      href="/Customer/addresses"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <FaMapMarkerAlt /> My Addresses
                    </Link>

                    <Link
                      href="Wishlist"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <FaHeart /> My Wishlist
                    </Link>

                    <Link
                      href="Cart"
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

          <Link href="Wishlist" onClick={closeMobileMenu}>

            <FaHeart />
            <span>Wishlist</span>

            {wishlistCount > 0 && (
              <span className="custMobileDrawerBadge">{wishlistCount}</span>
            )}

          </Link>

          <Link href="Cart" onClick={closeMobileMenu}>

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
            href="/Customer/profile"
            className="custMobileDrawerLink"
            onClick={closeMobileMenu}
          >
            <FaUserCircle /> My Profile
          </Link>

          <Link
            href="/Customer/orders"
            className="custMobileDrawerLink"
            onClick={closeMobileMenu}
          >
            <FaBoxOpen /> My Orders
          </Link>

          <Link
            href="/Customer/addresses"
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