
const admin = require("firebase-admin");

const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDBOupiMdYiKUTR\nq2EQTOI0bN7srnxhYWytRspk6yDeBzQYpNYG/ikhBz7EJVrvPh0a6q94ZJaRG5Ip\nhq3NiExUAe5dEmRSsBTTkSvrVLK5eVehN+i0dmYGIF0PmiNJFfiaxJ1mZ29u/TJF\nUAJLxefksPNADcz0BOz2eAq4iqZFBim2edHqgxh9YxI6aGSW7m2/iHd73YzCc2sC\nEVfeAlbHJWVaSYsl8hFNeYYMMwZ/v3OY0aFEEhI5lD8hInmGC+SOzhx/OpWSoc1+\nxUSUjGrIKhXnl2dBF7jPZAlKbULJBQQEYsAZTiNPSbIue540ubb3ePApOXH8jNYo\n4UGMvlQTAgMBAAECggEAAgryPQ0uKINLgnSaMewWJ3FlM+xY9/CUj7UOtl1pULTp\nHz+S3FUQhemyh1ambPQOUQwHxIaPtENYhWQymdh7Mhd+d8ZrgBeeHhR2pJDAfkci\n9DCH9GxyAgDn6vPOtAWYRg6WZBBA3ylXFYuAfWDqEC1ct6HNt7YGSUlrQkMuTyQk\n9vPdY8wA36BxsBpyMGRQ8GtnQYzscGKzab7/dP4uYN9vYUYGwbkF06QR0HorUj8w\n0DrbLvTFV5UzJxd1ap4nFjgq9Mh1VxcDlVzhrXanXVGrrJ625LPkg0OGRzEsMIZ6\ndZYHbE9PgQbTBQjZXRfUrmBgK4rPJmcBqPdYU5WzhQKBgQD8VB3AAbR76natbP5j\nhhf5ZlSOt0qSgLVNlqn65/IZV2HzQ9xvXBBp9YvXpde8K5WjykoDbk8Pt6/vpIpQ\ny4XnQc8hzbYNDm4nKJvENA0nCUvBRNR6O7dvH1O7XFdghLIED3+7mVSVSWPIzOsE\nZh5rMYAEywnk/Wo2O4ClVqdJVQKBgQDECqrE/oYQy1bQ3OIq4Pxj8R/UdmuxCzCs\AOX2zHGmaln75QJ/Vm731Vl3wi7HX317CVcfCyvGdOHiIYijIIpoz2VjZwi0xtOj\nu+jym90eb7i0uIqSlh0FdS07nxfGa32PLK9oYqL5+fPvd+gGRp8TCl6y3Xw2RXd2\nffjbqucHxwKBgE95pw0s/E3zYYHqTI3IVJDHPGbfMGvIglJ32/4dRFHbBgz7GNky\nZDEbl/pKUBMCn1VBh+JgwiIvNwkCCFa+Y+SdA8Kf6nFeVC+dSMKZqnLbKLMtHMeL\nO5GSimr/AL5zzSYeQ5sxBkUnInjColt2Vqpoouvfj7RCZUvDnhd1nacpAoGBAJ8Z\nVRwIwD7y9yMMkBRigRKPBtkDvkRxo2+ETx1rMDTxjNOsOMmlGOvTXwedNR+i9JAc\ntXLBOyaVhxhhRKW26/1Bi7QPU3Z7AhmYj+YM7ngcDVfFiNiMMUNTpIEFjWL/q2e9\nySE7I68h1oGa21f0incGbHJW486bs+cbNxL3cQXTAoGACRbZpxMMYnRZau/onNE/\nTlbbbNXHMm302CgT8VRTY6qzrfbGVQCVdUZw8I+wqGC/IH9R/BZr+Q6kuBC+F1Z3\nKOV4COsoYOHgr8xna5SQmV9j4yIWNIH1wP59wGkro3KunB0BBNNHafcJiq+fJzy5\ngg3s+ozlfFp5cHzJ4bzw2u4=\n-----END PRIVATE KEY-----\n";

const serviceAccount = {
  projectId: "revallo-gaming-7642a",
  clientEmail: "firebase-adminsdk-fbsvc@revallo-gaming-7642a.iam.gserviceaccount.com",
  privateKey: privateKey.replace(/\\n/g, "\n")
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function totalTournamentDump() {
  console.log("=== TOTAL TOURNAMENT DUMP ===");
  const tSnap = await db.collection("tournaments").get();
  console.log(`Total regular tournaments: ${tSnap.size}`);
  tSnap.forEach(doc => {
    console.log(`ID: ${doc.id} | Data: ${JSON.stringify(doc.data())}`);
  });

  const mSnap = await db.collection("mini_tournaments").get();
  console.log(`Total mini tournaments: ${mSnap.size}`);
  mSnap.forEach(doc => {
    console.log(`ID: ${doc.id} | Data: ${JSON.stringify(doc.data())}`);
  });
}

totalTournamentDump().catch(console.error);
