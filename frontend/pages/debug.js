import { useState } from "react";

export default function Debug() {
  const [result, setResult] = useState("");

  const testLogin = async () => {
    setResult("Testing login...");

    try {
      console.log("Sending login request...");

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "admin123",
        }),
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Login error:", error);
      setResult("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Login Debug</h1>

      <button
        onClick={testLogin}
        style={{
          padding: "1rem 2rem",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Test Login with admin@example.com / admin123
      </button>

      <pre
        style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#f3f4f6",
          borderRadius: "4px",
          whiteSpace: "pre-wrap",
          fontSize: "0.875rem",
        }}
      >
        {result || "Click button to test login"}
      </pre>

      <div style={{ marginTop: "1rem" }}>
        <a href="/login" style={{ color: "#3b82f6" }}>
          ← Back to Login
        </a>
      </div>
    </div>
  );
}
