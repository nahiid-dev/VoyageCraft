// src/services/firestore.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db;

function initializeDb(credentials) {
    if (!getApps().length) {
        initializeApp({
            credential: cert(JSON.parse(credentials)),
        });
    }
    db = getFirestore();
}

async function createInitialJob(jobId, destination, durationDays) {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = db.collection('itineraries').doc(jobId);
    await docRef.set({
        status: 'processing',
        destination,
        durationDays,
        createdAt: new Date(),
        completedAt: null,
        itinerary: null,
        error: null,
    });
}

async function updateJob(jobId, data) {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = db.collection('itineraries').doc(jobId);
    await docRef.update({
        ...data,
        completedAt: new Date(),
    });
}

export { initializeDb, createInitialJob, updateJob };