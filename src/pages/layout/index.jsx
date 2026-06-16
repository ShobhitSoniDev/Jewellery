"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  FaBars,
  FaBox,
  FaBoxes,
  FaExchangeAlt,
  FaGem,
  FaHome,
  FaMicrophone,
  FaMicrophoneSlash,
  FaSearch,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { LogoutUser } from "@/lib/services/AuthService";
import { getMenu } from "@/lib/services/MasterService";
import Chatbot from "@/components/Chatbot";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const iconMap = {
    FaHome,
    FaGem,
    FaBoxes,
    FaBox,
    FaExchangeAlt,
  };

  const [userName, setUserName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const loadMenuItems = async () => {
    try {
      const response = await getMenu();
      const data = response?.data || [];
      localStorage.setItem("allowedMenus", JSON.stringify(data));
      setMenuItems(data);
    } catch (error) {
      console.error("Error loading menu items:", error);
    }
  };

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setUserName(name);

    loadMenuItems();

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setMenuOpen(window.innerWidth > 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
  }, [menuItems]);

  const handleLogout = async () => {
    try {
      const payload = {
        UserId: sessionStorage.getItem("username") || "",
      };

      const response = await LogoutUser(payload);

      if (response?.code === 1) {
        sessionStorage.clear();
        router.push("/login");
      }
    } catch (error) {
      sessionStorage.clear();
      router.push("/login");
    }
  };

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

  const handleInputChange = (value) => {
    setSearchText(value);
    setSuggestions(getSuggestions(value));
    setShowSuggestions(true);
    setActiveIndex(-1);
  };

  const handleSuggestionClick = (item) => {
    router.push(item.MenuUrl);
    setSearchText("");
    setShowSuggestions(false);
    if (window.innerWidth <= 1024) setMenuOpen(false);
  };

  const highlightText = (text, query) => {
    if (!query) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="search-highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleAICommand = async (text) => {
    if (!text?.trim()) return;

    try {
      const res = await fetch("/api/ai-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: text }),
      });

      const data = await res.json();

      if (!data || data.error) {
        alert("AI failed");
        return;
      }

      if (data.page === "metal") router.push("/metalmaster");
      if (data.page === "category") router.push("/categorymaster");
      if (data.page === "product") router.push("/productmaster");

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("ai-form-fill", { detail: data }));
      }, 500);
    } catch (err) {
      console.error("AI Error:", err);
    }
  };

  const handleSearch = async (inputText) => {
    const text = (inputText ?? searchText ?? "").toLowerCase().trim();
    if (!text) return;

    const isAICommand =
      text.startsWith("add") ||
      text.startsWith("create") ||
      text.startsWith("insert");

    if (isAICommand) {
      await handleAICommand(text);
      setSearchText("");
      setShowSuggestions(false);
      return;
    }

    const exact = menuItems.find((m) => (m.MenuName || "").toLowerCase() === text);

    if (exact) {
      router.push(exact.MenuUrl);
      setSearchText("");
      setShowSuggestions(false);
      return;
    }

    const result = getSuggestions(text);

    if (result.length > 0) {
      router.push(result[0].MenuUrl);
    } else {
      alert("No matching page found");
    }

    setSearchText("");
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (activeIndex >= 0) {
        handleSuggestionClick(suggestions[activeIndex]);
      } else {
        handleSearch();
      }
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Voice not supported");
      return;
    }

    recognitionRef.current.start();
  };

  const closeMobileMenu = () => {
    if (window.innerWidth <= 1024) setMenuOpen(false);
  };

  return (
    <div className={`dashboardLayout ${menuOpen ? "menu-open" : "menu-close"}`}>
      {menuOpen && <button className="layoutOverlay" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <aside className="sidebar">
        <div className="sidebarTop">
          <Link href="/dashboard" className="logo" onClick={closeMobileMenu}>
            <span className="logoMark">
              <FaGem />
            </span>
            <span>
              <strong>Jewelry Stock</strong>
              <small>Inventory & Girvi</small>
            </span>
          </Link>

          <button className="sidebarClose" onClick={() => setMenuOpen(false)} aria-label="Close sidebar">
            <FaTimes />
          </button>
        </div>

        <ul className="menu">
          {menuItems.map((menu, index) => {
            const IconComponent = iconMap[menu.Icon];
            const isActive = router.pathname.toLowerCase() === (menu.MenuUrl || "").toLowerCase();

            return (
              <li key={menu.MenuId || index}>
                <Link
                  href={menu.MenuUrl}
                  className={`menuLink ${isActive ? "active" : ""}`}
                  onClick={closeMobileMenu}
                >
                  <span className="menuIcon">{IconComponent ? <IconComponent /> : <FaGem />}</span>
                  <span>{menu.MenuName}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="mainContent">
        <header className="topbar">
          <div className="topbarLeft">
            <button className="menuToggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              <FaBars />
            </button>

            <div className="searchShell">
              <FaSearch className="searchIcon" />
              <input
                type="text"
                value={searchText}
                placeholder="Search menu or type AI command..."
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => searchText && setShowSuggestions(true)}
                className="search-input"
              />

              <button className="aiButton" onClick={() => handleAICommand(searchText)} type="button">
                AI
              </button>

              <button
                className={`voiceButton ${isListening ? "listening" : ""}`}
                onClick={startListening}
                type="button"
                aria-label="Voice search"
              >
                {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestionsDropdown">
                  {suggestions.map((item, index) => (
                    <button
                      key={`${item.MenuName}-${index}`}
                      className={`suggestionItem ${index === activeIndex ? "active" : ""}`}
                      onClick={() => handleSuggestionClick(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      type="button"
                    >
                      {highlightText(item.MenuName, searchText)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div ref={menuRef} className="profileWrap">
            <button className="profile-box" onClick={() => setOpen(!open)} type="button">
              <FaUserCircle className="profile-icon" />
              <span className="profile-name">Hi, {userName || "User"}</span>
            </button>

            {open && (
              <div className="profileDropdown">
                <button onClick={() => router.push("/profile")} type="button">
                  <FaUserCircle />
                  Profile
                </button>
                <button onClick={handleLogout} className="logoutAction" type="button">
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="pageContent">{children}</main>

        <Chatbot />
      </div>
    </div>
  );
}
