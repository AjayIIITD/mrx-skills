import admin from "firebase-admin";

let db = null;

export function initFirebase() {
  if (db) return db;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn("⚠ Firebase not configured — using in-memory store");
    return createMemoryStore();
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, privateKey, clientEmail })
  });

  db = admin.firestore();
  return db;
}

// In-memory fallback when Firebase isn't configured
function createMemoryStore() {
  const store = { posts: [], analytics: {} };

  return {
    collection: (name) => ({
      add: async (data) => {
        const id = Date.now().toString();
        store[name] = store[name] || [];
        store[name].push({ id, ...data, _createdAt: new Date().toISOString() });
        return { id };
      },
      orderBy: () => ({
        limit: () => ({
          get: async () => ({
            docs: (store[name] || []).slice(-10).map(d => ({ id: d.id, data: () => d }))
          })
        })
      }),
      where: () => ({ get: async () => ({ docs: [] }) })
    })
  };
}

export async function saveAgentOutput(agentName, output) {
  const firestore = initFirebase();
  await firestore.collection("agent_outputs").add({
    agent: agentName,
    output: JSON.stringify(output),
    timestamp: new Date().toISOString()
  });
}

export async function getPostHistory(limit = 10) {
  const firestore = initFirebase();
  const snapshot = await firestore
    .collection("agent_outputs")
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(d => d.data());
}

export async function savePostRecord(postData) {
  const firestore = initFirebase();
  return firestore.collection("posts").add({
    ...postData,
    postedAt: new Date().toISOString()
  });
}
