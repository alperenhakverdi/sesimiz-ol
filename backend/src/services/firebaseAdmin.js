import admin from 'firebase-admin';

let appInstance;

const initializeFirebaseAdmin = () => {
  if (appInstance) {
    return appInstance;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyEnv) {
    throw new Error('Firebase Admin credentials are not fully configured');
  }

  const privateKey = privateKeyEnv.replace(/\\n/g, '\n');

  appInstance = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    }),
    projectId
  });

  return appInstance;
};

export const getFirebaseAdminApp = () => initializeFirebaseAdmin();
export const getFirebaseAuth = () => getFirebaseAdminApp().auth();
export const getFirebaseFirestore = () => getFirebaseAdminApp().firestore();

export const generatePasswordResetLink = async (email, actionCodeSettings = undefined) => {
  const auth = getFirebaseAuth();
  return auth.generatePasswordResetLink(email, actionCodeSettings);
};

export const generateEmailVerificationLink = async (email, actionCodeSettings = undefined) => {
  const auth = getFirebaseAuth();
  return auth.generateEmailVerificationLink(email, actionCodeSettings);
};

export default {
  getFirebaseAdminApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  generatePasswordResetLink,
  generateEmailVerificationLink
};
