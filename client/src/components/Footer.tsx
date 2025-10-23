import React from "react";
import metamaskLogo from "../assets/metamask.svg";

const Footer: React.FC = () => {
  const addPelagiaNetwork = async () => {
    try {
      const provider = (window as any).ethereum;
      if (!provider) return alert("MetaMask not found");

      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x3673",
            chainName: "Reef Pelagia Network",
            nativeCurrency: {
              name: "REEF",
              symbol: "REEF",
              decimals: 18,
            },
            rpcUrls: ["http://34.123.142.246:8545"],
            blockExplorerUrls: [],
          },
        ],
      });

      alert("Pelagia Network added to MetaMask!");
    } catch (err) {
      console.error(err);
      alert("Failed to add network");
    }
  };

  return (
    <footer className="fixed bottom-0 left-0  backdrop-blur-md text-gray-300 flex space-between items-center px-6 py-3 ">
      <button
        onClick={addPelagiaNetwork}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-colors text-white px-4 py-2 rounded-lg"
      >
        <img src={metamaskLogo} alt="MetaMask" className="w-6" />
        Add Pelagia Network
      </button>

    </footer>
  );
};

export default Footer;
