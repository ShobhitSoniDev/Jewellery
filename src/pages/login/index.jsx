import Link from "next/link";
import React, { useState } from "react";
import { FaGem, FaLock, FaUser } from "react-icons/fa";
import { useRouter } from "next/router";
import { LoginUser } from "@/lib/services/AuthService";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      username: email,
      password,
    };

    try {
      const response = await LoginUser(payload);

      if (response.code === 1) {
        sessionStorage.setItem("token", response.data.token);
        localStorage.setItem("userName", response.data.UserName);
        router.push("/dashboard");
      } else {
        setError(response.message || "Login failed");
      }

      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Login Error:", error);
      setError(error.message || "Something went wrong");
    }
  };

  return (
    <div className="authPage">
      <section className="authHero" aria-label="Jewellery Stock">
        <div className="authHeroContent">
          <span className="authHeroIcon">
            <FaGem />
          </span>
          <h1>Jewellery Stock</h1>
          <p>Inventory, girvi, stock movement aur customer records ko ek clean dashboard se manage karein.</p>
        </div>
      </section>

      <main className="authCard">
        <div className="authLogo">
          <FaGem className="authGem" />
          <h2>Jewellery Stock</h2>
        </div>

        <div className="authTitle">
          <h3>Welcome Back</h3>
          <p>Apne account me login karein</p>
        </div>

        <form onSubmit={handleLogin} className="authForm">
          <div className="authInputGroup">
            <FaUser />
            <input
              type="text"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="authInputGroup">
            <FaLock />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="authForgot">
            <Link href="/forgot-password">Forgot Password?</Link>
          </div>

          <button className="authButton" type="submit">
            Login
          </button>

          {error && <p className="authError">{error}</p>}
        </form>

        <p className="authSwitchText">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="authLink">
            Sign Up
          </Link>
        </p>
      </main>
    </div>
  );
};

export default Login;
