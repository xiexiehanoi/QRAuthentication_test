// lib/mongodb.ts
import { MongoClient } from 'mongodb';

/* eslint-disable @typescript-eslint/no-explicit-any */

if (!process.env.MONGODB_URI) {
  throw new Error('Please set MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  clientPromise = client.connect();
}

export default clientPromise;