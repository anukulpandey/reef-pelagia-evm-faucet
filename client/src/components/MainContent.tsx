import React from "react";

interface Props {
  token: string | null;
  user: string | null;
  address: string;
  setAddress: (val: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  onSendTokens: () => void;
}

const MainContent: React.FC<Props> = ({
  token,
  user,
  address,
  setAddress,
  onLogin,
  onLogout,
  onSendTokens,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 gap-6">
      {!token ? (
        <>
          <h2 className="text-3xl font-bold mb-2">Welcome to Pelagia Faucet</h2>
          <p className="text-gray-400 mb-4">Get free test tokens instantly by connecting your GitHub account.</p>
          <button
            onClick={onLogin}
            className="flex items-center gap-3 px-5 py-2 bg-gray-800 rounded-2xl hover:bg-gray-700 transition"
          >
            <img
              src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/github-white-icon.png"
              alt="GitHub"
              className="w-6"
            />
            Connect with GitHub
          </button>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold">Logged in as <span className="text-primary">{user}</span></h3>
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Enter wallet address"
              className="p-2 rounded-md text-black w-72"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              onClick={onSendTokens}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md"
            >
              Send Tokens
            </button>
          </div>
          <button
            className="mt-4 text-sm text-gray-400 hover:text-red-400"
            onClick={onLogout}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
};

export default MainContent;
