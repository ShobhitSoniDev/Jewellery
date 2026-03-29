"use client";
import { FAQMaster_Manage } from "@/lib/services/AIService";
import { useState } from "react";

const Chatbot = () => {

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi 👋 How can I help you?" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {

  if (!input.trim()) return;

  const userMessage = { role: "user", text: input };
  setMessages(prev => [...prev, userMessage]);

  try {
    debugger;

    const payload = {
      id: 0,
      question: "",
      answer: "",
      keywords: "",
      searchText: input, // ✅ user input pass karo
      typeId: 5
    };

    const res = await FAQMaster_Manage(payload);

    // ✅ extract answer properly
    debugger
    const botReply =
      res?.data[0]?.Answer || "Sorry, mujhe samajh nahi aaya.";

    setMessages(prev => [
      ...prev,
      { role: "bot", text: botReply }
    ]);

  } catch (err) {
    console.error("Error loading FAQ list", err);

    setMessages(prev => [
      ...prev,
      { role: "bot", text: "Something went wrong." }
    ]);
  }

  setInput("");
};

  return (
    <>
      {/* 💬 Floating Button */}
      {!open && (
        <div
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#1976d2",
            color: "#fff",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "24px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
          }}
        >
          💬
        </div>
      )}

      {/* 🧠 Chat Window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "300px",
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#1976d2",
              color: "#fff",
              padding: "10px",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <span>Jewellery Assistant</span>
            <span
              style={{ cursor: "pointer" }}
              onClick={() => setOpen(false)}
            >
              ✖
            </span>
          </div>

          {/* Messages */}
          <div style={{ height: "250px", overflowY: "auto", padding: "10px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", padding: "10px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1 }}
              placeholder="Type message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;