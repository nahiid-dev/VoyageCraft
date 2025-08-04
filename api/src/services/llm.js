// src/services/llm.js
export async function getItineraryFromLLM(destination, durationDays, apiKey) {
    const prompt = `Create a detailed travel itinerary for a ${durationDays}-day trip to ${destination}. The output MUST be a valid JSON object with a single key "itinerary", which is an array of day objects. Each day object must have "day", "theme", and "activities" keys.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API failed: ${errorText}`);
    }

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
}