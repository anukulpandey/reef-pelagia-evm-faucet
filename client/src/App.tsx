import { useEffect, useState } from "react";
import Header from "./components/Header";
import MainContent from "./components/MainContent";
import VideoSection from "./components/VideoSection";
import Footer from "./components/Footer";
import "./App.css"

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
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <Header />
      <div className="flex flex-1">
        <div className="w-7/10 flex-1 flex justify-center items-center">
          <MainContent
            token={token}
            user={user}
            address={address}
            setAddress={setAddress}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onSendTokens={handleSendTokens}
          />
        </div>
        <div className="w-3/10">
          <VideoSection />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;
