import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// --- Firebase Configuration ---
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
const ASANSOL_COORDS = [23.6823, 86.9635]; // Asansol Lat, Lng
const ASANSOL_ROUTES = [
    { id: 'route-1', name: 'Court More ⇌ Hutton Road', path: [[23.678, 86.974], [23.683, 86.979], [23.688, 86.985]] },
    { id: 'route-2a', name: 'Asansol City Bus Terminus ⇌ Burnpur', path: [[23.678, 86.978], [23.673, 86.960], [23.666, 86.933]] },
    { id: 'route-3', name: 'Ushagram ⇌ Neamatpur', path: [[23.693, 86.993], [23.700, 86.950], [23.715, 86.878]] },
    { id: 'route-4b', name: 'SB Gorai Road ⇌ Kulti', path: [[23.684, 86.975], [23.710, 86.910], [23.733, 86.850]] },
];

// Using an SVG to create a custom icon without needing external image files.
const busIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFF" width="28px" height="28px" style="transform: translate(-1px, -2px);"><path d="M0 0h24v24H0z" fill="none"/><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5S18.33 16 17.5 16zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;

export default function App() {
    const [liveBuses, setLiveBuses] = useState([]);
    const [selectedRouteFilter, setSelectedRouteFilter] = useState('');
    const [error, setError] = useState('');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    // Refs to hold the map instance and the container element
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const busMarkersLayerRef = useRef(null);


    // Effect to sign in the user anonymously
    useEffect(() => {
        const initAuth = async () => {
            try {
                await signInAnonymously(auth);
                setIsAuthReady(true);
            } catch (err) {
                console.error("Commuter App Auth Error:", err);
                setError("Could not connect to the bus tracking service.");
            }
        };
        initAuth();
        // Trigger sidebar animation
        setTimeout(() => setIsSidebarVisible(true), 500);
    }, []);

    // Effect to fetch live bus data from Firestore
    useEffect(() => {
        if (!isAuthReady) return; 

        const busesCollectionRef = collection(db, `/artifacts/${appId}/public/data/live_buses`);
        
        const unsubscribe = onSnapshot(busesCollectionRef, (snapshot) => {
            const now = new Date();
            const busesData = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(bus => {
                    if (!bus.lastUpdate) return false;
                    const lastUpdateDate = bus.lastUpdate.toDate();
                    const secondsSinceUpdate = (now.getTime() - lastUpdateDate.getTime()) / 1000;
                    return secondsSinceUpdate < 60;
                });
                
            setLiveBuses(busesData);
        }, (err) => {
            console.error("Firestore Snapshot Error:", err);
            setError("Failed to fetch live bus data.");
        });

        return () => unsubscribe();

    }, [isAuthReady]);

    // Effect to load Leaflet library and initialize the map
    useEffect(() => {
        const leafletCss = document.createElement('link');
        leafletCss.rel = 'stylesheet';
        leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCss);

        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletScript.async = true;
        document.body.appendChild(leafletScript);
        
        leafletScript.onload = () => {
            if (mapContainerRef.current && !mapInstanceRef.current) {
                const map = window.L.map(mapContainerRef.current, { zoomControl: false }).setView(ASANSOL_COORDS, 13);
                
                window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                }).addTo(map);

                mapInstanceRef.current = map;
                busMarkersLayerRef.current = window.L.layerGroup().addTo(map);
                setIsMapReady(true);
            }
        };

        return () => {
            if (document.head.contains(leafletCss)) document.head.removeChild(leafletCss);
            if (document.body.contains(leafletScript)) document.body.removeChild(leafletScript);
        };
    }, []);

    // Effect to update bus markers on the map
    useEffect(() => {
        if (!isMapReady || !busMarkersLayerRef.current) return;

        busMarkersLayerRef.current.clearLayers();
        const filteredBuses = selectedRouteFilter
            ? liveBuses.filter(bus => bus.routeId === selectedRouteFilter)
            : liveBuses;

        const busIcon = window.L.divIcon({
          html: `<div style="background-color: #3B82F6; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.5); border: 2px solid white;">${busIconSvg}</div>`,
          className: 'leaflet-dummy-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        filteredBuses.forEach(bus => {
            const popupContent = `
                <div class="font-bold text-lg p-0 m-0">${bus.routeName}</div>
                <div class="text-sm p-0 m-0">Last updated: ${bus.lastUpdate ? new Date(bus.lastUpdate.seconds * 1000).toLocaleTimeString() : 'N/A'}</div>
            `;
            const marker = window.L.marker([bus.lat, bus.lng], { icon: busIcon });
            marker.bindPopup(popupContent);
            busMarkersLayerRef.current.addLayer(marker);
        });

    }, [liveBuses, isMapReady, selectedRouteFilter]);

    // --- Derived State for Active Routes with Counts ---
    const activeRoutesWithCounts = liveBuses.reduce((acc, bus) => {
        const { routeName } = bus;
        if (!acc[routeName]) acc[routeName] = 0;
        acc[routeName]++;
        return acc;
    }, {});

    const activeRoutesList = Object.entries(activeRoutesWithCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="font-sans h-screen w-screen overflow-hidden bg-gray-100">
            {/* --- MAP BACKGROUND --- */}
            <main ref={mapContainerRef} className="absolute inset-0 z-10"></main>

            {/* --- HEADER --- */}
            <header className="absolute top-0 left-0 right-0 p-4 z-20">
                <div className="max-w-md mx-auto bg-white/80 backdrop-blur-md p-3 rounded-xl shadow-lg">
                    <h1 className="text-xl md:text-2xl font-bold text-center text-gray-800">Asansol Live Bus Tracker</h1>
                </div>
            </header>

            {/* --- FLOATING SIDEBAR --- */}
            <aside className={`absolute top-24 left-4 w-80 bg-white/80 backdrop-blur-md rounded-xl shadow-lg z-20 p-4 space-y-4 transform transition-transform duration-500 ease-in-out ${isSidebarVisible ? 'translate-x-0' : '-translate-x-[110%]'}`}>
                {/* --- CONTROLS --- */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                         <h2 className="font-bold text-gray-700">Live Status</h2>
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-xl text-blue-600 transition-all">{liveBuses.length}</span>
                            <span className="text-sm text-gray-600">Buses Active</span>
                         </div>
                    </div>
                    <select
                        value={selectedRouteFilter}
                        onChange={(e) => setSelectedRouteFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Filter by Route (Show All)</option>
                        {ASANSOL_ROUTES.map(route => (
                            <option key={route.id} value={route.id}>{route.name}</option>
                        ))}
                    </select>
                </div>
                
                <hr/>
                
                {/* --- ACTIVE ROUTES DISPLAY --- */}
                <div>
                     <h3 className="font-bold text-gray-700 mb-2">Active Routes</h3>
                     <div className="space-y-2 transition-all duration-300">
                        {activeRoutesList.length > 0 ? (
                            activeRoutesList.map((route, index) => (
                                <div key={route.name} className="bg-blue-50 text-blue-800 p-2 rounded-lg flex justify-between items-center transition-opacity" style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`, opacity: 0 }}>
                                    <span className="text-sm font-semibold">{route.name}</span>
                                    <span className="bg-blue-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                        {route.count}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No buses currently active.</p>
                        )}
                    </div>
                </div>
            </aside>

            {/* --- Error Display --- */}
            {error && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-30" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
             
            {/* --- CSS for Animations --- */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

