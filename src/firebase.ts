import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, getDocFromServer, doc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId from config if provided
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test Connection Helper
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      console.warn("Connection test feedback:", error);
    }
  }
}

export interface FirebaseLocationRecord {
  timestamp: string;
  mapUrl: string;
  lat: number;
  lon: number;
  employeeName: string;
}

// Save location to Firebase
export async function saveLocationToFirebase(
  employeeName: string,
  lat: number,
  lon: number,
  timestamp: string,
  mapUrl: string
): Promise<void> {
  const locationsCol = collection(db, "locations");
  await addDoc(locationsCol, {
    employeeName: employeeName || "Anonymous Employee",
    lat,
    lon,
    timestamp,
    mapUrl,
    createdAt: new Date().toISOString()
  });
}

// Fetch all locations from Firebase
export async function getLocationsFromFirebase(): Promise<FirebaseLocationRecord[]> {
  const locationsCol = collection(db, "locations");
  try {
    const q = query(locationsCol, orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);
    const records: FirebaseLocationRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      records.push({
        timestamp: data.timestamp || "",
        mapUrl: data.mapUrl || "",
        lat: Number(data.lat),
        lon: Number(data.lon),
        employeeName: data.employeeName || "Anonymous Employee"
      });
    });
    return records;
  } catch (err) {
    console.warn("Falling back to client-side sorting:", err);
    const querySnapshot = await getDocs(locationsCol);
    const records: FirebaseLocationRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      records.push({
        timestamp: data.timestamp || "",
        mapUrl: data.mapUrl || "",
        lat: Number(data.lat),
        lon: Number(data.lon),
        employeeName: data.employeeName || "Anonymous Employee"
      });
    });
    // Client-side sort by parsing ISO timestamp or fallback string
    return records.sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
    });
  }
}
