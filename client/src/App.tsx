import { useEffect, useState } from "react";

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    const u = params.get("user");
    if (t) {
      setToken(t);
      setUser(u);
      window.history.replaceState({}, document.title, "/");
    } 
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:4000/auth/github";
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <div style={{ padding: 50, textAlign: "center" }}>
      {!token ? (
        <>
          <h2>Login with GitHub</h2>
          <button onClick={handleLogin}>Login</button>
        </>
      ) : (
        <>
          <h3>Logged in as {user}</h3>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
    </div>
  );
}

export default App;
