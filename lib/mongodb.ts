import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
// console.log('[MongoDB] URI from env:', uri.substring(0, 50) + '...');
// console.log('[MongoDB] Connecting to:', uri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,  // 30 seconds for initial connection
  socketTimeoutMS: 60000,           // 60 seconds for socket operations
  connectTimeoutMS: 30000,          // 30 seconds for connection timeout
  retryWrites: true,
  retryReads: true,
  minPoolSize: 2,                   // Maintain minimum connections
  maxIdleTimeMS: 60000,             // Close idle connections after 60s
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;

    const dbName = process.env.MONGODB_DB_NAME || "READYPIPS";
    
    // console.log('[MongoDB] Successfully connected to database:', dbName);
    return client.db(dbName);
  } catch (error: any) {
    console.error('[MongoDB] Connection error:', error.message);
    console.error('[MongoDB] Error code:', error.code);
    
    // If connection fails, try to reconnect
    if (error.name === 'MongoServerSelectionError') {
      // console.log('[MongoDB] Retrying connection...');
      try {
        // Create new client and retry
        const newClient = new MongoClient(uri, options);
        const connectedClient = await newClient.connect();

        const dbName = process.env.MONGODB_DB_NAME || "READYPIPS";
        
        // console.log('[MongoDB] Reconnected successfully to:', dbName);
        return connectedClient.db(dbName);
      } catch (retryError: any) {
        console.error('[MongoDB] Retry failed:', retryError.message);
        throw retryError;
      }
    }
    
    throw error;
  }
}
