import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaGem, FaLock, FaUser } from "react-icons/fa";
import { useRouter } from "next/router";
import { LoginUser } from "@/lib/services/AuthService";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
const [shopCode, setShopCode] = useState("");
const [isShopCodeFromUrl, setIsShopCodeFromUrl] = useState(false);
const handleLogin = async (event) => {
  event.preventDefault();
  setError("");

  if (!shopCode?.trim()) {
    setError("Shop Code is required");
    return;
  }

  if (!email?.trim()) {
    setError("Username is required");
    return;
  }

  if (!password?.trim()) {
    setError("Password is required");
    return;
  }

  const payload = {
    shopCode,
    username: email,
    password,
  };

  try {
    const response = await LoginUser(payload);

    if (response.code === 1) {
      sessionStorage.setItem("token", response.data.token);
      localStorage.setItem("userName", response.data.UserName);
      localStorage.setItem("shopCode", response.data.shopCode);
      localStorage.setItem("ShopName", response.data.ShopName);
      localStorage.setItem("TagLine", response.data.TagLine);

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
useEffect(() => {
  if (router.isReady) {
    const { SC } = router.query;

    if (SC) {
      setShopCode(SC);
      setIsShopCodeFromUrl(true);
    }
  }
}, [router.isReady, router.query]);
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
<div
  className="authInputGroup"
  style={{ display: isShopCodeFromUrl ? "none" : "" }}
>
  <FaGem />
  <input
    type="text"
    placeholder="Shop Code"
    value={shopCode}
    onChange={(e) => setShopCode(e.target.value)}
    disabled={isShopCodeFromUrl}
  />
</div>
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
