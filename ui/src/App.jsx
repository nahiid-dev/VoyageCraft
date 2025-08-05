// ui/src/App.jsx

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from './services/firebase';
import './App.css';

function App() {
    const [destination, setDestination] = useState('');
    const [duration, setDuration] = useState('5');
    const [jobId, setJobId] = useState(null);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    useEffect(() => {
        if (!jobId) return;

        const unsubscribe = onSnapshot(doc(db, "itineraries", jobId), (doc) => {
            if (doc.exists()) {
                const docData = doc.data();
                setData(docData);
                if (docData.status === 'completed' || docData.status === 'failed') {
                    setIsLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, [jobId]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setApiError(null);
        setData(null);
        setJobId(null);

        try {

            const workerUrl = 'https://voyagecraft-api.naahid-sha.workers.dev/itinerary';

            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination,
                    durationDays: parseInt(duration, 10),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit request. Please try again.');
            }

            const result = await response.json();
            setJobId(result.jobId);

        } catch (error) {
            setApiError(error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="App">
            <header>
                <h1>🌍 VoyageCraft AI</h1>
                <p>Your intelligent travel planner</p>
            </header>
            <main>
                <form onSubmit={handleSubmit} className="itinerary-form">
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g., Tokyo, Japan"
                        required
                        disabled={isLoading}
                    />
                    <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="Days"
                        min="1"
                        max="14"
                        required
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Crafting...' : 'Craft My Voyage'}
                    </button>
                </form>

                {apiError && <div className="error-message">{apiError}</div>}

                {data && (
                    <div className="results">
                        <h2>Your Itinerary Status: <span className={`status-${data.status}`}>{data.status}</span></h2>
                        {data.status === 'processing' && <p>We are crafting your personalized itinerary. Please wait...</p>}
                        {data.status === 'failed' && <p className="error-message">Error: {data.error}</p>}
                        {data.status === 'completed' && data.itinerary && data.itinerary.itinerary && (
                            <div className="itinerary-details">
                                {data.itinerary.itinerary.map((day) => (
                                    <div key={day.day} className="day-card">
                                        <h3>Day {day.day}: {day.theme}</h3>
                                        <ul>
                                            {day.activities.map((activity, index) => (
                                                <li key={index}>
                                                    <strong>{activity.time} ({activity.location}):</strong> {activity.description}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
