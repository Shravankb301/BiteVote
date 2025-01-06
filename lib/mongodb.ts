import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongodb URI to .env.local');
}

const uri = process.env.MONGODB_URI;
console.log('Connecting to MongoDB...', { uri: uri.substring(0, 20) + '...' });

const options = {
  connectTimeoutMS: 10000, // Connection timeout of 10 seconds
  socketTimeoutMS: 30000,  // Socket timeout of 30 seconds
  maxPoolSize: 50,         // Maximum number of connections in the pool
  minPoolSize: 10,         // Minimum number of connections in the pool
  maxIdleTimeMS: 30000,    // Maximum time a connection can remain idle
  retryWrites: true,       // Enable retrying write operations
  retryReads: true         // Enable retrying read operations
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