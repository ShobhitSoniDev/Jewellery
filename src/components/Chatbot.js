"use client";
import { FAQMaster_Manage } from "@/lib/services/AIService";
import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
// Design tokens — warm gold / deep emerald jewellery palette
// ============================================================
const COLORS = {
  ink: "#1C1410",        // near-black warm ink for text
  emerald: "#0E3B31",    // deep emerald — header / primary
  emeraldDark: "#082820",
  gold: "#C9A24B",       // muted antique gold accent
  goldBright: "#E4C878",
  cream: "#FBF7EE",      // warm paper background
  creamDeep: "#F2EAD8",
  line: "#E4D9BE",
  userBubble: "#0E3B31",
  botBubble: "#FFFFFF",
  danger: "#8C4A3B",
};

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Namaste 🙏 Main aapka Jewellery Assistant hoon. Stock, sale, purchase, udhaari ya girvi se related kuch bhi poochh sakte hain.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // ---------------- Drag state (chat window) ----------------
  const [pos, setPos] = useState(null); // null => use default bottom-right CSS
  const windowRef = useRef(null);

  // ---------------- Drag state (launcher icon) ----------------
  const [launcherPos, setLauncherPos] = useState(null); // null => default bottom-right
  const [launcherHidden, setLauncherHidden] = useState(false);
  const [launcherHover, setLauncherHover] = useState(false);
  const launcherRef = useRef(null);
  const justDraggedRef = useRef(false);

  const dragRef = useRef({ dragging: false, type: null, offsetX: 0, offsetY: 0, startX: 0, startY: 0, moved: false });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  const onDragStart = useCallback((e, type) => {
    const el = type === "launcher" ? launcherRef.current : windowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      dragging: true,
      type,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      startX: clientX,
      startY: clientY,
      moved: false,
    };
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dist = Math.hypot(clientX - dragRef.current.startX, clientY - dragRef.current.startY);
      if (dist > 4) dragRef.current.moved = true;

      const isLauncher = dragRef.current.type === "launcher";
      const el = isLauncher ? launcherRef.current : windowRef.current;
      const width = el?.offsetWidth || (isLauncher ? 62 : 340);
      const height = el?.offsetHeight || (isLauncher ? 62 : 480);

      let left = clientX - dragRef.current.offsetX;
      let top = clientY - dragRef.current.offsetY;

      // keep within viewport
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - height - 8));

      if (isLauncher) {
        setLauncherPos({ left, top });
      } else {
        setPos({ left, top });
      }
    };

    const onUp = () => {
      if (dragRef.current.dragging && dragRef.current.type === "launcher" && dragRef.current.moved) {
        // suppress the click that follows a real drag
        justDraggedRef.current = true;
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 0);
      }
      dragRef.current.dragging = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const openChat = () => {
    if (justDraggedRef.current) return; // ignore click right after a drag
    setOpen(true);
  };

  const hideLauncher = (e) => {
    e.stopPropagation();
    setLauncherHidden(true);
  };

  const launcherStyle = launcherPos
    ? { left: launcherPos.left, top: launcherPos.top, right: "auto", bottom: "auto" }
    : { bottom: "22px", right: "22px" };

  const clearChat = () => {
    setMessages([
      {
        role: "bot",
        text: "Chat clear ho gayi ✨ Bataiye, kis baare me madad chahiye?",
      },
    ]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const payload = {
        id: 0,
        question: "",
        answer: "",
        keywords: "",
        searchText: text,
        typeId: 5,
      };

      const res = await FAQMaster_Manage(payload);

      const botReply =
        res?.data?.[0]?.Answer || "Sorry, mujhe samajh nahi aaya. Thoda alag tarike se poochhe?";

      setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
    } catch (err) {
      console.error("Error loading FAQ list", err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Kuch gadbad ho gayi. Thodi der baad try kare." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const windowStyle = pos
    ? { left: pos.left, top: pos.top, right: "auto", bottom: "auto" }
    : {};

  return (
    <>
      <style>{`
        @keyframes cb-pop-in {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cb-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cb-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes cb-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(201,162,75,0.55); }
          100% { box-shadow: 0 0 0 14px rgba(201,162,75,0); }
        }
        .cb-launcher {
          animation: cb-pulse-ring 2.4s ease-out infinite;
        }
        .cb-launcher:hover {
          transform: translateY(-2px) scale(1.04);
        }
        .cb-msg-row { animation: cb-fade-in 0.25s ease-out; }
        .cb-dot { animation: cb-bounce 1.2s infinite ease-in-out; }
        .cb-dot:nth-child(2) { animation-delay: 0.15s; }
        .cb-dot:nth-child(3) { animation-delay: 0.3s; }
        .cb-scroll::-webkit-scrollbar { width: 6px; }
        .cb-scroll::-webkit-scrollbar-track { background: transparent; }
        .cb-scroll::-webkit-scrollbar-thumb {
          background: ${COLORS.line};
          border-radius: 10px;
        }
        .cb-icon-btn {
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .cb-icon-btn:hover {
          background: rgba(255,255,255,0.14);
          transform: translateY(-1px);
        }
        .cb-send-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .cb-send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(14,59,49,0.35);
        }
        .cb-send-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .cb-input:focus {
          outline: none;
          border-color: ${COLORS.gold} !important;
          box-shadow: 0 0 0 3px rgba(201,162,75,0.18);
        }
      `}</style>

      {/* Floating launcher button — draggable, removable via cross badge */}
      {!open && !launcherHidden && (
        <div
          ref={launcherRef}
          onMouseEnter={() => setLauncherHover(true)}
          onMouseLeave={() => setLauncherHover(false)}
          style={{
            position: "fixed",
            width: "62px",
            height: "62px",
            zIndex: 9999,
            ...launcherStyle,
          }}
        >
          {/* cross badge — appears on hover, removes the launcher */}
          <button
            onClick={hideLauncher}
            title="Icon hataye"
            aria-label="Chat icon hataye"
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: `1.5px solid ${COLORS.cream}`,
              background: COLORS.danger,
              color: COLORS.cream,
              fontSize: "11px",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: launcherHover ? 1 : 0,
              transform: launcherHover ? "scale(1)" : "scale(0.7)",
              transition: "opacity 0.15s ease, transform 0.15s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              zIndex: 2,
            }}
          >
            ✕
          </button>

          <button
            className="cb-launcher"
            onMouseDown={(e) => onDragStart(e, "launcher")}
            onTouchStart={(e) => onDragStart(e, "launcher")}
            onClick={openChat}
            aria-label="Jewellery Assistant kholein — drag karke move bhi kar sakte hain"
            title="Kholne ke liye click kare, move karne ke liye drag kare"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: "none",
              cursor: "grab",
              background: `linear-gradient(145deg, ${COLORS.emerald}, ${COLORS.emeraldDark})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 8px 22px rgba(8,40,32,0.35)",
              transition: "transform 0.2s ease",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L14.5 8.5L21 9.5L16.2 14L17.5 20.5L12 17.3L6.5 20.5L7.8 14L3 9.5L9.5 8.5L12 2Z"
                fill={COLORS.gold}
              />
            </svg>
          </button>
        </div>
      )}

      {/* Tiny restore chip — shown after the launcher icon was removed */}
      {!open && launcherHidden && (
        <button
          onClick={() => setLauncherHidden(false)}
          title="Assistant wapas dikhaye"
          aria-label="Jewellery Assistant wapas dikhaye"
          style={{
            position: "fixed",
            bottom: "18px",
            right: "18px",
            padding: "6px 12px",
            borderRadius: "999px",
            border: `1px solid ${COLORS.gold}`,
            background: COLORS.cream,
            color: COLORS.emeraldDark,
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.2px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(28,20,16,0.18)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "13px" }}>💬</span> Assistant
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          ref={windowRef}
          style={{
            position: "fixed",
            bottom: pos ? "auto" : "22px",
            right: pos ? "auto" : "22px",
            width: "340px",
            maxWidth: "92vw",
            height: "500px",
            maxHeight: "82vh",
            background: COLORS.cream,
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(28,20,16,0.28)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${COLORS.line}`,
            zIndex: 9999,
            animation: "cb-pop-in 0.22s ease-out",
            ...windowStyle,
          }}
        >
          {/* Header — draggable handle */}
          <div
            onMouseDown={(e) => onDragStart(e, "window")}
            onTouchStart={(e) => onDragStart(e, "window")}
            style={{
              background: `linear-gradient(120deg, ${COLORS.emerald}, ${COLORS.emeraldDark})`,
              color: COLORS.cream,
              padding: "13px 10px 13px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "grab",
              flexShrink: 0,
            }}
            title="Drag karke move kare"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "rgba(228,200,120,0.18)",
                  border: `1.5px solid ${COLORS.gold}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L14.5 8.5L21 9.5L16.2 14L17.5 20.5L12 17.3L6.5 20.5L7.8 14L3 9.5L9.5 8.5L12 2Z"
                    fill={COLORS.gold}
                  />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "15px",
                    fontWeight: 600,
                    letterSpacing: "0.2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Jewellery Assistant
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: COLORS.goldBright,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#4ADE80",
                      display: "inline-block",
                    }}
                  />
                  Online
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
              <button
                className="cb-icon-btn"
                onClick={clearChat}
                title="Chat clear kare"
                aria-label="Chat clear kare"
                style={{
                  width: "30px",
                  height: "30px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "8px",
                  color: COLORS.cream,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                </svg>
              </button>
              <button
                className="cb-icon-btn"
                onClick={() => setOpen(false)}
                title="Band kare"
                aria-label="Chat band kare"
                style={{
                  width: "30px",
                  height: "30px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "8px",
                  color: COLORS.cream,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="cb-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              background: COLORS.cream,
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(201,162,75,0.10) 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className="cb-msg-row"
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "9px 13px",
                    borderRadius:
                      msg.role === "user"
                        ? "14px 14px 3px 14px"
                        : "14px 14px 14px 3px",
                    background: msg.role === "user" ? COLORS.userBubble : COLORS.botBubble,
                    color: msg.role === "user" ? COLORS.cream : COLORS.ink,
                    fontSize: "13.5px",
                    lineHeight: 1.45,
                    boxShadow:
                      msg.role === "user"
                        ? "0 3px 10px rgba(14,59,49,0.25)"
                        : "0 2px 8px rgba(28,20,16,0.08)",
                    border: msg.role === "bot" ? `1px solid ${COLORS.line}` : "none",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="cb-msg-row" style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "11px 15px",
                    borderRadius: "14px 14px 14px 3px",
                    background: COLORS.botBubble,
                    border: `1px solid ${COLORS.line}`,
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  <span className="cb-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.gold, display: "inline-block" }} />
                  <span className="cb-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.gold, display: "inline-block" }} />
                  <span className="cb-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.gold, display: "inline-block" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "10px",
              borderTop: `1px solid ${COLORS.line}`,
              background: COLORS.creamDeep,
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              className="cb-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Apna sawaal type kare..."
              style={{
                flex: 1,
                border: `1.5px solid ${COLORS.line}`,
                borderRadius: "10px",
                padding: "9px 12px",
                fontSize: "13.5px",
                background: "#fff",
                color: COLORS.ink,
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
            />
            <button
              className="cb-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              aria-label="Message bheje"
              style={{
                width: "40px",
                height: "40px",
                flexShrink: 0,
                border: "none",
                borderRadius: "10px",
                background:
                  !input.trim() || isTyping
                    ? COLORS.line
                    : `linear-gradient(145deg, ${COLORS.gold}, #B58F3C)`,
                color: !input.trim() || isTyping ? "#9C9182" : COLORS.emeraldDark,
                cursor: !input.trim() || isTyping ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M3 11L21 3L13 21L11 13L3 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
