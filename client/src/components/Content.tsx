import React from "react";

interface Props {
  token: string | null;
  user: string | null;
  address: string;
  setAddress: (val: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  onSend: () => void;
}

const Content: React.FC<Props> = ({ token, user, address, setAddress, onLogin, onLogout, onSend }) => {
  return (
    <div className="content">
      {!token ? (
        <div className="login-container">
          <button className="github-button" onClick={onLogin}>
            <img
              src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/github-white-icon.png"
              alt=""
              className="w-6"
            />
            Connect with GitHub
          </button>
        </div>
      ) : (
        <div className="user-container">
          <h3>Logged in as {user}</h3>
          <div className="input-container">
            <input
              type="text"
              placeholder="Enter your wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button onClick={onSend}>Send Tokens</button>
          </div>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Content;
