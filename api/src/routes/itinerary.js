// src/routes/itinerary.js
import { generateUUID } from '../utils/uuid.js';
import { createInitialJob, updateJob } from '../services/firestore.js';
import { getItineraryFromLLM } from '../services/llm.js';

export async function handleItineraryRequest(request, env, ctx) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { destination, durationDays } = await request.json();
        const jobId = generateUUID();

        // 1. Create initial job record in Firestore
        await createInitialJob(jobId, destination, durationDays);

        // 2. Schedule background processing
        ctx.waitUntil(
            processInBackground(jobId, destination, durationDays, env)
        );

        // 3. Return immediate response
        return new Response(JSON.stringify({ jobId }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response('Bad Request', { status: 400 });
    }
}

async function processInBackground(jobId, destination, durationDays, env) {
    try {
        const itineraryData = await getItineraryFromLLM(destination, durationDays, env.LLM_API_KEY);
        await updateJob(jobId, { status: 'completed', itinerary: itineraryData.itinerary });
    } catch (error) {
        await updateJob(jobId, { status: 'failed', error: error.message });
    }
}