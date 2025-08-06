# VoyageCraft API ✈️

VoyageCraft is a serverless API service that generates personalized travel itineraries using Artificial Intelligence. By simply providing a destination and the number of days, you receive a detailed, day-by-day travel plan, with the result saved to a NoSQL database.

This project was developed as part of an AI Engineering take-home test. The core challenge is managing asynchronous processes within a modern serverless architecture.

---

## 📚 Table of Contents

- [Architecture & Technology Choices](#-architecture--technology-choices)
- [Project Structure](#️-project-structure)
- [Application Flow](#️-application-flow)
- [Setup and Installation](#️-setup-and-installation)
- [API Usage Example](#-api-usage-example)
- [Live Links](#-live-links)

---

## 🚀 Architecture & Technology Choices

The selection of technologies and the project's structure were driven by the goals of speed, scalability, and a clean separation of concerns.

### Tech Stack

* **Serverless API: [Cloudflare Workers](https://workers.cloudflare.com/)** ☁️
    * **Why?** Workers run on Cloudflare's global edge network, resulting in extremely low latency for users worldwide. The platform is auto-scaling (no need to manage servers) and its consumption-based pricing model is highly cost-effective.

* **Database: [Google Cloud Firestore](https://cloud.google.com/firestore)** 🔥
    * **Why?** Firestore is a fast, scalable, and fully managed NoSQL database ideal for modern applications. Its JSON-like data structure aligns perfectly with the output of Large Language Models (LLMs), and its real-time capabilities are powerful for future features, such as a live status-checking UI.

* **AI Model: [OpenAI GPT Series](https://openai.com/)** 🤖
    * **Why?** The GPT models were chosen for their advanced natural language understanding and their ability to generate creative, structured text (like JSON). The "JSON Mode" feature in newer models ensures reliable and parsable output for the application.

* **Google Authentication: [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs)** 🔑
    * **Why?** Instead of a complex and error-prone manual implementation of the JWT signing process, we use the official Google library. This approach is simpler, more secure, and more reliable, as it completely abstracts away the underlying cryptographic complexities.

### 🏛️ Project Structure

The project is designed to be modular, following the **Separation of Concerns** principle:

<pre>
api/
├── src/
│   ├── index.js          # Main entry point and request router
│   ├── routes/
│   │   └── itinerary.js  # Logic for handling itinerary creation
│   ├── services/
│   │   ├── firestore.js  # Firestore interaction logic
│   │   └── llm.js        # OpenAI API call logic
│   └── utils/
│       └── uuid.js       # Utility functions (e.g., ID generation)
├── package.json          # Project dependencies
└── wrangler.toml         # Cloudflare Worker config
</pre>



* **`index.js`**: Acts as a traffic controller, routing incoming requests to the appropriate handlers.
* **`routes/`**: Each file in this directory is responsible for the business logic of a specific API route.
* **`services/`**: This directory is the heart of the application. Each file manages an external service (like the database or the LLM). This structure allows us to, for example, switch from Firestore to DynamoDB by only changing the `firestore.js` file.

## ⚙️ Application Flow

When a user submits a request to generate an itinerary, the following sequence of events occurs:

1.  **Request Received:** A `POST` request to the `/itinerary` endpoint is received by `index.js`.
2.  **ID Creation & Instant Response:** The `handleItinerary` handler generates a unique `jobId` and **immediately** sends a `202 Accepted` response back to the client, including the `jobId`.
3.  **Background Processing Begins:** The execution of the remaining logic is passed to `ctx.waitUntil`. This ensures that the time-consuming tasks continue to run in the background after the response has been sent.
4.  **Initial Job Creation:** The `createJob` function in `firestore.js` creates a new document in the `itineraries` collection, using the `jobId` and setting the status to `"processing"`.
5.  **AI Invocation:** The `generateItinerary` function in `llm.js` constructs a detailed prompt and sends it to the OpenAI API to generate the itinerary in a structured JSON format.
6.  **Final Job Update:** After receiving the response from the LLM, the `updateJob` function in `firestore.js` updates the existing document with the generated itinerary and a status of `"completed"`.
7.  **Error Handling:** If an error occurs at any stage of the background process, the job's status is updated to `"failed"`, and an error message is saved in the database.

## 🛠️ Setup and Installation

Follow these steps to run the project locally or deploy it to Cloudflare.

### Prerequisites

* [Node.js](https://nodejs.org/) (version 18 or higher)
* A [Cloudflare](https://dash.cloudflare.com/) account
* A [Google Cloud](https://console.cloud.google.com/) account
* An API Key from [OpenAI](https://platform.openai.com/api-keys)

### Installation Steps

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/nahiid-dev/VoyageCraft.git](https://github.com/nahiid-dev/VoyageCraft.git)
    cd VoyageCraft/api
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Google Cloud & Firestore:**
    * Create a new project in the Google Cloud Console.
    * Enable the **Firestore API** for your project.
    * Navigate to **IAM & Admin -> Service Accounts** and **create a new service account**.
    * Grant the new service account the **`Cloud Datastore User`** role.
    * Create a **new key** of type **JSON** for the service account and download the file.

4.  **Configure Environment Variables (Secrets):**
    This project requires two sensitive variables to function.

    * **For Local Development:**
        * Create a file named `.dev.vars` in the project root (`api/`).
        * Add the following content to the file:
            ```ini
            LLM_API_KEY="sk-..."
            GCP_SERVICE_ACCOUNT='{"type": "service_account", ...}'
            ```
            * `LLM_API_KEY`: Get your API key from the OpenAI platform.
            * `GCP_SERVICE_ACCOUNT`: Paste the **entire content** of the JSON key file you downloaded from Google Cloud here. It is recommended to format it as a single line.

    * **For Production Deployment (Recommended Method):**
        * Navigate to your Cloudflare Dashboard -> Workers & Pages -> `voyagecraft-api`.
        * Go to the **Settings -> Variables** tab.
        * Under **Environment Variable Bindings**, add the following two variables, paste their values, and click **Encrypt** for each one:
            * `LLM_API_KEY`: Your OpenAI API Key.
            * `GCP_SERVICE_ACCOUNT`: The entire content of the JSON key file from Google Cloud.

5.  **Run the Project Locally:**
    ```bash
    npm run start
    ```
    The worker will be available at `http://localhost:8787`.

6.  **Deploy to Cloudflare:**
    ```bash
    npm run deploy
    ```

## 🔌 API Usage Example

To request a new travel itinerary, send a `POST` request to the `/itinerary` endpoint.

**cURL Example:**
```bash
curl -X POST [https://voyagecraft-api.your-worker-subdomain.workers.dev/itinerary](https://voyagecraft-api.your-worker-subdomain.workers.dev/itinerary) \
-H "Content-Type: application/json" \
-d '{
  "destination": "Shiraz, Iran",
  "durationDays": 3
}'
Immediate Response:
You will instantly receive a jobId:

JSON

{
  "jobId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
Final Result:
After a few moments, a new document with the above jobId will be created in your Firestore itineraries collection, containing the complete, generated travel plan.


🌐 Live Links
API Endpoint:
https://voyagecraft-api.naahid-sha.workers.dev/

Live UI Demo:
https://voyagecraft-ui.pages.dev/