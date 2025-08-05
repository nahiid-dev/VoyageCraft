// src/services/llm.js

/**
 * Generates a travel itinerary by calling the OpenAI Chat Completions API.
 * @param {string} destination The travel destination.
 * @param {number} durationDays The duration of the trip in days.
 * @param {object} env The environment variables, containing the LLM_API_KEY.
 * @returns {Promise<object>} A promise that resolves to the parsed JSON object of the itinerary.
 */
export async function generateItinerary(destination, durationDays, env) {
  // Construct a detailed prompt instructing the LLM to return a structured JSON object.
  const prompt = `
        You are a travel planning assistant. Create a detailed travel itinerary for a ${durationDays}-day trip to ${destination}.
        Your response MUST be a valid JSON object. Do not include any text, notes, or explanations outside of the JSON object itself.
        The JSON object must follow this exact structure, including all specified fields for each activity:
        {
          "itinerary": [
            {
              "day": 1,
              "theme": "Theme of the day",
              "activities": [
                {
                  "time": "Morning",
                  "description": "Activity description.",
                  "location": "Location name"
                },
                {
                  "time": "Afternoon",
                  "description": "Activity description.",
                  "location": "Location name"
                },
                {
                  "time": "Evening",
                  "description": "Activity description.",
                  "location": "Location name"
                }
              ]
            }
          ]
        }

        Generate the complete itinerary for all ${durationDays} days.
    `;

  // Make the API call to OpenAI.
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.LLM_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-1106", // This model or newer ones support JSON mode.
      messages: [{ role: "user", content: prompt }],
      // Enable JSON Mode to ensure the output is a valid JSON object.
      response_format: { type: "json_object" }
    })
  });

  // Handle non-successful API responses.
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  // Validate the structure of the LLM's response.
  if (!result.choices || !result.choices[0] || !result.choices[0].message.content) {
    throw new Error("Invalid or empty response from LLM.");
  }

  try {
    // The response content is a JSON string; it must be parsed.
    const content = result.choices[0].message.content;
    return JSON.parse(content); // Return the parsed JavaScript object.
  } catch (e) {
    throw new Error("Failed to parse the LLM response as JSON: " + e.message);
  }
}
