// src/index.js
import { handleItineraryRequest } from './routes/itinerary.js';
import { initializeDb } from './services/firestore.js';

export default {
    async fetch(request, env, ctx) {
        // Initialize Firestore on first request
        initializeDb(env.GCP_SERVICE_ACCOUNT);

        // For now, we only have one route. In a bigger app, you'd have a router here.
        return handleItineraryRequest(request, env, ctx);
    },
};