// api/src/index.js - Final version with CORS support

import { handleItinerary } from './routes/itinerary.js';

// Define CORS headers
// These headers tell the browser that requests from other domains are allowed
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allows all domains. For more security, you can replace '*' with your UI site's address
    'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allowed methods
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request, env, ctx) {
        // Browsers send an OPTIONS request before sending the actual request
        // to get permission from the server. We need to respond positively to this request.
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        let response;

        // Main routing of your application
        if (request.method === "POST" && url.pathname === "/itinerary") {
            response = await handleItinerary(request, env, ctx);
        } else {
            response = new Response("Not Found", { status: 404 });
        }

        // Create a copy of the response to modify its headers
        response = new Response(response.body, response);

        // Add CORS header to the final response
        response.headers.set('Access-Control-Allow-Origin', '*');

        return response;
    }
};
