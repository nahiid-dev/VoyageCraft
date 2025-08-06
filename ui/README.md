# VoyageCraft UI - The Frontend Interface

**Live Demo:** [**https://voyagecraft-ui.pages.dev/**](https://voyagecraft-ui.pages.dev/)

This is the user interface for the VoyageCraft project, a modern, responsive web application built with React.js. It provides a simple and intuitive way for users to interact with the VoyageCraft API, generate AI-powered travel itineraries, and view the results in real-time.

This frontend is decoupled from the backend API, following modern web development best practices. It is designed to be deployed as a static site on a high-performance platform like Cloudflare Pages.

## 🚀 Technology Choices & Architecture

The frontend stack was chosen to create a fast, interactive, and maintainable user experience.

### Tech Stack

* **[React.js](https://react.dev/)**: A powerful JavaScript library for building user interfaces.
    * **Why?** Its component-based architecture makes the code reusable and easy to manage. React Hooks (`useState`, `useEffect`) provide a clean and efficient way to handle component state and side effects, which is perfect for an interactive application like this.
* **[Firebase SDK (Client)](https://firebase.google.com/docs/web/setup)**: The official Firebase library for web applications.
    * **Why?** Its primary role here is to establish a **real-time connection** to the Firestore database. Using the `onSnapshot` function, the UI can listen for live updates to a specific document, allowing the user to see the status change from "processing" to "completed" without ever needing to refresh the page.
* **[Cloudflare Pages](https://pages.cloudflare.com/)**: A platform for deploying and hosting modern frontend applications.
    * **Why?** It offers seamless integration with GitHub for continuous deployment, a blazingly fast global CDN for optimal performance, and a secure way to manage environment variables. It's the perfect hosting solution for a static React application.

### How It Works: The Data Flow

The application's logic is centered around a reactive, asynchronous data flow that ensures a smooth user experience.

1.  **User Interaction**: The user enters a destination and duration into the form in the `App.jsx` component.
2.  **API Call**: Upon submission, the `handleSubmit` function is triggered. It sends a `POST` request to the deployed Cloudflare Worker API (`.../itinerary`) using the browser's standard `fetch` API.
3.  **Receiving the Job ID**: The backend API immediately responds with a unique `jobId`. This ID is crucial as it acts as a tracking number for the itinerary generation task.
4.  **Real-time Listening**: The `jobId` is stored in the component's state using `useState`. This change triggers the `useEffect` hook.
5.  **Connecting to Firestore**: Inside `useEffect`, the Firebase SDK's `onSnapshot` function establishes a live connection to the specific Firestore document corresponding to our `jobId`.
6.  **Reactive Updates**: The backend worker is now processing the request in the background. As it updates the document's status in Firestore (from `processing` to `completed` or `failed`), Firestore **pushes** these changes directly to the UI in real-time.
7.  **UI Re-renders**: The `onSnapshot` listener receives the new data and updates the component's state. React automatically re-renders the UI to display the current status and, eventually, the final itinerary.

This architecture creates a seamless, non-blocking experience where the user gets instant feedback and sees the result the moment it's ready.

## 🔒 Security: Handling Credentials Safely

Hardcoding sensitive information like API keys directly into the source code is a major security risk. This project follows best practices for managing these keys.

* **Local Development**: For running the app locally, we use a `.env` file. This file is listed in `.gitignore`, ensuring that it is **never** committed to the Git repository. React's build tools automatically load these variables into `process.env`.
* **Production Deployment**: For the live site, we use the **Environment Variables** feature in the Cloudflare Pages dashboard. As you have done, all variables were set as **Secrets**, meaning they are encrypted at rest and only exposed to the build process, never to the client-side browser code.

This is the correct way to handle the `firebaseConfig` object, which contains public identifiers for your Firebase project.

### Key Code Snippet: Calling the API & Listening for Updates

The core logic resides in `App.jsx`, combining the API call and the real-time listener.

```javascript
// in App.jsx

// This effect activates as soon as a `jobId` is received from the API.
useEffect(() => {
    if (!jobId) return;

    // onSnapshot creates a real-time listener on the Firestore document.
    const unsubscribe = onSnapshot(doc(db, "itineraries", jobId), (doc) => {
        if (doc.exists()) {
            // Update the UI's state whenever Firestore data changes.
            setData(doc.data());
        }
    });

    // Clean up the listener when the component is no longer needed.
    return () => unsubscribe();
}, [jobId]); // This effect depends on the `jobId`.

const handleSubmit = async (event) => {
    event.preventDefault();
    // ... reset state ...

    try {
        // 1. Call the backend API
        const response = await fetch('[https://voyagecraft-api.naahid-sha.workers.dev/itinerary](https://voyagecraft-api.naahid-sha.workers.dev/itinerary)', {
            /* ... request options ... */
        });
        const result = await response.json();
        
        // 2. Store the jobId, which triggers the useEffect listener
        setJobId(result.jobId);

    } catch (error) {
        // ... handle error ...
    }
};
```

## 🛠️ Setup and Deployment Guide

Follow these steps to run and deploy the UI.

### 1. Local Setup

1.  **Navigate to the UI directory:**
    ```bash
    cd ui
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create the environment file:**
    * Create a new file named `.env` in the `ui/` directory.
    * Add your Firebase configuration keys to this file. The variable names **must** start with `REACT_APP_`.
    ```ini
    REACT_APP_FIREBASE_API_KEY=AIzaSy...
    REACT_APP_FIREBASE_AUTH_DOMAIN=...
    REACT_APP_FIREBASE_PROJECT_ID=...
    REACT_APP_FIREBASE_STORAGE_BUCKET=...
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
    REACT_APP_FIREBASE_APP_ID=...
    ```
4.  **Start the development server:**
    ```bash
    npm start
    ```
    The application will open at `http://localhost:3000`.

### 2. Deployment to Cloudflare Pages

1.  **Push to GitHub**: Ensure your latest code, including the updated `package-lock.json` and the new `public/index.html`, is pushed to your GitHub repository.
2.  **Connect to Cloudflare**: In the Cloudflare dashboard, create a new Pages project and connect it to your `VoyageCraft` GitHub repository.
3.  **Configure Build Settings**:
    * **Project name**: `voyagecraft-ui`
    * **Framework preset**: `Create React App`
    * **Build command**: `npm run build`
    * **Build output directory**: `build`
    * **Root Directory**: `/ui` *(This is a critical step)*
4.  **Set Environment Variables**: In the build settings, add the same `REACT_APP_...` variables from your `.env` file. Mark each one as a "Secret" by clicking the encrypt icon.
5.  **Save and Deploy**: Click "Save and Deploy". Cloudflare will build and deploy your site to a public URL.
