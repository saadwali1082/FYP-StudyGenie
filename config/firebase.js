// config/firebase.js
const admin = require("firebase-admin");

try {
  // Parse the JSON from environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const auth = admin.auth();
  const db = admin.firestore();

  console.log("✅ Firebase Admin initialized successfully!");
  console.log("📁 Connected to Firestore database");
  
  module.exports = {
    auth,
    db,
  };
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  console.error("Please check your FIREBASE_SERVICE_ACCOUNT environment variable");
  throw error;
}
