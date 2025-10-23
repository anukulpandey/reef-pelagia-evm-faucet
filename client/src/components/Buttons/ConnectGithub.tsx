import React from 'react'

interface Props {
    onLogin: () => void;
};

function ConnectGithub({onLogin}:Props) {
  return (
    <button
    className="group flex items-center justify-center gap-3 bg-black hover:bg-white hover:text-black hover:cursor-pointer text-white px-6 py-3 rounded-lg w-full max-w-md font-semibold text-lg shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
    onClick={onLogin}
  >
    <img
      src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/github-white-icon.png"
      alt="GitHub"
      className="w-6 block group-hover:hidden transition-all duration-300"
    />
    <img
      src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
      alt="GitHub Hover"
      className="w-6 hidden group-hover:block transition-all duration-300"
    />
    Connect with GitHub
  </button>

  )
}

export default ConnectGithub