import Link from "next/link";
import React, { useState } from "react";
import { FaGem, FaUser, FaEnvelope, FaLock, FaMobile } from "react-icons/fa";
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

    // ✅ Validation
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
      email: email,
      mobileNo: mobile,
      password: password,
      type: 1,
    };

    try {
      debugger;
      const response = await SignUp(payload);

      await Swal.fire({
        icon: "success",
        title: "Success",
        text:
          response?.data?.[0]?.Message ||
          "Account created successfully",
        confirmButtonColor: "#3085d6",
      });

      // ✅ Redirect after success
      router.push("/login");

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          error?.response?.data?.[0]?.Message ||
          "Failed to save",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  return (
    <div className="wrapper">
      <div className="card">
        <div className="logo">
          <FaGem className="gem" />
          <h2>Jewelry Stock</h2>
        </div>

        <h3>Create Your Account</h3>

        <form onSubmit={handleSignup}>
          <div className="inputGroup">
            <FaUser />
            <input
              type="text"
              placeholder="Full Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="inputGroup">
            <FaEnvelope />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="inputGroup">
            <FaMobile />
            <input
              type="text"
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          <div className="inputGroup">
            <FaLock />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="inputGroup">
            <FaLock />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmpassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button className="button">Sign Up</button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>

        <p className="loginText">
          Already have an account?{" "}
          <span>
            <Link href="/login">Login</Link>
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
