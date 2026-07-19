const admin = require("firebase-admin");

// Check if Firebase Admin is installed
if (!admin) {
  console.error("❌ firebase-admin not found! Run: npm install firebase-admin");
  throw new Error("firebase-admin not installed");
}

try {
  // Use environment variables
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
      : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CERT_URL,
    universe_domain: "googleapis.com"
  };

  // Log the private key format for debugging (remove in production)
  if (serviceAccount.private_key) {
    console.log("Private key starts with:", serviceAccount.private_key.substring(0, 27));
    console.log("Private key ends with:", serviceAccount.private_key.substring(serviceAccount.private_key.length - 25));
    console.log("Contains newlines:", serviceAccount.private_key.includes('\n'));
  }

  // Validate required fields
  const required = ['project_id', 'private_key', 'client_email'];
  const missing = required.filter(f => !serviceAccount[f]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing Firebase credentials: ${missing.join(', ')}`);
    console.log("Please add these environment variables on Render:");
    console.log("FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL");
    throw new Error(`Missing Firebase credentials: ${missing.join(', ')}`);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const auth = admin.auth();
  const db = admin.firestore();

  console.log("✅ Firebase Admin initialized successfully!");
  
  module.exports = {
    auth,
    db,
  };
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  throw error;
}
