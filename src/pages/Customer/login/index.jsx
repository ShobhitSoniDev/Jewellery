import React, { useEffect, useState } from "react";
import {
  FaGem,
  FaMobileAlt,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { useRouter } from "next/router";
import {
  LoginCustomerUser,
  SignUpCustomer,
  CustomerSendOtp,
  CustomerResetPassword,
} from "@/lib/services/AuthService";

/**
 * ─────────────────────────────────────────────────────────────────
 * API CALLS — add these to "@/lib/services/AuthService" next to your
 * existing LoginUser function. All four power this single page:
 * login, signup and the two-step forgot-password flow.
 * ─────────────────────────────────────────────────────────────────
 *
 * export const CustomerLoginUser = async ({ shopCode, mobile, password }) => {
 *   const response = await api.post("/customer/auth/login", {
 *     shopCode,
 *     mobile,
 *     password,
 *   });
 *   return response.data;
 * };
 *
 * export const CustomerSignup = async ({ shopCode, name, mobile, password }) => {
 *   const response = await api.post("/customer/auth/signup", {
 *     shopCode,
 *     name,
 *     mobile,
 *     password,
 *   });
 *   return response.data;
 * };
 *
 * export const CustomerSendOtp = async ({ shopCode, mobile }) => {
 *   const response = await api.post("/customer/auth/send-otp", {
 *     shopCode,
 *     mobile,
 *   });
 *   return response.data;
 * };
 *
 * export const CustomerResetPassword = async ({ shopCode, mobile, otp, newPassword }) => {
 *   const response = await api.post("/customer/auth/reset-password", {
 *     shopCode,
 *     mobile,
 *     otp,
 *     newPassword,
 *   });
 *   return response.data;
 * };
 *
 * Expected success shape (mirrors your existing admin login contract):
 * {
 *   code: 1,
 *   message: "Login successful",
 *   data: {
 *     token: "...",
 *     CustomerName: "...",
 *     CustomerId: "...",
 *     shopCode: "...",
 *     ShopName: "...",
 *   }
 * }
 * ─────────────────────────────────────────────────────────────────
 */

const MODE = { LOGIN: "login", SIGNUP: "signup", FORGOT: "forgot" };
const FORGOT_STEP = { REQUEST: "request", RESET: "reset" };

const HERO_COPY = {
  [MODE.LOGIN]: {
    heading: (
      <>
        Aapka Gehna,
        <br />
        Aapka Hisaab
      </>
    ),
    text: "Apne pledged items, ledger entries aur due payments ek hi jagah dekhein — kabhi bhi, kahin bhi.",
  },
  [MODE.SIGNUP]: {
    heading: (
      <>
        Apna Khata
        <br />
        Khud Banayein
      </>
    ),
    text: "Register karke apne gehno ki har entry, har payment aur har reminder apne phone par paayein.",
  },
  [MODE.FORGOT]: {
    heading: (
      <>
        Password Bhool
        <br />
        Gaye Hain?
      </>
    ),
    text: "Koi baat nahi — apna registered mobile number verify karein aur naya password set karein.",
  },
};

const CustomerLogin = () => {
  const router = useRouter();

  const [mode, setMode] = useState(MODE.LOGIN);
  const [shopCode, setShopCode] = useState("");
  const [isShopCodeFromUrl, setIsShopCodeFromUrl] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Login state ──
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ── Signup state ──
  const [signupName, setSignupName] = useState("");
  const [signupMobile, setSignupMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // ── Forgot password state ──
  const [forgotStep, setForgotStep] = useState(FORGOT_STEP.REQUEST);
  const [forgotMobile, setForgotMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Prefill shop code from ?SC= link, and restore a remembered mobile number
  useEffect(() => {
    if (router.isReady) {
      const { SC } = router.query;
      if (SC) {
        setShopCode(SC);
        setIsShopCodeFromUrl(true);
      }
    }
    const savedMobile = localStorage.getItem("customerMobile");
    if (savedMobile) {
      setMobile(savedMobile);
      setRememberMe(true);
    }
  }, [router.isReady, router.query]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setForgotStep(FORGOT_STEP.REQUEST);
  };

  // ── Handlers ──────────────────────────────────────────────

  const handleLogin = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await LoginCustomerUser({ shopCode, mobile, password });
debugger
      if (Number(response?.code) === 1) {
        sessionStorage.setItem("token", response.data.token);
        localStorage.setItem("customerName", response.data.UserName || "");
        localStorage.setItem("customerId", response.data.UserId || "");
        localStorage.setItem("shopCode", response.data.shopCode || shopCode);
        localStorage.setItem("ShopName", response.data.ShopName || "");

        if (rememberMe) {
          localStorage.setItem("customerMobile", mobile);
        } else {
          localStorage.removeItem("customerMobile");
        }

        router.replace("/Customer/OnlineProductDetails");
        return;
      }

      setError(response?.message || "Login failed. Please check your details.");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    if (signupPassword !== signupConfirm) {
      setError("Password aur Confirm Password match nahi kar rahe.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await SignUpCustomer({
        shopCode,
        UserName: signupName,
        MobileNo: signupMobile,
        password: signupPassword,
        type:1
      });

      if (Number(response?.code) === 1) {
        setSuccess("Account ban gaya! Ab login karein.");
        setSignupName("");
        setSignupMobile("");
        setSignupPassword("");
        setSignupConfirm("");
        setTimeout(() => switchMode(MODE.LOGIN), 1200);
        return;
      }

      setError(response?.message || "Signup nahi ho paya. Dobara try karein.");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await CustomerSendOtp({ shopCode, mobile: forgotMobile });

      if (Number(response?.code) === 1) {
        setSuccess("OTP aapke mobile par bhej diya gaya hai.");
        setForgotStep(FORGOT_STEP.RESET);
        return;
      }

      setError(response?.message || "OTP bhejne me problem hui.");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    if (newPassword !== newPasswordConfirm) {
      setError("Naya Password match nahi kar raha.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await CustomerResetPassword({
        shopCode,
        mobile: forgotMobile,
        otp,
        newPassword,
      });

      if (Number(response?.code) === 1) {
        setSuccess("Password reset ho gaya! Ab naye password se login karein.");
        setOtp("");
        setNewPassword("");
        setNewPasswordConfirm("");
        setTimeout(() => switchMode(MODE.LOGIN), 1200);
        return;
      }

      setError(response?.message || "Password reset nahi ho paya.");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hero = HERO_COPY[mode];

  return (
    <div className="custAuthPage">
      {/* Signature panel — faceted gem motif */}
      <section className="custAuthHero" aria-label="Customer Portal">
        <FacetedGem />

        <div className="custAuthHeroContent">
          <span className="custAuthTrustPill">
            <FaShieldAlt /> Secure Customer Access
          </span>
          <h1>{hero.heading}</h1>
          <p>{hero.text}</p>

          {mode !== MODE.FORGOT && (
            <ul className="custAuthHeroList">
              <li>Girvi rakhe gehno ki live status</li>
              <li>Payment history aur due reminders</li>
              <li>Apna khata seedha apne phone par</li>
            </ul>
          )}
        </div>
      </section>

      {/* Card — login / signup / forgot, all in one */}
      <main className="custAuthCard">
        <div className="custAuthLogo">
          <span className="custAuthLogoMark">
            <FaGem />
          </span>
          <div>
            <h2>
              {mode === MODE.LOGIN && "Customer Login"}
              {mode === MODE.SIGNUP && "Create Account"}
              {mode === MODE.FORGOT && "Reset Password"}
            </h2>
            <p>
              {mode === MODE.LOGIN && "Apne account me login karke apna record dekhein"}
              {mode === MODE.SIGNUP && "Naya account banayein, kuch hi seconds me"}
              {mode === MODE.FORGOT && "Mobile verify karein aur naya password set karein"}
            </p>
          </div>
        </div>

        {mode !== MODE.FORGOT && (
          <div className="custAuthTabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === MODE.LOGIN}
              className={`custAuthTab ${mode === MODE.LOGIN ? "isActive" : ""}`}
              onClick={() => switchMode(MODE.LOGIN)}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === MODE.SIGNUP}
              className={`custAuthTab ${mode === MODE.SIGNUP ? "isActive" : ""}`}
              onClick={() => switchMode(MODE.SIGNUP)}
            >
              Sign Up
            </button>
          </div>
        )}

        {mode === MODE.FORGOT && (
          <button
            type="button"
            className="custAuthBack"
            onClick={() => switchMode(MODE.LOGIN)}
          >
            <FaArrowLeft /> Back to login
          </button>
        )}

        {/* Shop code — shared across all modes */}
        <div
          className="custAuthInputGroup"
          style={{ display: isShopCodeFromUrl ? "none" : "flex", marginBottom: 14 }}
        >
          <FaGem />
          <input
            type="text"
            placeholder="Shop Code"
            value={shopCode.toUpperCase()}
            onChange={(e) => setShopCode(e.target.value)}
            disabled={isShopCodeFromUrl}
          />
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === MODE.LOGIN && (
          <form onSubmit={handleLogin} className="custAuthForm">
            <div className="custAuthInputGroup">
              <FaMobileAlt />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="custAuthInputGroup">
              <FaLock />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="custAuthPwToggle"
                onClick={() => setShowPassword((v) => !v)}
                role="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="custAuthRow">
              <label className="custAuthCheckbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Mujhe yaad rakhein
              </label>
              <button
                type="button"
                className="custAuthLinkBtn"
                onClick={() => switchMode(MODE.FORGOT)}
              >
                Forgot Password?
              </button>
            </div>

            <button className="custAuthButton" type="submit" disabled={isLoading}>
              {isLoading ? <span className="custAuthSpinner" /> : "Login"}
            </button>
          </form>
        )}

        {/* ── SIGNUP FORM ── */}
        {mode === MODE.SIGNUP && (
          <form onSubmit={handleSignup} className="custAuthForm">
            <div className="custAuthInputGroup">
              <FaUser />
              <input
                type="text"
                placeholder="Full Name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
              />
            </div>

            <div className="custAuthInputGroup">
              <FaMobileAlt />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Mobile Number"
                value={signupMobile}
                onChange={(e) => setSignupMobile(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="custAuthInputGroup">
              <FaLock />
              <input
                type={showSignupPassword ? "text" : "password"}
                placeholder="Create Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
              />
              <span
                className="custAuthPwToggle"
                onClick={() => setShowSignupPassword((v) => !v)}
                role="button"
                aria-label={showSignupPassword ? "Hide password" : "Show password"}
              >
                {showSignupPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="custAuthInputGroup">
              <FaLock />
              <input
                type={showSignupPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
              />
            </div>

            <button className="custAuthButton" type="submit" disabled={isLoading}>
              {isLoading ? <span className="custAuthSpinner" /> : "Create Account"}
            </button>
          </form>
        )}

        {/* ── FORGOT PASSWORD FORM (2 steps) ── */}
        {mode === MODE.FORGOT && forgotStep === FORGOT_STEP.REQUEST && (
          <form onSubmit={handleSendOtp} className="custAuthForm">
            <div className="custAuthInputGroup">
              <FaMobileAlt />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Registered Mobile Number"
                value={forgotMobile}
                onChange={(e) => setForgotMobile(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <button className="custAuthButton" type="submit" disabled={isLoading}>
              {isLoading ? <span className="custAuthSpinner" /> : "Send OTP"}
            </button>
          </form>
        )}

        {mode === MODE.FORGOT && forgotStep === FORGOT_STEP.RESET && (
          <form onSubmit={handleResetPassword} className="custAuthForm">
            <span className="custAuthStepLabel">OTP bheja gaya: {forgotMobile}</span>

            <div className="custAuthInputGroup">
              <FaShieldAlt />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="custAuthInputGroup">
              <FaLock />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <span
                className="custAuthPwToggle"
                onClick={() => setShowNewPassword((v) => !v)}
                role="button"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="custAuthInputGroup">
              <FaLock />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
              />
            </div>

            <button className="custAuthButton" type="submit" disabled={isLoading}>
              {isLoading ? <span className="custAuthSpinner" /> : "Reset Password"}
            </button>
          </form>
        )}

        {error && <p className="custAuthError">{error}</p>}
        {success && <p className="custAuthSuccess">{success}</p>}

        {mode === MODE.LOGIN && (
          <p className="custAuthSwitchText">
            Naye customer hain?{" "}
            <button type="button" className="custAuthLink" onClick={() => switchMode(MODE.SIGNUP)}>
              Account banayein
            </button>
          </p>
        )}
        {mode === MODE.SIGNUP && (
          <p className="custAuthSwitchText">
            Pehle se account hai?{" "}
            <button type="button" className="custAuthLink" onClick={() => switchMode(MODE.LOGIN)}>
              Login karein
            </button>
          </p>
        )}
      </main>
    </div>
  );
};

/**
 * The signature visual: a hand-built faceted gemstone made of layered
 * triangular facets with a shimmer sweep animation defined in the CSS.
 */
const FacetedGem = () => (
  <svg
    className="custAuthGemArt"
    viewBox="0 0 400 400"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="facetA" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2f6b5e" />
        <stop offset="100%" stopColor="#123b34" />
      </linearGradient>
      <linearGradient id="facetB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3f8b76" />
        <stop offset="100%" stopColor="#1c4b41" />
      </linearGradient>
      <linearGradient id="facetC" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#cba135" />
        <stop offset="100%" stopColor="#8a6c1f" />
      </linearGradient>
      <linearGradient id="facetD" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4fa08a" />
        <stop offset="100%" stopColor="#123b34" />
      </linearGradient>
      <clipPath id="gemClip">
        <polygon points="200,40 320,130 280,320 120,320 80,130" />
      </clipPath>
    </defs>

    <g clipPath="url(#gemClip)">
      <polygon points="200,40 320,130 200,175" fill="url(#facetB)" />
      <polygon points="200,40 80,130 200,175" fill="url(#facetA)" />
      <polygon points="80,130 200,175 120,320" fill="url(#facetD)" />
      <polygon points="320,130 200,175 280,320" fill="url(#facetC)" />
      <polygon points="200,175 120,320 280,320" fill="url(#facetB)" />
      <rect className="custAuthShimmer" x="-400" y="0" width="180" height="400" />
    </g>

    <polygon
      points="200,40 320,130 280,320 120,320 80,130"
      fill="none"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="2"
    />
  </svg>
);

export default CustomerLogin;
