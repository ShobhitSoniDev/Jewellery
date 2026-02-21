import Link from "next/link";
import React, { useState } from "react";
import { FaGem } from "react-icons/fa";
import { useRouter } from "next/router";
import { LoginUser } from "@/lib/services/AuthService";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // const handleLogin = (e) => {
  //   e.preventDefault(); // form reload stop

  //   if (email === "shobhit" && password === "shobhit#1234") {
  //     router.push("/dashboard");
  //   } else {
  //     if(email==="" && password===""){
  //     setError("Username and password cannot be empty");
  //   }
  //   else if(email===""){
  //     setError("Username cannot be empty");
  //   }
  //   else if(password===""){
  //     setError("Password cannot be empty");
  //   }
  //   else{
  //     setError("Invalid username or password");
  //   }
  
  //   }
  // };
const handleLogin = async (event) => {
  event.preventDefault(); // stop page reload

  const payload = {
    username: email,
    password: password
  };

  try {
    const response = await LoginUser(payload);

    if (response.code === 1) {
      sessionStorage.setItem("token", response.data); // token
      router.push("/dashboard");
      alert(response.message || "Login successful ✅");
    } else {
      setError(response.message || "Login failed ❌");
    }

    setEmail("");
    setPassword("");

    console.log("API Response:", response);

  } catch (error) {
    console.error("Login Error:", error);
    alert(error.message || "Something went wrong ❌");
  }
};

  return (
    <div className="wrapper">
      <div className="card">

        <div className="logo">
                  <FaGem className="gem" />
                  <h2>Jewelry Stock</h2>
                </div>
       

        <hr className="divider" />

        <h3>Welcome Back!</h3>

        <form onSubmit={handleLogin}>
          <div className="inputGroup">
            <span>✉️</span>
            <input
              type="text"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="inputGroup">
            <span>🔒</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="forgot">
            <Link href="/forgot-password">Forgot Password?</Link>
          </div>

          <button className="button" type="submit">Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
        </form>

        <p className="signupText">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="signupLink">
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;