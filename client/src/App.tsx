import { useEffect, useState } from "react";
import './App.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [address, setAddress] = useState("");

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

  const handleSendTokens = async () => {
    if (!address) return alert("Enter an address");
    if (!token) return alert("Not logged in");

    try {
      const res = await fetch("http://localhost:4000/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address }),
      });

      const data = await res.json();
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Error sending tokens");
    }
  };

  return (
    <div className="container">
      {!token ? (
        <button className="github-button rounded-4xl" onClick={handleLogin}>
          <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/github-white-icon.png" alt="" className="w-8" />
          Connect
        </button>
      ) : (
        <>
          <h3>Logged in as {user}</h3>
          <div className="input-container">
            <input
              type="text"
              placeholder="Enter your wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button onClick={handleSendTokens}>Send Tokens</button>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default App;
