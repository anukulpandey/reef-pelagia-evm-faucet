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
            chainId: "0x1AEF",
            chainName: "Pelagia Network",
            nativeCurrency: {
              name: "REEF",
              symbol: "REEF",
              decimals: 18,
            },
            rpcUrls: ["https://rpc.pelagia.network"],
            blockExplorerUrls: ["https://explorer.pelagia.network"],
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
    <footer className="w-full bg-gray-900 text-gray-300 flex justify-between items-center px-6 py-3 border-t border-gray-800">
      <button
        onClick={addPelagiaNetwork}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
      >
        <img src={metamaskLogo} alt="MetaMask" className="w-6" />
        Add Pelagia Network
      </button>
      <p className="text-sm text-gray-500">© {new Date().getFullYear()} Pelagia Network</p>
    </footer>
  );
};

export default Footer;
