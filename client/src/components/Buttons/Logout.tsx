import React from 'react'

interface Props{
    onLogout:()=>void;
}

function Logout({onLogout}:Props) {
    return (
        <button
            className="w-full max-w-md hover:bg-red-700  px-4 py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-red-700 border-2 text-red-700 hover:text-white"
            onClick={onLogout}
        >
            Logout
        </button>
    )
}

export default Logout