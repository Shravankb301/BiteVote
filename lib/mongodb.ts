import { MongoClient, MongoClientOptions, WriteConcernSettings } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;

// Add type declaration for global MongoDB client
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Optimized connection options
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,
  writeConcern: {
    w: 1,
    wtimeout: 30000,
    j: true
  } as WriteConcernSettings,
  retryWrites: true,
  retryReads: true
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
  // In production, use connection pooling
  const client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('Connected to MongoDB in production');
      return client;
    });
}

// Export the promisified client
export default clientPromise;