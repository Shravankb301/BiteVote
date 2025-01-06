import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongodb URI to .env.local');
}

const uri = process.env.MONGODB_URI;
console.log('Connecting to MongoDB...', { uri: uri.substring(0, 20) + '...' });

const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  retryReads: true,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true, // For development only, remove in production
  tlsAllowInvalidHostnames: true,    // For development only, remove in production
  useNewUrlParser: true,
  useUnifiedTopology: true
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
  // In production, use more secure TLS options
  const productionOptions = {
    ...options,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    ssl: true,
    tls: true,
  };
  client = new MongoClient(uri, productionOptions);
  clientPromise = client.connect()
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      throw err;
    });
}

export default clientPromise;