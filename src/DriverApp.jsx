import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// --- Firebase Configuration ---
// PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
const firebaseConfig = {
    apiKey: "AIzaSyBw3XC_OwfluqhuViCbJ1sVRU7668rJQ1Y",
    appId: "1:91831028776:web:a3e55b40a75dfccc33791d",
    authDomain: "asansol-bus-tracker.firebaseapp.com",
    messagingSenderId: "91831028776",
    projectId: "asansol-bus-tracker",
    storageBucket: "asansol-bus-tracker.firebasestorage.app" 
  };
const appId = firebaseConfig.appId || 'default-app-id';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Constants ---
const ASANSOL_ROUTES = [
    { id: 'route-1', name: 'Court More ⇌ Hutton Road' },
    { id: 'route-2a', name: 'Asansol City Bus Terminus ⇌ Burnpur' },
    { id: 'route-3', name: 'Ushagram ⇌ Neamatpur' },
    { id: 'route-4b', name: 'SB Gorai Road ⇌ Kulti' },
];

// --- Helper Components ---
const StatusIndicator = ({ status }) => {
    const isOnTrip = status === 'ON TRIP';
    return (
        <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isOnTrip ? 'bg-green-500 shadow-lg' : 'bg-gray-200'}`}>
                {isOnTrip && <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse-slow"></div>}
                <div className={`w-28 h-28 rounded-full flex items-center justify-center ${isOnTrip ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <span className={`text-2xl font-bold transition-colors ${isOnTrip ? 'text-white' : 'text-gray-600'}`}>
                        {isOnTrip ? 'LIVE' : 'OFF'}
                    </span>
                </div>
            </div>
            <p className={`font-semibold transition-colors ${isOnTrip ? 'text-green-600' : 'text-gray-500'}`}>
                 {isOnTrip ? 'Trip is Active' : 'Off Duty'}
            </p>
        </div>
    );
};

export default function App() {
    const [appStatus, setAppStatus] = useState('INITIALIZING'); // INITIALIZING, NEEDS_PERMISSION, READY, ERROR
    const [tripStatus, setTripStatus] = useState('OFF DUTY');
    const [selectedRoute, setSelectedRoute] = useState('');
    const [error, setError] = useState('');

    const watchIdRef = useRef(null);
    const userIdRef = useRef(null);
    
    // --- Effect to Handle Permissions and Auth ---
    useEffect(() => {
        const setup = async () => {
            try {
                const userCredential = await signInAnonymously(auth);
                userIdRef.current = userCredential.user.uid;

                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                
                const handlePermissionChange = (status) => {
                     if (status === 'granted') {
                        setAppStatus('READY');
                        setError('');
                    } else if (status === 'denied') {
                        setAppStatus('ERROR');
                        setError('Location permission was denied. You must enable it in your browser settings.');
                    } else { // prompt
                        setAppStatus('NEEDS_PERMISSION');
                    }
                }

                handlePermissionChange(permissionStatus.state);
                permissionStatus.onchange = () => handlePermissionChange(permissionStatus.state);

            } catch (err) {
                console.error("Initialization Error:", err);
                setError(err.message.includes('auth/configuration-not-found') ? 'Firebase configuration is missing or invalid.' : err.message);
                setAppStatus('ERROR');
            }
        };
        setTimeout(() => setup(), 500); // Small delay for animation
    }, []);

    const requestLocationPermission = () => {
        navigator.geolocation.getCurrentPosition(
            () => setAppStatus('READY'),
            (err) => {
                console.error("Error during permission request:", err.message);
                setError('Location permission was denied. You must enable it in your browser settings.');
                setAppStatus('ERROR');
            }, 
            { timeout: 10000 }
        );
    };

    const startTrip = async () => {
        if (!selectedRoute) {
            alert('Please select a route first.');
            return;
        }
        if (appStatus !== 'READY') return;

        const route = ASANSOL_ROUTES.find(r => r.id === selectedRoute);
        const busId = userIdRef.current;
        const busDocRef = doc(db, `/artifacts/${appId}/public/data/live_buses`, busId);

        setTripStatus('ON TRIP');

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await setDoc(busDocRef, {
                    lat: latitude,
                    lng: longitude,
                    routeId: route.id,
                    routeName: route.name,
                    lastUpdate: serverTimestamp(),
                    active: true,
                }, { merge: true });
            },
            (err) => {
                console.error('Geolocation watch error:', err);
                setError('Lost location access. Trip has been stopped.');
                setAppStatus('ERROR');
                endTrip();
            },
            { enableHighAccuracy: true }
        );
    };

    const endTrip = async () => {
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setTripStatus('OFF DUTY');
        const busId = userIdRef.current;
        if (busId) {
            const busDocRef = doc(db, `/artifacts/${appId}/public/data/live_buses`, busId);
            try { await deleteDoc(busDocRef); } catch (e) { console.error("Cleanup error:", e); }
        }
    };
    
    // --- UI Rendering Logic ---
    const renderContent = () => {
        switch(appStatus) {
            case 'INITIALIZING':
                return <p className="text-center text-gray-500">Connecting to service...</p>;
            case 'ERROR':
                return <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg"><b>Error:</b> {error}</div>;
            case 'NEEDS_PERMISSION':
                return (
                    <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 space-y-4 rounded-lg text-center">
                        <p className="font-bold">Location Permission Required</p>
                        <button
                            onClick={requestLocationPermission}
                            className="w-full p-3 bg-yellow-500 text-white rounded-md font-bold text-lg hover:bg-yellow-600 transition-transform hover:scale-105"
                        >
                            Enable Location
                        </button>
                    </div>
                );
            case 'READY':
                return (
                    <div className="space-y-6">
                        <StatusIndicator status={tripStatus} />
                        <div className="space-y-4">
                            <select
                                value={selectedRoute}
                                onChange={(e) => setSelectedRoute(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
                                disabled={tripStatus === 'ON TRIP'}
                            >
                                <option value="">-- Select Your Route --</option>
                                {ASANSOL_ROUTES.map(route => <option key={route.id} value={route.id}>{route.name}</option>)}
                            </select>

                            {tripStatus === 'OFF DUTY' ? (
                                <button onClick={startTrip} className="w-full p-4 bg-blue-600 text-white rounded-lg font-bold text-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md">
                                    Start Trip
                                </button>
                            ) : (
                                <button onClick={endTrip} className="w-full p-4 bg-red-600 text-white rounded-lg font-bold text-xl hover:bg-red-700 transition-all transform hover:scale-105 shadow-md">
                                    End Trip
                                </button>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen font-sans flex items-center justify-center p-4">
            <div className={`w-full max-w-md mx-auto bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 transition-all duration-500 ease-in-out transform ${appStatus !== 'INITIALIZING' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <header>
                    <h1 className="text-3xl font-bold text-gray-800 text-center">Driver Control</h1>
                </header>
                {renderContent()}
            </div>
             {/* --- CSS for Animations --- */}
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.2;
                    }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}

