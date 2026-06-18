import Link from "next/link";
import React, { useState } from "react";
import { FaEnvelope, FaGem, FaLock, FaMobile, FaUser } from "react-icons/fa";
import { useRouter } from "next/router";
import { SignUp } from "@/lib/services/AuthService";
import Swal from "sweetalert2";

const Signup = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!username) {
      setError("Username cannot be empty");
      return;
    }
    if (!email) {
      setError("Email cannot be empty");
      return;
    }
    if (!mobile) {
      setError("Mobile number cannot be empty");
      return;
    }
    if (!password) {
      setError("Password cannot be empty");
      return;
    }
    if (!confirmpassword) {
      setError("Confirm password cannot be empty");
      return;
    }
    if (password !== confirmpassword) {
      setError("Passwords do not match");
      return;
    }

    const payload = {
      userName: username,
      email,
      mobileNo: mobile,
      password,
      type: 1,
    };

    try {
      const response = await SignUp(payload);

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: response?.data?.[0]?.Message || "Account created successfully",
        confirmButtonColor: "#d69a32",
      });

      router.push("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error?.response?.data?.[0]?.Message || "Failed to save",
        confirmButtonColor: "#d69a32",
      });
    }
  };

  return (
    <div className="authPage signupAuthPage">
      <section className="authHero" aria-label="Jewelry Stock">
        <div className="authHeroContent">
          <span className="authHeroIcon">
            <FaGem />
          </span>
          <h1>Start Managing Smarter</h1>
          <p>Customer, loan, metal aur product data ko responsive dashboard me securely manage karein.</p>
        </div>
      </section>

      <main className="authCard signupAuthCard">
        <div className="authLogo">
          <FaGem className="authGem" />
          <h2>Jewelry Stock</h2>
        </div>

        <div className="authTitle">
          <h3>Create Account</h3>
          <p>Naya account banane ke liye details bharein</p>
        </div>

        <form onSubmit={handleSignup} className="authForm">
          <div className="authInputGroup">
            <FaUser />
            <input
              type="text"
              placeholder="Full Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="authInputGroup">
            <FaEnvelope />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="authInputGroup">
            <FaMobile />
            <input
              type="text"
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
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

          <div className="authInputGroup">
            <FaLock />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmpassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button className="authButton" type="submit">
            Sign Up
          </button>

          {error && <p className="authError">{error}</p>}
        </form>

        <p className="authSwitchText">
          Already have an account?{" "}
          <Link href="/login" className="authLink">
            Login
          </Link>
        </p>
      </main>
    </div>
  );
};

export default Signup;
