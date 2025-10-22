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
    <div className="flex flex-col justify-center items-center h-full px-6 py-12">
      {!token ? (
        <div className="flex flex-col items-center gap-8 max-w-lg w-full text-center">
          <h1 className="text-4xl font-bold text-white">Pelagia Network Faucet</h1>
          <p className="text-white text-lg">
            Claim your free REEF tokens instantly. Connect your GitHub account to get started.
          </p>
          <button
            className="flex items-center justify-center gap-3 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg w-full max-w-md font-semibold text-lg shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            onClick={onLogin}
          >
            <img
              src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/github-white-icon.png"
              alt="GitHub"
              className="w-6"
            />
            Connect with GitHub
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 max-w-lg w-full text-center">
          <h1 className="text-4xl font-bold text-white">
            Pelagia Network Faucet
          </h1>
          <p className="text-white text-lg">
            Logged in as <span className="font-semibold">{user}</span>. Enter your wallet address below to claim your tokens.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-md">
            <input
              type="text"
              placeholder="Enter your wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-white border border-gray-400 bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 text-lg"
            />
            <button
              onClick={onSend}
              className="w-full bg-black hover:bg-gray-800 text-white px-4 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Send Tokens
            </button>
          </div>

          <p className="text-gray-400 text-sm">
            Each wallet can claim once every 24 hours. Make sure you are on the correct network.
          </p>

          <button
            className="w-full max-w-md bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Content;
