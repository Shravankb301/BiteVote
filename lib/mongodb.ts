import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongodb URI to .env.local');
}

const uri = process.env.MONGODB_URI;
console.log('Connecting to MongoDB...', { uri: uri.substring(0, 20) + '...' });

// Simplified options based on MongoDB Atlas recommendations
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  tls: true,
  tlsInsecure: false // Required for some Node.js versions
};

let client;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = global as typeof globalThis & {
  mongo: {
    conn: MongoClient | null;
    promise: Promise<MongoClient> | null;
  };
};

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo.mongo) {
    client = new MongoClient(uri, options);
    const clientPromise = client.connect()
      .catch(err => {
        console.error('Failed to connect to MongoDB:', err);
        throw err;
      });
    globalWithMongo.mongo = {
      conn: client,
      promise: clientPromise
    };
  }
  clientPromise = globalWithMongo.mongo.promise!;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      throw err;
    });
}

export default clientPromise;