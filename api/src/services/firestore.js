// src/services/firestore.js

import { GoogleAuth } from 'google-auth-library';

/**
 * Retrieves a Google Cloud access token using the service account credentials.
 * This function uses the official Google Auth Library for robust and secure authentication.
 * @param {object} env The environment variables, containing GCP_SERVICE_ACCOUNT.
 * @returns {Promise<string>} A promise that resolves to the access token.
 */
async function getAccessToken(env) {
    // Parse the service account JSON from the environment variable.
    const serviceAccount = JSON.parse(env.GCP_SERVICE_ACCOUNT);

    // Initialize the Google Auth client with the service account credentials
    // and specify the required scope for Firestore access.
    const auth = new GoogleAuth({
        credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/datastore'],
    });

    // Get an authenticated client and retrieve the access token.
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    return accessToken.token;
}

/**
 * A recursive helper function to convert a standard JavaScript object
 * into the format required by the Firestore REST API.
 * @param {object} data The JavaScript object to convert.
 * @returns {object} The object formatted for Firestore.
 */
function toFirestoreData(data) {
    const convertValue = (value) => {
        if (value === null) return { nullValue: null };
        if (typeof value === 'string') return { stringValue: value };
        if (typeof value === 'number' && Number.isInteger(value)) return { integerValue: String(value) };
        if (typeof value === 'number') return { doubleValue: value };
        if (typeof value === 'boolean') return { booleanValue: value };
        if (Array.isArray(value)) {
            const values = value.map(convertValue).filter(v => v !== undefined);
            return { arrayValue: { values: values } };
        }
        if (typeof value === 'object' && value !== null) {
            const fields = toFirestoreData(value);
            if (Object.keys(fields).length === 0) return undefined;
            return { mapValue: { fields: fields } };
        }
        return undefined; // Ignore unsupported types
    };

    const fields = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
            const converted = convertValue(data[key]);
            if (converted !== undefined) {
                fields[key] = converted;
            }
        }
    }
    return fields;
}

/**
 * Creates a new document in the 'itineraries' collection in Firestore.
 * @param {string} jobId The unique ID for the document.
 * @param {object} data The initial data for the job (e.g., status: "processing").
 * @param {object} env The environment variables.
 */
export async function createJob(jobId, data, env) {
    const accessToken = await getAccessToken(env);
    const projectId = JSON.parse(env.GCP_SERVICE_ACCOUNT).project_id;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/itineraries?documentId=${jobId}`;

    const firestorePayload = { fields: toFirestoreData(data) };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(firestorePayload)
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Firestore create error: ${error}`);
    }
}

/**
 * Updates an existing document in the 'itineraries' collection.
 * @param {string} jobId The ID of the document to update.
 * @param {object} dataToUpdate The fields to update in the document.
 * @param {object} env The environment variables.
 */
export async function updateJob(jobId, dataToUpdate, env) {
    const accessToken = await getAccessToken(env);
    const projectId = JSON.parse(env.GCP_SERVICE_ACCOUNT).project_id;

    // Use updateMask to specify which fields to update, preventing accidental overwrites.
    const updateMask = Object.keys(dataToUpdate).map(key => `updateMask.fieldPaths=${key}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/itineraries/${jobId}?${updateMask}`;

    const firestorePayload = { fields: toFirestoreData(dataToUpdate) };

    const res = await fetch(url, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(firestorePayload)
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Firestore update error: ${error}`);
    }
}
