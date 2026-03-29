"use client";

// ---------------- IMPORTS ----------------
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaGem,
  FaBoxes,
  FaBox,
  FaExchangeAlt,
  FaHome
} from "react-icons/fa";
import Link from "next/link";
import { LogoutUser } from "@/lib/services/AuthService";
import { getMenu } from "@/lib/services/MasterService";
import Chatbot from "@/components/Chatbot";

export default function DashboardLayout({ children }) {

  // ---------------- ROUTER ----------------
  const router = useRouter();

  // ---------------- ICON MAPPING ----------------
  const iconMap = {
    FaHome,
    FaGem,
    FaBoxes,
    FaBox,
    FaExchangeAlt
  };

  // ---------------- STATE MANAGEMENT ----------------
  const [menuOpen, setMenuOpen] = useState(true); // sidebar toggle
  const [menuItems, setMenuItems] = useState([]); // menu list from API

  const [open, setOpen] = useState(false); // profile dropdown
  const menuRef = useRef(null);

  // ---------------- SEARCH STATES ----------------
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // ---------------- VOICE STATES ----------------
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // ---------------- LOAD MENU ----------------
  useEffect(() => {
    loadMenuItems();

    // close profile dropdown on outside click
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadMenuItems = async () => {
    try {
      const response = await getMenu();
      setMenuItems(response.data || []);
    } catch (error) {
      console.error("Error loading menu items:", error);
    }
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = async () => {
    try {
      const payload = {
        UserId: sessionStorage.getItem("username") || ""
      };

      const response = await LogoutUser(payload);

      if (response.code === 1) {
        sessionStorage.clear();
        router.push("/login");
      }
    } catch (error) {
      sessionStorage.clear();
      router.push("/login");
    }
  };

  // ---------------- GET SUGGESTIONS ----------------
  const getSuggestions = (input) => {
    if (!input) return [];

    const text = input.toLowerCase();

    return menuItems.filter((m) => {
      const name = (m.MenuName || "").toLowerCase();

      return (
        name.includes(text) ||
        text.includes(name) ||
        name.replace("add", "").includes(text) ||
        name.replace("master", "").includes(text)
      );
    });
  };

  // ---------------- HANDLE INPUT CHANGE ----------------
  const handleInputChange = (value) => {
    setSearchText(value);

    const result = getSuggestions(value);

    setSuggestions(result);
    setShowSuggestions(true);
    setActiveIndex(-1); // reset highlight
  };

  // ---------------- CLICK SUGGESTION ----------------
  const handleSuggestionClick = (item) => {
    router.push(item.MenuUrl);
    setSearchText("");
    setShowSuggestions(false);
  };

  // ---------------- HIGHLIGHT MATCH TEXT ----------------
  const highlightText = (text, query) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ fontWeight: "bold", color: "#1976d2" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // ---------------- SEARCH HANDLER ----------------
  const handleSearch = (inputText) => {
    const text = (inputText ?? searchText ?? "").toLowerCase().trim();

    if (!text) return;

    // exact match
    const exact = menuItems.find(
      (m) => m.MenuName.toLowerCase() === text
    );

    if (exact) {
      router.push(exact.MenuUrl);
      return;
    }

    // fallback suggestion
    const result = getSuggestions(text);

    if (result.length > 0) {
      router.push(result[0].MenuUrl);
    } else {
      alert("No matching page found");
    }

    setSearchText("");
    setShowSuggestions(false);
  };

  // ---------------- KEYBOARD NAVIGATION ----------------
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (activeIndex >= 0) {
        handleSuggestionClick(suggestions[activeIndex]);
      } else {
        handleSearch();
      }
    }
  };

  // ---------------- VOICE SETUP ----------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();

      recognition.lang = "en-IN";
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event) => {
        const voiceText = event.results[0][0].transcript;
        setSearchText(voiceText);
        handleSearch(voiceText);
      };

      recognitionRef.current = recognition;
    }
  }, [menuItems]);

  // ---------------- START VOICE ----------------
  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Voice not supported");
      return;
    }
    recognitionRef.current.start();
  };

  // ---------------- UI ----------------
  return (
    <div className={`dashboardLayout ${menuOpen ? "menu-open" : "menu-close"}`}>

      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="sidebar">
        <div className="logo">
          <FaGem />
          <h5>Jewelry Stock</h5>
        </div>

        <ul className="menu">
          {menuItems.map((menu, index) => {
            const IconComponent = iconMap[menu.Icon];

            return (
              <li key={menu.MenuId || index}>
                <Link href={menu.MenuUrl}>
                  {IconComponent ? <IconComponent /> : "📌"} {menu.MenuName}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ---------------- MAIN ---------------- */}
      <div className="mainContent">

        {/* ---------------- TOPBAR ---------------- */}
        <header className="topbar">

          <button onClick={() => setMenuOpen(!menuOpen)}>☰</button>

          {/* ---------------- SEARCH BAR ---------------- */}
          <div style={{ position: "relative", marginLeft: "20px", width: "260px" }}>

  {/* ---------------- SEARCH INPUT ---------------- */}
  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
    <input
      type="text"
      value={searchText}
      placeholder="Search or speak..."
      onChange={(e) => handleInputChange(e.target.value)}
      onKeyDown={handleKeyDown}
      style={{
        flex: 1,
        padding: "8px 12px",
        borderRadius: "12px",
        border: "1px solid #ccc",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        outline: "none",
        transition: "all 0.2s",
      }}
      onFocus={(e) => e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"}
      onBlur={(e) => e.target.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)"}
    />

    <button
      onClick={() => handleSearch()}
      style={{
        background: "#1976d2",
        color: "#fff",
        border: "none",
        borderRadius: "12px",
        padding: "6px 12px",
        cursor: "pointer",
        fontWeight: 500,
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => e.target.style.background = "#155a9c"}
      onMouseLeave={(e) => e.target.style.background = "#1976d2"}
    >
      Go
    </button>

    {/* ---------------- VOICE BUTTON ---------------- */}
    <button
      onClick={startListening}
      style={{
        background: isListening ? "#d32f2f" : "#1976d2",
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        padding: "8px",
        cursor: "pointer",
        fontSize: "16px",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => e.target.style.opacity = 0.85}
      onMouseLeave={(e) => e.target.style.opacity = 1}
    >
      {isListening ? "🎙️" : "🎤"}
    </button>
  </div>

  {/* ---------------- SUGGESTIONS DROPDOWN ---------------- */}
  {showSuggestions && suggestions.length > 0 && (
    <div
      style={{
        position: "absolute",
        top: "45px",
        width: "100%",
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #ddd",
        boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
        zIndex: 1000,
        overflow: "hidden",
        maxHeight: "300px",
        overflowY: "auto",
        transition: "all 0.2s"
      }}
    >
      {suggestions.map((item, index) => (
        <div
          key={index}
          onClick={() => handleSuggestionClick(item)}
          style={{
            padding: "10px 12px",
            cursor: "pointer",
            background: index === activeIndex ? "#1976d2" : "#fff",
            color: index === activeIndex ? "#fff" : "#333",
            transition: "all 0.2s",
          }}
          onMouseEnter={() => setActiveIndex(index)}
        >
          {highlightText(item.MenuName, searchText)}
        </div>
      ))}
    </div>
  )}
</div>

          {/* ---------------- PROFILE ---------------- */}
          <div ref={menuRef}>
            <span>Hi, Rohit</span>

            <div onClick={() => setOpen(!open)}>⋮</div>

            {open && (
              <div>
                <div onClick={() => router.push("/profile")}>
                  <FaUserCircle /> Profile
                </div>
                <div onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ---------------- PAGE CONTENT ---------------- */}
        <main>{children}</main>

        {/* ---------------- CHATBOT ---------------- */}
        <Chatbot />

      </div>
    </div>
  );
}