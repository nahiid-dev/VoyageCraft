// src/routes/itinerary.js

import { createJob, updateJob } from '../services/firestore.js';
import { generateItinerary } from '../services/llm.js';
import { generateUUID } from '../utils/uuid.js';

/**
 * Handles incoming POST requests to the /itinerary endpoint.
 * It immediately returns a job ID and processes the itinerary generation in the background.
 * @param {Request} request The incoming request object.
 * @param {object} env The environment variables.
 * @param {object} ctx The execution context, used for waitUntil.
 * @returns {Response} A Response object with the job ID and a 202 status.
 */
export async function handleItinerary(request, env, ctx) {
    // Parse the JSON body from the request.
    const body = await request.json();
    const { destination, durationDays } = body;

    // Validate the input to ensure required fields are present.
    if (!destination || !durationDays) {
        return new Response(JSON.stringify({ error: "Missing destination or durationDays" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    console.log("📥 Received new request for /itinerary");
    console.log("📦 Request body:", body);

    // Generate a unique identifier for this job.
    const jobId = generateUUID();

    // Define the asynchronous task to be executed in the background.
    const backgroundTask = async () => {
        try {
            // Step 1: Create an initial record in Firestore with a "processing" status.
            // This allows the client to track the job's progress.
            await createJob(jobId, {
                destination,
                durationDays,
                status: "processing",
                createdAt: new Date().toISOString(),
                completedAt: null,
                itinerary: null,
                error: null
            }, env);

            // Step 2: Call the LLM to generate the travel itinerary.
            // This is the time-consuming part of the process.
            const itineraryJson = await generateItinerary(destination, durationDays, env);

            // Step 3: Update the Firestore record with the generated itinerary
            // and set the status to "completed".
            await updateJob(jobId, {
                status: "completed",
                itinerary: itineraryJson,
                completedAt: new Date().toISOString(),
            }, env);

        } catch (error) {
            console.error("Error during background itinerary generation:", error);
            // If any step in the process fails, update the Firestore record
            // with a "failed" status and store the error message.
            await updateJob(jobId, {
                status: "failed",
                error: error.message,
                completedAt: new Date().toISOString(),
            }, env);
        }
    };

    // Use ctx.waitUntil() to ensure the background task runs to completion,
    // even after the initial response has been sent to the client.
    ctx.waitUntil(backgroundTask());

    // Immediately return a 202 Accepted response to the client
    // with the unique jobId for tracking.
    return new Response(JSON.stringify({ jobId }), {
        status: 202, // 202 Accepted
        headers: { "Content-Type": "application/json" }
    });
}