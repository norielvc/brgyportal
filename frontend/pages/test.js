import { useState } from "react";

export default function Test() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    setResult("Testing...");

    try {
      const response = await fetch("http://localhost:5000/api/health");
      const data = await response.json();
      setResult("✅ Backend connected! " + JSON.stringify(data));
    } catch (error) {
      setResult("❌ Backend error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult("Testing login...");

    try {
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

      const data = await response.json();
      setResult("✅ Login test: " + JSON.stringify(data));
    } catch (error) {
      setResult("❌ Login error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Backend Connection Test</h1>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={testBackend}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            marginRight: "1rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Test Backend Health
        </button>

        <button
          onClick={testLogin}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Test Login API
        </button>
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f3f4f6",
          borderRadius: "4px",
          minHeight: "100px",
          whiteSpace: "pre-wrap",
        }}
      >
        {result || "Click a button to test the connection"}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <a href="/login" style={{ color: "#3b82f6" }}>
          ← Back to Login
        </a>
      </div>
    </div>
  );
}
