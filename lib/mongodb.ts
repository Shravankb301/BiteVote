import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongodb URI to .env.local');
}

const uri = process.env.MONGODB_URI;
console.log('Connecting to MongoDB...', { uri: uri.substring(0, 20) + '...' });

const options = {};
let client;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = global as typeof globalThis & {
  mongo: {
    conn: MongoClient | null;
    promise: Promise<MongoClient> | null;
  };
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!globalWithMongo.mongo) {
    client = new MongoClient(uri, options);
    const clientPromise = client.connect();
    globalWithMongo.mongo = {
      conn: client,
      promise: clientPromise
    };
  }
  clientPromise = globalWithMongo.mongo.promise!;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;