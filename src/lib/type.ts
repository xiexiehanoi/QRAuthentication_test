// src/lib/type.ts
import { ObjectId } from 'mongodb';

export interface Device {
  credentialID: Buffer;
  publicKey: string;
  counter: number;
}

export interface User {
  _id?: ObjectId;
  username: string;
  devices: Device[];
  currentChallenge?: string;
}
