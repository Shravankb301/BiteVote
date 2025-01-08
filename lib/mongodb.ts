import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongodb URI to .env.local');
}

const uri = process.env.MONGODB_URI;
console.log('MongoDB URI configured:', { uri: uri.substring(0, 20) + '...' });

// Optimized options for better connection handling
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  waitQueueTimeoutMS: 10000,
  tls: true,
  tlsInsecure: false
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = global as typeof globalThis & {
  mongo: {
    conn: MongoClient | null;
    promise: Promise<MongoClient> | null;
  };
};

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo.mongo) {
    globalWithMongo.mongo = {
      conn: null,
      promise: null
    };
  }

  if (!globalWithMongo.mongo.promise) {
    client = new MongoClient(uri, options);
    globalWithMongo.mongo.promise = client.connect()
      .then(client => {
        console.log('Connected to MongoDB in development');
        return client;
      })
      .catch(err => {
        console.error('Failed to connect to MongoDB:', err);
        throw err;
      });
  }
  clientPromise = globalWithMongo.mongo.promise;
} else {
  // In production, use a new connection
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('Connected to MongoDB in production');
      return client;
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      throw err;
    });
}

// Add connection health check function
export const checkConnection = async () => {
  try {
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('MongoDB connection health check failed:', error);
    return false;
  }
};

// Add reconnection function
export const reconnect = async () => {
  try {
    if (client) {
      await client.close();
    }
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
    const newClient = await clientPromise;
    console.log('Successfully reconnected to MongoDB');
    return newClient;
  } catch (error) {
    console.error('Failed to reconnect to MongoDB:', error);
    throw error;
  }
};

export default clientPromise;