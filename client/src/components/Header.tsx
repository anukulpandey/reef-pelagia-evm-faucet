import React from 'react';

function Header() {
  return (
    <header
      className="fixed top-4 right-6 left-6 mx-auto px-8 py-3 
      flex justify-end items-center rounded-full
      backdrop-blur-md bg-[#bb29d0]/20 border border-[#bb29d0]/30 
      shadow-xl"
    >
      <h1 className="text-lg font-[Poppins] tracking-wide text-white font-semibold drop-shadow-sm">
        Pelagia Testnet
      </h1>
    </header>
  );
}

export default Header;
