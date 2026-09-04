const admin = require("firebase-admin");
require("dotenv").config();

let db = null;
let auth = null;
let isFirebaseConfigured = false;

try {
  const apps = admin.apps || [];
  if (apps.length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (firebaseProjectId && clientEmail && privateKey) {
      const firebaseConfig = {
        type: process.env.FIREBASE_TYPE || "service_account",
        project_id: firebaseProjectId,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: clientEmail,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri:
          process.env.FIREBASE_AUTH_URI ||
          "https://accounts.google.com/o/oauth2/auth",
        token_uri:
          process.env.FIREBASE_TOKEN_URI ||
          "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

      console.log("✅ Firebase Admin initialized with Service Account credentials");
      isFirebaseConfigured = true;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
      console.log("✅ Firebase Admin initialized with Application Default Credentials");
      isFirebaseConfigured = true;
    } else {
      console.warn(
        "⚠️ Firebase environment variables not fully set (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).",
      );
    }
  } else {
    isFirebaseConfigured = true;
  }

  if (apps.length > 0 || admin.apps?.length > 0 || isFirebaseConfigured) {
    db = admin.firestore();
    auth = admin.auth();
    isFirebaseConfigured = true;
  }
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error.message);
}

module.exports = {
  admin,
  db,
  auth,
  isFirebaseConfigured,
};
