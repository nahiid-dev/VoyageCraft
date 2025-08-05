// src/index.js

import { handleItinerary } from './routes/itinerary.js';

/**
 * The main entry point for the Cloudflare Worker.
 * This function acts as a simple router, directing incoming requests
 * to the appropriate handler based on the request method and path.
 */
export default {
    /**
     * Handles incoming fetch events.
     * @param {Request} request The incoming request object.
     * @param {object} env The environment variables bound to the Worker.
     * @param {object} ctx The execution context of the request.
     * @returns {Promise<Response>} A promise that resolves to the Response.
     */
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Route for creating a new itinerary.
        // It accepts POST requests to the /itinerary path.
        if (request.method === "POST" && url.pathname === "/itinerary") {
            // Pass the request, environment, and execution context to the handler.
            // The context (ctx) is crucial for using `waitUntil` for background tasks.
            return await handleItinerary(request, env, ctx);
        }

        // For any other request, return a 404 Not Found response.
        return new Response("Not Found", { status: 404 });
    }
};
