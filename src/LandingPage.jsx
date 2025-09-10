import React from 'react';
// import { Link } from 'react-router-dom'; // No longer needed

// --- Inline SVG Icons ---
const CommuterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M12 22s-8-4.5-8-11.5a8 8 0 0 1 16 0c0 7-8 11.5-8 11.5z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const DriverIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3.2c0-.7-.5-1.3-1.2-1.4l-4.4-.9c-.6-.1-1.2.3-1.4.9l-1.9 4.3c-.2.5-.7.8-1.2.8H4c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h2"></path>
        <circle cx="7" cy="17" r="2"></circle>
        <circle cx="17" cy="17" r="2"></circle>
        <path d="M12 17H9"></path>
        <path d="M12 5a3 3 0 0 0-3 3v4h6V8a3 3 0 0 0-3-3z"></path>
    </svg>
);


export default function LandingPage() {
    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen font-sans flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Asansol Bus Tracker</h1>
                <p className="text-lg text-gray-600 mt-4">Your real-time guide to public transport in the city.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Commuter Card */}
                <a href="/commuter" className="group rounded-2xl p-8 bg-blue-500 text-white shadow-2xl hover:shadow-blue-400/50 transition-all duration-300 transform hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 bg-blue-600 p-4 rounded-full transition-transform duration-300 group-hover:scale-110">
                            <CommuterIcon />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Commuter View</h2>
                        <p className="text-blue-100">See live bus locations on the map, check active routes, and plan your journey.</p>
                    </div>
                </a>

                {/* Driver Card */}
                <a href="/driver" className="group rounded-2xl p-8 bg-gray-700 text-white shadow-2xl hover:shadow-gray-600/50 transition-all duration-300 transform hover:-translate-y-2">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 bg-gray-800 p-4 rounded-full transition-transform duration-300 group-hover:scale-110">
                           <DriverIcon />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Driver Mode</h2>
                        <p className="text-gray-300">Start your trip to share your bus's location with commuters in real-time.</p>
                    </div>
                </a>
            </div>

            <footer className="absolute bottom-4 text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Asansol Bus Tracker Project</p>
            </footer>
        </div>
    );
}

