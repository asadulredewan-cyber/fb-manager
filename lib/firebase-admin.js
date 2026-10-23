import admin from "firebase-admin";

function initFirebase() {
  if (admin.apps.length) {
    return admin.app();
  }

  let credential = null;

  // ১. অপশন ১: পুরো Service Account JSON স্ট্রিং থাকলে
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount);
    } catch (err) {
      console.error("FIREBASE_SERVICE_ACCOUNT_KEY পার্স করতে সমস্যা:", err.message);
    }
  }

  // ২. অপশন ২: আলাদা আলাদা Environment Variables থাকলে
  if (!credential && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // নিউলাইন হ্যান্ডলিং
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });
    } catch (err) {
      console.error("Firebase Private Key ইনিশিয়ালাইজেশনে সমস্যা:", err.message);
    }
  }

  if (credential) {
    try {
      return admin.initializeApp({
        credential,
        ...(process.env.FIREBASE_STORAGE_BUCKET
          ? { storageBucket: process.env.FIREBASE_STORAGE_BUCKET }
          : {}),
      });
    } catch (err) {
      console.error("Firebase App ইনিশিয়ালাইজেশন ফেইল্ড:", err.message);
    }
  } else {
    console.warn("সতর্কতা: Firebase শংসাপত্র (Credentials) পাওয়া যায়নি। ডাটাবেস সম্পর্কিত ফিচার কাজ নাও করতে পারে।");
  }

  return null;
}

// অ্যাপ রান করা
const app = initFirebase();

export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;
export { admin, app };
export default admin;