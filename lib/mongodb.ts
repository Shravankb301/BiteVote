import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongodb URI to .env.local');
}

const uri = process.env.MONGODB_URI;
console.log('MongoDB URI configured:', { uri: uri.substring(0, 20) + '...' });

// Add type declaration for global MongoDB client
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

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

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development, use global variable to preserve connection across HMR
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
      .then(client => {
        console.log('Connected to MongoDB in development');
        return client;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, it's best to not use a global variable
  const client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('Connected to MongoDB in production');
      return client;
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

export default clientPromise;