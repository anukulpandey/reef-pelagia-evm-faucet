import './App.css';
import { useEffect, useState } from "react";
import Content from "./components/Content";
import VideoPanel from "./components/VideoPanel";
import Footer from "./components/Footer";

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
    <div className="app-grid">
      <div className="content-side">
        <Content
          token={token}
          user={user}
          address={address}
          setAddress={setAddress}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onSend={handleSendTokens}
        />
        <Footer />
      </div>
      <div className="video-side">
        <VideoPanel />
      </div>
    </div>
  );
}

export default App;
