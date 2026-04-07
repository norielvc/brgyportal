export default function Health() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ color: "#10B981" }}>✓ Frontend is Working!</h1>
        <p>Next.js application is running successfully</p>
        <p>Time: {new Date().toLocaleString()}</p>
        <a href="/" style={{ color: "#3B82F6", textDecoration: "underline" }}>
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
