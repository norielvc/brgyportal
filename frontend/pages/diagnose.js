import { useEffect, useState } from "react";

export default function Diagnose() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const runDiagnostics = async () => {
      const diags = [];

      // Check environment variables
      diags.push({
        test: "Environment Variables",
        result: `API_URL: ${process.env.NEXT_PUBLIC_API_URL || "NOT SET"}`,
        status: process.env.NEXT_PUBLIC_API_URL ? "pass" : "fail",
      });

      // Check backend health
      try {
        const response = await fetch("http://localhost:5000/api/health");
        const data = await response.json();
        diags.push({
          test: "Backend Health",
          result: `Status: ${data.status}`,
          status: "pass",
        });
      } catch (error) {
        diags.push({
          test: "Backend Health",
          result: `Error: ${error.message}`,
          status: "fail",
        });
      }

      // Check CORS
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
        diags.push({
          test: "CORS & Login API",
          result: data.success ? "Login successful" : `Error: ${data.message}`,
          status: data.success ? "pass" : "fail",
        });
      } catch (error) {
        diags.push({
          test: "CORS & Login API",
          result: `Error: ${error.message}`,
          status: "fail",
        });
      }

      // Check localStorage
      try {
        localStorage.setItem("test", "value");
        localStorage.removeItem("test");
        diags.push({
          test: "LocalStorage",
          result: "Working",
          status: "pass",
        });
      } catch (error) {
        diags.push({
          test: "LocalStorage",
          result: `Error: ${error.message}`,
          status: "fail",
        });
      }

      setResults(diags);
    };

    runDiagnostics();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Barangay Management System Diagnostics</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th
              style={{
                border: "1px solid #ddd",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Test
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: "10px",
                textAlign: "left",
              }}
            >
              Result
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: "10px",
                textAlign: "center",
              }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((diag, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                {diag.test}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                {diag.result}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "10px",
                  textAlign: "center",
                  backgroundColor:
                    diag.status === "pass" ? "#d4edda" : "#f8d7da",
                  color: diag.status === "pass" ? "#155724" : "#721c24",
                }}
              >
                {diag.status === "pass" ? "✅ PASS" : "❌ FAIL"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#e7f3ff",
          borderRadius: "4px",
        }}
      >
        <h3>Debug Info:</h3>
        <p>
          <strong>Frontend URL:</strong>{" "}
          {typeof window !== "undefined" ? window.location.origin : "N/A"}
        </p>
        <p>
          <strong>API URL:</strong>{" "}
          {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}
        </p>
        <p>
          <strong>Node Env:</strong> {process.env.NODE_ENV}
        </p>
      </div>

      <div style={{ marginTop: "20px" }}>
        <a href="/login" style={{ color: "#0066cc", textDecoration: "none" }}>
          ← Back to Login
        </a>
      </div>
    </div>
  );
}
