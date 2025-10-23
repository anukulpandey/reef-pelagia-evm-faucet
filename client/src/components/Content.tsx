import React from "react";
import ConnectGithub from "./Buttons/ConnectGithub";
import LoggedInView from "./LoggedInView";

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
         <ConnectGithub onLogin={onLogin}/>
        </div>
      ) : <LoggedInView address={address} onLogout={onLogout} onSend={onSend} setAddress={setAddress} user={user!}/>}
    </div>
  );
};

export default Content;
