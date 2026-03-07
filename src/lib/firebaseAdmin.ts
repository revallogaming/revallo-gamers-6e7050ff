import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

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
