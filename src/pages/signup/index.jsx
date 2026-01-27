import Link from 'next/link';
import React, { useState } from "react";
import { FaGem, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/router";

const Signup = () => {
const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const handleSignup = (e) => {
    e.preventDefault(); // form reload stop

    if (username === "") {
      setError("Username cannot be empty");
    }       
    else if(email===""){
      setError("Email cannot be empty");
    }
    else if(password===""){
      setError("password cannot be empty");
    }
    else if(confirmpassword===""){
      setError("Confirm password cannot be empty");
    }
    else{
      router.push("/dashboard");
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
            <input type="text" placeholder="Full Name" 
            value={username}
              onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="inputGroup">
            <FaEnvelope />
            <input type="email" placeholder="Email" 
            value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="inputGroup">
            <FaLock />
            <input type="password" placeholder="Password"  
            value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="inputGroup">
            <FaLock />
            <input type="password" placeholder="Confirm Password" 
            value={confirmpassword}
              onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <button className="button">Sign Up</button>
           {error && <p style={{ color: "red" }}>{error}</p>}
        </form>

        <p className="loginText">
          Already have an account? <span><Link href="/login" >Login</Link></span>
        </p>
      </div>
    </div>
  );
};

export default Signup;