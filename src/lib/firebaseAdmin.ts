import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let app: admin.app.App | undefined;

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        project_id: projectId,
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      } as any),
    });
  } else {
    console.warn("Firebase Admin SDK credentials missing. Server-side admin features disabled.");
  }
} else {
  app = admin.apps[0]!;
}

// Helper to get app or throw error
const getApp = () => {
  if (!app) {
    throw new Error(
      "Firebase Admin SDK not initialized. Check your environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }
  return app;
};

export const adminAuth = {
  get instance() { return getApp().auth(); },
  createUser: (args: any) => getApp().auth().createUser(args),
  getUserByEmail: (email: string) => getApp().auth().getUserByEmail(email),
  updateUser: (uid: string, args: any) => getApp().auth().updateUser(uid, args),
  verifyIdToken: (token: string) => getApp().auth().verifyIdToken(token),
  listUsers: (maxResults?: number, pageToken?: string) => getApp().auth().listUsers(maxResults, pageToken),
} as any;

export const adminDb = {
  get instance() { return getApp().firestore(); },
  collection: (name: string) => getApp().firestore().collection(name),
  doc: (path: string) => getApp().firestore().doc(path),
  batch: () => getApp().firestore().batch(),
} as any;

export const adminStorage = {
  get instance() { return getApp().storage(); },
  bucket: (name?: string) => getApp().storage().bucket(name),
} as any;

export const verifyToken = async (
  reqOrToken: any | string,
) => {
  let token: string | undefined;

  if (typeof reqOrToken === "string") {
    token = reqOrToken;
  } else {
    // Support Web Request (NextRequest) and Node Request (IncomingMessage)
    const authHeader = reqOrToken.headers?.get
      ? reqOrToken.headers.get("authorization")
      : reqOrToken.headers?.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    throw new Error("Missing or invalid authorization header");
  }

  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error: unknown) {
    throw new Error("Invalid token");
  }
};
